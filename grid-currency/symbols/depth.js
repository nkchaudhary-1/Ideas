'use strict';
/*
 * DEPTH — 100 GRID / Craft.
 *
 * Construction:
 *   A square S is divided 3 × 3.  The centre cell becomes a hole — a CIRCLE at level 0.
 *   Each of the other eight cells is divided 3 × 3 again; its centre becomes a SQUARE hole at level 1.
 *   Again: circles at level 2.  Three generations: 1 + 8 + 64 = 73 holes, 512 solid cells, 27 × 27 divisions.
 *   Circle, square, circle: the shape alternates with every scale, so no scale repeats the one above it.
 *   S = 600 px = 8 modules;   cells 200 · 66.7 · 22.2 px.
 */
function holes({ x, y, S, levels = 3 }) {
  const out = [];
  (function rec(cx, cy, s, l) {
    if (l >= levels) return;
    const t = s / 3;
    out.push({ level: l, kind: l % 2 === 0 ? 'circle' : 'square', x: cx + t, y: cy + t, s: t, cx: cx + 1.5 * t, cy: cy + 1.5 * t, r: t / 2 });
    for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) if (!(i === 1 && j === 1)) rec(cx + i * t, cy + j * t, t, l + 1);
  })(x, y, S, 0);
  return out;
}
/* fine construction grid: a line at every S/3^levels */
function gridD({ x, y, S, levels = 3 }) {
  const n = Math.pow(3, levels), st = S / n;
  let d = '';
  for (let i = 1; i < n; i++) { d += `M${(x + i * st).toFixed(1)} ${y}V${y + S}M${x} ${(y + i * st).toFixed(1)}H${x + S}`; }
  return d;
}
/* ruler ticks along an edge: three lengths for the three divisions */
function rulerD({ x, y, S, levels = 3, vertical = false, flip = false, lens = [14, 9, 5, 3] }) {
  const n = Math.pow(3, levels), st = S / n;
  let d = '';
  for (let i = 0; i <= n; i++) {
    let lv = levels; for (let k = 0; k < levels; k++) { if (i % Math.pow(3, levels - k) === 0) { lv = k; break; } }
    const L = (flip ? -1 : 1) * lens[lv];
    d += vertical ? `M${x} ${(y + i * st).toFixed(1)}h${L}` : `M${(x + i * st).toFixed(1)} ${y}v${L}`;
  }
  return d;
}
module.exports = { holes, gridD, rulerD };
