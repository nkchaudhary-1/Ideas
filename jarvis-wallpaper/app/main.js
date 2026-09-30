'use strict';
const { app, BrowserWindow, Tray, Menu, screen, session, nativeImage, shell, globalShortcut, dialog } = require('electron');
const path = require('path');
const os = require('os');
const fs = require('fs');
const { execFile, spawn } = require('child_process');

if (!app.requestSingleInstanceLock()) app.quit();
const DRY = !!process.env.JARVIS_DRYRUN;            // test mode: log actions instead of running them
const WIN = process.platform === 'win32';

/* ---------------- catalogue ---------------- */
const THEMES = [['cortex', 'Cortex', 'cortex'], ['blueprint', 'Blueprint', 'blueprint'], ['cockpit', 'Cockpit', 'cockpit'], ['target', 'Target', 'target'], ['orb', 'Orb', 'orb'],
  ['halo', 'Halo', 'halo'], ['sensory', 'Sensory', 'sensory'], ['poster', 'Poster', 'poster'], ['radar', 'Radar', 'radar'], ['console', 'Console', 'console'],
  ['hud', 'Core HUD (classic)', 'classic hud'], ['brain', 'Claude Brain (classic)', 'brain'], ['eye', 'Eye (classic)', 'eye']];
const LEGACY = new Set(['hud', 'brain', 'eye']);
const PANELS = [['cpu', 'CPU', 'cpu'], ['mem', 'Memory', 'memory'], ['disk', 'Storage', 'storage'], ['net', 'Network', 'network'], ['procs', 'Processes', 'processes'],
  ['gpu', 'GPU', 'gpu'], ['batt', 'Battery', 'battery'], ['sys', 'System info & clock', 'system info'], ['voice', 'Voice log', 'voice log']];

/* ---------------- settings (persisted) ---------------- */
const CFG_FILE = () => path.join(app.getPath('userData'), 'settings.json');
const ACCENTS = ['Claude terracotta', 'Ice blue', 'Mono', 'Amber', 'Violet', 'Jade'];
const DEFAULTS = { theme: 'cortex', accent: 0, palette: 0, mode: 'window', gain: 1, userName: os.userInfo().username, autostart: false, hidden: [], voice: true };
let cfg = { ...DEFAULTS };
try { cfg = { ...DEFAULTS, ...JSON.parse(fs.readFileSync(CFG_FILE(), 'utf8')) }; } catch (_) {}
if ({ sector: 1, nebula: 1, reactor: 1 }[cfg.theme]) cfg.theme = { sector: 'cortex', nebula: 'orb', reactor: 'halo' }[cfg.theme];
const save = () => { try { fs.writeFileSync(CFG_FILE(), JSON.stringify(cfg, null, 2)); } catch (_) {} };

let wins = [], tray = null;
const toastSrc = () => fs.readFileSync(path.join(__dirname, 'themes', 'shared', 'toast.js'), 'utf8');
const runJS = (js) => wins.forEach(w => { if (!w.isDestroyed()) w.webContents.executeJavaScript(js).catch(() => {}); });
const call = (fn, arg) => `window.${fn}&&window.${fn}(${JSON.stringify(arg)})`;

/* ---------------- windows ---------------- */
function loadTheme(win) {
  if (LEGACY.has(cfg.theme)) win.loadFile(path.join(__dirname, 'themes', cfg.theme, 'index.html'));
  else win.loadFile(path.join(__dirname, 'themes', 'studio', 'index.html'), { query: { theme: cfg.theme } });
}
function pushSettings(win) {
  const js = [call('jarvisConfig', { hidden: cfg.hidden, gain: cfg.gain, userName: cfg.userName, accent: cfg.accent }),
    `window.livelyPropertyListener&&(window.livelyPropertyListener('theme',${cfg.palette}),window.livelyPropertyListener('gain',${cfg.gain}),window.livelyPropertyListener('userName',${JSON.stringify(cfg.userName)}))`];
  js.forEach(s => win.webContents.executeJavaScript(s).catch(() => {}));
}
function createWindows() {
  wins.forEach(w => { try { w.destroy(); } catch (_) {} }); wins = [];
  for (const d of screen.getAllDisplays()) {
    const wallpaper = cfg.mode === 'wallpaper' && WIN;
    const win = new BrowserWindow({ x: d.bounds.x, y: d.bounds.y, width: d.bounds.width, height: d.bounds.height, frame: false, show: false, skipTaskbar: true, backgroundColor: '#050608',
      fullscreen: !wallpaper, resizable: false, focusable: !wallpaper, webPreferences: { backgroundThrottling: false, autoplayPolicy: 'no-user-gesture-required' } });
    win.setMenuBarVisibility(false); let first = true;
    win.webContents.on('did-finish-load', () => {
      win.webContents.executeJavaScript(toastSrc()).catch(() => {}); pushSettings(win); pushData();
      win.webContents.executeJavaScript(call('jarvisVoiceState', speechProc ? 'on' : 'off')).catch(() => {});
      if (first) { first = false; win.show(); if (wallpaper) attachToDesktop(win, d); }
      if (process.env.JARVIS_SHOT) setTimeout(() => win.webContents.capturePage().then(img => { fs.writeFileSync(process.env.JARVIS_SHOT, img.toPNG()); app.quit(); }), 7000);
    });
    win.webContents.on('before-input-event', (e, i) => { if (i.type === 'keyDown' && i.key === 'Escape' && cfg.mode === 'window' && !DRY) app.quit(); });
    loadTheme(win); wins.push(win);
  }
}
const PS_ATTACH = `
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
  const phys = screen.dipToScreenRect(null, display.bounds), all = screen.getAllDisplays().map(d => screen.dipToScreenRect(null, d.bounds));
  const ox = Math.min(...all.map(r => r.x)), oy = Math.min(...all.map(r => r.y)), hwnd = Number(win.getNativeWindowHandle().readBigUInt64LE(0));
  const script = path.join(os.tmpdir(), 'jarvis-wp.ps1'); fs.writeFileSync(script, PS_ATTACH);
  execFile('powershell', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', script, String(hwnd), String(phys.x - ox), String(phys.y - oy), String(phys.width), String(phys.height)], { windowsHide: true }, () => {});
}

/* ---------------- real PC data ---------------- */
let si = null; try { si = require('systeminformation'); } catch (_) {}
const sample = { cpu: {}, mem: {}, disks: [], net: {}, procs: [], sys: { host: os.hostname(), user: os.userInfo().username, os: os.type() + ' ' + os.release() }, batt: null, gpu: null };
const busy = {};
async function once(key, fn) { if (busy[key]) return; busy[key] = true; try { await fn(); } catch (_) {} busy[key] = false; }
async function initStatic() { if (!si) return; try { const c = await si.cpu(); sample.cpu.brand = (c.manufacturer + ' ' + c.brand).trim(); sample.cpu.speed = c.speed; const o = await si.osInfo(); sample.sys.os = (o.distro + ' ' + (o.release || '')).trim(); sample.sys.host = o.hostname || sample.sys.host; } catch (_) {} }
const fast = () => once('fast', async () => {
  if (!si) return; const l = await si.currentLoad(); sample.cpu.load = l.currentLoad; sample.cpu.cores = l.cpus.map(c => c.load);
  const m = await si.mem(); sample.mem = { total: m.total, used: m.total - m.available, pct: (m.total - m.available) / m.total * 100 };
  const n = await si.networkStats(); const a = n.filter(x => x.operstate === 'up' || x.operstate === 'unknown'); sample.net = { iface: (a[0] || n[0] || {}).iface, down: a.reduce((s, x) => s + (x.rx_sec || 0), 0), up: a.reduce((s, x) => s + (x.tx_sec || 0), 0) };
});
const procs = () => once('procs', async () => { if (!si) return; const p = await si.processes(); sample.procs = p.list.filter(x => !/idle|^system$/i.test(x.name)).sort((a, b) => b.cpu - a.cpu).slice(0, 8).map(x => ({ name: x.name, pid: x.pid, cpu: x.cpu })); });
const slow = () => once('slow', async () => {
  if (!si) return; const f = await si.fsSize(); sample.disks = f.filter(x => x.size > 0).map(x => ({ mount: x.mount, size: x.size, used: x.used, pct: x.use })).slice(0, 4);
  const b = await si.battery(); sample.batt = { has: b.hasBattery, pct: b.percent, charging: b.isCharging };
  const g = await si.graphics(); const c = (g.controllers || [])[0]; sample.gpu = c ? { name: c.model, util: c.utilizationGpu == null ? null : c.utilizationGpu, temp: c.temperatureGpu == null ? null : c.temperatureGpu } : null;
  const t = await si.cpuTemperature(); sample.cpu.temp = t && t.main != null ? t.main : null;
});
function pushData() {
  sample.sys.uptime = os.uptime();
  runJS(call('jarvisData', sample));
  runJS(call('livelySystemInformation', { currentCpu: sample.cpu.load, totalRam: sample.mem.total, currentRamUsed: sample.mem.used, currentNetDown: (sample.net.down || 0) / 1e6 }));
}

/* ---------------- actions ---------------- */
const expand = s => String(s).replace(/%([^%]+)%/g, (_, k) => process.env[k] || process.env[k.toUpperCase()] || '');
const themeIdx = () => THEMES.findIndex(t => t[0] === cfg.theme);
function setTheme(id) { if (!THEMES.find(t => t[0] === id)) return; cfg.theme = id; save(); wins.forEach(loadTheme); rebuildTray(); }
function nextTheme(dir) { setTheme(THEMES[(themeIdx() + dir + THEMES.length) % THEMES.length][0]); }
function setPanel(key, on) { const s = new Set(cfg.hidden); on ? s.delete(key) : s.add(key); cfg.hidden = [...s]; save(); wins.forEach(pushSettings); rebuildTray(); }
function setAllPanels(on) { cfg.hidden = on ? [] : PANELS.map(p => p[0]); save(); wins.forEach(pushSettings); rebuildTray(); }
const MEDIA = { volumeup: 175, volumedown: 174, mute: 173, playpause: 179, next: 176, prev: 177 };

function perform(cmd) {
  const log = (m) => { if (DRY) console.log('[dry-run]', m); };
  switch (cmd.do) {
    case 'open': { const t = expand(cmd.target); log('open ' + t); if (DRY) return 'ok'; if (/^[a-z][a-z0-9+.-]+:/i.test(t) && !/^[a-z]:[\\/]/i.test(t)) shell.openExternal(t); else shell.openPath(t); return 'ok'; }
    case 'run': { const t = expand(cmd.target), args = (cmd.args || []).map(expand); log('run ' + t + ' ' + args.join(' ')); if (DRY) return 'ok';
      const p = WIN ? spawn('cmd.exe', ['/c', 'start', '', t, ...args], { detached: true, stdio: 'ignore', windowsHide: true }) : spawn(t, args, { detached: true, stdio: 'ignore' }); p.on('error', () => {}); p.unref(); return 'ok'; }
    case 'media': { const code = MEDIA[cmd.target]; log('media ' + cmd.target); if (!code || DRY || !WIN) return 'ok'; const reps = /volume/.test(cmd.target) ? 5 : 1;
      execFile('powershell', ['-NoProfile', '-Command', `1..${reps} | % { (New-Object -ComObject WScript.Shell).SendKeys([char]${code}) }`], { windowsHide: true }, () => {}); return 'ok'; }
    case 'app': return appAction(cmd.target);
  }
  return 'unknown action';
}
function appAction(t) {
  const [k, v] = String(t).split(':');
  switch (k) {
    case 'theme': setTheme(v); return 'ok'; case 'nextTheme': nextTheme(1); return 'ok'; case 'prevTheme': nextTheme(-1); return 'ok';
    case 'hide': v === 'all' ? setAllPanels(false) : setPanel(v, false); return 'ok'; case 'show': v === 'all' ? setAllPanels(true) : setPanel(v, true); return 'ok';
    case 'gain': cfg.gain = Math.max(.3, Math.min(5, cfg.gain * (v === 'up' ? 1.4 : 1 / 1.4))); save(); wins.forEach(pushSettings); return 'mic ×' + cfg.gain.toFixed(1);
    case 'quit': if (!DRY) setTimeout(() => app.quit(), 600); return 'bye';
  }
  return 'unknown';
}

/* ---------------- voice commands (offline, Windows speech recognition) ---------------- */
const CMD_FILE = () => path.join(app.getPath('userData'), 'commands.json');
const DEFAULT_COMMANDS = {
  _readme: 'Say the wake word + a phrase, e.g. "jarvis open downloads". "do": open | run | media | app. Edit, save, then tray > Voice commands > Reload. Only add commands you trust.',
  wake: 'jarvis', minConfidence: 0.7,
  commands: [
    { say: 'open downloads', do: 'open', target: '%USERPROFILE%\\Downloads' }, { say: 'open documents', do: 'open', target: '%USERPROFILE%\\Documents' },
    { say: 'open desktop', do: 'open', target: '%USERPROFILE%\\Desktop' }, { say: 'open pictures', do: 'open', target: '%USERPROFILE%\\Pictures' },
    { say: 'open settings', do: 'open', target: 'ms-settings:' }, { say: 'open display settings', do: 'open', target: 'ms-settings:display' },
    { say: 'open sound settings', do: 'open', target: 'ms-settings:sound' }, { say: 'open bluetooth settings', do: 'open', target: 'ms-settings:bluetooth' },
    { say: 'open wifi settings', do: 'open', target: 'ms-settings:network-wifi' }, { say: 'open update settings', do: 'open', target: 'ms-settings:windowsupdate' },
    { say: 'open task manager', do: 'run', target: 'taskmgr' }, { say: 'open calculator', do: 'run', target: 'calc' }, { say: 'open notepad', do: 'run', target: 'notepad' },
    { say: 'open command prompt', do: 'run', target: 'cmd' }, { say: 'take screenshot', do: 'open', target: 'ms-screenclip:' },
    { say: 'open browser', do: 'open', target: 'https://www.google.com' }, { say: 'open youtube', do: 'open', target: 'https://www.youtube.com' },
    { say: 'lock computer', do: 'run', target: 'rundll32.exe', args: ['user32.dll,LockWorkStation'] },
    { say: 'volume up', do: 'media', target: 'volumeup' }, { say: 'volume down', do: 'media', target: 'volumedown' }, { say: 'mute', do: 'media', target: 'mute' },
    { say: 'play pause', do: 'media', target: 'playpause' }, { say: 'next track', do: 'media', target: 'next' }, { say: 'previous track', do: 'media', target: 'prev' }
  ]
};
let cmdCfg = DEFAULT_COMMANDS, phraseMap = new Map(), speechProc = null;
function loadCommands() {
  try { if (!fs.existsSync(CMD_FILE())) fs.writeFileSync(CMD_FILE(), JSON.stringify(DEFAULT_COMMANDS, null, 2)); cmdCfg = { ...DEFAULT_COMMANDS, ...JSON.parse(fs.readFileSync(CMD_FILE(), 'utf8')) }; }
  catch (e) { cmdCfg = DEFAULT_COMMANDS; }
  const wake = String(cmdCfg.wake == null ? 'jarvis' : cmdCfg.wake).trim().toLowerCase(), pre = wake ? wake + ' ' : '';
  phraseMap = new Map(); const add = (say, cmd) => phraseMap.set(pre + String(say).toLowerCase().trim(), cmd);
  (cmdCfg.commands || []).forEach(c => c && c.say && add(c.say, c));
  THEMES.forEach(t => add('switch to ' + t[2], { do: 'app', target: 'theme:' + t[0] })); add('next theme', { do: 'app', target: 'nextTheme' }); add('previous theme', { do: 'app', target: 'prevTheme' });
  add('hide data', { do: 'app', target: 'hide:all' }); add('show data', { do: 'app', target: 'show:all' });
  PANELS.forEach(p => { add('hide ' + p[2], { do: 'app', target: 'hide:' + p[0] }); add('show ' + p[2], { do: 'app', target: 'show:' + p[0] }); });
  add('mic louder', { do: 'app', target: 'gain:up' }); add('mic quieter', { do: 'app', target: 'gain:down' }); add('quit wallpaper', { do: 'app', target: 'quit' });
}
const PS_SPEECH = `
param([string]$file)
Add-Type -AssemblyName System.Speech
$rec = New-Object System.Speech.Recognition.SpeechRecognitionEngine
$phrases = Get-Content -Raw -Encoding UTF8 -Path $file | ConvertFrom-Json
$choices = New-Object System.Speech.Recognition.Choices
foreach ($p in $phrases) { $choices.Add([string]$p) }
$gb = New-Object System.Speech.Recognition.GrammarBuilder
$gb.Culture = $rec.RecognizerInfo.Culture
$gb.Append($choices)
$rec.LoadGrammar((New-Object System.Speech.Recognition.Grammar($gb)))
$rec.SetInputToDefaultAudioDevice()
Register-ObjectEvent -InputObject $rec -EventName SpeechRecognized -Action {
  $o = [pscustomobject]@{ text = $Event.SourceEventArgs.Result.Text; conf = [math]::Round($Event.SourceEventArgs.Result.Confidence, 2) }
  [Console]::Out.WriteLine(($o | ConvertTo-Json -Compress)); [Console]::Out.Flush()
} | Out-Null
$rec.RecognizeAsync([System.Speech.Recognition.RecognizeMode]::Multiple)
[Console]::Out.WriteLine('{"ready":true}'); [Console]::Out.Flush()
while ($true) { Start-Sleep -Milliseconds 200 }
`;
function handleHeard(text, conf) {
  const key = String(text).toLowerCase().trim(), cmd = phraseMap.get(key), min = cmdCfg.minConfidence || .7;
  if (!cmd) return sendVoice({ text, status: 'ignored', msg: 'not a command' });
  if (conf < min) return sendVoice({ text, status: 'ignored', msg: 'low confidence ' + conf });
  const r = perform(cmd); sendVoice({ text, status: r === 'unknown' || r === 'unknown action' ? 'error' : 'ok', msg: r === 'ok' ? '' : r });
}
const sendVoice = m => runJS(call('jarvisVoice', m));
function startSpeech() {
  stopSpeech(); loadCommands(); if (!cfg.voice) return;
  if (!WIN) { if (DRY) console.log('[voice] phrases:', phraseMap.size); return; }
  try {
    const pf = path.join(app.getPath('userData'), 'phrases.json'), sf = path.join(app.getPath('userData'), 'speech.ps1');
    fs.writeFileSync(pf, JSON.stringify([...phraseMap.keys()]), 'utf8'); fs.writeFileSync(sf, PS_SPEECH, 'utf8');
    const p = speechProc = spawn('powershell', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', sf, pf], { windowsHide: true }); let buf = '', err = '';
    p.stdout.on('data', d => { buf += d; let i; while ((i = buf.indexOf('\n')) >= 0) { const line = buf.slice(0, i).trim(); buf = buf.slice(i + 1); if (!line) continue;
      try { const j = JSON.parse(line); if (j.ready) runJS(call('jarvisVoiceState', 'on')); else handleHeard(j.text, j.conf); } catch (_) {} } });
    p.stderr.on('data', d => { err += d; });
    p.on('exit', () => { if (speechProc === p) { speechProc = null; runJS(call('jarvisVoiceState', 'off')); if (err.trim()) { runJS(call('jarvisVoiceState', 'error')); sendVoice({ text: 'Speech engine unavailable', status: 'error', msg: err.split('\n')[0].slice(0, 60) }); } } });
  } catch (e) { sendVoice({ text: 'Speech engine failed', status: 'error', msg: String(e.message).slice(0, 60) }); }
}
function stopSpeech() { if (speechProc) { const p = speechProc; speechProc = null; try { p.kill(); } catch (_) {} } }

/* ---------------- tray ---------------- */
function rebuildTray() {
  if (!tray) return; const hid = new Set(cfg.hidden);
  tray.setContextMenu(Menu.buildFromTemplate([
    { label: 'Theme', submenu: THEMES.map(t => ({ label: t[1], type: 'radio', checked: cfg.theme === t[0], click: () => setTheme(t[0]) })).concat([{ type: 'separator' }, { label: 'Next   (Ctrl+Alt+→)', click: () => nextTheme(1) }, { label: 'Previous   (Ctrl+Alt+←)', click: () => nextTheme(-1) }]) },
    { label: 'Accent colour', submenu: ACCENTS.map((n, i) => ({ label: n, type: 'radio', checked: cfg.accent === i, click: () => { cfg.accent = i; save(); wins.forEach(pushSettings); } })) },
    { label: 'Classic HUD palette', submenu: ['Claude', 'Mono', 'Reactor'].map((n, i) => ({ label: n, type: 'radio', checked: cfg.palette === i, click: () => { cfg.palette = i; save(); wins.forEach(pushSettings); } })) },
    { label: 'Data panels', submenu: PANELS.map(p => ({ label: p[1], type: 'checkbox', checked: !hid.has(p[0]), click: m => setPanel(p[0], m.checked) })).concat([{ type: 'separator' }, { label: 'Show all', click: () => setAllPanels(true) }, { label: 'Hide all   (Ctrl+Alt+H)', click: () => setAllPanels(false) }]) },
    { label: 'Voice commands', submenu: [
      { label: 'Enabled   (Ctrl+Alt+V)', type: 'checkbox', checked: cfg.voice, click: m => { cfg.voice = m.checked; save(); m.checked ? startSpeech() : stopSpeech(); } },
      { label: 'What can I say…', click: showHelp }, { label: 'Edit my commands (commands.json)', click: () => { loadCommands(); shell.openPath(CMD_FILE()); } },
      { label: 'Reload commands', click: () => { startSpeech(); sendVoice({ text: 'Commands reloaded', status: 'ok', msg: phraseMap.size + ' phrases' }); } }] },
    { label: 'Mic sensitivity', submenu: [0.6, 1, 1.6, 2.5, 4].map(g => ({ label: g + '×', type: 'radio', checked: cfg.gain === g, click: () => { cfg.gain = g; save(); wins.forEach(pushSettings); } })) },
    { type: 'separator' },
    { label: 'Mode', submenu: [{ label: 'Window (fullscreen, Esc to exit)', type: 'radio', checked: cfg.mode === 'window', click: () => { cfg.mode = 'window'; save(); createWindows(); } },
      { label: 'Wallpaper (behind icons, experimental)', type: 'radio', checked: cfg.mode === 'wallpaper', click: () => { cfg.mode = 'wallpaper'; save(); createWindows(); } }] },
    { label: 'Start with Windows', type: 'checkbox', checked: cfg.autostart, click: m => { cfg.autostart = m.checked; save(); app.setLoginItemSettings({ openAtLogin: m.checked }); } },
    { type: 'separator' }, { label: 'Quit', click: () => app.quit() }]));
}
function showHelp() {
  const wake = cmdCfg.wake || '', list = [...phraseMap.keys()].slice(0, 60).join('\n');
  dialog.showMessageBox({ type: 'info', title: 'Voice commands', message: `Say “${wake}” + a phrase. ${phraseMap.size} phrases loaded.`, detail: list + (phraseMap.size > 60 ? '\n…' : '') + '\n\nEdit commands.json from the tray menu to add your own.' });
}

app.whenReady().then(() => {
  session.defaultSession.setPermissionRequestHandler((_, perm, cb) => cb(perm === 'media'));
  session.defaultSession.setPermissionCheckHandler((_, perm) => perm === 'media');
  tray = new Tray(nativeImage.createFromPath(path.join(__dirname, 'assets', 'icon.png')).resize({ width: 16, height: 16 })); tray.setToolTip('Jarvis Wallpaper');
  loadCommands(); rebuildTray(); createWindows(); initStatic(); fast(); procs(); slow();
  setInterval(() => { fast(); pushData(); }, 1000); setInterval(procs, 6000); setInterval(slow, 20000);
  startSpeech();
  const reg = (k, f) => { try { globalShortcut.register(k, f); } catch (_) {} };
  reg('Control+Alt+Right', () => nextTheme(1)); reg('Control+Alt+Left', () => nextTheme(-1));
  reg('Control+Alt+H', () => setAllPanels(cfg.hidden.length >= PANELS.length)); reg('Control+Alt+V', () => { cfg.voice = !cfg.voice; save(); cfg.voice ? startSpeech() : stopSpeech(); rebuildTray(); });
  screen.on('display-added', createWindows); screen.on('display-removed', createWindows);
  if (process.env.JARVIS_TEST_SAY) setTimeout(() => { loadCommands(); for (const s of process.env.JARVIS_TEST_SAY.split('|')) handleHeard(s, .9); console.log('[test] theme=' + cfg.theme, 'hidden=' + cfg.hidden.join(',')); }, 2500);
});
app.on('will-quit', () => { globalShortcut.unregisterAll(); stopSpeech(); });
app.on('window-all-closed', e => e.preventDefault());
