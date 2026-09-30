'use strict';
const { app, BrowserWindow, Tray, Menu, screen, session, nativeImage } = require('electron');
const path = require('path');
const os = require('os');
const fs = require('fs');
const { execFile } = require('child_process');

if (!app.requestSingleInstanceLock()) app.quit();

/* ---------------- settings (persisted) ---------------- */
const CFG_FILE = () => path.join(app.getPath('userData'), 'settings.json');
const DEFAULTS = { theme: 'hud', palette: 0, mode: 'window', gain: 1, userName: os.userInfo().username, autostart: false };
let cfg = { ...DEFAULTS };
try { cfg = { ...DEFAULTS, ...JSON.parse(fs.readFileSync(CFG_FILE(), 'utf8')) }; } catch (_) {}
const save = () => { try { fs.writeFileSync(CFG_FILE(), JSON.stringify(cfg, null, 2)); } catch (_) {} };

let wins = [], tray = null;

/* ---------------- windows ---------------- */
function pushSettings(win) {
  const set = (n, v) => win.webContents.executeJavaScript(
    `window.livelyPropertyListener&&window.livelyPropertyListener(${JSON.stringify(n)},${JSON.stringify(v)})`).catch(() => {});
  set('theme', cfg.palette); set('gain', cfg.gain); set('userName', cfg.userName);
}

function createWindows() {
  wins.forEach(w => { try { w.destroy(); } catch (_) {} });
  wins = [];
  for (const d of screen.getAllDisplays()) {
    const wallpaper = cfg.mode === 'wallpaper' && process.platform === 'win32';
    const win = new BrowserWindow({
      x: d.bounds.x, y: d.bounds.y, width: d.bounds.width, height: d.bounds.height,
      frame: false, show: false, skipTaskbar: true, backgroundColor: '#0e0c0a',
      fullscreen: !wallpaper, resizable: false, focusable: !wallpaper,
      webPreferences: { backgroundThrottling: false, autoplayPolicy: 'no-user-gesture-required' }
    });
    win.setMenuBarVisibility(false);
    win.loadFile(path.join(__dirname, 'themes', cfg.theme, 'index.html'));
    win.webContents.on('did-finish-load', () => { pushSettings(win); win.show(); if (wallpaper) attachToDesktop(win, d); });
    win.webContents.on('before-input-event', (e, input) => {      // Esc closes window mode
      if (input.type === 'keyDown' && input.key === 'Escape' && cfg.mode === 'window') app.quit();
    });
    wins.push(win);
  }
}

/* Attach the window behind the desktop icons (Windows). Standard WorkerW technique via PowerShell P/Invoke. */
const PS = `
param([long]$h,[int]$x,[int]$y,[int]$w,[int]$ht)
Add-Type @"
using System; using System.Runtime.InteropServices;
public class WP {
  public delegate bool EnumProc(IntPtr t, IntPtr l);
  [DllImport("user32.dll")] static extern IntPtr FindWindow(string c,string t);
  [DllImport("user32.dll")] static extern IntPtr FindWindowEx(IntPtr p,IntPtr a,string c,string t);
  [DllImport("user32.dll")] static extern bool EnumWindows(EnumProc p,IntPtr l);
  [DllImport("user32.dll")] static extern IntPtr SendMessageTimeout(IntPtr h,uint m,IntPtr w,IntPtr l,uint f,uint t,out IntPtr r);
  [DllImport("user32.dll")] static extern IntPtr SetParent(IntPtr c,IntPtr p);
  [DllImport("user32.dll")] static extern bool SetWindowPos(IntPtr h,IntPtr a,int x,int y,int cx,int cy,uint f);
  public static string Attach(long hwnd,int x,int y,int w,int h){
    IntPtr progman=FindWindow("Progman",null); IntPtr r;
    SendMessageTimeout(progman,0x052C,IntPtr.Zero,IntPtr.Zero,0,1000,out r);
    IntPtr worker=IntPtr.Zero;
    EnumWindows((t,l)=>{ IntPtr sh=FindWindowEx(t,IntPtr.Zero,"SHELLDLL_DefView",null);
      if(sh!=IntPtr.Zero){ worker=FindWindowEx(IntPtr.Zero,t,"WorkerW",null);} return true;},IntPtr.Zero);
    IntPtr parent = worker!=IntPtr.Zero ? worker : progman;
    SetParent((IntPtr)hwnd,parent);
    SetWindowPos((IntPtr)hwnd,IntPtr.Zero,x,y,w,h,0x0014);
    return worker!=IntPtr.Zero ? "workerw" : "progman";
  }
}
"@
[WP]::Attach($h,$x,$y,$w,$ht)
`;
function attachToDesktop(win, display) {
  const phys = screen.dipToScreenRect(null, display.bounds);
  const all = screen.getAllDisplays().map(d => screen.dipToScreenRect(null, d.bounds));
  const ox = Math.min(...all.map(r => r.x)), oy = Math.min(...all.map(r => r.y));
  const hwnd = Number(win.getNativeWindowHandle().readBigUInt64LE(0));
  const script = path.join(os.tmpdir(), 'jarvis-wp.ps1');
  fs.writeFileSync(script, PS);
  execFile('powershell', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', script,
    String(hwnd), String(phys.x - ox), String(phys.y - oy), String(phys.width), String(phys.height)],
    { windowsHide: true }, (err, out) => { if (err) console.error('wallpaper attach failed:', err.message); else console.log('attached via', out.trim()); });
}

/* ---------------- real system stats -> themes ---------------- */
let lastCpu = os.cpus().map(c => ({ ...c.times }));
let si = null; try { si = require('systeminformation'); } catch (_) {}
async function statsTick() {
  const now = os.cpus().map(c => ({ ...c.times }));
  let idle = 0, total = 0;
  now.forEach((t, i) => { const p = lastCpu[i]; for (const k in t) { const d = t[k] - p[k]; total += d; if (k === 'idle') idle += d; } });
  lastCpu = now;
  const payload = { currentCpu: total ? (1 - idle / total) * 100 : 0, totalRam: os.totalmem(), currentRamUsed: os.totalmem() - os.freemem() };
  if (si) { try { const n = await si.networkStats(); payload.currentNetDown = (n[0].rx_sec || 0) / 1e6; } catch (_) {} }
  const js = `window.livelySystemInformation&&window.livelySystemInformation(${JSON.stringify(payload)})`;
  wins.forEach(w => { if (!w.isDestroyed()) w.webContents.executeJavaScript(js).catch(() => {}); });
}

/* ---------------- tray ---------------- */
function rebuildTray() {
  const radio = (label, key, value, extra) => ({ label, type: 'radio', checked: cfg[key] === value, click: () => { cfg[key] = value; save(); extra ? extra() : null; } });
  const menu = Menu.buildFromTemplate([
    { label: 'Theme', submenu: [
      radio('HUD', 'theme', 'hud', createWindows), radio('Brain', 'theme', 'brain', createWindows), radio('Eye', 'theme', 'eye', createWindows)] },
    { label: 'HUD palette', submenu: [
      radio('Claude', 'palette', 0, () => wins.forEach(pushSettings)), radio('Mono', 'palette', 1, () => wins.forEach(pushSettings)),
      radio('Reactor', 'palette', 2, () => wins.forEach(pushSettings))] },
    { label: 'Mic sensitivity', submenu: [0.6, 1, 1.6, 2.5, 4].map(g => ({ label: g + '×', type: 'radio', checked: cfg.gain === g,
      click: () => { cfg.gain = g; save(); wins.forEach(pushSettings); } })) },
    { type: 'separator' },
    { label: 'Mode', submenu: [
      { label: 'Window (fullscreen, Esc to exit)', type: 'radio', checked: cfg.mode === 'window', click: () => { cfg.mode = 'window'; save(); createWindows(); } },
      { label: 'Wallpaper (behind icons, experimental)', type: 'radio', checked: cfg.mode === 'wallpaper', click: () => { cfg.mode = 'wallpaper'; save(); createWindows(); } }] },
    { label: 'Start with Windows', type: 'checkbox', checked: cfg.autostart, click: m => { cfg.autostart = m.checked; save(); app.setLoginItemSettings({ openAtLogin: m.checked }); } },
    { type: 'separator' },
    { label: 'Quit', click: () => app.quit() }]);
  tray.setContextMenu(menu);
}

app.whenReady().then(() => {
  // allow the microphone without a prompt
  session.defaultSession.setPermissionRequestHandler((_, perm, cb) => cb(perm === 'media'));
  session.defaultSession.setPermissionCheckHandler((_, perm) => perm === 'media');
  tray = new Tray(nativeImage.createFromPath(path.join(__dirname, 'assets', 'icon.png')).resize({ width: 16, height: 16 }));
  tray.setToolTip('Jarvis Wallpaper');
  rebuildTray();
  createWindows();
  setInterval(statsTick, 1000);
  screen.on('display-added', createWindows); screen.on('display-removed', createWindows);
});
app.on('window-all-closed', e => e.preventDefault());   // keep living in the tray
