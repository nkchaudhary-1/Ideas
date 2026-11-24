'use strict';
/*
 * RESOLVE — 500 GRID / Clarity.
 *
 * Construction:
 *   N = 8 stripes of equal thickness t, separated by gaps G, flow left to right.
 *   The gaps close in three stages by smoothstep: 8 → 4 → 2 → 1.
 *     stage 0 closes gaps 0 2 4 6   (pairs touch)
 *     stage 1 closes gaps 1 5       (pairs touch)
 *     stage 2 closes gap  3         (halves touch)
 *   Thickness never changes, so area is conserved: the final bar is exactly N·t thick.
 *   Before stage 0 the stripes carry a travelling wobble that decays — complexity settling into order.
 *   Fine vertical hatching halves its density at every stage: gap 4 · 8 · 16 · solid.
 */
const S = require('../lib/svg');
const { smoothstep, f1 } = S;

const STAGES = [[0.12, 0.22], [0.28, 0.40], [0.46, 0.58]];
const gapStage = (i) => (i % 2 === 0 ? 0 : i === 3 ? 2 : 1);

function stripes({ x0, x1, cy, t, G, N = 8, stages = STAGES, wob = { A: 16, k: 0.02, end: 0.3 }, step = 6, over = 0.6 }) {
  const span = x1 - x0, n = Math.ceil(span / step);
  const tops = Array.from({ length: N }, () => []), bots = Array.from({ length: N }, () => []);
  for (let j = 0; j <= n; j++) {
    const x = x0 + (j * span) / n, u = (x - x0) / span;
    const gaps = [];
    for (let i = 0; i < N - 1; i++) { const st = stages[gapStage(i)]; gaps.push(G * (1 - smoothstep(st[0], st[1], u))); }
    const H = N * t + gaps.reduce((a, b) => a + b, 0);
    let y = cy - H / 2;
    const fade = 1 - smoothstep(0, wob.end, u);
    for (let i = 0; i < N; i++) {
      const w = wob.A * fade * Math.sin(wob.k * (x - x0) + 0.9 * i);
      tops[i].push([x, y + w]); bots[i].push([x, y + w + t + over]);
      y += t + (i < N - 1 ? gaps[i] : 0);
    }
  }
  const dOf = (i) => {
    let d = '';
    tops[i].forEach((p, k) => { d += `${k ? 'L' : 'M'}${f1(p[0])} ${f1(p[1])}`; });
    for (let k = bots[i].length - 1; k >= 0; k--) d += `L${f1(bots[i][k][0])} ${f1(bots[i][k][1])}`;
    return d + 'Z';
  };
  const xs = (st) => x0 + span * st;
  return {
    d: Array.from({ length: N }, (_, i) => dOf(i)),
    N, t, G, x0, x1, cy, span,
    height0: N * t + (N - 1) * G,
    boundaries: [x0, xs(stages[0][1]), xs(stages[1][1]), xs(stages[2][1])],   // column starts: 8, 4, 2, 1 stripes
    stageX: stages.map((s) => [xs(s[0]), xs(s[1])]),
  };
}

/* vertical hatch in four columns, density halving: returns [{d, gap}] */
function hatchColumns(R, pad = 6) {
  const cols = [];
  const gaps = [4, 8, 16, 0];
  const y0 = R.cy - R.height0 / 2 - 30, y1 = R.cy + R.height0 / 2 + 30;
  R.boundaries.forEach((bx, k) => {
    const ex = k < 3 ? R.boundaries[k + 1] : R.x1;
    if (!gaps[k]) return;
    let d = '';
    for (let x = Math.ceil(bx / gaps[k]) * gaps[k]; x < ex; x += gaps[k]) d += `M${f1(x)} ${f1(y0)}V${f1(y1)}`;
    cols.push({ d, gap: gaps[k], x0: bx, x1: ex });
  });
  return cols;
}

module.exports = { stripes, hatchColumns, STAGES, gapStage };
