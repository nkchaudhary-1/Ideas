'use strict';
/*
 * UNFOLD — 1000 GRID / Creativity.
 *
 * Construction:
 *   Squares K0..Kn share one corner O (a grid vertex).
 *   Each square is turned 45° from the last and grown by √2:   side_k = u·√2^k,  angle_k = a0 + 45°·k.
 *   Therefore every square's DIAGONAL is exactly the next square's SIDE, and exactly half of each square
 *   nests inside its successor (Plato's doubling of the square).  Area doubles every quarter turn: 1, 2, 4, 8…
 *   The far corners F_k all sit on one logarithmic spiral  r = u·√2·e^(0.4413·φ)
 *   — a curve produced by nothing but straight edges and right angles.
 */
const S = require('../lib/svg');
const { P, f1, rad, pathFromPoints, smoothD } = S;

const SQ2 = Math.SQRT2;
const e = (a) => [Math.cos(rad(a)), Math.sin(rad(a))];

function squares({ o, u, a0 = -90, dir = 1, n = 6, from = 0 }) {
  const out = [];
  for (let k = from; k < from + n; k++) {
    const side = u * Math.pow(SQ2, k);
    const ang = a0 + dir * 45 * k;
    const e1 = e(ang), e2 = e(ang + dir * 90);
    const A = [o[0] + side * e1[0], o[1] + side * e1[1]];
    const B = [o[0] + side * e2[0], o[1] + side * e2[1]];
    const F = [A[0] + side * e2[0], A[1] + side * e2[1]];
    const C = [(o[0] + F[0]) / 2, (o[1] + F[1]) / 2];           // centre
    out.push({ k, side, ang, o, A, B, F, C, pts: [o, A, F, B] });
  }
  return out;
}

/* The half of K_k that nests inside K_{k+1}: triangle O, F_k, B_k */
const nestedHalf = (sq) => [sq.o, sq.F, sq.B];
/* The quarter of K_k that nests inside K_{k-1}'s successor relation: O, A_{k-1}-shared edge ... the triangle O, A_k, C_k */
const innerQuarter = (sq) => [sq.o, sq.A, sq.C];

/* Logarithmic spiral through the far corners. φ in radians measured from the first far corner. */
function spiralPoints({ o, u, a0 = -90, dir = 1, from = -3, to = 6, steps = 12 }) {
  const b = Math.log(SQ2) / (Math.PI / 4);
  const pts = [];
  const n = (to - from) * steps;
  for (let i = 0; i <= n; i++) {
    const kk = from + (i / steps);                    // fractional k
    const r = u * SQ2 * Math.pow(SQ2, kk);
    const ang = a0 + dir * (45 * kk + 45);
    const v = e(ang);
    pts.push([o[0] + r * v[0], o[1] + r * v[1]]);
  }
  return pts;
}

function bbox(sqs) {
  const xs = [], ys = [];
  sqs.forEach((s) => s.pts.forEach((p) => { xs.push(p[0]); ys.push(p[1]); }));
  return { x0: Math.min(...xs), x1: Math.max(...xs), y0: Math.min(...ys), y1: Math.max(...ys) };
}

module.exports = { squares, nestedHalf, innerQuarter, spiralPoints, bbox, SQ2 };
