'use strict';
/*
 * RIPPLE — 50 GRID / Impact.
 *
 * Construction:
 *   A square lattice of dots (spacing d) is the existing world.  One impact point E lands on it.
 *   Every dot at distance D from E is resized and pushed outward by a decaying wave:
 *        r(D)      = r0 + R · e^(−D/τ) · ½ (1 + cos 2πD/λ)
 *        shift(D)  = s  · e^(−D/τ) · sin 2πD/λ        (along the line from E)
 *   Crests sit exactly at D = n·λ, which is where the contour rings are drawn.
 *   Close to E the world is rearranged; far away it is almost untouched — consequences that thin out but never quite stop.
 *   Mark: 11 × 11 lattice, d = 30, λ = 90 (three cells).  Note: λ = 120 (four cells), τ = 520.
 */
const S = require('../lib/svg');
const { f1 } = S;

function dots({ E, x0, y0, x1, y1, d, off = [0, 0], r0, R, lambda, tau, shift = 0 }) {
  const out = [];
  for (let y = y0 + off[1]; y <= y1 + 0.01; y += d) for (let x = x0 + off[0]; x <= x1 + 0.01; x += d) {
    const dx = x - E[0], dy = y - E[1], dist = Math.hypot(dx, dy), env = Math.exp(-dist / tau);
    const w = 0.5 + 0.5 * Math.cos((2 * Math.PI * dist) / lambda);
    const sh = dist < 1e-6 ? 0 : shift * env * Math.sin((2 * Math.PI * dist) / lambda);
    out.push({ x: x + (dist < 1e-6 ? 0 : (dx / dist) * sh), y: y + (dist < 1e-6 ? 0 : (dy / dist) * sh), r: r0 + R * env * w, dist });
  }
  return out;
}
const dotsD = (ds, min = 0.4) => ds.filter((p) => p.r > min).map((p) => `M${f1(p.x - p.r)} ${f1(p.y)}a${f1(p.r)} ${f1(p.r)} 0 1 0 ${f1(2 * p.r)} 0a${f1(p.r)} ${f1(p.r)} 0 1 0 ${f1(-2 * p.r)} 0`).join('');
module.exports = { dots, dotsD };
