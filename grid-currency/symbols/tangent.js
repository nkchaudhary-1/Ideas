'use strict';
/*
 * COMMON GROUND — 200 GRID / Empathy.
 *
 * Construction:
 *   Invert the GRID in a circle centred on a grid vertex P.  Every horizontal grid line y = a·k becomes a circle
 *   through P tangent to the x-axis; every vertical line becomes a circle through P tangent to the y-axis.
 *   Radii follow the harmonic series  r_k = C0 / k.
 *   The two pencils cross each other at exactly 90° — the same grid, seen from where someone else stands.
 *   The mark uses the two horizontal pencils (left and right of P). They touch at P and nowhere else:
 *   two perspectives with one point in common.  C0 = 3.5 modules = 262.5 px.
 */
const S = require('../lib/svg');

function pencil({ P, C0, kMax = 6, side = -1, axis = 'x' }) {
  const out = [];
  for (let k = 1; k <= kMax; k++) {
    const c = C0 / k;
    out.push(axis === 'x' ? { k, r: c, cx: P[0] + side * c, cy: P[1] } : { k, r: c, cx: P[0], cy: P[1] + side * c });
  }
  return out;
}
/* intersection of horizontal-pencil circle j and vertical-pencil circle k (signs sx, sy), the image of a grid vertex */
function nodes({ P, C0, kMax = 5 }) {
  const out = [];
  for (let j = 1; j <= kMax; j++) for (let k = 1; k <= kMax; k++) for (const sx of [-1, 1]) for (const sy of [-1, 1]) {
    const cj = C0 / j, ck = C0 / k, D = cj * cj + ck * ck;
    out.push({ j, k, x: P[0] + (2 * sx * ck * cj * cj) / D, y: P[1] + (2 * sy * ck * ck * cj) / D });
  }
  return out;
}
module.exports = { pencil, nodes };
