/* Themes 1-4: Sector, Blueprint, Cockpit, Target */
(() => {
const S = window.Studio, P = Math.PI;

/* ================= 1. SECTOR  (blue HUD elements) ================= */
S.register({ id: 'sector', name: 'Sector', palette: { a: [246, 251, 255], b: [130, 190, 255] },
bg(a) { const { ctx, w, au } = a; let g = ctx.createLinearGradient(0, 0, 0, 900); g.addColorStop(0, '#12397a'); g.addColorStop(1, '#061633'); ctx.fillStyle = g; ctx.fillRect(0, 0, w, 900);
  for (const x of [0, w]) { g = ctx.createRadialGradient(x, 450, 0, x, 450, w * .3); g.addColorStop(0, 'rgba(130,195,255,.5)'); g.addColorStop(1, 'rgba(130,195,255,0)'); ctx.fillStyle = g; ctx.fillRect(0, 0, w, 900); }
  a.glow(a.cx, 450, 430, .22 + au.env * .35, [70, 150, 255]); },
draw(a) { const { ctx, w, cx, cy, T, au, col, W } = a, A = col.a, B = col.b, e = au.env;
  a.ring(cx, cy, 108, 1, .55, B); a.ring(cx, cy, 152, 1, .3, B); a.ticks(cx, cy, 158, 144, 5, T * .02, 1, .4, B, 12);
  for (let k = 0; k < 4; k++) { const an = P / 4 + k * P / 2, c = Math.cos(an), s = Math.sin(an); a.line(cx + c * 172, cy + s * 172, cx + c * 470, cy + s * 470, 1, .35, B); a.fillRect(cx + c * 470 - 3, cy + s * 470 - 3, 6, 6, .8, A); }
  a.arc(cx, cy, 292 + e * 16, P * 1.13, P * 1.87, 14, .95, A, true); a.arc(cx, cy, 292 + e * 16, P * .13, P * .87, 14, .95, A, true);
  a.arc(cx, cy, 322, P * 1.2, P * 1.8, 3, .6, A); a.arc(cx, cy, 322, P * .2, P * .8, 3, .6, A);
  a.arc(cx, cy, 560, P * .83, P * 1.17, 22, .95, A, true); a.arc(cx, cy, 560, -P * .17, P * .17, 22, .95, A, true);
  a.arc(cx, cy, 596, P * .86, P * 1.14, 3, .55, A); a.arc(cx, cy, 596, -P * .14, P * .14, 3, .55, A);
  a.arc(cx, cy, 82 + e * 10, P * 1.15, P * 1.85, 8, .95, A, true); a.arc(cx, cy, 82 + e * 10, P * .15, P * .85, 8, .95, A, true);
  a.line(cx - 34, cy, cx + 34, cy, 1, .7, A); a.line(cx, cy - 34, cx, cy + 34, 1, .7, A); a.disc(cx, cy, 3 + e * 5, .95, A);
  a.radial(cx, cy, 190, 54, 96, T * .05, 2, .85, B, true);
  a.rect(cx - 250, cy - 11, 92, 22, 1, .7, A); a.text('SIGNAL-IN', cx - 246, cy, 9, .9, A, 'left', { sp: 1 }); a.text('▼ ' + a.fmt.rate((a.d.net || {}).down == null ? null : a.v.netD), cx - 250, cy + 22, 9, .7, B);
  a.rect(cx + 158, cy - 11, 98, 22, 1, .7, A); a.text('SIGNAL-OUT', cx + 162, cy, 9, .9, A, 'left', { sp: 1 }); a.text('▲ ' + a.fmt.rate((a.d.net || {}).up == null ? null : a.v.netU), cx + 158, cy + 22, 9, .7, B);
  const lx = cx - 492, rx = cx + 300;
  a.text('OBJECT-01', lx, cy - 215, 10, .9, A, 'left', { sp: 2 }); a.stack(lx, cy - 195, 192, ['cpu', 'mem', 'disk'], 16);
  a.text('OBJECT-02', rx + 192, cy - 215, 10, .9, A, 'right', { sp: 2 }); a.stack(rx, cy - 195, 192, ['net', 'procs', 'gpu'], 16, { right: true });
  for (let i = 0; i < 16; i++) a.fillRect(56 + (i % 4) * 9, 52 + Math.floor(i / 4) * 9, 5, 5, .4 + .6 * a.au.spec[i * 6], A);
  a.text('JARVIS', 104, 60, 22, .95, A, 'left', { weight: 700, font: a.F.SANS, sp: 2 }); a.text('HUD ELEMENTS', 104, 82, 9, .6, B, 'left', { sp: 3 });
  a.text('VOICE', w - 290, 50, 10, .9, A, 'left', { sp: 2 }); a.text(au.voice ? '[ LIVE ]' : '[ IDLE ]', w - 60, 50, 10, .8, B, 'right');
  a.rect(w - 290, 62, 230, 10, 1, .7, A); a.fillRect(w - 288, 64, 226 * e, 6, .95, A); a.text('SECTOR-' + ((a.d.sys || {}).host || '00').slice(0, 10).toUpperCase(), w - 60, 92, 10, .6, B, 'right', { sp: 2 });
  W.clock(60, 770, { big: 44 }); W.voice(w - 290, 760, 230, { right: true });
} });

/* ================= 2. BLUEPRINT  (wireframe on blue glow) ================= */
S.register({ id: 'blueprint', name: 'Blueprint', palette: { a: [236, 244, 255], b: [90, 150, 255] },
bg(a) { const { ctx, w, au } = a; ctx.fillStyle = '#04060c'; ctx.fillRect(0, 0, w, 900);
  a.glow(0, 900, 760, .7 + au.env * .2, [40, 100, 230]); a.glow(w * .22, 900, 520, .45, [110, 160, 235]); a.grid(66, .07, a.col.b, 10, 14); },
draw(a) { const { ctx, w, T, au, col, W } = a, A = col.a, B = col.b, e = au.env, ox = w * .64, oy = 470, yaw = T * .28 + a.mx * .8, pit = .42 + a.my * .3;
  const R0 = 215, pr = (x, y, z) => a.proj(x, y, z, yaw, pit, 900, ox, oy);
  const draw = (pts, al) => { for (let i = 1; i < pts.length; i++) { const p = pts[i - 1], q = pts[i], d = (p[2] + q[2]) / 2 / R0; ctx.beginPath(); ctx.moveTo(p[0], p[1]); ctx.lineTo(q[0], q[1]); ctx.strokeStyle = a.rgba(Math.max(.08, al * (.6 - d * .5)), A); ctx.lineWidth = 1; ctx.stroke(); } };
  const disp = (lon) => 1 + au.spec[Math.floor(((lon / (2 * P)) % 1 + 1) % 1 * 127)] * .28;
  for (let i = 1; i < 12; i++) { const lat = -P / 2 + i * P / 12, pts = []; for (let j = 0; j <= 56; j++) { const lon = j / 56 * 2 * P, r = R0 * disp(lon); pts.push(pr(r * Math.cos(lat) * Math.cos(lon), r * Math.sin(lat), r * Math.cos(lat) * Math.sin(lon))); } draw(pts, .9); }
  for (let i = 0; i < 18; i++) { const lon = i / 18 * 2 * P, pts = []; for (let j = 0; j <= 28; j++) { const lat = -P / 2 + j / 28 * P, r = R0 * disp(lon); pts.push(pr(r * Math.cos(lat) * Math.cos(lon), r * Math.sin(lat), r * Math.cos(lat) * Math.sin(lon))); } draw(pts, .9); }
  for (let j = 0; j < 4; j++) { const pts = []; for (let k = 0; k <= 90; k++) { const t0 = k / 90 * 2 * P; pts.push(pr(356 * Math.cos(t0), (j - 1.5) * 16, 356 * Math.sin(t0))); } draw(pts, .4); }
  const lab = (txt, val, tx, ty, px, py) => { a.line(px, py, tx, ty, 1, .5, B); a.disc(px, py, 3, .9, A); a.line(tx, ty, tx + 150, ty, 1, .5, B); a.text(txt, tx + 4, ty - 12, 9, .6, B, 'left', { sp: 2 }); a.text(val, tx + 4, ty + 12, 15, .95, A, 'left', { font: a.F.SANS }); };
  const cp = pr(0, -R0, 0), mp = pr(R0, 0, 0);
  if (a.show('cpu')) lab('CPU LOAD', a.fmt.pct((a.d.cpu || {}).load == null ? null : a.v.cpu), ox + 250, 170, cp[0], cp[1]);
  if (a.show('mem')) lab('MEMORY', a.fmt.pct((a.d.mem || {}).pct == null ? null : a.v.mem), ox + 300, 330, mp[0] + 40, mp[1] - 40);
  if (a.show('net')) lab('NET ▼', a.fmt.rate((a.d.net || {}).down == null ? null : a.v.netD), ox - 420, 720, pr(-R0 * .7, R0 * .7, 0)[0], pr(-R0 * .7, R0 * .7, 0)[1]);
  a.text('Your system,', 80, 130, 50, .96, A, 'left', { font: a.F.SANS, weight: 400 }); a.text('in real time.', 80, 188, 50, .96, A, 'left', { font: a.F.SANS, weight: 400 });
  ctx.beginPath(); ctx.roundRect(80, 236, 190, 40, 20); ctx.fillStyle = au.voice ? 'rgb(60,130,255)' : 'rgb(37,99,235)'; ctx.fill();
  a.text(au.voice ? '● LISTENING' : 'SAY “JARVIS”', 175, 256, 12, .98, [255, 255, 255], 'center', { sp: 2 });
  a.stack(80, 320, 250, ['cpu', 'mem', 'net', 'sys'], 16); W.voice(w - 330, 690, 250, { right: true });
  a.text('JARVIS', w - 80, 860, 20, .9, A, 'right', { font: a.F.SANS, weight: 600, sp: 3 });
} });

/* ================= 3. COCKPIT  (tilted glass, pitch ladder) ================= */
S.register({ id: 'cockpit', name: 'Cockpit', palette: { a: [238, 234, 224], b: [168, 164, 154] },
bg(a) { const { ctx, w, au, T } = a; let g = ctx.createLinearGradient(0, 0, w, 900); g.addColorStop(0, '#1b1b1c'); g.addColorStop(1, '#060606'); ctx.fillStyle = g; ctx.fillRect(0, 0, w, 900);
  a.glow(w * .68, 250, 300, .14 + au.env * .16, [200, 195, 180]);
  for (let i = 0; i < 9; i++) { const x = (i * 197 + T * (6 + i)) % (w + 200) - 100, y = 140 + (i * 113) % 640; a.glow(x, y, 40 + (i % 4) * 28, .05 + (i % 3) * .02 + au.bass * .05, [220, 215, 200]); } },
draw(a) { const { ctx, w, cx, cy, T, au, col, W } = a, A = col.a, B = col.b, e = au.env, cs = (a.d.cpu || {}).cores || [], ps = a.d.procs || [];
  ctx.save(); ctx.translate(cx, cy + 20); ctx.rotate(-.05 + a.mx * .03); ctx.scale(.9, .9); ctx.transform(1, -.05 + a.my * .04, -.12, 1, 0, 0); ctx.translate(-cx, -cy);
  ctx.beginPath(); ctx.moveTo(cx - 640, cy - 250); ctx.lineTo(cx + 640, cy - 250); ctx.lineTo(cx + 640, cy + 380); ctx.lineTo(cx - 640, cy + 380); ctx.closePath(); ctx.fillStyle = a.rgba(.035, A); ctx.fill();
  a.line(cx - 640, cy - 250, cx + 640, cy - 250, 1.5, .55, A); a.line(cx + 640, cy - 250, cx + 640, cy + 380, 1, .3, A);
  const hy = cy - 150, mxp = cx + Math.max(-150, Math.min(150, (au.bass - au.treb) * 300 + au.wave[8] * 120));
  a.line(cx - 640, hy, cx + 640, hy, 2, .9, A);
  for (let i = -6; i <= 6; i++) { if (!i) continue; const x = cx + i * 95 + (i > 0 ? -20 : 20); a.poly([[x - 8 * Math.sign(-i), hy - 9], [x + 8 * Math.sign(-i), hy], [x - 8 * Math.sign(-i), hy + 9]], 1.2, .8, A); }
  ctx.beginPath(); ctx.arc(mxp, hy, 14, 0, P * 2); ctx.lineWidth = 2; ctx.strokeStyle = a.rgba(.95, A); ctx.stroke(); a.line(mxp, hy + 14, mxp, hy + 34, 1.5, .9, A); a.poly([[mxp - 7, hy + 24], [mxp, hy + 36], [mxp + 7, hy + 24]], 1.5, .9, A);
  a.text(String(Math.round(a.v.cpu || 0)).padStart(2, '0'), cx - 20, hy + 64, 56, .95, A, 'center', { weight: 600, sp: 4 });
  a.text('CPU', cx - 20, hy + 104, 10, .5, B, 'center', { sp: 4 });
  a.line(cx, hy + 120, cx, cy + 380, 1, .35, A);
  for (let i = 0; i < 4; i++) { const y = cy - 10 + i * 100, ld = cs[i] == null ? 0 : cs[i], len = 50 + ld * 1.4, lab = String(-(i + 1) * 5);
    a.line(cx - 40, y, cx - 40 - len, y, 1.3, .8, A); ctx.setLineDash([3, 4]); a.line(cx - 40, y + 14, cx - 40 - len, y + 14, 1, .5, A); ctx.setLineDash([]); a.line(cx - 40, y - 12, cx - 40, y + 14, 1.2, .8, A);
    a.text(lab, cx - 50 - len - 14, y + 2, 20, .85, A, 'right', { weight: 500 });
    a.line(cx + 40, y, cx + 40 + len, y, 1.3, .8, A); ctx.setLineDash([3, 4]); a.line(cx + 40, y + 14, cx + 40 + len, y + 14, 1, .5, A); ctx.setLineDash([]); a.line(cx + 40, y - 12, cx + 40, y + 14, 1.2, .8, A);
    a.text(lab, cx + 50 + len + 14, y + 2, 20, .85, A, 'left', { weight: 500 });
    a.text('C' + (i + 1) + ' ' + Math.round(ld) + '%', cx + 40, y - 26, 9, .5, B); }
  a.fillRect(cx - 6, cy - 40, 3, 26 + au.env * 60, .95, A); a.fillRect(cx + 10, cy - 40, 3, 26 + au.env * 60, .5, A);
  const tape = (x, val, lab, dir) => { a.line(x, cy - 130, x, cy + 350, 1, .5, A); for (let v = 0; v <= 120; v += 10) { const y = cy + 340 - v * 3.8; a.line(x, y, x + dir * (v % 20 ? 8 : 16), y, 1, .7, A); if (!(v % 20)) a.text(String(v), x + dir * 26, y, 11, .7, A, dir > 0 ? 'left' : 'right'); }
    const my = cy + 340 - Math.max(0, Math.min(120, val || 0)) * 3.8; a.poly([[x, my], [x + dir * 16, my - 7], [x + dir * 16, my + 7]], 1.5, .95, A, true, .9); a.text(lab, x + dir * 60, cy - 146, 10, .6, B, 'center', { sp: 2 }); };
  tape(cx - 590, a.v.cpu, 'CPU', 1); tape(cx + 590, a.v.mem, 'MEM', -1);
  a.text('TAXI', cx - 330, cy - 286, 11, .7, B, 'left', { sp: 3 });
  ctx.beginPath(); ctx.roundRect(cx - 332, cy - 274, 56, 20, 4); if (au.voice) { ctx.fillStyle = a.rgba(.95, A); ctx.fill(); } else { ctx.lineWidth = 1; ctx.strokeStyle = a.rgba(.5, A); ctx.stroke(); }
  a.text('ACT', cx - 304, cy - 264, 11, 1, au.voice ? [10, 10, 10] : A, 'center', { weight: 700, sp: 2 });
  ps.slice(0, 3).forEach((p, i) => { const x = cx - 120 + i * 190, y = cy - 200 - (i % 2) * 28; a.poly([[x - 14, y + 12], [x, y - 10], [x + 14, y + 12]], 1, .9, A, true, .75); a.text('ID ' + String(p.pid || 0).slice(-4).padStart(4, '0'), x, y + 28, 10, .8, A, 'center', { sp: 1 }); a.text(a.fmt.short(p.name.replace(/\.exe$/i, ''), 12).toUpperCase(), x, y + 42, 8, .45, B, 'center'); });
  a.text('NET ▼ ' + a.fmt.rate((a.d.net || {}).down == null ? null : a.v.netD), cx + 560, cy + 290, 12, .7, A, 'right', { sp: 1 }); a.text('ONH --' + String(Math.round(a.v.mem || 0)).padStart(2, '0'), cx + 560, cy + 312, 10, .5, B, 'right');
  ctx.restore();
  W.clock(60, 56, { big: 46 }); a.stack(40, 700, 200, ['sys'], 12); a.stack(w - 240, 620, 200, ['disk', 'voice'], 14, { right: true });
} });

/* ================= 4. TARGET  (symmetric targeting reticle) ================= */
S.register({ id: 'target', name: 'Target', palette: { a: [244, 244, 244], b: [150, 150, 150] },
bg(a) { const { ctx, w, cx, au } = a; ctx.fillStyle = '#020202'; ctx.fillRect(0, 0, w, 900);
  const g = ctx.createLinearGradient(cx - 120, 0, cx + 120, 0); g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(.5, 'rgba(255,255,255,' + (.05 + au.env * .1) + ')'); g.addColorStop(1, 'rgba(255,255,255,0)'); ctx.fillStyle = g; ctx.fillRect(cx - 120, 0, 240, 900);
  a.glow(cx, 450, 380, .1 + au.env * .12, [255, 255, 255]); },
draw(a) { const { ctx, w, cx, cy, T, au, col, W } = a, A = col.a, B = col.b, e = au.env, cpu = (a.v.cpu || 0) / 100, JP = a.F.JP;
  a.text('ターゲット', cx, 150, 54, .92, A, 'center', { font: JP, weight: 700, sp: 14 });
  a.rect(cx - 190, 206, 380, 28, 1, .7, A); a.text(au.voice ? 'リスニング' : 'イニシャライズ', cx, 221, 15, .9, A, 'center', { font: JP, sp: 8 });
  a.fillRect(cx - 190, 244, 380, 4, .15, A); a.fillRect(cx - 190, 244, 380 * cpu, 4, .95, A); a.text('CPU ' + a.fmt.pct((a.d.cpu || {}).load == null ? null : a.v.cpu), cx + 190, 262, 9, .6, B, 'right', { sp: 2 });
  a.fillRect(cx - 190, 244, 3, 14, .9, A); a.fillRect(cx + 187, 244, 3, 14, .9, A);
  a.bracket(cx - 74, cy - 74, 148, 148, 26, 1.5, .9, A); a.rect(cx - 10, cy - 10, 20, 20, 1, .9, A); a.disc(cx, cy, 2 + e * 4, .95, A);
  a.line(cx - 300, cy, cx - 100, cy, 1, .5, A); a.line(cx + 100, cy, cx + 300, cy, 1, .5, A); a.bracket(cx - 130, cy - 14, 28, 28, 7, 1, .8, A); a.bracket(cx + 102, cy - 14, 28, 28, 7, 1, .8, A);
  ctx.save(); ctx.globalCompositeOperation = 'lighter'; const L = 250 + e * 70;
  for (const s of [-1, 1]) { const y0 = cy + s * 130, y1 = cy + s * (130 + (s < 0 ? Math.min(L, 140) : L)); a.line(cx, y0, cx, y1, 3, .9, A); a.line(cx, y0, cx, y1, 12, .12, A); for (let i = 1; i < 6; i++) { const yy = y0 + (y1 - y0) * i / 6; a.line(cx - 6, yy, cx + 6, yy, 1, .6, A); } } ctx.restore();
  for (const s of [-1, 1]) { const x = cx + s * 262, hh = 100 + au.bass * 140;
    a.fillRect(x - 6, cy - hh / 2, 12, hh, .95, A); a.rect(x + s * 26 - 9, cy - 9, 18, 18, 1, .7, A); a.fillRect(x + s * 50 - 2, cy - 30 - au.mid * 80, 4, 60 + au.mid * 160, .7, A);
    for (let i = 0; i < 3; i++) a.fillRect(x + s * (80 + i * 14) - 1.5, cy - 20 - au.treb * 60, 3, 40 + au.treb * 120, .3 + i * .15, A);
    a.poly([[cx + s * 215, cy - 135], [cx + s * 345, cy - 135], [cx + s * 470, cy - 300]], 2, .85, A); a.poly([[cx + s * 215, cy + 135], [cx + s * 345, cy + 135], [cx + s * 470, cy + 300]], 2, .85, A);
    a.line(cx + s * 480, cy - 312, cx + s * 560, cy - 312, 2, .9, A); a.line(cx + s * 480, cy + 312, cx + s * 560, cy + 312, 2, .9, A);
    for (let r = 0; r < 9; r++) for (let c = 0; c < 10; c++) a.disc(cx + s * (400 + c * 12), cy - 60 + r * 14, 1.6, .12 + au.spec[(r * 10 + c) % 128] * .85, A); }
  a.rect(cx - 70, cy + 104, 140, 18, 1, .6, A); a.text(au.voice ? 'DETECTING VOICE' : 'STANDBY', cx, cy + 113, 9, .85, A, 'center', { sp: 2 });
  a.text('FILE ' + String(Math.round(T) % 1000).padStart(3, '0'), cx, cy - 104, 9, .5, B, 'center', { sp: 3 });
  a.ticks(cx, cy, 98, 60, 4, T * .03, 1, .35, B, 5);
  a.stack(30, 130, 225, ['cpu', 'mem', 'gpu', 'procs'], 16); a.stack(w - 255, 130, 225, ['net', 'disk', 'sys'], 16, { right: true }); W.batt(30, 830, 200);
} });
})();
