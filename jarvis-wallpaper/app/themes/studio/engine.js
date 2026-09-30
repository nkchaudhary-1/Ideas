/* Jarvis Studio engine: audio (real mic), PC data, widgets, drawing helpers.
   All theme code draws in "design px": height is always 900, width = 900 * aspect. */
(() => {
'use strict';
const TAU = Math.PI * 2;
const MONO = '"Cascadia Mono","SF Mono",Consolas,monospace';
const SANS = '"Segoe UI",Inter,system-ui,sans-serif';
const JP = '"Yu Gothic UI","Yu Gothic","Meiryo","Noto Sans CJK JP",sans-serif';
const SERIF = 'Georgia,"Iowan Old Style","Times New Roman",serif';
const PALETTES = [
  { name: 'Cyan',    a: [98, 214, 255],  b: [228, 240, 250], c: [118, 150, 172], bg0: '#08121c', bg1: '#03050a' },
  { name: 'Claude',  a: [217, 119, 87],  b: [240, 238, 230], c: [168, 160, 147], bg0: '#27211b', bg1: '#0d0b09' },
  { name: 'Mono',    a: [236, 236, 232], b: [244, 244, 240], c: [170, 170, 166], bg0: '#1b1b1d', bg1: '#050506', mono: true },
  { name: 'Amber',   a: [255, 176, 64],  b: [250, 240, 222], c: [178, 164, 140], bg0: '#261f10', bg1: '#0b0905' },
  { name: 'Violet',  a: [178, 142, 255], b: [236, 230, 250], c: [164, 154, 188], bg0: '#1f1830', bg1: '#09060f' },
  { name: 'Jade',    a: [108, 228, 184], b: [230, 246, 240], c: [146, 176, 166], bg0: '#13241f', bg1: '#060d0b' }];
const Studio = window.Studio = { themes: {}, list: [], register(t) { this.themes[t.id] = t; this.list.push(t.id); } };
const cv = document.getElementById('c'), ctx = cv.getContext('2d');
const q = new URLSearchParams(location.search);

const api = Studio.api = {
  ctx, TAU, F: { MONO, SANS, JP, SERIF }, PALETTES, w: 1600, h: 900, cx: 800, cy: 450, s: 1, T: 0, dt: 16, mx: 0, my: 0,
  col: { a: [217, 119, 87], b: [240, 238, 230], c: [168, 160, 147] }, pal: PALETTES[0],
  au: { env: 0, bass: 0, mid: 0, treb: 0, voice: false, live: false, src: 'none', spec: new Float32Array(128), wave: new Float32Array(128) },
  d: {}, hist: { cpu: [], mem: [], netD: [], netU: [] }, v: { cpu: 0, mem: 0, netD: 0, netU: 0, gpu: 0 },
  hidden: new Set(), cfg: { gain: 1, userName: '', accent: 0 }, vlog: []
};
api.show = k => !api.hidden.has(k);
const rgba = api.rgba = (al, c) => { c = c || api.col.a; return 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + al + ')'; };

/* ---------------- canvas ---------------- */
function resize() {
  const DPR = Math.min(devicePixelRatio || 1, 2);
  cv.width = Math.round(innerWidth * DPR); cv.height = Math.round(innerHeight * DPR);
  api.s = cv.height / 900; api.w = cv.width / api.s; api.cx = api.w / 2;
}
addEventListener('resize', resize); resize();
addEventListener('mousemove', e => { api.mx = e.clientX / innerWidth - .5; api.my = e.clientY / innerHeight - .5; api.mpx = e.clientX * cv.width / innerWidth / api.s; api.mpy = e.clientY * cv.height / innerHeight / api.s; api.mouseIn = true; });

/* ---------------- drawing helpers ---------------- */
api.line = (x0, y0, x1, y1, lw, al, c) => { ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.lineWidth = lw || 1; ctx.strokeStyle = rgba(al == null ? 1 : al, c); ctx.stroke(); };
api.poly = (pts, lw, al, c, close, fill) => { ctx.beginPath(); pts.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); if (close) ctx.closePath();
  if (fill) { ctx.fillStyle = rgba(fill, c); ctx.fill(); } if (lw) { ctx.lineWidth = lw; ctx.strokeStyle = rgba(al == null ? 1 : al, c); ctx.stroke(); } };
api.arc = (x, y, r, a0, a1, lw, al, c, gl) => { ctx.beginPath(); ctx.arc(x, y, r, a0, a1);
  if (gl) { ctx.lineWidth = lw * 2.6; ctx.strokeStyle = rgba(al * .09, c); ctx.stroke(); }
  ctx.lineWidth = lw; ctx.strokeStyle = rgba(al, c); ctx.stroke(); };
api.ring = (x, y, r, lw, al, c, gl) => api.arc(x, y, r, 0, TAU, lw, al, c, gl);
api.disc = (x, y, r, al, c) => { ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fillStyle = rgba(al, c); ctx.fill(); };
api.rect = (x, y, w, h, lw, al, c) => { ctx.lineWidth = lw || 1; ctx.strokeStyle = rgba(al, c); ctx.strokeRect(x, y, w, h); };
api.fillRect = (x, y, w, h, al, c) => { ctx.fillStyle = rgba(al, c); ctx.fillRect(x, y, w, h); };
api.bracket = (x, y, w, h, len, lw, al, c) => { ctx.beginPath();
  ctx.moveTo(x, y + len); ctx.lineTo(x, y); ctx.lineTo(x + len, y); ctx.moveTo(x + w - len, y); ctx.lineTo(x + w, y); ctx.lineTo(x + w, y + len);
  ctx.moveTo(x + w, y + h - len); ctx.lineTo(x + w, y + h); ctx.lineTo(x + w - len, y + h); ctx.moveTo(x + len, y + h); ctx.lineTo(x, y + h); ctx.lineTo(x, y + h - len);
  ctx.lineWidth = lw || 1; ctx.strokeStyle = rgba(al, c); ctx.stroke(); };
api.ticks = (x, y, r, n, len, rot, lw, al, c, emph, a0, a1) => { a0 = a0 || 0; a1 = a1 === undefined ? TAU : a1; ctx.beginPath();
  for (let i = 0; i < n; i++) { const a = rot + a0 + (a1 - a0) * i / n, l = emph && i % emph === 0 ? len * 1.9 : len, co = Math.cos(a), si = Math.sin(a);
    ctx.moveTo(x + co * r, y + si * r); ctx.lineTo(x + co * (r + l), y + si * (r + l)); }
  ctx.lineWidth = lw || 1; ctx.strokeStyle = rgba(al, c); ctx.stroke(); };
api.text = (s, x, y, size, al, c, align, o) => { o = o || {}; ctx.font = (o.weight || 400) + ' ' + size + 'px ' + (o.font || MONO);
  ctx.textAlign = align || 'left'; ctx.textBaseline = 'middle'; ctx.letterSpacing = (o.sp || 0) + 'px'; ctx.fillStyle = rgba(al, c); ctx.fillText(s, x, y); ctx.letterSpacing = '0px'; };
api.glow = (x, y, r, al, c) => { const g = ctx.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, rgba(al, c)); g.addColorStop(1, rgba(0, c)); ctx.fillStyle = g; ctx.fillRect(x - r, y - r, r * 2, r * 2); };
api.bg = (c0, c1) => { const g = ctx.createRadialGradient(api.cx, 450, 0, api.cx, 450, Math.max(api.w, 900) * .7); g.addColorStop(0, c0); g.addColorStop(1, c1); ctx.fillStyle = g; ctx.fillRect(0, 0, api.w, 900); };
api.grid = (step, al, c, ox, oy) => { ctx.beginPath(); for (let x = (ox || 0) % step; x < api.w; x += step) { ctx.moveTo(x, 0); ctx.lineTo(x, 900); }
  for (let y = (oy || 0) % step; y < 900; y += step) { ctx.moveTo(0, y); ctx.lineTo(api.w, y); } ctx.lineWidth = 1; ctx.strokeStyle = rgba(al, c); ctx.stroke(); };
api.spark = (x, y, w, h, arr, max, lw, al, c, fill) => { if (!arr || arr.length < 2) { api.line(x, y + h, x + w, y + h, 1, .2, c); return; }
  const m = max || Math.max(1, ...arr), n = arr.length; ctx.beginPath();
  arr.forEach((v, i) => { const px = x + w * i / (n - 1), py = y + h - h * Math.min(1, v / m); i ? ctx.lineTo(px, py) : ctx.moveTo(px, py); });
  ctx.lineWidth = lw || 1; ctx.strokeStyle = rgba(al, c); ctx.stroke();
  if (fill) { ctx.lineTo(x + w, y + h); ctx.lineTo(x, y + h); ctx.closePath(); ctx.fillStyle = rgba(fill, c); ctx.fill(); } };
api.bar = (x, y, w, h, v, al, c, seg) => { v = Math.max(0, Math.min(1, v || 0));
  if (seg) { const n = seg, gw = w / n; for (let i = 0; i < n; i++) api.fillRect(x + i * gw, y, gw - 2, h, i / n < v ? al : .12, c); }
  else { api.fillRect(x, y, w, h, .14, c); api.fillRect(x, y, w * v, h, al, c); } };
/* linear spectrum: bars from baseline up (dir -1) / down (1) / both (0) */
api.spectrum = (x, y, w, h, n, al, c, dir, lw) => { const bw = w / n; ctx.beginPath();
  for (let i = 0; i < n; i++) { const v = api.au.spec[Math.floor(i * 128 / n)] * h, px = x + i * bw + bw / 2;
    if (dir === 0) { ctx.moveTo(px, y - v / 2); ctx.lineTo(px, y + v / 2 + 1); } else { ctx.moveTo(px, y); ctx.lineTo(px, y + (dir || -1) * (v + 1)); } }
  ctx.lineWidth = lw || Math.max(1, bw * .55); ctx.strokeStyle = rgba(al, c); ctx.stroke(); };
api.radial = (x, y, r, len, n, rot, lw, al, c, gl) => { ctx.beginPath();
  for (let k = 0; k < n; k++) { const idx = k < n / 2 ? k : n - 1 - k, v = api.au.spec[Math.floor(idx * 128 / (n / 2))] || 0, a = rot - Math.PI / 2 + k / n * TAU, l = len * (.06 + v);
    ctx.moveTo(x + Math.cos(a) * r, y + Math.sin(a) * r); ctx.lineTo(x + Math.cos(a) * (r + l), y + Math.sin(a) * (r + l)); }
  if (gl) { ctx.lineWidth = lw * 3; ctx.strokeStyle = rgba(al * .2, c); ctx.stroke(); } ctx.lineWidth = lw; ctx.strokeStyle = rgba(al, c); ctx.stroke(); };
api.wave = (x, y, w, amp, lw, al, c, mirror) => { ctx.beginPath(); const n = 128;
  for (let i = 0; i <= n; i++) { const k = mirror ? (i < n / 2 ? i : n - i) * 2 : i, v = api.au.wave[Math.min(127, k)] || 0, px = x + w * i / n, py = y + v * amp; i ? ctx.lineTo(px, py) : ctx.moveTo(px, py); }
  ctx.lineWidth = lw; ctx.strokeStyle = rgba(al, c); ctx.stroke(); };
/* 3D-ish projection around a centre with yaw/pitch (used by wireframe themes) */
api.proj = (x, y, z, yaw, pit, f, ox, oy) => { const cy = Math.cos(yaw), sy = Math.sin(yaw), cp = Math.cos(pit), sp = Math.sin(pit);
  const x1 = x * cy + z * sy, z1 = -x * sy + z * cy, y1 = y * cp - z1 * sp, z2 = y * sp + z1 * cp, k = f / (f + z2); return [ox + x1 * k, oy + y1 * k, z2]; };
api.fmt = {
  pct: v => v == null ? '--' : Math.round(v) + '%',
  gb: b => b == null ? '--' : (b / 1073741824).toFixed(b > 1e11 ? 0 : 1) + ' GB',
  rate: b => b == null ? '--' : b >= 1e6 ? (b / 1e6).toFixed(1) + ' MB/s' : b >= 1e3 ? Math.round(b / 1e3) + ' KB/s' : Math.round(b) + ' B/s',
  up: s => { if (s == null) return '--'; const d = Math.floor(s / 86400), h = Math.floor(s / 3600) % 24, m = Math.floor(s / 60) % 60; return (d ? d + 'd ' : '') + String(h).padStart(2, '0') + 'h ' + String(m).padStart(2, '0') + 'm'; },
  clock: () => { const d = new Date(); return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0'); },
  secs: () => String(new Date().getSeconds()).padStart(2, '0'),
  date: () => new Date().toLocaleDateString(undefined, { weekday: 'long', day: '2-digit', month: 'short', year: 'numeric' }),
  short: (s, n) => s && s.length > n ? s.slice(0, n - 1) + '…' : (s || '')
};

/* ---------------- refined typography helpers ---------------- */
/* big serif numeral + small mono unit; returns width. right=true aligns the whole group to x */
api.num = (str, unit, x, y, size, al, right, c) => {
  ctx.font = '400 ' + size + 'px ' + SERIF; const w = ctx.measureText(str).width;
  ctx.font = '400 ' + size * .36 + 'px ' + MONO; const uw = unit ? ctx.measureText(unit).width + 5 : 0, sx = right ? x - w - uw : x;
  api.text(str, sx, y, size, al == null ? .94 : al, c || api.col.b, 'left', { font: SERIF });
  if (unit) api.text(unit, sx + w + 5, y + size * .14, size * .38, .7, api.col.c, 'left');
  return w + uw; };
api.label = (t, x, y, al, align, c) => api.text(String(t).toUpperCase(), x, y, 9, al == null ? .75 : al, c || api.col.c, align || 'left', { sp: 3 });
api.clockBig = (x, y, size, align) => { const hh = fmt.clock().split(':'); ctx.font = '400 ' + size + 'px ' + SERIF; const wh = ctx.measureText(hh[0]).width, wc = ctx.measureText(':').width, wm = ctx.measureText(hh[1]).width, tot = wh + wc + wm;
  const sx = align === 'right' ? x - tot : align === 'center' ? x - tot / 2 : x;
  api.text(hh[0], sx, y, size, .95, api.col.b, 'left', { font: SERIF }); api.text(':', sx + wh, y - size * .04, size, .9, api.col.a, 'left', { font: SERIF }); api.text(hh[1], sx + wh + wc, y, size, .95, api.col.b, 'left', { font: SERIF }); return tot; };
api.greeting = (x, y, align) => { const h = new Date().getHours(), part = h < 5 ? 'night' : h < 12 ? 'morning' : h < 17 ? 'afternoon' : 'evening', name = api.cfg.userName || (api.d.sys || {}).user || '';
  api.text('Good ' + part + (name ? ', ' + name : '') + '.', x, y, 24, .95, api.col.b, align || 'left', { font: SERIF });
  api.label('Core online · ' + fmt.up((api.d.sys || {}).uptime), x, y + 26, .5, align || 'left'); };

const { fmt } = api;
const W = api.W = {};

/* ---------------- neural brain core (shared by themes) ---------------- */
const Brain = api.brain = { nodes: [], edges: [], adj: [], pulses: [], yaw: .6, n: 0,
  build(n) { const N = this.nodes = [], rnd = (a, b) => a + Math.random() * (b - a); this.edges = []; this.adj = []; this.pulses = []; this.n = n;
    while (N.length < n) { const u = Math.random() * 2 - 1, th = Math.random() * TAU, sq = Math.sqrt(1 - u * u), dx = sq * Math.cos(th), dy = u, dz = sq * Math.sin(th);
      const hemi = Math.random() < .5 ? -1 : 1, shell = Math.random() < .72 ? rnd(.93, 1) : rnd(.35, .9), fold = 1 + .07 * Math.sin(dx * 9 + dz * 7) * Math.cos(dy * 8 + dz * 5) + .04 * Math.sin(dz * 14 + dy * 6);
      let x = dx * .62 * shell * fold, y = dy * .78 * shell * fold, z = dz * shell * fold; if (y < 0) y *= .72; if (y < -.3 && z > .25 && z < .6 && shell > .9) continue;
      x = hemi * (Math.abs(x) + .05); N.push({ x: x * 1.05, y: -y, z, glow: 0, px: 0, py: 0, pz: 0, bin: (Math.random() * 128) | 0 }); }
    const seen = new Set(); N.forEach((a, i) => { const ds = []; for (let j = 0; j < N.length; j++) { if (i === j) continue; const b = N[j]; ds.push([(a.x - b.x) ** 2 + (a.y - b.y) ** 2 + (a.z - b.z) ** 2, j]); }
      ds.sort((p, q) => p[0] - q[0]); const maxD = n < 300 ? .42 : .34;
      for (let k = 0; k < 3; k++) { const d = ds[k][0], j = ds[k][1]; if (d > maxD * maxD) continue; const key = i < j ? i + '_' + j : j + '_' + i; if (seen.has(key)) continue; seen.add(key);
        this.edges.push({ a: i, b: j }); (this.adj[i] || (this.adj[i] = [])).push(this.edges.length - 1); (this.adj[j] || (this.adj[j] = [])).push(this.edges.length - 1); } }); },
  seed() { if (this.edges.length) this.pulses.push({ e: (Math.random() * this.edges.length) | 0, from: null, t: 0, sp: .012 + Math.random() * .018 }); },
  draw(x, y, H, o) { o = o || {}; const n = o.n || 420; if (this.n !== n) this.build(n);
    const au = api.au, e = au.env, dt = api.dt, N = this.nodes, al = o.alpha == null ? 1 : o.alpha; this.yaw += dt * .00018 * (o.speed == null ? 1 : o.speed) * (1 + e * 3);
    const yw = this.yaw + api.mx * .5, rx = (o.tilt == null ? -.12 : o.tilt) + api.my * .25, c = Math.cos(yw), s = Math.sin(yw), cr = Math.cos(rx), sr = Math.sin(rx), k = H * 1.9 * (1 + Math.sin(api.T * 1.2) * .012 + e * .05);
    for (const p of N) { const x1 = p.x * c + p.z * s, z1 = -p.x * s + p.z * c, y1 = p.y * cr - z1 * sr, z2 = p.y * sr + z1 * cr, f = 1 / (1.9 - z2 * .55); p.px = x + x1 * k * f; p.py = y + y1 * k * f; p.pz = z2; if (p.glow > 0) p.glow = Math.max(0, p.glow - dt * .0022); }
    for (let i = 0; i < 8; i++) { const p = N[(Math.random() * N.length) | 0], g = au.spec[p.bin]; if (g > .3) p.glow = Math.max(p.glow, g); }
    if (!o.noGlow) api.glow(x, y, H * 1.35, (.1 + e * .22) * al, api.col.a);
    const buckets = [[], [], [], []]; for (const ed of this.edges) { const a = N[ed.a], b = N[ed.b], d = (a.pz + b.pz) / 2; buckets[Math.max(0, Math.min(3, Math.floor((d + 1) * 2)))].push(a.px, a.py, b.px, b.py); }
    ctx.lineWidth = 1; buckets.forEach((arr, bi) => { ctx.beginPath(); for (let i = 0; i < arr.length; i += 4) { ctx.moveTo(arr[i], arr[i + 1]); ctx.lineTo(arr[i + 2], arr[i + 3]); } ctx.strokeStyle = rgba(([.07, .12, .18, .26][bi] + e * .06) * al, api.col.a); ctx.stroke(); });
    for (const p of N) { const dep = (p.pz + 1) / 2, r = 1 + dep * 1.3 + p.glow * 3; ctx.fillStyle = rgba((.22 + dep * .5 + p.glow * .4) * al, p.glow > .05 ? api.col.b : api.col.a); ctx.beginPath(); ctx.arc(p.px, p.py, r, 0, TAU); ctx.fill();
      if (p.glow > .4) { ctx.fillStyle = rgba(p.glow * .14 * al, api.col.a); ctx.beginPath(); ctx.arc(p.px, p.py, r * 4, 0, TAU); ctx.fill(); } }
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    for (let i = this.pulses.length - 1; i >= 0; i--) { const p = this.pulses[i]; p.t += p.sp * (dt / 16) * (1 + e * 2); const ed = this.edges[p.e]; let a = N[ed.a], b = N[ed.b], ib = ed.b; if (p.from === ed.b) { [a, b] = [b, a]; ib = ed.a; }
      if (p.t >= 1) { b.glow = 1; this.pulses.splice(i, 1); const out = (this.adj[ib] || []).filter(q => q !== p.e); if (out.length && this.pulses.length < 70) { const br = Math.random() < .2 + e * .2 ? 2 : 1; for (let q = 0; q < br; q++) this.pulses.push({ e: out[(Math.random() * out.length) | 0], from: ib, t: 0, sp: .012 + Math.random() * .018 }); } continue; }
      const px = a.px + (b.px - a.px) * p.t, py = a.py + (b.py - a.py) * p.t, t0 = Math.max(0, p.t - .25), tx = a.px + (b.px - a.px) * t0, ty = a.py + (b.py - a.py) * t0, g = ctx.createLinearGradient(tx, ty, px, py);
      g.addColorStop(0, rgba(0, api.col.b)); g.addColorStop(1, rgba(.9 * al, api.col.b)); ctx.strokeStyle = g; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(tx, ty); ctx.lineTo(px, py); ctx.stroke(); ctx.fillStyle = rgba(.28 * al, api.col.a); ctx.beginPath(); ctx.arc(px, py, 3, 0, TAU); ctx.fill(); }
    ctx.restore();
    if (this.pulses.length < 10 + e * 45 && Math.random() < .2 + e * .5) this.seed(); } };

/* ---------------- ambient backdrop + finishing ---------------- */
const dust = Array.from({ length: 80 }, () => ({ x: Math.random(), y: Math.random(), z: Math.random(), v: 2e-5 + Math.random() * 6e-5 }));
api.backdrop = (o) => { o = o || {}; const p = api.pal; api.bg(o.c0 || p.bg0, o.c1 || p.bg1);
  for (const d of dust) { d.y -= d.v * (.4 + d.z) * api.dt * .06 * 16; if (d.y < 0) { d.y = 1; d.x = Math.random(); } ctx.fillStyle = rgba(.06 + d.z * .16, api.col.b); ctx.fillRect(d.x * api.w, d.y * 900, .8 + d.z, .8 + d.z); } };
function finish() { const g = ctx.createRadialGradient(api.cx, 450, Math.min(api.w, 900) * .45, api.cx, 450, Math.max(api.w, 900) * .8); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,.45)'); ctx.fillStyle = g; ctx.fillRect(0, 0, api.w, 900); }
api.setAccent = i => { i = ((i | 0) % PALETTES.length + PALETTES.length) % PALETTES.length; api.pal = PALETTES[i]; api.cfg.accent = i; api.col = { a: api.pal.a, b: api.pal.b, c: api.pal.c }; };

/* ---------------- audio (real microphone only) ---------------- */
let an = null, tb, fb;
async function startMic() {
  if (an) return;
  try {
    const st = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: false, autoGainControl: true } });
    const ac = new (window.AudioContext || window.webkitAudioContext)(); an = ac.createAnalyser(); an.fftSize = 1024; an.smoothingTimeConstant = .6;
    ac.createMediaStreamSource(st).connect(an); tb = new Uint8Array(1024); fb = new Uint8Array(512); ac.resume && ac.resume(); api.au.live = true; api.au.src = 'mic';
  } catch (e) { api.au.live = false; }
}
addEventListener('click', startMic);
const tg = new Float32Array(128), wt = new Float32Array(128); let holdT = 0;
function audio(now) {
  const au = api.au; let rms = 0;
  if (an) {
    an.getByteTimeDomainData(tb); an.getByteFrequencyData(fb); let s = 0; for (let i = 0; i < 1024; i++) { const v = (tb[i] - 128) / 128; s += v * v; } rms = Math.sqrt(s / 1024) * api.cfg.gain;
    for (let i = 0; i < 128; i++) { const f = 2 * Math.pow(45, i / 127), lo = f | 0, fr = f - lo, raw = (fb[lo] * (1 - fr) + fb[lo + 1] * fr) / 255; tg[i] = Math.min(1, Math.max(0, raw - .15) / .85 * 1.5 * api.cfg.gain); wt[i] = (tb[i * 8] - 128) / 128 * api.cfg.gain; }
  } else { tg.fill(0); wt.fill(0); }
  const l = Math.min(1, Math.max(0, rms - .008) * 7); au.env += (l - au.env) * (1 - Math.exp(-api.dt / (l > au.env ? 40 : 220)));
  let b = 0, m = 0, t = 0;
  for (let i = 0; i < 128; i++) { au.spec[i] += (tg[i] - au.spec[i]) * (tg[i] > au.spec[i] ? .6 : .12); au.wave[i] += (wt[i] - au.wave[i]) * .5; if (i < 16) b += au.spec[i]; else if (i < 70) m += au.spec[i]; else t += au.spec[i]; }
  au.bass = b / 16; au.mid = m / 54; au.treb = t / 58;
  if (au.env > .14) { au.voice = true; holdT = now + 350; } else if (au.voice && au.env < .08 && now > holdT) au.voice = false;
}

/* ---------------- data / config / voice events from the main process ---------------- */
window.jarvisData = d => { api.d = d || {}; const H = api.hist, push = (a, v) => { a.push(v); if (a.length > 90) a.shift(); };
  if (d.cpu && d.cpu.load != null) push(H.cpu, d.cpu.load); if (d.mem && d.mem.pct != null) push(H.mem, d.mem.pct);
  if (d.net) { push(H.netD, d.net.down || 0); push(H.netU, d.net.up || 0); } };
window.jarvisConfig = c => { if (c.hidden) api.hidden = new Set(c.hidden); if (c.gain != null) api.cfg.gain = +c.gain; if (c.userName != null) api.cfg.userName = c.userName; if (c.accent != null) api.setAccent(c.accent); };
addEventListener('jarvis-voice', e => { const l = e.detail; if (l && l.text) { api.vlog.push({ text: l.text, status: l.status, msg: l.msg || '', t: Date.now() }); if (api.vlog.length > 6) api.vlog.shift(); } });

/* ---------------- main loop ---------------- */
let theme = null, last = performance.now();
Studio.switch = (id, silent) => { const t = Studio.themes[id]; if (!t) return; theme = t; api.theme = t; if (!silent) { document.title = 'JV|theme|' + id + '|' + Date.now(); } };
Studio.start = () => {
  const id = q.get('theme') || 'engine'; theme = Studio.themes[id] || Studio.themes.engine; api.theme = theme; api.setAccent(+(q.get('accent') || 0));
  if (theme.init) theme.init(api); startMic(); requestAnimationFrame(frame);
};
function frame(now) {
  api.dt = Math.min(50, now - last); last = now; api.T += api.dt / 1000; audio(now);
  const d = api.d, tgt = { cpu: d.cpu && d.cpu.load, mem: d.mem && d.mem.pct, netD: d.net && d.net.down, netU: d.net && d.net.up, gpu: d.gpu && d.gpu.util };
  for (const k in tgt) if (tgt[k] != null) api.v[k] += (tgt[k] - api.v[k]) * (k.startsWith('net') ? .12 : .08);
  ctx.setTransform(api.s, 0, 0, api.s, 0, 0); ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.globalCompositeOperation = 'source-over'; ctx.setLineDash([]);
  if (theme.bg) theme.bg(api); else api.backdrop();
  theme.draw(api); finish();
  requestAnimationFrame(frame);
}
})();
