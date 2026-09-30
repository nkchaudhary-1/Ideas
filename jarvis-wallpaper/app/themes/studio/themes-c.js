/* Themes 9-10: Radar, Console */
(() => {
const S = window.Studio, P = Math.PI, TAU = P * 2;

/* ================= 9. RADAR  (top processes as blips) ================= */
let ripples = [], lastRip = 0;
S.register({ id: 'radar', name: 'Radar',
bg(a) { a.backdrop(); a.grid(45, .025, a.col.b); },
draw(a) { const { ctx, w, cx, T, au, col, W } = a, cy = 450, AC = col.a, CR = col.b, DM = col.c, R = 330, e = au.env, now = performance.now(), ps = a.d.procs || [], ang = (T * .8) % TAU;
  for (let i = 1; i <= 4; i++) a.ring(cx, cy, R * i / 4, 1, i === 4 ? .5 : .14, CR); a.line(cx - R, cy, cx + R, cy, 1, .15, CR); a.line(cx, cy - R, cx, cy + R, 1, .15, CR);
  a.line(cx - R * .7, cy - R * .7, cx + R * .7, cy + R * .7, 1, .07, CR); a.line(cx - R * .7, cy + R * .7, cx + R * .7, cy - R * .7, 1, .07, CR);
  a.ticks(cx, cy, R, 180, 5, -P / 2, 1, .35, CR, 5); a.ticks(cx, cy, R + 3, 12, 14, -P / 2, 1.2, .7, AC, 1);
  for (let k = 0; k < 12; k++) { const an = k * P / 6 - P / 2, r = R + 34; a.text(String(k * 30).padStart(3, '0'), cx + Math.cos(an) * r, cy + Math.sin(an) * r, 9, .6, DM, 'center'); }
  ctx.save(); if (ctx.createConicGradient) { const g = ctx.createConicGradient(ang - P / 2 - 1.2, cx, cy); g.addColorStop(0, a.rgba(0)); g.addColorStop(.19, a.rgba(.22, AC)); g.addColorStop(.2, a.rgba(0)); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, R, 0, TAU); ctx.fill(); } ctx.restore();
  a.line(cx, cy, cx + Math.cos(ang - P / 2) * R, cy + Math.sin(ang - P / 2) * R, 1.4, .9, AC);
  if (au.voice && now - lastRip > 380) { ripples.push(0); lastRip = now; } ripples = ripples.map(r => r + a.dt * .0006).filter(r => r < 1); ripples.forEach(r => a.ring(cx, cy, R * r, 1.2, (1 - r) * .55, CR, true));
  if (a.show('procs')) ps.slice(0, 8).forEach((p, i) => { const h = ((p.pid || i * 97) * 2654435761 >>> 0) % 3600 / 3600 * TAU, r = R * (.2 + .72 * (1 - Math.min(1, p.cpu / 40))), x = cx + Math.cos(h - P / 2) * r, y = cy + Math.sin(h - P / 2) * r;
    const df = ((ang - h) % TAU + TAU) % TAU, hit = Math.exp(-df * 3); a.disc(x, y, 2.5 + hit * 3, .4 + hit * .6, AC); a.ring(x, y, 8 + hit * 9, 1, .15 + hit * .5, AC);
    a.text(a.fmt.short(p.name.replace(/\.exe$/i, ''), 12).toUpperCase(), x + 14, y - 4, 9, .55 + hit * .45, CR); a.text(p.cpu.toFixed(1) + '%', x + 14, y + 9, 8, .4 + hit * .5, DM); });
  a.radial(cx, cy, 10, 26, 64, 0, 1.3, .8, CR); a.disc(cx, cy, 3, 1, AC);
  a.label(au.voice ? 'Voice lock' : 'Scanning', cx, cy + R + 62, .9, 'center', au.voice ? AC : CR); a.label('process radar · top ' + Math.min(8, ps.length), cx, cy + R + 80, .5, 'center');
  W.clock(50, 50, { big: 56 }); a.stack(50, 230, 232, ['cpu', 'mem', 'gpu'], 26); W.batt(50, 680, 232);
  a.stack(w - 282, 92, 232, ['net', 'disk', 'sys'], 26, { right: true }); W.voice(w - 282, 620, 232, { right: true }); W.greet(50, 820);
} });

/* ================= 10. CONSOLE  (dense multi-panel dashboard) ================= */
S.register({ id: 'console', name: 'Console',
bg(a) { a.backdrop(); a.grid(30, .03, a.col.b); a.glow(a.cx, 140, 560, .08, a.col.a); },
draw(a) { const { ctx, w, T, au, col, W, hist } = a, AC = col.a, CR = col.b, DM = col.c, d = a.d, fm = a.fmt, cs = (d.cpu || {}).cores || [];
  const gx = 40, cw = 340, mx = gx + cw + 24, mw = w - 2 * (gx + cw + 24), rx = w - gx - cw;
  a.text('JARVIS // SYSTEM CONSOLE', gx, 34, 12, .95, CR, 'left', { sp: 4 }); a.label(fm.short((d.sys || {}).host, 16) + '  ·  ' + fm.clock() + ':' + fm.secs() + '  ·  ' + fm.date(), w - gx, 34, .7, 'right');
  a.line(gx, 52, w - gx, 52, 1, .14, CR); a.line(gx, 52, gx + 60, 52, 1.4, .95, AC);
  const panel = (x, y, ww, hh, t) => { a.bracket(x, y, ww, hh, 9, 1, .4, CR); a.label(t, x + 12, y + 14, .85); };
  const big = (x, y, ww, hh, title, arr, max, unit, c, cur) => { panel(x, y, ww, hh, title); a.text(cur, x + ww - 14, y + 14, 11, .95, CR, 'right');
    const gx0 = x + 14, gy = y + 32, gw = ww - 28, gh = hh - 52; for (let i = 0; i <= 4; i++) { a.line(gx0, gy + gh * i / 4, gx0 + gw - 34, gy + gh * i / 4, 1, .07, CR); a.text(unit(max * (1 - i / 4)), gx0 + gw, gy + gh * i / 4, 8, .45, DM, 'right'); }
    a.spark(gx0, gy, gw - 34, gh, arr, max, 1.3, .95, c, .07); a.text('-90s', gx0, y + hh - 10, 8, .45, DM); a.text('now', gx0 + gw - 34, y + hh - 10, 8, .45, DM, 'right'); };
  const cpuOn = a.show('cpu'), memOn = a.show('mem'), netOn = a.show('net'); let y = 70;
  if (cpuOn) { big(mx, y, mw, 190, 'CPU utilisation', hist.cpu, 100, v => Math.round(v) + '%', AC, fm.pct(d.cpu && d.cpu.load == null ? null : a.v.cpu)); y += 206; }
  if (memOn) { big(mx, y, mw, 170, 'Memory', hist.mem, 100, v => Math.round(v) + '%', CR, d.mem ? fm.gb(d.mem.used) + ' / ' + fm.gb(d.mem.total) : '--'); y += 186; }
  if (netOn) { const m = Math.max(1e5, ...hist.netD, ...hist.netU); big(mx, y, mw, 190, 'Network  ↓ down  ↑ up', hist.netD, m, v => fm.rate(v), AC, '↓ ' + fm.rate(d.net && d.net.down == null ? null : a.v.netD) + '   ↑ ' + fm.rate(d.net && d.net.up == null ? null : a.v.netU));
    a.spark(mx + 14, y + 32, mw - 62, 138, hist.netU, m, 1.1, .6, CR); y += 206; }
  let ly = 70; if (cpuOn) { panel(gx, ly, cw, 34 + cs.length * 17, 'Cores · ' + cs.length); cs.forEach((c, i) => { const yy = ly + 42 + i * 17; a.text('C' + String(i).padStart(2, '0'), gx + 14, yy, 9, .6, DM); a.bar(gx + 46, yy - 1, cw - 130, 2, c / 100, .9, c > 80 ? [255, 130, 100] : AC); a.text(Math.round(c) + '%', gx + cw - 14, yy, 9, .85, CR, 'right'); }); ly += 34 + cs.length * 17 + 14; }
  ly = a.stack(gx, ly + 4, cw, ['mem', 'gpu', 'batt'], 20);
  a.stack(rx, 74, cw, ['procs', 'disk', 'sys'], 24, { max: 8 });
  if (a.show('voice')) { const vy = 700; panel(gx, vy, w - 2 * gx, 160, 'Voice input · ' + (au.live ? 'live' : 'off') + (au.voice ? ' · speaking' : ''));
    a.spectrum(gx + 14, vy + 146, w - 2 * gx - 28 - 360, 90, 120, .75, AC, -1, 1.2); a.wave(gx + 14, vy + 100, w - 2 * gx - 28 - 360, 50, 1.2, .8, CR);
    (a.vlog.slice(-6)).forEach((l, i) => a.text('› ' + fm.short(l.text, 40), w - gx - 14, vy + 40 + i * 18, 10, l.status === 'ok' ? .95 : .5, l.status === 'ok' ? AC : DM, 'right')); }
} });
})();
