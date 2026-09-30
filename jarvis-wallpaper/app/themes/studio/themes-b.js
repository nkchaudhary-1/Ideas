/* Themes 5-8: Nebula, Reactor, Sensory, Poster */
(() => {
const S = window.Studio, P = Math.PI, TAU = P * 2;

/* ================= 5. NEBULA  (purple orb lens, data as orbit rings) ================= */
let bokeh = null;
S.register({ id: 'nebula', name: 'Nebula', palette: { a: [238, 232, 255], b: [120, 150, 255], c: [205, 120, 235] },
init() { bokeh = Array.from({ length: 130 }, () => ({ a: Math.random() * TAU, r: 300 + Math.random() * 360, v: (Math.random() - .5) * .0004, s: .8 + Math.random() * 2.4, o: Math.random(), k: (Math.random() * 128) | 0 })); },
bg(a) { const { ctx, w, cx, au } = a; ctx.fillStyle = '#04030a'; ctx.fillRect(0, 0, w, 900);
  ctx.save(); ctx.translate(cx + 40, 330); ctx.rotate(-.35); ctx.scale(1.25, .8); a.glow(0, 0, 340, .42 + au.env * .3, [185, 120, 240]); ctx.restore();
  a.glow(cx - 30, 500, 330, .38 + au.env * .25, [70, 90, 255]); a.glow(cx + 160, 560, 200, .2, [180, 90, 200]); },
draw(a) { const { ctx, w, cx, T, au, col, W } = a, cy = 470, A = col.a, B = col.b, C = col.c, e = au.env;
  const g = ctx.createRadialGradient(cx - 50, cy - 40, 10, cx, cy, 170); g.addColorStop(0, 'rgb(150,110,190)'); g.addColorStop(.6, 'rgb(70,45,110)'); g.addColorStop(1, 'rgb(14,10,30)');
  ctx.beginPath(); ctx.arc(cx, cy, 140, 0, TAU); ctx.fillStyle = g; ctx.fill(); a.ring(cx, cy, 142, 2, .5, A);
  const gauge = (r, v, lab, c, lw) => { a.arc(cx, cy, r, 0, TAU, lw, .12, B); a.arc(cx, cy, r, -P / 2, -P / 2 + TAU * Math.max(.005, Math.min(1, v || 0)), lw, .92, c, true); a.text(lab, cx - 10, cy - r, 10, .85, A, 'right', { sp: 2 }); };
  const d = a.d, disk = (d.disks || [])[0];
  if (a.show('cpu')) gauge(200, (a.v.cpu || 0) / 100, 'CPU ' + a.fmt.pct(d.cpu && d.cpu.load == null ? null : a.v.cpu), C, 12);
  if (a.show('mem')) gauge(232, (a.v.mem || 0) / 100, 'MEM ' + a.fmt.pct(d.mem && d.mem.pct == null ? null : a.v.mem), B, 12);
  if (a.show('disk') && disk) gauge(264, disk.pct / 100, 'DSK ' + disk.mount + ' ' + Math.round(disk.pct) + '%', A, 12);
  if (a.show('net')) gauge(296, Math.min(1, (a.v.netD || 0) / 1e7), 'NET ' + a.fmt.rate(d.net && d.net.down == null ? null : a.v.netD), [160, 255, 240], 6);
  a.ticks(cx, cy, 312, 180, 5, T * .03, 1, .35, B, 5);
  ctx.save(); ctx.translate(cx - 40, cy + 14); ctx.rotate(-.5 + Math.sin(T * .3) * .05); for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.ellipse(0, 0, 250 + i * 12 + e * 30, 62 + i * 6, 0, 0, TAU); ctx.lineWidth = 1; ctx.strokeStyle = a.rgba(.45 - i * .12, A); ctx.stroke(); } ctx.restore();
  for (let k = 0; k < 4; k++) { const an = P / 4 + k * P / 2 + T * .15, r = 178 - e * 14, x = cx + Math.cos(an) * r, y = cy + Math.sin(an) * r; ctx.save(); ctx.translate(x, y); ctx.rotate(an + P / 2);
    ctx.beginPath(); ctx.moveTo(-11, 6); ctx.lineTo(0, -7); ctx.lineTo(11, 6); ctx.lineWidth = 3; ctx.strokeStyle = a.rgba(.95, [255, 255, 255]); ctx.stroke(); ctx.restore(); }
  for (const b of bokeh) { b.a += b.v * a.dt * (1 + e * 8); const r = b.r + au.spec[b.k] * 90 + e * 40, x = cx + Math.cos(b.a) * r, y = cy + Math.sin(b.a) * r * .85;
    if (b.s > 2.4) { a.ring(x, y, b.s * 2.4, 1, .35 + b.o * .3, C); } else a.disc(x, y, b.s, .25 + b.o * .5 + au.spec[b.k] * .4, b.o > .5 ? A : B); }
  a.radial(cx, cy, 152, 34, 72, -T * .05, 2, .8, C, true);
  ctx.save(); ctx.translate(cx + 160, cy + 250); ctx.rotate(-P / 2); a.text(au.voice ? 'LISTENING' : 'STANDBY', 0, 0, 10, .8, A, 'left', { sp: 4, weight: 600 }); ctx.restore();
  for (let i = 0; i < 3; i++) a.poly([[cx - 470 + i * 10, cy + 70], [cx - 460 + i * 10, cy + 80], [cx - 470 + i * 10, cy + 90]], 2, .4 + i * .25, B);
  W.clock(60, 56, { big: 50 }); a.stack(60, 230, 230, ['cpu', 'mem', 'gpu'], 16); a.stack(w - 290, 120, 230, ['net', 'disk', 'procs', 'sys'], 16, { right: true }); W.voice(60, 690, 230); W.batt(w - 290, 840, 230, { right: true });
} });

/* ================= 6. REACTOR  (orange gauge, hex mesh, teal) ================= */
S.register({ id: 'reactor', name: 'Reactor', palette: { a: [255, 138, 40], b: [110, 214, 226] },
bg(a) { const { ctx, w, au } = a; let g = ctx.createLinearGradient(0, 0, w, 900); g.addColorStop(0, '#16292f'); g.addColorStop(1, '#050b0e'); ctx.fillStyle = g; ctx.fillRect(0, 0, w, 900);
  a.grid(60, .06, a.col.b, 20, 10); a.glow(w * .55, 450, 520, .18 + au.env * .25, [255, 120, 40]); },
draw(a) { const { ctx, w, T, au, col, W } = a, A = col.a, B = col.b, e = au.env, cpu = (a.v.cpu || 0) / 100, ox = w * .58;
  ctx.save(); ctx.translate(ox, 455); ctx.scale(.86, .86); ctx.rotate(-.22 + a.mx * .04); ctx.transform(1, -.06, -.3, .86, 0, 0);
  a.ring(0, 0, 360, 4, .85, [255, 255, 255], true); a.ring(0, 0, 376, 1, .5, A); a.ring(0, 0, 330, 1, .3, B);
  a.ticks(0, 0, 384, 160, 7, T * .02, 1, .5, B, 8); a.radial(0, 0, 392, 50, 120, T * .03, 2, .9, A, true);
  ctx.setLineDash([14, 4]); a.arc(0, 0, 255, 0, TAU, 62, .13, A); a.arc(0, 0, 255, -P / 2, -P / 2 + TAU * Math.max(.01, cpu), 62, .92, A, true); ctx.setLineDash([]);
  a.ring(0, 0, 292, 2, .8, [255, 255, 255]); a.ring(0, 0, 218, 2, .8, [255, 255, 255]); a.arc(0, 0, 306, .2, 1.4, 3, .7, B); a.arc(0, 0, 306, P + .2, P + 1.4, 3, .7, B);
  ctx.save(); ctx.beginPath(); ctx.arc(0, 0, 210, 0, TAU); ctx.clip(); a.fillRect(-230, -230, 460, 460, .55, [6, 10, 12]);
  const hs = 15, hh = hs * Math.sqrt(3); for (let r = -14; r <= 14; r++) for (let c = -14; c <= 14; c++) { const x = c * hs * 1.5, y = r * hh + (c & 1 ? hh / 2 : 0), d = Math.hypot(x, y); if (d > 205) continue;
    const v = au.spec[Math.min(127, Math.floor(d / 205 * 60))] || 0; ctx.beginPath(); for (let k = 0; k < 6; k++) { const an = k * P / 3; ctx.lineTo(x + Math.cos(an) * (hs - 1.5), y + Math.sin(an) * (hs - 1.5)); } ctx.closePath();
    ctx.lineWidth = 1; ctx.strokeStyle = a.rgba(.12 + v * .8, v > .3 ? A : B); ctx.stroke(); if (v > .45) { ctx.fillStyle = a.rgba(v * .35, A); ctx.fill(); } }
  ctx.restore();
  a.text('CPU LOAD', 0, -62, 12, .8, B, 'center', { sp: 5 }); a.text(String(Math.round(a.v.cpu || 0)), 0, 8, 120, .98, [255, 255, 255], 'center', { font: a.F.SANS, weight: 700 });
  a.text(au.voice ? 'RECEIVING VOICE' : 'PERCENTAGE', 0, 82, 11, .85, A, 'center', { sp: 4 });
  ctx.restore();
  const pills = [['MEM', 'mem', (a.v.mem || 0) / 100, a.fmt.pct((a.d.mem || {}).pct == null ? null : a.v.mem)], ['DISK ' + (((a.d.disks || [])[0] || {}).mount || ''), 'disk', (((a.d.disks || [])[0] || {}).pct || 0) / 100, a.fmt.pct(((a.d.disks || [])[0] || {}).pct)],
    ['NET ▼', 'net', Math.min(1, (a.v.netD || 0) / 1e7), a.fmt.rate((a.d.net || {}).down == null ? null : a.v.netD)], ['GPU', 'gpu', (a.v.gpu || 0) / 100, a.fmt.pct(((a.d.gpu || {}).util))]];
  let y = 150; pills.forEach(p => { if (!a.show(p[1])) return; const x = 60, pw = 300, ph = 46; ctx.beginPath(); ctx.roundRect(x, y, pw, ph, 23); ctx.lineWidth = 2; ctx.strokeStyle = a.rgba(.7, [255, 255, 255]); ctx.stroke();
    ctx.beginPath(); ctx.roundRect(x + 5, y + 5, Math.max(30, (pw - 10) * p[2]), ph - 10, 18); ctx.fillStyle = a.rgba(.85, A); ctx.fill();
    a.text(p[0], x + 20, y + ph / 2, 12, .98, [20, 12, 6], 'left', { weight: 700, sp: 2 }); a.text(p[3], x + pw + 12, y + ph / 2, 13, .9, B, 'left'); y += 66; });
  a.stack(60, y + 10, 300, ['batt'], 10);
  a.stack(w - 280, 120, 240, ['procs', 'sys'], 16, { right: true }); W.voice(w - 280, 600, 240, { right: true });
  W.clock(60, 40, { big: 40 });
} });

/* ================= 7. SENSORY  (minimal white, symmetric panels) ================= */
S.register({ id: 'sensory', name: 'Sensory', palette: { a: [250, 250, 248], b: [170, 170, 166] },
bg(a) { const { ctx, w, cx, au } = a; ctx.fillStyle = '#050506'; ctx.fillRect(0, 0, w, 900); a.glow(cx, 450, 520, .08 + au.env * .16, [255, 255, 255]);
  for (let i = 0; i < 6; i++) { a.fillRect(0, 210 + i * 90, 120, 6, .05, a.col.a); a.fillRect(w - 120, 210 + i * 90, 120, 6, .05, a.col.a); } },
draw(a) { const { ctx, w, cx, cy, T, au, col, W } = a, A = col.a, B = col.b, e = au.env, d = a.d, cs = (d.cpu || {}).cores || [];
  a.ring(cx, cy, 392, 1, .3, A); a.ring(cx, cy, 384, 1, .15, A); a.ring(cx, cy, 250, 1, .5, A); a.ring(cx, cy, 236, 1, .25, A); a.ring(cx, cy, 168, 1, .4, A);
  a.arc(cx, cy, 300, P * 1.15, P * 1.85, 5, .95, A, true); a.arc(cx, cy, 300, P * .15, P * .85, 5, .95, A, true); a.arc(cx, cy, 316, P * 1.2, P * 1.8, 1, .6, A); a.arc(cx, cy, 316, P * .2, P * .8, 1, .6, A);
  a.arc(cx, cy, 250, P * 1.27, P * 1.73 + e * .2, 4 + e * 3, .95, A, true); a.arc(cx, cy, 250, P * .27 - e * .2, P * .73, 4 + e * 3, .95, A, true);
  for (const s of [-1, 1]) for (const v of [-1, 1]) { const x0 = cx + s * 262, y0 = cy + v * 118; a.poly([[x0, y0], [cx + s * 330, cy + v * 166], [cx + s * 490, cy + v * 166]], 1, .7, A); a.fillRect(cx + s * 490 - 3, cy + v * 166 - 3, 6, 6, .9, A); a.fillRect(x0 - 3, y0 - 3, 6, 6, .9, A); }
  a.radial(cx, cy, 172, 52, 120, T * .03, 1.5, .8, A, true); a.ticks(cx, cy, 254, 120, 4, -T * .02, 1, .3, B, 10);
  a.ring(cx, cy, 13 + e * 34, 3, .98, A, true); a.disc(cx, cy, 2, .9, A);
  for (const [yy, t] of [[-300, 'IN'], [300, 'OUT']]) { a.ring(cx, cy + yy, 12, 1, .8, A); a.text(t.charAt(0), cx, cy + yy, 9, .9, A, 'center'); }
  a.text(au.voice ? 'VOICE DETECTED' : 'SENSORY SIGNAL', cx, cy - 128, 12, .95, A, 'center', { sp: 4 }); ctx.setLineDash([3, 3]); a.line(cx - 90, cy - 114, cx + 90, cy - 114, 1, .6, A); ctx.setLineDash([]);
  a.text('X      O', cx - 228, cy + 12, 9, .7, A, 'center'); a.text('O      X', cx + 228, cy + 12, 9, .7, A, 'center');
  const side = (s, title, rows, set) => { const x = cx + s * 500, al = s < 0 ? 'left' : 'right', x0 = s < 0 ? x - 150 : x + 150;
    a.line(cx + s * 470, cy - 130, cx + s * 640, cy - 130, 1, .7, A); a.line(cx + s * 470, cy + 120, cx + s * 640, cy + 120, 1, .7, A); a.line(cx + s * 640, cy - 130, cx + s * 640, cy + 120, 1, .7, A); a.fillRect(cx + s * 640 - 3, cy - 133, 6, 6, .9, A); a.fillRect(cx + s * 640 - 3, cy + 117, 6, 6, .9, A);
    const tx = cx + s * 650 - s * 0, tl = s < 0 ? 'right' : 'left';
    a.text(title, cx + s * 628, cy - 110, 10, .95, A, s < 0 ? 'left' : 'right', { sp: 2 }); a.text(s < 0 ? '›' : '‹', cx + s * 500, cy - 108, 12, .9, A, 'center');
    rows.forEach((r, i) => { a.text(r[0], cx + s * 628, cy - 76 + i * 34, 9, .5, B, s < 0 ? 'left' : 'right', { sp: 2 }); a.text(r[1], cx + s * 628, cy - 58 + i * 34, 17, .95, A, s < 0 ? 'left' : 'right', { font: a.F.SANS, weight: 300 }); });
    ctx.setLineDash([6, 4]); a.line(cx + s * 540, cy + 98, cx + s * 640, cy + 98, 1, .7, A); ctx.setLineDash([]); a.text(set, cx + s * 628, cy + 100, 9, .8, A, s < 0 ? 'left' : 'right', { sp: 2 }); };
  const fm = a.fmt; if (a.show('cpu') || a.show('mem')) side(-1, 'LEFT XYZ', [['CPU', fm.pct(d.cpu && d.cpu.load == null ? null : a.v.cpu)], ['MEMORY', fm.pct(d.mem && d.mem.pct == null ? null : a.v.mem)]], 'ENGAGE SYSTEMS');
  if (a.show('net') || a.show('disk')) side(1, 'RIGHT XYZ', [['NET ▼', fm.rate(d.net && d.net.down == null ? null : a.v.netD)], ['DISK ' + ((d.disks || [])[0] || {}).mount, fm.pct(((d.disks || [])[0] || {}).pct)]], 'ENGAGE SYSTEMS');
  if (a.show('cpu')) { a.text('LEFT SET', cx - 628, cy + 152, 9, .9, A, 'left', { sp: 2 }); cs.slice(0, 8).forEach((c, i) => { a.fillRect(cx - 628 + i * 14, cy + 190 - c * .3, 8, 2 + c * .3, .85, A); }); }
  if (a.show('net')) { a.text('RIGHT SET', cx + 628, cy + 152, 9, .9, A, 'right', { sp: 2 }); a.spark(cx + 470, cy + 162, 160, 36, a.hist.netD, 0, 1.2, .85, A); }
  W.clock(50, 50, { big: 40 }); a.stack(50, 730, 210, ['sys'], 12); a.stack(w - 260, 700, 210, ['procs'], 12, { right: true }); W.batt(w - 260, 850, 210, { right: true });
} });

/* ================= 8. POSTER  (technical compass, data as tick arcs) ================= */
S.register({ id: 'poster', name: 'Poster', palette: { a: [255, 255, 255], b: [150, 150, 150] },
bg(a) { const { ctx, w, cx, au } = a; ctx.fillStyle = '#000'; ctx.fillRect(0, 0, w, 900); a.glow(cx, 450, 460, .05 + au.env * .1, [255, 255, 255]); },
draw(a) { const { ctx, w, cx, cy, T, au, col, W } = a, A = col.a, B = col.b, e = au.env, d = a.d, fm = a.fmt, H = P / 2;
  a.ring(cx, cy, 352, 3, .95, A); a.ring(cx, cy, 344, 7, .55, B); a.ring(cx, cy, 332, 1, .7, A);
  const quad = (q, v, n) => { const a0 = -H + q * H; a.ticks(cx, cy, 306, n, 14, 0, 1.4, .18, A, 0, a0 + .06, a0 + H - .06); const lit = Math.round(n * Math.max(0, Math.min(1, v || 0))); a.ticks(cx, cy, 306, lit, 14, 0, 2, .98, A, 0, a0 + .06, a0 + .06 + (H - .12) * lit / n); };
  quad(0, (a.v.cpu || 0) / 100, 50); quad(1, (a.v.mem || 0) / 100, 50); quad(2, (((d.disks || [])[0] || {}).pct || 0) / 100, 50); quad(3, Math.min(1, (a.v.netD || 0) / 1e7), 50);
  const lab = (an, t1, t2) => { const r = 372, x = cx + Math.cos(an) * r, y = cy + Math.sin(an) * r; ctx.save(); ctx.translate(x, y); ctx.rotate(an + (Math.cos(an) < 0 ? P : 0)); const al = Math.cos(an) < 0 ? 'right' : 'left';
    a.text(t1, al === 'left' ? 8 : -8, 0, 10, .95, A, al, { sp: 1 }); a.text(t2, al === 'left' ? 8 : -8, 13, 8, .5, B, al); ctx.restore(); a.line(cx + Math.cos(an) * 352, cy + Math.sin(an) * 352, cx + Math.cos(an) * 368, cy + Math.sin(an) * 368, 1, .8, A); };
  lab(-H + .785, '<CPU ' + fm.pct(d.cpu && d.cpu.load == null ? null : a.v.cpu) + '>', 'LOAD'); lab(.785, '<MEM ' + fm.pct(d.mem && d.mem.pct == null ? null : a.v.mem) + '>', d.mem ? fm.gb(d.mem.used) : '--');
  lab(H + .785, '<DSK ' + (((d.disks || [])[0] || {}).mount || '--') + ' ' + fm.pct(((d.disks || [])[0] || {}).pct) + '>', 'STORAGE'); lab(P + .785, '<NET ' + fm.rate(d.net && d.net.down == null ? null : a.v.netD) + '>', 'DOWN');
  lab(-H, 'N ' + fm.clock(), 'LOCAL'); lab(0, 'E ' + fm.up((d.sys || {}).uptime), 'UPTIME'); lab(H, 'S ' + (((d.gpu || {}).util) == null ? '--' : Math.round(a.v.gpu) + '%'), 'GPU'); lab(P, 'W ' + fm.short((d.sys || {}).host, 10), 'HOST');
  a.ring(cx, cy, 252, 2, .9, A); a.ring(cx, cy, 246, 1, .5, A);
  for (let i = 0; i < 4; i++) { const an = P / 4 + i * H, mv = Math.sin(T * .5 + i) * .05 + au.bass * .3 * (i % 2 ? 1 : -1); a.arc(cx, cy, 238, an - .2 + mv, an + .2 + mv, 4, .95, A); const x = cx + Math.cos(an + mv) * 262, y = cy + Math.sin(an + mv) * 262; ctx.save(); ctx.translate(x, y); ctx.rotate(an + mv + H); a.poly([[-5, -6], [5, -6], [0, 6]], 0, 0, A, true, .95); ctx.restore(); }
  a.ticks(cx, cy, 158, 120, 6, T * .02, 1, .4, B, 10); a.radial(cx, cy, 150, 52, 120, 0, 1.6, .9, A);
  a.line(cx - 150, cy, cx + 150, cy, 1, .55, A); a.line(cx, cy - 210, cx, cy + 210, 1, .55, A); for (const [x, y] of [[0, -210], [0, 210], [0, -150], [0, 150]]) a.disc(cx + x, cy + y, 2.5, .95, A);
  const gap = 12 + e * 26; a.line(cx - 54 - gap, cy - 7, cx - gap, cy - 7, 2, .95, A); a.line(cx - 54 - gap, cy + 7, cx - gap, cy + 7, 2, .95, A); a.line(cx + gap, cy - 7, cx + 54 + gap, cy - 7, 2, .95, A); a.line(cx + gap, cy + 7, cx + 54 + gap, cy + 7, 2, .95, A);
  for (const an of [P / 4, 3 * P / 4, 5 * P / 4, 7 * P / 4]) for (const o of [-1, 1]) a.disc(cx + Math.cos(an) * 122 + o * 5, cy + Math.sin(an) * 122, 2, .9, A);
  const tl = [[a.show('sys'), '< HOST ' + fm.short((d.sys || {}).host, 14).toUpperCase() + ' >'], [a.show('sys'), '< USER ' + fm.short(a.cfg.userName || (d.sys || {}).user, 12).toUpperCase() + ' >'], [a.show('cpu'), '< CPU ' + fm.pct(d.cpu && d.cpu.load == null ? null : a.v.cpu) + ' ' + ((d.cpu || {}).cores ? d.cpu.cores.length + 'C' : '') + ' >'],
    [a.show('mem'), '< MEM ' + (d.mem ? fm.gb(d.mem.used) + '/' + fm.gb(d.mem.total) : '--') + ' >'], [a.show('net'), '< NET ' + fm.rate(d.net && d.net.down == null ? null : a.v.netD) + ' >'], [a.show('sys'), '< UP ' + fm.up((d.sys || {}).uptime) + ' >']].filter(r => r[0]);
  tl.forEach((r, i) => a.text(r[1], 50, 60 + i * 28, 12, .92, A, 'left', { sp: 1 }));
  (d.procs || []).slice(0, a.show('procs') ? 5 : 0).forEach((p, i) => a.text('< ' + fm.short(p.name.replace(/\.exe$/i, ''), 12).toUpperCase() + ' ' + p.cpu.toFixed(1) + ' >', 50, 720 + i * 26, 12, .8 - i * .08, A, 'left', { sp: 1 }));
  W.voice(w - 280, 690, 230, { right: true }); a.text(au.voice ? '[ VOICE ACTIVE ]' : '[ STANDBY ]', w - 50, 60, 12, .9, A, 'right', { sp: 2 }); W.batt(w - 280, 650, 230, { right: true });
} });
})();
