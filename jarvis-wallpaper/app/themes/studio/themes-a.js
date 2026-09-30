/* Themes 1-4: Cortex, Blueprint, Cockpit, Target  (brain design language: hairlines, one accent, serif numerals) */
(() => {
const S = window.Studio, P = Math.PI;

/* ================= 1. CORTEX  (brain core inside fine concentric HUD) ================= */
S.register({ id: 'cortex', name: 'Cortex',
draw(a) { const { ctx, w, cx, T, au, col, W } = a, AC = col.a, CR = col.b, DM = col.c, e = au.env, cy = 450;
  a.ring(cx, cy, 236, 1, .13, CR); a.ring(cx, cy, 336, 1, .08, CR); a.ticks(cx, cy, 342, 240, 4, -P / 2, 1, .2, CR, 20); a.ticks(cx, cy, 342, 12, 11, -P / 2, 1, .65, AC, 1);
  ctx.save(); if (ctx.createConicGradient) { const g = ctx.createConicGradient(T * .5 - 1.3, cx, cy); g.addColorStop(0, a.rgba(0)); g.addColorStop(.2, a.rgba(.1, AC)); g.addColorStop(.201, a.rgba(0)); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, 336, 0, P * 2); ctx.fill(); } ctx.restore();
  a.arc(cx, cy, 310, P * 1.1, P * 1.9, 1.4, .6, AC); a.arc(cx, cy, 310, P * .1, P * .9, 1.4, .6, AC);
  for (const [an, r] of [[1.1, 310], [1.9, 310], [.1, 310], [.9, 310]]) a.fillRect(cx + Math.cos(an * P) * r - 2, cy + Math.sin(an * P) * r - 2, 4, 4, .9, AC);
  a.radial(cx, cy, 248, 44, 120, T * .03, 1, .6, AC);
  a.arc(cx, cy, 470, P * .86, P * 1.14, 1.2, .4, CR); a.arc(cx, cy, 470, -P * .14, P * .14, 1.2, .4, CR); a.arc(cx, cy, 486, P * .9, P * 1.1, 1, .2, CR); a.arc(cx, cy, 486, -P * .1, P * .1, 1, .2, CR);
  for (let k = 0; k < 4; k++) { const an = P / 4 + k * P / 2, c = Math.cos(an), s = Math.sin(an); a.line(cx + c * 352, cy + s * 352, cx + c * 440, cy + s * 440, 1, .14, CR); a.disc(cx + c * 440, cy + s * 440, 2, .5, AC); }
  a.brain.draw(cx, cy, 190, { n: 420 });
  a.label(au.voice ? 'Voice detected' : (au.live ? 'Listening' : 'Mic off'), cx, cy + 372, .8, 'center', au.voice ? AC : DM);
  W.clock(80, 56, { big: 64 }); a.stack(80, 232, 232, ['cpu', 'mem', 'gpu', 'batt'], 26);
  a.stack(w - 312, 92, 232, ['net', 'disk', 'procs', 'sys'], 26, { right: true }); W.greet(80, 820); W.voice(w - 312, 740, 232, { right: true });
} });

/* ================= 2. BLUEPRINT  (serif headline + fine mesh sphere) ================= */
S.register({ id: 'blueprint', name: 'Blueprint',
bg(a) { const { ctx, w } = a; a.backdrop(); a.glow(0, 900, 640, .22 + a.au.env * .12, a.col.a); a.grid(60, .035, a.col.b, 10, 14); },
draw(a) { const { ctx, w, T, au, col, W } = a, AC = col.a, CR = col.b, DM = col.c, e = au.env, ox = w * .64, oy = 470, yaw = T * .22 + a.mx * .8, pit = .38 + a.my * .3, R0 = 215, pr = (x, y, z) => a.proj(x, y, z, yaw, pit, 900, ox, oy);
  const disp = lon => 1 + au.spec[Math.floor(((lon / (2 * P)) % 1 + 1) % 1 * 127)] * .1, pt = (lat, lon, rr) => pr(rr * Math.cos(lat) * Math.cos(lon), rr * Math.sin(lat), rr * Math.cos(lat) * Math.sin(lon));
  const seg = (pts, al) => { for (let i = 1; i < pts.length; i++) { const p = pts[i - 1], q = pts[i], d = (p[2] + q[2]) / 2 / R0; a.line(p[0], p[1], q[0], q[1], 1, Math.max(.05, al * (.55 - d * .45)), CR); } };
  for (let i = 1; i < 12; i++) { const lat = -P / 2 + i * P / 12, pts = []; for (let j = 0; j <= 64; j++) { const lon = j / 64 * 2 * P; pts.push(pt(lat, lon, R0 * disp(lon))); } seg(pts, .7); }
  for (let i = 0; i < 20; i++) { const lon = i / 20 * 2 * P, pts = []; for (let j = 0; j <= 32; j++) pts.push(pt(-P / 2 + j / 32 * P, lon, R0 * disp(lon))); seg(pts, .7); }
  for (let i = 1; i < 12; i += 1) for (let j = 0; j < 20; j += 1) { const lat = -P / 2 + i * P / 12, lon = j / 20 * 2 * P, p = pt(lat, lon, R0 * disp(lon)), d = p[2] / R0; if (d < .3) a.disc(p[0], p[1], 1.1 + au.spec[(i * 9 + j) % 128] * 1.5, .25 + (1 - d) * .3 + au.spec[(i * 9 + j) % 128] * .5, au.spec[(i * 9 + j) % 128] > .4 ? AC : CR); }
  for (let j = 0; j < 3; j++) { const pts = []; for (let k = 0; k <= 120; k++) { const t0 = k / 120 * 2 * P; pts.push(pr(300 * Math.cos(t0), (j - 1) * 14, 300 * Math.sin(t0))); } seg(pts, .35); }
  const lab = (txt, val, unit, tx, ty, px, py) => { a.line(px, py, tx, ty, 1, .3, CR); a.disc(px, py, 2.5, .9, AC); a.line(tx, ty, tx + 140, ty, 1, .3, CR); a.label(txt, tx + 2, ty - 12, .5); a.num(val, unit, tx + 2, ty + 18, 22, .94); };
  const d = a.d, cp = pt(-P / 2 + .3, 1, R0), mp = pt(0, 0, R0 * 1.0), np = pt(.6, 4.2, R0);
  if (a.show('cpu') && d.cpu && d.cpu.load != null) lab('CPU load', String(Math.round(a.v.cpu)), '%', ox + 240, 170, cp[0], cp[1]);
  if (a.show('mem') && d.mem && d.mem.pct != null) lab('Memory', String(Math.round(a.v.mem)), '%', ox + 290, 330, mp[0], mp[1]);
  if (a.show('net') && d.net && d.net.down != null) lab('Network ↓', (a.v.netD / 1e6).toFixed(1), 'MB/s', ox - 420, 730, np[0], np[1]);
  a.text('Your system,', 80, 140, 54, .96, CR, 'left', { font: a.F.SERIF }); a.text('in real time.', 80, 204, 54, .96, AC, 'left', { font: a.F.SERIF });
  ctx.beginPath(); ctx.roundRect(80, 252, 176, 32, 16); ctx.lineWidth = 1; ctx.strokeStyle = a.rgba(au.voice ? .9 : .5, AC); ctx.stroke(); if (au.voice) { ctx.fillStyle = a.rgba(.14, AC); ctx.fill(); }
  a.disc(100, 268, 3, au.voice ? 1 : .5, AC); a.text(au.voice ? 'LISTENING' : 'SAY “JARVIS”', 114, 268, 10, .85, CR, 'left', { sp: 3 });
  a.stack(80, 340, 250, ['cpu', 'mem', 'net'], 26); a.stack(w - 320, 640, 240, ['sys'], 20, { right: true }); W.voice(w - 320, 440, 240, { right: true }); W.greet(80, 820);
} });

/* ================= 3. COCKPIT  (tilted glass, pitch ladder) ================= */
S.register({ id: 'cockpit', name: 'Cockpit',
bg(a) { const { ctx, w, au, T } = a; a.backdrop({ c0: '#1c1a18', c1: '#050505' }); a.glow(w * .68, 250, 300, .1 + au.env * .12, a.col.b);
  for (let i = 0; i < 8; i++) { const x = (i * 197 + T * (5 + i)) % (w + 200) - 100, y = 140 + (i * 113) % 640; a.glow(x, y, 40 + (i % 4) * 26, .035 + (i % 3) * .012 + au.bass * .04, a.col.b); } },
draw(a) { const { ctx, w, cx, cy, T, au, col, W } = a, AC = col.a, CR = col.b, DM = col.c, e = au.env, cs = (a.d.cpu || {}).cores || [], ps = a.d.procs || [];
  ctx.save(); ctx.translate(cx, cy + 20); ctx.rotate(-.05 + a.mx * .03); ctx.scale(.9, .9); ctx.transform(1, -.05 + a.my * .04, -.12, 1, 0, 0); ctx.translate(-cx, -cy);
  ctx.beginPath(); ctx.moveTo(cx - 640, cy - 250); ctx.lineTo(cx + 640, cy - 250); ctx.lineTo(cx + 640, cy + 380); ctx.lineTo(cx - 640, cy + 380); ctx.closePath(); ctx.fillStyle = a.rgba(.028, CR); ctx.fill();
  a.line(cx - 640, cy - 250, cx + 640, cy - 250, 1, .45, CR); a.line(cx + 640, cy - 250, cx + 640, cy + 380, 1, .2, CR);
  const hy = cy - 150, mxp = cx + Math.max(-150, Math.min(150, (au.bass - au.treb) * 300 + au.wave[8] * 120));
  a.line(cx - 640, hy, cx + 640, hy, 1.2, .7, CR);
  for (let i = -6; i <= 6; i++) { if (!i) continue; const x = cx + i * 95 + (i > 0 ? -20 : 20), sg = Math.sign(-i); a.poly([[x - 7 * sg, hy - 8], [x + 7 * sg, hy], [x - 7 * sg, hy + 8]], 1, .6, CR); }
  ctx.beginPath(); ctx.arc(mxp, hy, 13, 0, P * 2); ctx.lineWidth = 1.4; ctx.strokeStyle = a.rgba(.95, AC); ctx.stroke(); a.line(mxp, hy + 13, mxp, hy + 32, 1.2, .9, AC);
  a.num(String(Math.round(a.v.cpu || 0)).padStart(2, '0'), '', cx - 44, hy + 68, 54, .95); a.label('CPU', cx - 20, hy + 104, .5, 'center');
  a.line(cx, hy + 120, cx, cy + 380, 1, .22, CR);
  for (let i = 0; i < 4; i++) { const y = cy - 10 + i * 100, ld = cs[i] == null ? 0 : cs[i], len = 50 + ld * 1.4, lab = String(-(i + 1) * 5);
    for (const sd of [-1, 1]) { a.line(cx + sd * 40, y, cx + sd * (40 + len), y, 1.1, .75, CR); ctx.setLineDash([3, 4]); a.line(cx + sd * 40, y + 14, cx + sd * (40 + len), y + 14, 1, .35, CR); ctx.setLineDash([]); a.line(cx + sd * 40, y - 11, cx + sd * 40, y + 14, 1, .7, CR);
      a.text(lab, cx + sd * (54 + len + 10), y + 2, 17, .8, CR, sd < 0 ? 'right' : 'left', { font: a.F.SERIF }); }
    a.label('core ' + (i + 1) + ' · ' + Math.round(ld) + '%', cx + 40, y - 24, .4); }
  a.fillRect(cx - 6, cy - 40, 2, 24 + au.env * 60, .9, AC); a.fillRect(cx + 10, cy - 40, 2, 24 + au.env * 60, .4, CR);
  const tape = (x, val, lab, dir) => { a.line(x, cy - 130, x, cy + 350, 1, .35, CR); for (let v = 0; v <= 120; v += 10) { const y = cy + 340 - v * 3.8; a.line(x, y, x + dir * (v % 20 ? 7 : 14), y, 1, .55, CR); if (!(v % 20)) a.text(String(v), x + dir * 24, y, 10, .55, CR, dir > 0 ? 'left' : 'right'); }
    const my = cy + 340 - Math.max(0, Math.min(120, val || 0)) * 3.8; a.poly([[x, my], [x + dir * 14, my - 6], [x + dir * 14, my + 6]], 1, .95, AC, true, .9); a.label(lab, x + dir * 50, cy - 146, .5, 'center'); };
  tape(cx - 590, a.v.cpu, 'cpu', 1); tape(cx + 590, a.v.mem, 'mem', -1);
  a.label('taxi', cx - 330, cy - 286, .55); ctx.beginPath(); ctx.roundRect(cx - 332, cy - 274, 52, 18, 3); if (au.voice) { ctx.fillStyle = a.rgba(.95, AC); ctx.fill(); } else { ctx.lineWidth = 1; ctx.strokeStyle = a.rgba(.4, CR); ctx.stroke(); }
  a.text('ACT', cx - 306, cy - 265, 10, 1, au.voice ? [14, 12, 10] : CR, 'center', { weight: 600, sp: 2 });
  ps.slice(0, a.show('procs') ? 3 : 0).forEach((p, i) => { const x = cx - 120 + i * 190, y = cy - 200 - (i % 2) * 28; a.poly([[x - 12, y + 10], [x, y - 9], [x + 12, y + 10]], 1, .8, CR, true, .6); a.text('ID ' + String(p.pid || 0).slice(-4).padStart(4, '0'), x, y + 26, 9, .7, CR, 'center', { sp: 1 }); a.label(a.fmt.short(p.name.replace(/\.exe$/i, ''), 12), x, y + 40, .35, 'center'); });
  a.text('NET ↓ ' + a.fmt.rate((a.d.net || {}).down == null ? null : a.v.netD), cx + 560, cy + 290, 11, .65, CR, 'right', { sp: 1 });
  ctx.restore();
  W.clock(60, 56, { big: 54 }); a.stack(40, 690, 190, ['sys'], 16); a.stack(w - 230, 620, 190, ['disk', 'voice'], 20, { right: true });
} });

/* ================= 4. TARGET  (symmetric targeting reticle) ================= */
S.register({ id: 'target', name: 'Target',
bg(a) { const { ctx, w, cx, au } = a; a.backdrop({ c0: '#151413', c1: '#020202' }); const g = ctx.createLinearGradient(cx - 100, 0, cx + 100, 0); g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(.5, 'rgba(255,255,255,' + (.035 + au.env * .08) + ')'); g.addColorStop(1, 'rgba(255,255,255,0)'); ctx.fillStyle = g; ctx.fillRect(cx - 100, 0, 200, 900); },
draw(a) { const { ctx, w, cx, cy, T, au, col, W } = a, AC = col.a, CR = col.b, DM = col.c, e = au.env, cpu = (a.v.cpu || 0) / 100, JP = a.F.JP;
  a.text('ターゲット', cx, 146, 40, .9, CR, 'center', { font: JP, weight: 500, sp: 14 });
  a.rect(cx - 170, 196, 340, 26, 1, .4, CR); a.text(au.voice ? 'リスニング' : 'イニシャライズ', cx, 209, 13, .85, CR, 'center', { font: JP, sp: 8 });
  a.fillRect(cx - 170, 232, 340, 1, .2, CR); a.fillRect(cx - 170, 231, 340 * cpu, 2, .95, AC); a.label('cpu ' + a.fmt.pct((a.d.cpu || {}).load == null ? null : a.v.cpu), cx + 170, 250, .5, 'right');
  a.bracket(cx - 70, cy - 70, 140, 140, 24, 1.2, .8, CR); a.rect(cx - 9, cy - 9, 18, 18, 1, .8, AC); a.disc(cx, cy, 1.5 + e * 3, .95, AC);
  a.line(cx - 300, cy, cx - 96, cy, 1, .35, CR); a.line(cx + 96, cy, cx + 300, cy, 1, .35, CR); a.bracket(cx - 126, cy - 12, 24, 24, 6, 1, .7, CR); a.bracket(cx + 102, cy - 12, 24, 24, 6, 1, .7, CR);
  ctx.save(); ctx.globalCompositeOperation = 'lighter'; const L = 240 + e * 70;
  for (const s of [-1, 1]) { const y0 = cy + s * 130, y1 = cy + s * (130 + (s < 0 ? Math.min(L, 140) : L)); a.line(cx, y0, cx, y1, 1.5, .85, CR); a.line(cx, y0, cx, y1, 7, .07, AC); for (let i = 1; i < 6; i++) { const yy = y0 + (y1 - y0) * i / 6; a.line(cx - 5, yy, cx + 5, yy, 1, .45, CR); } } ctx.restore();
  for (const s of [-1, 1]) { const x = cx + s * 262, hh = 90 + au.bass * 120;
    a.line(x, cy - hh / 2, x, cy + hh / 2, 2, .9, CR); a.rect(x + s * 26 - 8, cy - 8, 16, 16, 1, .5, CR); a.line(x + s * 50, cy - 26 - au.mid * 70, x + s * 50, cy + 26 + au.mid * 70, 1, .6, AC);
    for (let i = 0; i < 3; i++) a.line(x + s * (76 + i * 12), cy - 18 - au.treb * 50, x + s * (76 + i * 12), cy + 18 + au.treb * 50, 1, .2 + i * .15, CR);
    a.poly([[cx + s * 215, cy - 135], [cx + s * 345, cy - 135], [cx + s * 470, cy - 300]], 1, .6, CR); a.poly([[cx + s * 215, cy + 135], [cx + s * 345, cy + 135], [cx + s * 470, cy + 300]], 1, .6, CR);
    a.line(cx + s * 480, cy - 312, cx + s * 560, cy - 312, 1.5, .8, CR); a.line(cx + s * 480, cy + 312, cx + s * 560, cy + 312, 1.5, .8, CR);
    for (let r = 0; r < 9; r++) for (let c = 0; c < 10; c++) a.disc(cx + s * (400 + c * 12), cy - 60 + r * 14, 1.2, .1 + au.spec[(r * 10 + c) % 128] * .8, au.spec[(r * 10 + c) % 128] > .5 ? AC : CR); }
  a.rect(cx - 66, cy + 104, 132, 18, 1, .35, CR); a.text(au.voice ? 'DETECTING VOICE' : 'STANDBY', cx, cy + 113, 8, .8, au.voice ? AC : CR, 'center', { sp: 2 });
  a.ticks(cx, cy, 96, 60, 4, T * .03, 1, .25, CR, 5);
  a.stack(40, 130, 190, ['cpu', 'mem', 'gpu', 'procs'], 22); a.stack(w - 230, 130, 190, ['net', 'disk', 'sys'], 22, { right: true }); W.batt(40, 838, 190); W.greet(w - 40, 820, { right: true });
} });
})();
