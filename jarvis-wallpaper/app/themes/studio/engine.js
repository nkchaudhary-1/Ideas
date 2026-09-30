/* Jarvis Studio engine: audio (real mic), PC data, widgets, drawing helpers.
   All theme code draws in "design px": height is always 900, width = 900 * aspect. */
(() => {
'use strict';
const TAU = Math.PI * 2;
const MONO = '"Cascadia Mono","SF Mono",Consolas,monospace';
const SANS = '"Segoe UI",Inter,system-ui,sans-serif';
const JP = '"Yu Gothic UI","Yu Gothic","Meiryo","Noto Sans CJK JP",sans-serif';
const Studio = window.Studio = { themes: {}, register(t) { this.themes[t.id] = t; } };
const cv = document.getElementById('c'), ctx = cv.getContext('2d');
const q = new URLSearchParams(location.search);

const api = Studio.api = {
  ctx, TAU, F: { MONO, SANS, JP }, w: 1600, h: 900, cx: 800, cy: 450, s: 1, T: 0, dt: 16, mx: 0, my: 0,
  col: { a: [255, 255, 255], b: [160, 200, 255], c: [90, 150, 255] },
  au: { env: 0, bass: 0, mid: 0, treb: 0, voice: false, live: false, src: 'none', spec: new Float32Array(128), wave: new Float32Array(128) },
  d: {}, hist: { cpu: [], mem: [], netD: [], netU: [] }, v: { cpu: 0, mem: 0, netD: 0, netU: 0, gpu: 0 },
  hidden: new Set(), cfg: { gain: 1, userName: '' }, vlog: []
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
addEventListener('mousemove', e => { api.mx = e.clientX / innerWidth - .5; api.my = e.clientY / innerHeight - .5; });

/* ---------------- drawing helpers ---------------- */
api.line = (x0, y0, x1, y1, lw, al, c) => { ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.lineWidth = lw || 1; ctx.strokeStyle = rgba(al == null ? 1 : al, c); ctx.stroke(); };
api.poly = (pts, lw, al, c, close, fill) => { ctx.beginPath(); pts.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); if (close) ctx.closePath();
  if (fill) { ctx.fillStyle = rgba(fill, c); ctx.fill(); } if (lw) { ctx.lineWidth = lw; ctx.strokeStyle = rgba(al == null ? 1 : al, c); ctx.stroke(); } };
api.arc = (x, y, r, a0, a1, lw, al, c, gl) => { ctx.beginPath(); ctx.arc(x, y, r, a0, a1);
  if (gl) { ctx.lineWidth = lw * 3.2; ctx.strokeStyle = rgba(al * .18, c); ctx.stroke(); }
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

/* ---------------- data widgets (all honour the show/hide switches; return height used) ---------------- */
const W = api.W = {};
const { fmt } = api;
function head(t, detail, x, y, w, o) { const r = o.right, b = api.col.b;
  api.text(t, r ? x + w : x, y + 6, o.ts || 10, .8, b, r ? 'right' : 'left', { sp: 2.5, weight: 600 });
  if (detail) api.text(detail, r ? x : x + w, y + 6, 9, .45, b, r ? 'left' : 'right');
  api.line(x, y + 16, x + w, y + 16, 1, o.ln == null ? .25 : o.ln, b); }
W.cpu = (x, y, w, o = {}) => { if (!api.show('cpu')) return 0; const h = o.h || 118, d = api.d.cpu || {}, r = o.right, A = api.col.a, B = api.col.b, big = o.big || 38;
  head('CPU', fmt.short((d.brand || '').replace(/\((R|TM)\)|CPU|Processor|@.*/g, '').trim(), 24), x, y, w, o);
  api.text(d.load == null ? '--' : Math.round(api.v.cpu) + '%', r ? x + w : x, y + 46, big, .95, A, r ? 'right' : 'left', { font: o.font || SANS, weight: 300 });
  api.spark(r ? x : x + w * .46, y + 26, w * .54, 36, api.hist.cpu, 100, 1.3, .9, A, .12);
  const c = d.cores || [], n = c.length; if (n) { const gap = 2, bw = Math.min(14, (w - (n - 1) * gap) / n);
    for (let i = 0; i < n; i++) { const bx = r ? x + w - (i + 1) * (bw + gap) + gap : x + i * (bw + gap), hh = 3 + Math.min(1, c[i] / 100) * (h - 82);
      api.fillRect(bx, y + h - 6 - (h - 79), bw, h - 79, .07, B); api.fillRect(bx, y + h - 6 - hh, bw, hh, .8, A); } }
  if (d.temp != null) api.text(Math.round(d.temp) + '°C', r ? x : x + w, y + 46, 11, .6, B, r ? 'left' : 'right');
  return h; };
W.mem = (x, y, w, o = {}) => { if (!api.show('mem')) return 0; const d = api.d.mem || {}, r = o.right, A = api.col.a, B = api.col.b;
  head('MEMORY', d.total ? fmt.gb(d.used) + ' / ' + fmt.gb(d.total) : '', x, y, w, o);
  api.text(d.pct == null ? '--' : Math.round(api.v.mem) + '%', r ? x + w : x, y + 44, o.big || 34, .95, A, r ? 'right' : 'left', { font: o.font || SANS, weight: 300 });
  api.spark(r ? x : x + w * .46, y + 26, w * .54, 30, api.hist.mem, 100, 1.2, .8, B, .1);
  api.bar(x, y + 64, w, 7, (api.v.mem || 0) / 100, .85, A, o.seg === 0 ? 0 : 24);
  api.text('FREE ' + (d.total ? fmt.gb(d.total - d.used) : '--'), r ? x + w : x, y + 82, 9, .5, B, r ? 'right' : 'left');
  return 94; };
W.disk = (x, y, w, o = {}) => { if (!api.show('disk')) return 0; const ds = (api.d.disks || []).slice(0, o.max || 4), r = o.right, A = api.col.a, B = api.col.b;
  head('STORAGE', ds.length ? ds.length + ' VOL' : '', x, y, w, o);
  ds.forEach((k, i) => { const yy = y + 34 + i * 22; api.text(k.mount.replace(/[\\/]+$/, ''), x, yy, 11, .85, A, 'left');
    const bx = r ? x + 34 : x + 34, bw = w - 110; api.bar(bx, yy - 3, bw, 6, k.pct / 100, .8, A);
    api.text(Math.round(k.pct) + '%', x + w, yy, 10, .7, B, 'right'); api.text(fmt.gb(k.size), x + w - 34, yy, 8, .35, B, 'right'); });
  return 30 + ds.length * 22 + 4; };
W.net = (x, y, w, o = {}) => { if (!api.show('net')) return 0; const r = o.right, A = api.col.a, B = api.col.b, n = api.d.net || {};
  head('NETWORK', n.iface ? fmt.short(n.iface, 14) : '', x, y, w, o);
  api.text('▼ ' + fmt.rate(n.down == null ? null : api.v.netD), r ? x + w : x, y + 38, 15, .95, A, r ? 'right' : 'left', { font: o.font || SANS });
  api.text('▲ ' + fmt.rate(n.up == null ? null : api.v.netU), r ? x + w : x, y + 60, 12, .7, B, r ? 'right' : 'left', { font: o.font || SANS });
  const sx = r ? x : x + w * .5, sw = w * .5; api.spark(sx, y + 24, sw, 44, api.hist.netD, 0, 1.3, .9, A, .12); api.spark(sx, y + 24, sw, 44, api.hist.netU, Math.max(1, ...api.hist.netD, ...api.hist.netU), 1, .6, B);
  return 82; };
W.procs = (x, y, w, o = {}) => { if (!api.show('procs')) return 0; const ps = (api.d.procs || []).slice(0, o.max || 5), r = o.right, A = api.col.a, B = api.col.b;
  head('PROCESSES', ps.length ? 'TOP ' + ps.length : '', x, y, w, o);
  ps.forEach((p, i) => { const yy = y + 34 + i * 19; api.text(fmt.short(p.name.replace(/\.exe$/i, ''), 15), r ? x + w : x, yy, 11, .85, A, r ? 'right' : 'left');
    const bw = w * .3, bx = r ? x + 0 : x + w - bw - 40; api.bar(r ? x + 40 : bx, yy - 3, bw, 5, Math.min(1, p.cpu / 50), .75, A);
    api.text(p.cpu.toFixed(1) + '%', r ? x : x + w, yy, 10, .6, B, r ? 'left' : 'right'); });
  return 30 + ps.length * 19 + 4; };
W.sys = (x, y, w, o = {}) => { if (!api.show('sys')) return 0; const s = api.d.sys || {}, r = o.right, A = api.col.a, B = api.col.b;
  head('SYSTEM', '', x, y, w, o);
  const rows = [['HOST', fmt.short(s.host, 18)], ['USER', fmt.short(api.cfg.userName || s.user, 18)], ['OS', fmt.short((s.os || '').replace('Microsoft ', ''), 20)], ['UPTIME', fmt.up(s.uptime)]];
  if (api.d.cpu && api.d.cpu.cores) rows.push(['CORES', api.d.cpu.cores.length + (api.d.cpu.speed ? ' @ ' + api.d.cpu.speed + ' GHz' : '')]);
  rows.forEach((k, i) => { const yy = y + 32 + i * 17; api.text(k[0], r ? x + w : x, yy, 9, .45, B, r ? 'right' : 'left', { sp: 1.5 }); api.text(k[1], r ? x : x + w, yy, 10, .85, A, r ? 'left' : 'right'); });
  return 36 + rows.length * 17; };
W.clock = (x, y, o = {}) => { if (!api.show('sys')) return 0; const r = o.right, al = r ? 'right' : (o.center ? 'center' : 'left'), big = o.big || 56;
  api.text(fmt.clock(), x, y + big * .5, big, .95, api.col.a, al, { font: o.font || SANS, weight: 200 });
  api.text(fmt.date().toUpperCase(), x, y + big + 10, 10, .55, api.col.b, al, { sp: 2 }); return big + 24; };
W.batt = (x, y, w, o = {}) => { if (!api.show('batt')) return 0; const b = api.d.batt, r = o.right;
  if (!b || !b.has) return 0; api.text('PWR ' + Math.round(b.pct) + '%' + (b.charging ? ' ⚡' : ''), r ? x + w : x, y + 6, 10, .8, api.col.a, r ? 'right' : 'left', { sp: 1.5 });
  api.bar(x, y + 18, w, 5, b.pct / 100, .8, api.col.a); return 32; };
W.gpu = (x, y, w, o = {}) => { if (!api.show('gpu')) return 0; const g = api.d.gpu, r = o.right; if (!g || g.util == null) return 0;
  head('GPU', fmt.short(g.name || '', 22), x, y, w, o); api.text(Math.round(api.v.gpu) + '%', r ? x + w : x, y + 42, o.big || 30, .95, api.col.a, r ? 'right' : 'left', { font: o.font || SANS, weight: 300 });
  api.bar(x, y + 64, w, 6, api.v.gpu / 100, .85, api.col.a, 20); if (g.temp != null) api.text(Math.round(g.temp) + '°C', r ? x : x + w, y + 42, 11, .6, api.col.b, r ? 'left' : 'right'); return 80; };
W.voice = (x, y, w, o = {}) => { if (!api.show('voice')) return 0; const au = api.au, r = o.right;
  head('VOICE', au.live ? 'MIC LIVE' : 'MIC OFF', x, y, w, o);
  api.spectrum(x, y + 54, w, 30, Math.floor(w / 5), .8, api.col.a, -1);
  api.bar(x, y + 62, w, 4, au.env, .9, api.col.a);
  (api.vlog.slice(-3)).forEach((l, i) => api.text('> ' + fmt.short(l.text, 34), r ? x + w : x, y + 82 + i * 14, 9, l.status === 'ok' ? .85 : .45, l.status === 'ok' ? api.col.a : api.col.b, r ? 'right' : 'left'));
  return 128; };
/* stack helper: panelStack(x,y,w,[['cpu',opts],...],gap) */
api.stack = (x, y, w, list, gap, o) => { gap = gap == null ? 16 : gap; list.forEach(k => { const f = W[k]; const hh = f(x, y, w, o || {}); if (hh) y += hh + gap; }); return y; };

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
window.jarvisConfig = c => { if (c.hidden) api.hidden = new Set(c.hidden); if (c.gain != null) api.cfg.gain = +c.gain; if (c.userName != null) api.cfg.userName = c.userName; };
addEventListener('jarvis-voice', e => { const l = e.detail; if (l && l.text) { api.vlog.push({ text: l.text, status: l.status, t: Date.now() }); if (api.vlog.length > 6) api.vlog.shift(); } });

/* ---------------- main loop ---------------- */
let theme = null, last = performance.now();
Studio.start = () => {
  const id = q.get('theme') || 'sector'; theme = Studio.themes[id] || Studio.themes.sector; api.theme = theme;
  api.col = { a: theme.palette.a, b: theme.palette.b, c: theme.palette.c || theme.palette.b };
  if (theme.init) theme.init(api); startMic(); requestAnimationFrame(frame);
};
function frame(now) {
  api.dt = Math.min(50, now - last); last = now; api.T += api.dt / 1000; audio(now);
  const d = api.d, tgt = { cpu: d.cpu && d.cpu.load, mem: d.mem && d.mem.pct, netD: d.net && d.net.down, netU: d.net && d.net.up, gpu: d.gpu && d.gpu.util };
  for (const k in tgt) if (tgt[k] != null) api.v[k] += (tgt[k] - api.v[k]) * (k.startsWith('net') ? .12 : .08);
  ctx.setTransform(api.s, 0, 0, api.s, 0, 0); ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.globalCompositeOperation = 'source-over'; ctx.setLineDash([]);
  if (theme.bg) theme.bg(api); else api.bg('#15191f', '#050608');
  theme.draw(api);
  requestAnimationFrame(frame);
}
})();
