/* Knowledge-graph scene: your PC as a glowing star graph.
   Hubs = CPU / MEMORY / GPU / STORAGE / NETWORK / PROCESSES / VOICE, nodes = cores, memory cells, drives, processes, voice bands.
   Every value is real; the active "mode" only decides where things are placed in 3D. */
(() => {
const S = window.Studio, api = S.api, ctx = api.ctx, TAU = Math.PI * 2, P = Math.PI, MONO = api.F.MONO, SERIF = api.F.SERIF;
const Sc = S.scene = { hubs: {}, nodes: [], edges: [], cam: { pitch: .5, dist: 26, yaw: 0 }, hits: [] };
const HUBS = [['cpu', 'CPU'], ['mem', 'MEMORY'], ['gpu', 'GPU'], ['disk', 'STORAGE'], ['net', 'NETWORK'], ['procs', 'PROCESSES'], ['voice', 'VOICE']];
const HCOL = { mem: [96, 226, 196], gpu: [255, 122, 160], disk: [255, 172, 92], net: [150, 128, 255], procs: [92, 146, 255] };
const hubColor = k => api.pal.mono ? api.col.b : (k === 'cpu' || k === 'voice') ? api.col.a : HCOL[k];
Sc.hubColor = hubColor;
const hubs = Sc.hubs, nodes = Sc.nodes, edges = Sc.edges;
HUBS.forEach(([k, l], i) => hubs[k] = { key: k, label: l, pos: [0, 0, 0], tgt: [0, 0, 0], nodes: [], val: '', count: 0, act: 0, vis: true, seed: i * 1.7 + .3, idx: i, sx: 0, sy: 0, kn: 1, zc: 0 });
const DUST = 1100, dust = Array.from({ length: DUST }, (_, i) => ({ pos: [(Math.random() - .5) * 30, (Math.random() - .5) * 20, (Math.random() - .5) * 30], tgt: [0, 0, 0], seed: Math.random(), i }));
let sig = '', mode = null;

/* ---------- graph structure from real data ---------- */
function sync() {
  const d = api.d, cores = (d.cpu && d.cpu.cores) || [], procs = (d.procs || []).slice(0, 8), disks = (d.disks || []).slice(0, 4), hasGpu = d.gpu && d.gpu.util != null;
  const s = [cores.length, procs.map(p => p.name).join(','), disks.map(x => x.mount).join(','), hasGpu ? 1 : 0].join('|'); if (s === sig) return; sig = s;
  const old = new Map(nodes.map(n => [n.key, n])); nodes.length = 0; HUBS.forEach(([k]) => hubs[k].nodes = []);
  const add = (hub, id, label, size) => { const key = hub + ':' + id; let n = old.get(key); const h = hubs[hub];
    if (!n) n = { key, hub, id, size, v: 0, vt: 0, tip: '', seed: Math.random(), pos: [h.pos[0] + Math.random() - .5, h.pos[1] + Math.random() - .5, h.pos[2] + Math.random() - .5], tgt: [0, 0, 0], sx: 0, sy: 0, kn: 1, zc: 0 };
    n.label = label; n.size = size; nodes.push(n); h.nodes.push(n); n.j = h.nodes.length - 1; return n; };
  cores.forEach((c, i) => add('cpu', i, '', .8)); for (let i = 0; i < 18; i++) add('mem', i, '', .6); if (hasGpu) add('gpu', 0, 'GPU', 1.2);
  disks.forEach(k => add('disk', k.mount, k.mount.replace(/[\\/]+$/, '').slice(0, 10), 1.1)); add('net', 'down', 'DOWN', 1.1); add('net', 'up', 'UP', .9);
  procs.forEach(p => add('procs', p.name, p.name.replace(/\.exe$/i, '').slice(0, 14), 1)); for (let i = 0; i < 20; i++) add('voice', i, '', .5);
  edges.length = 0; nodes.forEach(n => edges.push({ a: hubs[n.hub], b: n, kind: 'n', ph: Math.random(), hub: n.hub }));
  [['voice', 'cpu'], ['cpu', 'mem'], ['cpu', 'procs'], ['mem', 'disk'], ['net', 'procs'], ['cpu', 'gpu'], ['disk', 'net'], ['voice', 'net'], ['voice', 'procs']].forEach(([a, b]) => edges.push({ a: hubs[a], b: hubs[b], kind: 'h', ph: Math.random(), hub: a }));
  for (let i = 0; i < 28 && nodes.length > 8; i++) { const a = nodes[(Math.random() * nodes.length) | 0], b = nodes[(Math.random() * nodes.length) | 0]; if (a.hub !== b.hub) edges.push({ a, b, kind: 'f', ph: Math.random(), hub: a.hub }); }
}
function values() {
  const d = api.d, v = api.v, au = api.au, F = api.fmt, H = hubs, rate = s => s == null ? '--' : F.rate(s);
  H.cpu.count = ((d.cpu || {}).cores || []).length; H.cpu.val = d.cpu && d.cpu.load != null ? Math.round(v.cpu) + '%' : '--'; H.cpu.act = (v.cpu || 0) / 100;
  H.mem.count = d.mem ? Math.round(d.mem.total / 1073741824) : 0; H.mem.val = d.mem && d.mem.pct != null ? Math.round(v.mem) + '%  ·  ' + F.gb(d.mem.used) : '--'; H.mem.act = (v.mem || 0) / 100;
  H.gpu.count = d.gpu && d.gpu.util != null ? 1 : 0; H.gpu.val = d.gpu && d.gpu.util != null ? Math.round(v.gpu) + '%' : '--'; H.gpu.act = (v.gpu || 0) / 100;
  const dk = (d.disks || [])[0]; H.disk.count = (d.disks || []).length; H.disk.val = dk ? dk.mount.replace(/[\\/]+$/, '') + ' ' + Math.round(dk.pct) + '%' : '--'; H.disk.act = .25;
  H.net.count = d.net && d.net.iface ? 1 : 0; H.net.val = d.net && d.net.down != null ? '↓ ' + rate(v.netD) : '--'; H.net.act = Math.min(1, (v.netD || 0) / 5e6);
  H.procs.count = (d.procs || []).length; H.procs.val = d.procs && d.procs[0] ? d.procs[0].name.replace(/\.exe$/i, '') : '--'; H.procs.act = Math.min(1, (d.procs || []).reduce((s, p) => s + p.cpu, 0) / 100);
  H.voice.count = 20; H.voice.val = au.live ? (au.voice ? 'speaking' : 'listening') : 'mic off'; H.voice.act = au.env;
  HUBS.forEach(([k]) => H[k].vis = api.show(k));
  const cores = (d.cpu || {}).cores || [], memUsed = d.mem ? d.mem.pct / 100 : 0;
  nodes.forEach(n => { const h = n.hub;
    if (h === 'cpu') { const c = cores[n.id] || 0; n.vt = c / 100; n.tip = 'Core ' + n.id + ' · ' + Math.round(c) + '%'; }
    else if (h === 'mem') { n.vt = (n.id + .5) / 18 < memUsed ? .85 : .12; n.tip = 'Memory · ' + Math.round(memUsed * 100) + '% used'; }
    else if (h === 'gpu') { n.vt = (v.gpu || 0) / 100; n.tip = 'GPU · ' + Math.round(v.gpu || 0) + '%'; }
    else if (h === 'disk') { const k = (d.disks || []).find(x => x.mount === n.id); n.vt = k ? k.pct / 100 : 0; n.tip = k ? k.mount + ' · ' + Math.round(k.pct) + '% of ' + F.gb(k.size) : ''; }
    else if (h === 'net') { const dn = n.id === 'down'; n.vt = Math.min(1, (dn ? v.netD : v.netU) / (dn ? 5e6 : 1e6)) + .15; n.tip = (dn ? 'Download ' : 'Upload ') + rate(dn ? v.netD : v.netU); }
    else if (h === 'procs') { const p = (d.procs || []).find(x => x.name === n.id); n.vt = p ? Math.min(1, p.cpu / 25) + .15 : .1; n.tip = p ? p.name + ' · ' + p.cpu.toFixed(1) + '% · pid ' + p.pid : ''; }
    else if (h === 'voice') { n.vt = Math.min(1, au.spec[Math.floor(n.id * 6)] * 1.1 + au.env * .25); n.tip = 'Voice band ' + (n.id + 1); }
    n.v += (n.vt - n.v) * .16; });
}

/* ---------- camera ---------- */
let yaw = 0, cp = 1, sp = 0, cyw = 1, syw = 0, dist = 26, F0 = 26 * 38;
const out = [0, 0, 0, 0];
Sc.P3 = (x, y, z) => { const x1 = x * cyw + z * syw, z1 = -x * syw + z * cyw, y1 = y * cp + z1 * sp, z2 = -y * sp + z1 * cp, zc = dist + z2; if (zc < 3) return null;
  const k = F0 / zc; out[0] = api.cx + x1 * k; out[1] = 470 - y1 * k; out[2] = k / 38; out[3] = zc; return out; };
const fade = zc => Math.max(.12, Math.min(1, 1.25 - (zc - (dist - 14)) / (dist * 1.2)));
Sc.fade = fade;
const sprites = {}; const sprite = c => { const key = c.join(','); if (sprites[key]) return sprites[key]; const cv = document.createElement('canvas'); cv.width = cv.height = 96; const x = cv.getContext('2d'), g = x.createRadialGradient(48, 48, 0, 48, 48, 48);
  g.addColorStop(0, 'rgba(' + key + ',1)'); g.addColorStop(.12, 'rgba(' + key + ',.55)'); g.addColorStop(.35, 'rgba(' + key + ',.14)'); g.addColorStop(1, 'rgba(' + key + ',0)'); x.fillStyle = g; x.fillRect(0, 0, 96, 96); return sprites[key] = cv; };
Sc.star = (x, y, r, al, c, white) => { ctx.globalAlpha = Math.min(1, al); ctx.drawImage(sprite(c), x - r * 3, y - r * 3, r * 6, r * 6); if (white) { ctx.globalAlpha = Math.min(1, al * 1.1); ctx.fillStyle = 'rgb(' + api.col.b + ')'; ctx.beginPath(); ctx.arc(x, y, Math.max(.6, r * .34), 0, TAU); ctx.fill(); } ctx.globalAlpha = 1; };
Sc.ring = (r, y, al, label, c, n) => { c = c || api.col.a; n = n || 120; let first = true; ctx.beginPath(); let lp = null;
  for (let i = 0; i <= n; i++) { const a = i / n * TAU, p = Sc.P3(Math.cos(a) * r, y, Math.sin(a) * r); if (!p) { first = true; continue; } first ? ctx.moveTo(p[0], p[1]) : ctx.lineTo(p[0], p[1]); first = false; }
  ctx.lineWidth = 1; ctx.strokeStyle = api.rgba(al, c); ctx.stroke();
  if (label) { const p = Sc.P3(Math.cos(.35) * r, y, Math.sin(.35) * r); if (p) api.text(label, p[0] + 8, p[1] - 4, 8, .55, api.col.c, 'left', { sp: 1.5 }); } };
Sc.tag = (x, y, z, t, al) => { const p = Sc.P3(x, y, z); if (p) api.text(t, p[0], p[1], 8, al == null ? .5 : al, api.col.c, 'center', { sp: 1.5 }); };

/* ---------- render ---------- */
const tmp = [0, 0, 0];
function edgePoint(e, t, curve, o) { const a = e.a.pos, b = e.b.pos; let y = a[1] + (b[1] - a[1]) * t;
  if (curve && e.kind === 'h') { const len = Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]); y += curve * len * .2 * Math.sin(P * t) * (1 + api.au.env * 1.6) + api.au.wave[(t * 127) | 0] * len * .25 * curve * api.au.env; }
  o[0] = a[0] + (b[0] - a[0]) * t; o[1] = y; o[2] = a[2] + (b[2] - a[2]) * t; return o; }
const visOf = o => o.nodes ? o.vis : hubs[o.hub].vis, vis = e => visOf(e.a) && visOf(e.b);
let hoverTip = null;

Sc.render = m => {
  mode = m; const au = api.au, T = api.T, dt = api.dt, cam = Sc.cam; const cm = m.cam || {};
  cam.pitch += ((cm.pitch == null ? .5 : cm.pitch) - cam.pitch) * .03; dist += (((cm.dist || 26) - dist)) * .03; F0 = dist * 38;
  yaw += dt * (cm.yaw == null ? .00012 : cm.yaw) * (1 + au.env * 2); const Y = yaw + api.mx * .5, Pt = cam.pitch + api.my * .14;
  cp = Math.cos(Pt); sp = Math.sin(Pt); cyw = Math.cos(Y); syw = Math.sin(Y);
  sync(); values(); m.place(Sc, T, api);
  const f = 1 - Math.exp(-dt / 300); [...Object.values(hubs), ...nodes].forEach(o => { for (let i = 0; i < 3; i++) o.pos[i] += (o.tgt[i] - o.pos[i]) * f; });
  dust.forEach(d => { m.dust(d, T); for (let i = 0; i < 3; i++) d.pos[i] += (d.tgt[i] - d.pos[i]) * f * .7; });
  /* backdrop */
  const pal = api.pal, bg = ctx.createRadialGradient(api.cx, 470, 0, api.cx, 470, Math.max(api.w, 900) * .7); bg.addColorStop(0, pal.bg0); bg.addColorStop(1, pal.bg1); ctx.fillStyle = bg; ctx.fillRect(0, 0, api.w, 900);
  ctx.globalCompositeOperation = 'lighter';
  /* dust */
  const bb = api.col.b; for (const d of dust) { const p = Sc.P3(d.pos[0], d.pos[1], d.pos[2]); if (!p) continue; const a = Math.min(.6, (.09 + .2 * (.5 + .5 * Math.sin(T * (.6 + d.seed) + d.seed * 40))) * (m.dustAlpha || 1)) * fade(p[3]); ctx.fillStyle = 'rgba(' + bb + ',' + a + ')'; const s = (.5 + d.seed * 1.1) * p[2]; ctx.fillRect(p[0], p[1], s, s); }
  if (m.guides) m.guides(Sc, T, api);
  /* project everything once */
  for (const h of Object.values(hubs)) { const p = Sc.P3(h.pos[0], h.pos[1], h.pos[2]); if (p) { h.sx = p[0]; h.sy = p[1]; h.kn = p[2]; h.zc = p[3]; } else h.zc = -1; }
  for (const n of nodes) { const p = Sc.P3(n.pos[0], n.pos[1], n.pos[2]); if (p) { n.sx = p[0]; n.sy = p[1]; n.kn = p[2]; n.zc = p[3]; } else n.zc = -1; }
  /* edges + flow */
  const curve = m.curve || 0, acc = api.col.a;
  for (const e of edges) { if (!vis(e)) continue; const col = hubColor(e.hub), base = e.kind === 'h' ? .26 : e.kind === 'n' ? .11 : .055, na = e.kind === 'n' ? e.b : null;
    const act = e.kind === 'n' ? e.b.v : e.kind === 'h' ? (hubs[e.hub].act + .15) : .2; const steps = curve && e.kind === 'h' ? 16 : 1; let prev = null, ok = true; ctx.beginPath(); let zs = 0, zn = 0;
    for (let i = 0; i <= steps; i++) { edgePoint(e, i / steps, curve, tmp); const p = Sc.P3(tmp[0], tmp[1], tmp[2]); if (!p) { prev = null; continue; } zs += p[3]; zn++; prev ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]); prev = 1; }
    if (!zn) continue; ctx.lineWidth = 1; ctx.strokeStyle = api.rgba(base * fade(zs / zn) * (.6 + act * 1.2), col); ctx.stroke();
    if (e.kind !== 'f') { e.ph = (e.ph + dt * .00018 * (.25 + act * 2.4)) % 1; edgePoint(e, e.ph, curve, tmp); const p = Sc.P3(tmp[0], tmp[1], tmp[2]); if (p) Sc.star(p[0], p[1], 2.2 * p[2], (.25 + act * .7) * fade(p[3]), col, false); } }
  /* nodes */
  for (const n of nodes) { if (n.zc < 0 || !hubs[n.hub].vis) continue; const col = hubColor(n.hub), fd = fade(n.zc), r = Math.min(16, (2.2 + n.size * 2.6 + n.v * (n.hub === 'voice' ? 4 : 6) + (n.hub === 'voice' ? au.env * 2 : 0)) * n.kn);
    Sc.star(n.sx, n.sy, r, (.3 + n.v * .7) * fd, col, n.v > .08); if (n.size > .95 && n.v > .35) { ctx.globalAlpha = .22 * fd * n.v; ctx.strokeStyle = 'rgb(' + api.col.b + ')'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(n.sx - r * 3, n.sy); ctx.lineTo(n.sx + r * 3, n.sy); ctx.moveTo(n.sx, n.sy - r * 3); ctx.lineTo(n.sx, n.sy + r * 3); ctx.stroke(); ctx.globalAlpha = 1; } }
  /* hubs */
  for (const h of Object.values(hubs)) { if (h.zc < 0 || !h.vis) continue; const col = hubColor(h.key), fd = fade(h.zc), r = (7 + h.act * 7 + (h.key === 'voice' ? au.env * 8 : 0)) * h.kn; Sc.star(h.sx, h.sy, r, (.55 + h.act * .45) * fd, col, true); }
  ctx.globalCompositeOperation = 'source-over';
  /* labels */
  hoverTip = null; let best = 1e9; const mx = api.mpx, my = api.mpy;
  for (const n of nodes) { if (n.zc < 0 || !hubs[n.hub].vis) continue; if (n.label && (n.hub === 'procs' || n.hub === 'disk' || n.hub === 'net' || n.hub === 'gpu') && n.kn > .55) api.text(n.label, n.sx + 9 * n.kn, n.sy + 3, 8, .55 * fade(n.zc), api.col.c, 'left', { sp: 1 });
    if (api.mouseIn) { const dd = Math.hypot(n.sx - mx, n.sy - my); if (dd < 16 && dd < best && n.tip) { best = dd; hoverTip = { x: n.sx, y: n.sy, t: n.tip, c: hubColor(n.hub) }; } } }
  for (const h of Object.values(hubs)) { if (h.zc < 0 || !h.vis || (m.hideHubLabel && m.hideHubLabel[h.key])) continue; const col = hubColor(h.key), fd = fade(h.zc), ks = Math.max(.8, Math.min(1.25, h.kn)), x = h.sx + 12 * ks, y = h.sy, sz = 10 * ks, sp2 = 3;
    api.disc(h.sx + 0, y, 0, 0, col); ctx.fillStyle = api.rgba(.95 * fd, col); ctx.beginPath(); ctx.arc(x, y, 2.6, 0, TAU); ctx.fill();
    api.text(h.label, x + 9, y, sz, .96 * fd, api.col.b, 'left', { sp: sp2, weight: 700 }); api.text(String(h.count).padStart(2, '0'), x + 9 + h.label.length * (sz * .6 + sp2) + 6, y, 8, .45 * fd, api.col.c, 'left');
    api.text(h.val, x + 9, y + 13 * ks, 8.5 * ks, .7 * fd, col, 'left', { sp: 1 }); if (api.mouseIn && Math.hypot(h.sx - mx, h.sy - my) < 18) hoverTip = { x: h.sx, y: h.sy, t: h.label + ' · ' + h.val, c: col }; }
  if (hoverTip) { const t = hoverTip.t, w = t.length * 6 + 18, x = Math.min(api.w - w - 10, hoverTip.x + 14), y = hoverTip.y - 30; ctx.beginPath(); ctx.roundRect(x, y, w, 22, 11); ctx.fillStyle = 'rgba(4,8,14,.85)'; ctx.fill(); ctx.strokeStyle = api.rgba(.6, hoverTip.c); ctx.lineWidth = 1; ctx.stroke(); api.text(t, x + 9, y + 11, 10, .95, api.col.b, 'left'); }
  Sc.chrome();
};

/* ---------- chrome: nav, pill, mode bar, telemetry rail ---------- */
const NAV = [['SYSTEM NODES', ['cpu', 'mem', 'gpu']], ['PROCESSES', ['procs']], ['STORAGE', ['disk']], ['NETWORK', ['net']], ['VOICE', ['voice']]];
const tw = (s, size, sp) => s.length * (size * .6 + sp);
function hit(x, y, w, h, fn) { Sc.hits.push({ x, y, w, h, fn }); }
Sc.chrome = () => {
  const w = api.w, cx = api.cx, AC = api.col.a, CR = api.col.b, DM = api.col.c, au = api.au, F = api.fmt, d = api.d; Sc.hits.length = 0;
  /* top nav */
  let tot = 0; const ws = NAV.map(n => tw(n[0], 8.5, 2.5) + 36); ws.forEach(x => tot += x); let x = cx - tot / 2;
  NAV.forEach((n, i) => { const on = n[1].some(k => api.show(k)), cxn = x + ws[i] / 2; api.text(n[0], cxn, 16, 8.5, on ? .7 : .28, on ? CR : DM, 'center', { sp: 2.5 });
    if (i) api.line(x, 8, x, 24, 1, .12, CR); hit(x, 0, ws[i], 30, () => { const keys = n[1], s = new Set(api.hidden); keys.every(k => !s.has(k)) ? keys.forEach(k => s.add(k)) : keys.forEach(k => s.delete(k)); api.hidden = s; document.title = 'JV|hidden|' + [...s].join(',') + '|' + Date.now(); }); x += ws[i]; });
  /* centre pill */
  const pt = 'LIVE SYSTEM  ·  SPEAK FREELY', pw = tw(pt, 8.5, 2.5) + 150, px = cx - pw / 2; ctx.beginPath(); ctx.roundRect(px, 42, pw, 34, 17); ctx.fillStyle = 'rgba(6,14,24,.55)'; ctx.fill(); ctx.strokeStyle = api.rgba(.28, AC); ctx.lineWidth = 1; ctx.stroke();
  api.text(pt, px + 18, 59, 8.5, .7, CR, 'left', { sp: 2.5 }); const mt = au.live ? (au.voice ? 'LISTENING' : 'MIC LIVE') : 'MIC OFF', mw = tw(mt, 8, 2.5) + 26; ctx.beginPath(); ctx.roundRect(px + pw - mw - 6, 47, mw, 24, 12); ctx.strokeStyle = api.rgba(au.voice ? 1 : .55, au.live ? AC : DM); ctx.stroke(); if (au.voice) { ctx.fillStyle = api.rgba(.14, AC); ctx.fill(); }
  api.disc(px + pw - mw + 4, 59, 2.4, au.live ? 1 : .4, au.live ? AC : DM); api.text(mt, px + pw - mw + 12, 59, 8, .95, au.live ? CR : DM, 'left', { sp: 2.5 });
  /* voice box (top right) */
  const last = api.vlog[api.vlog.length - 1], fresh = last && Date.now() - last.t < 7000, bw = 250, bx = w - bw - 24; ctx.beginPath(); ctx.roundRect(bx, 14, bw, 30, 15); ctx.fillStyle = 'rgba(6,14,24,.55)'; ctx.fill(); ctx.strokeStyle = api.rgba(fresh && last.status === 'ok' ? .7 : .2, fresh && last.status === 'ok' ? AC : CR); ctx.stroke();
  api.text(fresh ? '› ' + F.short(last.text + (last.status !== 'ok' && last.msg ? '  ·  ' + last.msg : ''), 34) : '› say “jarvis …”', bx + 16, 29, 9.5, fresh ? .95 : .5, fresh && last.status === 'ok' ? AC : CR, 'left', { sp: 1 });
  if (!fresh) api.spectrum(bx + bw - 62, 29, 44, 12, 12, .7, AC, 0, 1.2);
  /* clock / greeting (top-left) */
  if (api.show('sys')) { api.clockBig(34, 60, 38, 'left'); api.label(F.date(), 36, 92, .55); api.label((api.cfg.userName || (d.sys || {}).user || '') + (((d.sys || {}).host) ? '  ·  ' + d.sys.host : ''), 36, 108, .4); }
  /* telemetry rail (bottom-left) */
  const rows = []; const sp = (arr, max, col) => ({ arr, max, col });
  if (api.show('cpu')) rows.push(['CPU', d.cpu && d.cpu.load != null ? Math.round(api.v.cpu) + '%' : '--', sp(api.hist.cpu, 100)]);
  if (api.show('mem')) rows.push(['MEM', d.mem && d.mem.pct != null ? Math.round(api.v.mem) + '%  ' + F.gb(d.mem.used) : '--', sp(api.hist.mem, 100)]);
  if (api.show('gpu') && d.gpu && d.gpu.util != null) rows.push(['GPU', Math.round(api.v.gpu) + '%' + (d.gpu.temp != null ? '  ' + Math.round(d.gpu.temp) + '°C' : ''), null]);
  if (api.show('net')) rows.push(['NET', d.net && d.net.down != null ? '↓ ' + F.rate(api.v.netD) + '  ↑ ' + F.rate(api.v.netU) : '--', sp(api.hist.netD, 0)]);
  if (api.show('disk')) (d.disks || []).slice(0, 3).forEach(k => rows.push(['DSK', k.mount.replace(/[\\/]+$/, '') + '  ' + Math.round(k.pct) + '%  of ' + F.gb(k.size), null]));
  if (api.show('batt') && d.batt && d.batt.has) rows.push(['PWR', Math.round(d.batt.pct) + '%' + (d.batt.charging ? '  charging' : ''), null]);
  if (api.show('sys')) rows.push(['UP', F.up((d.sys || {}).uptime) + (d.cpu && d.cpu.cores ? '  ·  ' + d.cpu.cores.length + ' cores' : ''), null]);
  const ry0 = 900 - 78 - rows.length * 22; rows.forEach((r, i) => { const y = ry0 + i * 22; api.label(r[0], 36, y, .55); api.text(r[1], 76, y, 10, .92, CR, 'left'); if (r[2]) api.spark(250, y - 7, 70, 14, r[2].arr, r[2].max, 1, .8, AC, 0); });
  /* voice log (bottom-right) */
  if (api.show('voice')) { api.spectrum(w - 252, 880 - 14, 220, 16, 56, .55, AC, -1, 1.2); (api.vlog.slice(-3)).forEach((l, i) => api.text('› ' + F.short(l.text, 30), w - 32, 820 - (2 - i) * 14 - 0, 9, l.status === 'ok' ? .9 : .4, l.status === 'ok' ? AC : DM, 'right')); }
  /* mode bar (bottom-centre) */
  const ids = S.list, names = ids.map((id, i) => ({ id, num: String(i + 1).padStart(2, '0'), name: S.themes[id].name })); const iw = names.map(n => tw(n.name, 10, .5) + 54), total = iw.reduce((a, b) => a + b, 0) + 12; let bx0 = cx - total / 2;
  ctx.beginPath(); ctx.roundRect(bx0, 900 - 62, total, 40, 20); ctx.fillStyle = 'rgba(6,14,24,.6)'; ctx.fill(); ctx.strokeStyle = api.rgba(.16, CR); ctx.lineWidth = 1; ctx.stroke(); let xx = bx0 + 6;
  names.forEach((n, i) => { const on = S.api.theme && S.api.theme.id === n.id; if (on) { ctx.beginPath(); ctx.roundRect(xx, 900 - 56, iw[i], 28, 14); ctx.fillStyle = api.rgba(.1, AC); ctx.fill(); ctx.strokeStyle = api.rgba(.5, AC); ctx.stroke(); }
    api.text(n.num, xx + 14, 900 - 42, 8, on ? 1 : .45, on ? AC : DM, 'left'); api.text(n.name, xx + 34, 900 - 42, 10, on ? .98 : .55, on ? CR : DM, 'left', { sp: .5 }); hit(xx, 900 - 56, iw[i], 28, () => S.switch(n.id)); xx += iw[i]; });
};
addEventListener('click', e => { const s = api.s, dpr = cvScale(); const x = e.clientX * dpr / s, y = e.clientY * dpr / s; for (const h of Sc.hits) if (x >= h.x && x <= h.x + h.w && y >= h.y && y <= h.y + h.h) { h.fn(); return; } });
function cvScale() { return document.getElementById('c').width / innerWidth; }
addEventListener('mousemove', e => { const s = api.s, dpr = cvScale(), x = e.clientX * dpr / s, y = e.clientY * dpr / s; document.getElementById('c').style.cursor = Sc.hits.some(h => x >= h.x && x <= h.x + h.w && y >= h.y && y <= h.y + h.h) ? 'pointer' : 'default'; });
})();
