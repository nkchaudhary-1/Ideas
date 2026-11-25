'use strict';
/*
 * The clean-print kit (direction v3). Light tinted paper, one strong idea per note, translucent-looking layers drawn as
 * explicit flat overlap inks, solid numerals, value in words, and security detail kept small and exact:
 * registration square, braille-style dots, a roundel seal, microprint, signatures, thread.
 */
const S = require('./svg');
const PT = require('./patterns');
const N = require('./note');
const E = require('./engrave');
const { f, f1, g, rect, circle, path, line, comment } = S;
const { W, H } = N;

/* L01: paper, a pale print field, a few fibres */
function ground(ctx, { paper, field, fibres, seed = 1, inset = 24 }) {
  const kids = [rect(0, 0, W, H, { fill: paper, id: 'PAPER' })];
  if (field) kids.push(rect(inset, inset, W - inset * 2, H - inset * 2, { fill: field, id: 'PRINT_FIELD' }));
  ctx.add(1, ...kids, g({ id: 'PAPER_FIBRES' }, E.fibres({ seed, n: ctx.n(110), x: 0, y: 0, w: W, h: H, colors: fibres, sw: [0.3, 0.5] })));
}

/* L02: a thin keyline round the print area and crop ticks at the note corners */
function frame(ctx, { line: lc, ink, inset = 24 }) {
  const t = (x, y, dx, dy) => `M${x + dx * 14} ${y}H${x}V${y + dy * 14}`;
  ctx.add(2, comment('Print area keyline and crop ticks'),
    rect(inset, inset, W - inset * 2, H - inset * 2, { fill: 'none', stroke: lc, stroke_width: 0.9, id: 'FRAME_KEYLINE_OUTER' }),
    path(t(8, 8, 1, 1) + t(W - 8, 8, -1, 1) + t(8, H - 8, 1, -1) + t(W - 8, H - 8, -1, -1), { fill: 'none', stroke: ink, stroke_width: 0.8, id: 'FRAME_CROP_TICKS' }));
}

/* Two translucent-looking layers: B drawn again inside A in the overlap ink. A and B are { geom(extra) -> svg }. */
function overlap(ctx, id, A, B, ink) {
  const clip = ctx.clip(`clip-ov-${id}`, A.geom({}));
  return g({ id: `OVERLAP_${id}`, clip_path: clip }, B.geom({ fill: ink }));
}

/* Registration square (nested squares, like a print mark) */
function reg(x, y, s, c1, c2) {
  return g({ id: 'REGISTRATION_SQUARE' },
    rect(x, y, s, s, { fill: 'none', stroke: c1, stroke_width: 2 }),
    rect(x + s * 0.2, y + s * 0.2, s * 0.6, s * 0.6, { fill: 'none', stroke: c2, stroke_width: 2 }),
    rect(x + s * 0.4, y + s * 0.4, s * 0.2, s * 0.2, { fill: c1 }));
}

/* Braille-style tactile dots: n columns of 2 x 3 dots */
function braille(x, y, n, fill, r = 2.1, gap = 7) {
  const out = [];
  for (let c = 0; c < n; c++) for (let i = 0; i < 2; i++) for (let j = 0; j < 3; j++) if ((c + i + j) % 3 !== 1) out.push(circle(x + c * (gap * 2 + 8) + i * gap, y + j * gap, r, { fill }));
  return g({ id: 'TACTILE_DOTS' }, out);
}

/* Roundel seal: dense rosette ring around the GRID module mark */
function seal(ctx, cx, cy, r, { c1, c2, c3, ink, paper }) {
  const m = r * 0.62;
  return g({ id: 'SEAL_ROUNDEL' },
    circle(cx, cy, r + 2, { fill: paper }),
    E.rosetteDense({ cx, cy, R: r, c1, c2, c3, density: ctx.density }),
    circle(cx, cy, r * 0.56, { fill: paper, stroke: ink, stroke_width: 0.8 }),
    N.gridMark(cx - m / 2, cy - m / 2, m, ink));
}

/* Value in words, two lines, like "ONE DOLLAR / United States of America" */
function words(x, y, w1, w2, { fill, size = 28, anchor }) {
  const a = { text_anchor: anchor };
  return g({ id: 'T02_VALUE_IN_WORDS' },
    N.inter(w1, x, y, size, fill, { weight: 800, ls: '0.08em', ...a }),
    N.inter(w2, x, y + size * 1.25, size * 0.64, fill, { weight: 600, ls: '0.02em', ...a }));
}

/* Stripe or hatch block (like the pattern bands in the World Bank reference) */
function band(x, y, w, h, { color, angle = 45, gap = 8, sw = 2, ground, id }) {
  return g({ id }, ground ? rect(x, y, w, h, { fill: ground }) : '', path(PT.hatchRectD(x, y, w, h, angle, gap), { fill: 'none', stroke: color, stroke_width: sw }));
}

module.exports = { ground, frame, overlap, reg, braille, seal, words, band };
