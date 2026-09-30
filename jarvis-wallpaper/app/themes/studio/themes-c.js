/* Themes 9-10: Radar, Console */
(() => {
const S = window.Studio, P = Math.PI, TAU = P * 2;

/* ================= 9. RADAR  (top processes as blips) ================= */
let ripples = [], lastRip = 0;
S.register({ id: 'radar', name: 'Radar', palette: { a: [112, 255, 206], b: [70, 190, 235] },
bg(a) { const { ctx, w, au } = a; let g = ctx.createRadialGradient(a.cx, 450, 0, a.cx, 450, w * .6); g.addColorStop(0, '#0a2228'); g.addColorStop(1, '#03090c'); ctx.fillStyle = g; ctx.fillRect(0, 0, w, 900); a.grid(45, .035, a.col.b); a.glow(a.cx, 450, 420, .1 + au.env * .2, [60, 255, 200]); },
draw(a) { const { ctx, w, cx, cy, T, au, col, W } = a, A = col.a, B = col.b, R = 340, e = au.env, now = performance.now(), ps = a.d.procs || [];
  const ang = (T * .9) % TAU;
  for (let i = 1; i <= 4; i++) a.ring(cx, cy, R * i / 4, 1, i === 4 ? .8 : .3, A); a.line(cx - R, cy, cx + R, cy, 1, .3, A); a.line(cx, cy - R, cx, cy + R, 1, .3, A);
  a.line(cx - R * .7, cy - R * .7, cx + R * .7, cy + R * .7, 1, .15, A); a.line(cx - R * .7, cy + R * .7, cx + R * .7, cy - R * .7, 1, .15, A);
  a.ticks(cx, cy, R, 180, 6, -P / 2, 1, .6, A, 5); a.ticks(cx, cy, R + 4, 12, 16, -P / 2, 2, .9, A, 1);
  for (let k = 0; k < 12; k++) { const an = k * P / 6 - P / 2, r = R + 36; a.text(String(k * 30).padStart(3, '0'), cx + Math.cos(an) * r, cy + Math.sin(an) * r, 10, .7, B, 'center'); }
  ctx.save(); ctx.globalCompositeOperation = 'lighter'; if (ctx.createConicGradient) { const g = ctx.createConicGradient(ang - P / 2 - 1.2, cx, cy); g.addColorStop(0, 'rgba(112,255,206,0)'); g.addColorStop(.19, 'rgba(112,255,206,.32)'); g.addColorStop(.2, 'rgba(112,255,206,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, R, 0, TAU); ctx.fill(); } ctx.restore();
  a.line(cx, cy, cx + Math.cos(ang - P / 2) * R, cy + Math.sin(ang - P / 2) * R, 2, .95, A);
  if (au.voice && now - lastRip > 380) { ripples.push(0); lastRip = now; } ripples = ripples.map(r => r + a.dt * .0006).filter(r => r < 1);
  ripples.forEach(r => a.ring(cx, cy, R * r, 2, (1 - r) * .7, [255, 255, 255], true));
  if (a.show('procs')) ps.slice(0, 8).forEach((p, i) => { const h = ((p.pid || i * 97) * 2654435761 >>> 0) % 3600 / 3600 * TAU, r = R * (.2 + .72 * (1 - Math.min(1, p.cpu / 40))), x = cx + Math.cos(h - P / 2) * r, y = cy + Math.sin(h - P / 2) * r;
    let df = ((ang - h) % TAU + TAU) % TAU; const hit = Math.exp(-df * 3); a.disc(x, y, 4 + hit * 4, .35 + hit * .65, A); a.ring(x, y, 9 + hit * 10, 1, .2 + hit * .6, A);
    a.text(a.fmt.short(p.name.replace(/\.exe$/i, ''), 12).toUpperCase(), x + 14, y - 4, 10, .5 + hit * .5, A); a.text(p.cpu.toFixed(1) + '%', x + 14, y + 9, 9, .4 + hit * .5, B); });
  a.radial(cx, cy, 14, 34, 64, 0, 2, .9, [255, 255, 255], true); a.disc(cx, cy, 4, 1, A);
  a.text(au.voice ? 'VOICE LOCK' : 'SCANNING', cx, cy + R + 66, 12, .9, A, 'center', { sp: 6 }); a.text('PROCESS RADAR // TOP ' + Math.min(8, ps.length), cx, cy + R + 86, 9, .5, B, 'center', { sp: 3 });
  W.clock(50, 50, { big: 46 }); a.stack(50, 200, 230, ['cpu', 'mem', 'gpu'], 16); a.stack(50, 640, 230, ['batt'], 10);
  a.stack(w - 280, 120, 230, ['net', 'disk', 'sys'], 16, { right: true }); W.voice(w - 280, 600, 230, { right: true });
} });

/* ================= 10. CONSOLE  (dense multi-panel dashboard) ================= */
S.register({ id: 'console', name: 'Console', palette: { a: [120, 224, 255], b: [86, 150, 205] },
bg(a) { const { ctx, w } = a; ctx.fillStyle = '#05090f'; ctx.fillRect(0, 0, w, 900); a.grid(30, .04, a.col.b); a.glow(w * .5, 140, 600, .12, [60, 140, 255]); },
draw(a) { const { ctx, w, T, au, col, W, hist } = a, A = col.a, B = col.b, d = a.d, fm = a.fmt, cs = (d.cpu || {}).cores || [];
  const gx = 40, cw = 340, mx = gx + cw + 24, mw = w - 2 * (gx + cw + 24), rx = w - gx - cw;
  a.text('JARVIS // SYSTEM CONSOLE', gx, 34, 13, .95, A, 'left', { sp: 4, weight: 700 }); a.text(fm.short((d.sys || {}).host, 16).toUpperCase() + '  ·  ' + fm.clock() + ':' + fm.secs() + '  ·  ' + fm.date().toUpperCase(), w - gx, 34, 10, .6, B, 'right', { sp: 2 });
  a.line(gx, 52, w - gx, 52, 1, .4, A); ctx.fillStyle = A; a.fillRect(gx, 50, 60, 4, .95, A);
  const panel = (x, y, ww, hh, t) => { a.bracket(x, y, ww, hh, 10, 1, .55, A); a.text(t, x + 12, y + 14, 10, .85, A, 'left', { sp: 3, weight: 600 }); };
  const big = (x, y, ww, hh, title, arr, max, unit, c, cur) => { panel(x, y, ww, hh, title); a.text(cur, x + ww - 14, y + 14, 12, .95, A, 'right');
    const gx0 = x + 14, gy = y + 32, gw = ww - 28, gh = hh - 52; for (let i = 0; i <= 4; i++) { a.line(gx0, gy + gh * i / 4, gx0 + gw, gy + gh * i / 4, 1, .1, B); a.text(unit(max * (1 - i / 4)), gx0 + gw + 0, gy + gh * i / 4 - 6, 8, .35, B, 'right'); }
    a.spark(gx0, gy, gw - 30, gh, arr, max, 1.6, .95, c, .14); a.text('-90s', gx0, y + hh - 10, 8, .4, B); a.text('now', gx0 + gw - 30, y + hh - 10, 8, .4, B, 'right'); };
  const cpuOn = a.show('cpu'), memOn = a.show('mem'), netOn = a.show('net'); let y = 70;
  if (cpuOn) { big(mx, y, mw, 190, 'CPU UTILISATION', hist.cpu, 100, v => Math.round(v) + '%', A, fm.pct(d.cpu && d.cpu.load == null ? null : a.v.cpu)); y += 206; }
  if (memOn) { big(mx, y, mw, 170, 'MEMORY', hist.mem, 100, v => Math.round(v) + '%', B, d.mem ? fm.gb(d.mem.used) + ' / ' + fm.gb(d.mem.total) : '--'); y += 186; }
  if (netOn) { const m = Math.max(1e5, ...hist.netD, ...hist.netU); big(mx, y, mw, 190, 'NETWORK  ▼ DOWN  ▲ UP', hist.netD, m, v => fm.rate(v), A, '▼ ' + fm.rate(d.net && d.net.down == null ? null : a.v.netD) + '   ▲ ' + fm.rate(d.net && d.net.up == null ? null : a.v.netU));
    a.spark(mx + 14, y + 32, mw - 58, 138, hist.netU, m, 1.3, .8, [255, 200, 120]); y += 206; }
  let ly = 70; if (cpuOn) { panel(gx, ly, cw, 34 + cs.length * 17, 'CORES  ' + cs.length); cs.forEach((c, i) => { const yy = ly + 40 + i * 17; a.text('C' + String(i).padStart(2, '0'), gx + 14, yy + 6, 9, .6, B); a.bar(gx + 46, yy + 2, cw - 130, 8, c / 100, .85, A, 30); a.text(Math.round(c) + '%', gx + cw - 14, yy + 6, 9, .85, A, 'right'); }); ly += 34 + cs.length * 17 + 14; }
  ly = a.stack(gx, ly + 4, cw, ['mem', 'gpu', 'batt'], 12);
  let ry = 70; ry = a.stack(rx, ry + 4, cw, ['procs', 'disk', 'sys'], 14, { max: 8 });
  if (a.show('voice')) { const vy = 700; panel(gx, vy, w - 2 * gx, 160, 'VOICE INPUT  ' + (au.live ? '● LIVE' : '○ OFF') + (au.voice ? '  · SPEAKING' : ''));
    a.spectrum(gx + 14, vy + 146, w - 2 * gx - 28 - 360, 96, 120, .8, A, -1, 4); a.wave(gx + 14, vy + 100, w - 2 * gx - 28 - 360, 50, 1.5, .9, [255, 255, 255]);
    (a.vlog.slice(-6)).forEach((l, i) => a.text('> ' + fm.short(l.text, 40), w - gx - 14, vy + 40 + i * 18, 10, l.status === 'ok' ? .95 : .5, l.status === 'ok' ? A : B, 'right')); }
  ctx.fillStyle = 'rgba(0,0,0,.12)'; for (let yy = 0; yy < 900; yy += 3) ctx.fillRect(0, yy, w, 1);
} });
})();
