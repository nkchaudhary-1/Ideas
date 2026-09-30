/* Themes 5-8: Orb, Halo, Sensory, Poster */
(() => {
const S = window.Studio, P = Math.PI, TAU = P * 2;

/* ================= 5. ORB  (glass orb holding the brain; data as thin orbit gauges) ================= */
let bokeh = null;
S.register({ id: 'orb', name: 'Orb',
init() { bokeh = Array.from({ length: 110 }, () => ({ a: Math.random() * TAU, r: 310 + Math.random() * 330, v: (Math.random() - .5) * .0003, s: .7 + Math.random() * 1.8, o: Math.random(), k: (Math.random() * 128) | 0 })); },
bg(a) { const { ctx, w, cx, au } = a; a.backdrop(); ctx.save(); ctx.translate(cx + 60, 300); ctx.rotate(-.35); ctx.scale(1.3, .8); a.glow(0, 0, 330, .2 + au.env * .22, a.col.a); ctx.restore(); a.glow(cx - 40, 560, 300, .1 + au.env * .1, a.col.b); },
draw(a) { const { ctx, w, cx, T, au, col, W } = a, cy = 470, AC = col.a, CR = col.b, DM = col.c, e = au.env, d = a.d;
  const g = ctx.createRadialGradient(cx - 50, cy - 50, 10, cx, cy, 180); g.addColorStop(0, a.rgba(.12, AC)); g.addColorStop(.6, a.rgba(.04, AC)); g.addColorStop(1, 'rgba(6,5,5,.92)'); ctx.beginPath(); ctx.arc(cx, cy, 172, 0, TAU); ctx.fillStyle = g; ctx.fill();
  a.ring(cx, cy, 172, 1, .45, CR); a.arc(cx, cy, 166, -2.6, -1.8, 1.2, .5, CR);
  a.brain.draw(cx, cy, 112, { n: 340, alpha: .95, noGlow: true });
  const gauge = (r, v, lab, c, al) => { a.ring(cx, cy, r, 1, .1, CR); a.arc(cx, cy, r, -P / 2, -P / 2 + TAU * Math.max(.004, Math.min(1, v || 0)), 2, al, c, true); a.fillRect(cx - 1, cy - r - 3, 2, 6, .6, CR); a.text(lab, cx - 10, cy - r, 9, .8, CR, 'right', { sp: 2 }); };
  const disk = (d.disks || [])[0];
  if (a.show('cpu')) gauge(206, (a.v.cpu || 0) / 100, 'CPU ' + a.fmt.pct(d.cpu && d.cpu.load == null ? null : a.v.cpu), AC, .95);
  if (a.show('mem')) gauge(228, (a.v.mem || 0) / 100, 'MEM ' + a.fmt.pct(d.mem && d.mem.pct == null ? null : a.v.mem), CR, .85);
  if (a.show('disk') && disk) gauge(250, disk.pct / 100, 'DSK ' + disk.mount.replace(/[\\/]+$/, '') + ' ' + Math.round(disk.pct) + '%', AC, .6);
  if (a.show('net')) gauge(272, Math.min(1, (a.v.netD || 0) / 1e7), 'NET ' + a.fmt.rate(d.net && d.net.down == null ? null : a.v.netD), CR, .6);
  a.ticks(cx, cy, 292, 200, 4, T * .02, 1, .25, CR, 5); a.radial(cx, cy, 182, 18, 96, -T * .04, 1, .55, AC);
  ctx.save(); ctx.translate(cx - 30, cy + 10); ctx.rotate(-.5 + Math.sin(T * .3) * .05); for (let i = 0; i < 2; i++) { ctx.beginPath(); ctx.ellipse(0, 0, 330 + i * 14 + e * 26, 70 + i * 6, 0, 0, TAU); ctx.lineWidth = 1; ctx.strokeStyle = a.rgba(.22 - i * .08, CR); ctx.stroke(); } ctx.restore();
  for (let k = 0; k < 4; k++) { const an = P / 4 + k * P / 2 + T * .12, r = 196 - e * 8, x = cx + Math.cos(an) * r, y = cy + Math.sin(an) * r; ctx.save(); ctx.translate(x, y); ctx.rotate(an + P / 2); ctx.beginPath(); ctx.moveTo(-8, 4); ctx.lineTo(0, -5); ctx.lineTo(8, 4); ctx.lineWidth = 1.4; ctx.strokeStyle = a.rgba(.9, CR); ctx.stroke(); ctx.restore(); }
  for (const b of bokeh) { b.a += b.v * a.dt * (1 + e * 8); const r = b.r + au.spec[b.k] * 70 + e * 30, x = cx + Math.cos(b.a) * r, y = cy + Math.sin(b.a) * r * .86;
    if (b.s > 1.9) a.ring(x, y, b.s * 2.2, 1, .2 + b.o * .2, AC); else a.disc(x, y, b.s * .8, .15 + b.o * .35 + au.spec[b.k] * .4, b.o > .5 ? CR : AC); }
  ctx.save(); ctx.translate(cx + 232, cy + 228); ctx.rotate(-P / 2); a.label(au.voice ? 'Listening' : 'Standby', 0, 0, .7); ctx.restore();
  W.clock(80, 56, { big: 58 }); a.stack(80, 236, 232, ['cpu', 'mem', 'gpu'], 26); a.stack(w - 312, 92, 232, ['net', 'disk', 'procs', 'sys'], 26, { right: true }); W.greet(80, 820); W.voice(w - 312, 740, 232, { right: true });
} });

/* ================= 6. HALO  (thin tilted ring lens, CPU as tick gauge) ================= */
S.register({ id: 'halo', name: 'Halo',
bg(a) { a.backdrop(); a.grid(60, .03, a.col.b, 20, 10); a.glow(a.cx, 450, 520, .1 + a.au.env * .14, a.col.a); },
draw(a) { const { ctx, w, cx, T, au, col, W } = a, AC = col.a, CR = col.b, DM = col.c, e = au.env, cpu = Math.max(0, Math.min(1, (a.v.cpu || 0) / 100));
  ctx.save(); ctx.translate(cx, 455); ctx.scale(.9, .9); ctx.rotate(-.16 + a.mx * .04); ctx.transform(1, -.05, -.2, .9, 0, 0);
  a.ring(0, 0, 360, 1, .55, CR); a.ring(0, 0, 372, 1, .18, CR); a.ring(0, 0, 330, 1, .12, CR);
  a.ticks(0, 0, 380, 180, 6, T * .015, 1, .25, CR, 9); a.radial(0, 0, 388, 54, 120, T * .02, 1, .7, AC);
  const n = 120; ctx.beginPath(); for (let i = 0; i < n; i++) { const an = -P / 2 + i / n * TAU, lit = i / n < cpu; if (!lit) continue; ctx.moveTo(Math.cos(an) * 262, Math.sin(an) * 262); ctx.lineTo(Math.cos(an) * 298, Math.sin(an) * 298); } ctx.lineWidth = 1.6; ctx.strokeStyle = a.rgba(.95, AC); ctx.stroke();
  ctx.beginPath(); for (let i = 0; i < n; i++) { const an = -P / 2 + i / n * TAU; ctx.moveTo(Math.cos(an) * 262, Math.sin(an) * 262); ctx.lineTo(Math.cos(an) * 298, Math.sin(an) * 298); } ctx.lineWidth = 1; ctx.strokeStyle = a.rgba(.14, CR); ctx.stroke();
  a.ring(0, 0, 250, 1, .4, CR); a.ring(0, 0, 214, 1, .2, CR);
  ctx.save(); ctx.beginPath(); ctx.arc(0, 0, 208, 0, TAU); ctx.clip(); const hs = 14, hh = hs * Math.sqrt(3);
  for (let r = -15; r <= 15; r++) for (let c = -15; c <= 15; c++) { const x = c * hs * 1.5, y = r * hh + (c & 1 ? hh / 2 : 0), dd = Math.hypot(x, y); if (dd > 204) continue; const v = au.spec[Math.min(127, Math.floor(dd / 204 * 60))] || 0;
    ctx.beginPath(); for (let k = 0; k < 6; k++) { const an = k * P / 3; ctx.lineTo(x + Math.cos(an) * (hs - 1.5), y + Math.sin(an) * (hs - 1.5)); } ctx.closePath(); ctx.lineWidth = 1; ctx.strokeStyle = a.rgba(.07 + v * .7, v > .35 ? AC : CR); ctx.stroke(); if (v > .5) { ctx.fillStyle = a.rgba(v * .18, AC); ctx.fill(); } }
  ctx.restore();
  a.label('cpu load', 0, -68, .8, 'center'); a.num(String(Math.round(a.v.cpu || 0)), '%', -34, 10, 104, .96, false); a.label(au.voice ? 'receiving voice' : 'standby', 0, 84, .8, 'center', au.voice ? AC : DM);
  ctx.restore();
  W.clock(60, 56, { big: 56 }); a.stack(60, 230, 232, ['mem', 'gpu', 'net', 'disk'], 24); a.stack(w - 292, 92, 232, ['procs', 'sys'], 26, { right: true }); W.voice(w - 292, 600, 232, { right: true }); W.greet(60, 820); W.batt(w - 292, 780, 232, { right: true });
} });

/* ================= 7. SENSORY  (minimal symmetric panels) ================= */
S.register({ id: 'sensory', name: 'Sensory',
bg(a) { a.backdrop({ c0: '#171615', c1: '#040404' }); },
draw(a) { const { ctx, w, cx, cy, T, au, col, W } = a, AC = col.a, CR = col.b, DM = col.c, e = au.env, d = a.d, cs = (d.cpu || {}).cores || [];
  a.ring(cx, cy, 392, 1, .22, CR); a.ring(cx, cy, 384, 1, .1, CR); a.ring(cx, cy, 250, 1, .4, CR); a.ring(cx, cy, 236, 1, .18, CR); a.ring(cx, cy, 168, 1, .3, CR);
  a.arc(cx, cy, 300, P * 1.15, P * 1.85, 1.6, .8, CR); a.arc(cx, cy, 300, P * .15, P * .85, 1.6, .8, CR); a.arc(cx, cy, 316, P * 1.2, P * 1.8, 1, .35, CR); a.arc(cx, cy, 316, P * .2, P * .8, 1, .35, CR);
  a.arc(cx, cy, 250, P * 1.27, P * 1.73 + e * .2, 2, .95, AC, true); a.arc(cx, cy, 250, P * .27 - e * .2, P * .73, 2, .95, AC, true);
  for (const s of [-1, 1]) for (const v of [-1, 1]) { const x0 = cx + s * 262, y0 = cy + v * 118; a.poly([[x0, y0], [cx + s * 330, cy + v * 166], [cx + s * 490, cy + v * 166]], 1, .5, CR); a.fillRect(cx + s * 490 - 2, cy + v * 166 - 2, 4, 4, .8, AC); a.fillRect(x0 - 2, y0 - 2, 4, 4, .8, CR); }
  a.radial(cx, cy, 172, 50, 120, T * .03, 1, .65, AC); a.ticks(cx, cy, 254, 120, 4, -T * .02, 1, .25, CR, 10);
  a.ring(cx, cy, 12 + e * 32, 1.6, .95, CR, true); a.disc(cx, cy, 2, .95, AC);
  for (const [yy, t] of [[-300, 'IN'], [300, 'OUT']]) { a.ring(cx, cy + yy, 12, 1, .6, CR); a.text(t.charAt(0), cx, cy + yy, 9, .85, CR, 'center'); }
  a.label(au.voice ? 'Voice detected' : 'Sensory signal', cx, cy - 128, .95, 'center', au.voice ? AC : CR); ctx.setLineDash([3, 3]); a.line(cx - 90, cy - 114, cx + 90, cy - 114, 1, .4, CR); ctx.setLineDash([]);
  const side = (s, title, rows, set) => { a.line(cx + s * 470, cy - 130, cx + s * 640, cy - 130, 1, .5, CR); a.line(cx + s * 470, cy + 120, cx + s * 640, cy + 120, 1, .5, CR); a.line(cx + s * 640, cy - 130, cx + s * 640, cy + 120, 1, .5, CR);
    const al = s < 0 ? 'left' : 'right', x = cx + s * 628; a.label(title, x, cy - 110, .9, al, CR); rows.forEach((r, i) => { a.label(r[0], x, cy - 76 + i * 40, .6, al); a.num(r[1], r[2] || '', s < 0 ? x : x, cy - 52 + i * 40, 22, .94, s > 0); });
    ctx.setLineDash([6, 4]); a.line(cx + s * 540, cy + 98, cx + s * 640, cy + 98, 1, .4, CR); ctx.setLineDash([]); a.label(set, x, cy + 108, .7, al); };
  const fm = a.fmt, dk = (d.disks || [])[0] || {};
  if (a.show('cpu') || a.show('mem')) side(-1, 'Left xyz', [['cpu', d.cpu && d.cpu.load == null ? '--' : String(Math.round(a.v.cpu)), '%'], ['memory', d.mem && d.mem.pct == null ? '--' : String(Math.round(a.v.mem)), '%']], 'engage systems');
  if (a.show('net') || a.show('disk')) side(1, 'Right xyz', [['network ↓', d.net && d.net.down == null ? '--' : (a.v.netD / 1e6).toFixed(1), 'MB/s'], ['disk ' + String(dk.mount || '').replace(/[\\/]+$/, ''), dk.pct == null ? '--' : String(Math.round(dk.pct)), '%']], 'engage systems');
  if (a.show('cpu')) { a.label('left set', cx - 628, cy + 152, .7); cs.slice(0, 8).forEach((c, i) => a.line(cx - 628 + i * 10, cy + 196, cx - 628 + i * 10, cy + 196 - 4 - c * .28, 1.4, .8, AC)); }
  if (a.show('net')) { a.label('right set', cx + 628, cy + 152, .7, 'right'); a.spark(cx + 480, cy + 162, 148, 34, a.hist.netD, 0, 1.1, .85, AC); }
  W.clock(50, 50, { big: 54 }); a.stack(50, 730, 200, ['sys'], 16); a.stack(w - 250, 690, 200, ['procs', 'batt'], 16, { right: true }); W.greet(50, 640);
} });

/* ================= 8. POSTER  (technical compass, data as tick arcs) ================= */
S.register({ id: 'poster', name: 'Poster',
bg(a) { a.backdrop({ c0: '#141312', c1: '#000000' }); },
draw(a) { const { ctx, w, cx, cy, T, au, col, W } = a, AC = col.a, CR = col.b, DM = col.c, e = au.env, d = a.d, fm = a.fmt, H = P / 2;
  a.ring(cx, cy, 352, 1.6, .8, CR); a.ring(cx, cy, 344, 5, .2, CR); a.ring(cx, cy, 332, 1, .4, CR);
  const quad = (q, v, n) => { const a0 = -H + q * H; a.ticks(cx, cy, 306, n, 14, 0, 1.2, .16, CR, 0, a0 + .06, a0 + H - .06); const lit = Math.round(n * Math.max(0, Math.min(1, v || 0))); a.ticks(cx, cy, 306, lit, 14, 0, 1.6, .95, AC, 0, a0 + .06, a0 + .06 + (H - .12) * lit / n); };
  quad(0, (a.v.cpu || 0) / 100, 50); quad(1, (a.v.mem || 0) / 100, 50); quad(2, (((d.disks || [])[0] || {}).pct || 0) / 100, 50); quad(3, Math.min(1, (a.v.netD || 0) / 1e7), 50);
  const lab = (an, t1, t2) => { const r = 372, x = cx + Math.cos(an) * r, y = cy + Math.sin(an) * r; ctx.save(); ctx.translate(x, y); ctx.rotate(an + (Math.cos(an) < 0 ? P : 0)); const al = Math.cos(an) < 0 ? 'right' : 'left';
    a.text(t1, al === 'left' ? 8 : -8, 0, 10, .9, CR, al, { sp: 1 }); a.text(t2, al === 'left' ? 8 : -8, 13, 8, .55, DM, al); ctx.restore(); a.line(cx + Math.cos(an) * 352, cy + Math.sin(an) * 352, cx + Math.cos(an) * 368, cy + Math.sin(an) * 368, 1, .6, CR); };
  lab(-H + .785, '<CPU ' + fm.pct(d.cpu && d.cpu.load == null ? null : a.v.cpu) + '>', 'LOAD'); lab(.785, '<MEM ' + fm.pct(d.mem && d.mem.pct == null ? null : a.v.mem) + '>', d.mem ? fm.gb(d.mem.used) : '--');
  lab(H + .785, '<DSK ' + String(((d.disks || [])[0] || {}).mount || '--').replace(/[\\/]+$/, '') + ' ' + fm.pct(((d.disks || [])[0] || {}).pct) + '>', 'STORAGE'); lab(P + .785, '<NET ' + fm.rate(d.net && d.net.down == null ? null : a.v.netD) + '>', 'DOWN');
  lab(-H, 'N ' + fm.clock(), 'LOCAL'); lab(0, 'E ' + fm.up((d.sys || {}).uptime), 'UPTIME'); lab(H, 'S ' + (((d.gpu || {}).util) == null ? '--' : Math.round(a.v.gpu) + '%'), 'GPU'); lab(P, 'W ' + fm.short((d.sys || {}).host, 10), 'HOST');
  a.ring(cx, cy, 252, 1.4, .7, CR); a.ring(cx, cy, 246, 1, .3, CR);
  for (let i = 0; i < 4; i++) { const an = P / 4 + i * H, mv = Math.sin(T * .5 + i) * .05 + au.bass * .3 * (i % 2 ? 1 : -1); a.arc(cx, cy, 238, an - .2 + mv, an + .2 + mv, 2.4, .9, AC); const x = cx + Math.cos(an + mv) * 262, y = cy + Math.sin(an + mv) * 262; ctx.save(); ctx.translate(x, y); ctx.rotate(an + mv + H); a.poly([[-4, -5], [4, -5], [0, 5]], 0, 0, CR, true, .9); ctx.restore(); }
  a.ticks(cx, cy, 158, 120, 6, T * .02, 1, .25, CR, 10); a.radial(cx, cy, 150, 52, 120, 0, 1.3, .8, AC);
  a.line(cx - 150, cy, cx + 150, cy, 1, .4, CR); a.line(cx, cy - 210, cx, cy + 210, 1, .4, CR); for (const y of [-210, 210, -150, 150]) a.disc(cx, cy + y, 2, .85, CR);
  const gap = 12 + e * 26; for (const dy of [-6, 6]) { a.line(cx - 50 - gap, cy + dy, cx - gap, cy + dy, 1.4, .9, CR); a.line(cx + gap, cy + dy, cx + 50 + gap, cy + dy, 1.4, .9, CR); }
  for (const an of [P / 4, 3 * P / 4, 5 * P / 4, 7 * P / 4]) for (const o of [-1, 1]) a.disc(cx + Math.cos(an) * 122 + o * 5, cy + Math.sin(an) * 122, 1.6, .8, CR);
  const tl = [[a.show('sys'), '< HOST ' + fm.short((d.sys || {}).host, 14).toUpperCase() + ' >'], [a.show('sys'), '< USER ' + fm.short(a.cfg.userName || (d.sys || {}).user, 12).toUpperCase() + ' >'], [a.show('cpu'), '< CPU ' + fm.pct(d.cpu && d.cpu.load == null ? null : a.v.cpu) + ' ' + ((d.cpu || {}).cores ? d.cpu.cores.length + 'C' : '') + ' >'],
    [a.show('mem'), '< MEM ' + (d.mem ? fm.gb(d.mem.used) + '/' + fm.gb(d.mem.total) : '--') + ' >'], [a.show('net'), '< NET ' + fm.rate(d.net && d.net.down == null ? null : a.v.netD) + ' >'], [a.show('sys'), '< UP ' + fm.up((d.sys || {}).uptime) + ' >']].filter(r => r[0]);
  tl.forEach((r, i) => a.text(r[1], 50, 60 + i * 28, 11, .88, CR, 'left', { sp: 1 }));
  (d.procs || []).slice(0, a.show('procs') ? 5 : 0).forEach((p, i) => a.text('< ' + fm.short(p.name.replace(/\.exe$/i, ''), 12).toUpperCase() + ' ' + p.cpu.toFixed(1) + ' >', 50, 720 + i * 26, 11, .8 - i * .1, CR, 'left', { sp: 1 }));
  W.voice(w - 280, 690, 230, { right: true }); a.text(au.voice ? '[ VOICE ACTIVE ]' : '[ STANDBY ]', w - 50, 60, 11, .9, au.voice ? AC : CR, 'right', { sp: 2 }); W.batt(w - 280, 650, 230, { right: true });
} });
})();
