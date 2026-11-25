'use strict';
/*
 * The "real note" kit shared by all five denominations: paper, ornate border, corner rosettes, issuer and legal text,
 * signatures, engraved numerals. Flat ink only; tone is line weight and line density.
 */
const S = require('./svg');
const PT = require('./patterns');
const N = require('./note');
const E = require('./engrave');
const { f, f1, g, rect, circle, path, line, comment } = S;
const { W, H, FIELD } = N;

/* L01: paper and fibres */
function paper(ctx, { paper: pc, fibres, seed = 11 }) {
  ctx.add(1, rect(0, 0, W, H, { fill: pc, id: 'PAPER' }),
    comment('Paper fibres: hairline curves in the palette'),
    g({ id: 'PAPER_FIBRES' }, E.fibres({ seed, n: ctx.n(520), x: 0, y: 0, w: W, h: H, colors: fibres })));
}

/* L02: ornate border. Two interlaced lathe bands in the 26 px frame, double keylines. */
function border(ctx, { c1, c2, ink }) {
  const d = ctx.density;
  const st = ctx.gap(4);
  ctx.add(2, comment('Ornate border: interlaced lathe-work bands and double keylines'),
    rect(3, 3, W - 6, H - 6, { fill: 'none', stroke: ink, stroke_width: 0.8, id: 'FRAME_KEYLINE_OUTER' }),
    g({ id: 'FRAME_LATHE_BANDS' },
      E.lathe({ x0: 34, x1: W - 34, yc: 17, amp: 3.6, lambda: 22, rows: 6, step: st, swell: 6, color: c1, sw: 0.4, id: 'lathe_top_a' }),
      E.lathe({ x0: 34, x1: W - 34, yc: 17, amp: 3.6, lambda: 31, rows: 4, step: st, swell: 4, color: c2, sw: 0.35, id: 'lathe_top_b' }),
      E.lathe({ x0: 34, x1: W - 34, yc: H - 17, amp: 3.6, lambda: 22, rows: 6, step: st, swell: 6, color: c1, sw: 0.4, id: 'lathe_bottom_a' }),
      E.lathe({ x0: 34, x1: W - 34, yc: H - 17, amp: 3.6, lambda: 31, rows: 4, step: st, swell: 4, color: c2, sw: 0.35, id: 'lathe_bottom_b' }),
      E.latheV({ y0: 34, y1: H - 34, xc: 17, amp: 3.6, lambda: 22, rows: 6, step: st, swell: 5, color: c1, sw: 0.4, id: 'lathe_left_a' }),
      E.latheV({ y0: 34, y1: H - 34, xc: 17, amp: 3.6, lambda: 31, rows: 4, step: st, swell: 3, color: c2, sw: 0.35, id: 'lathe_left_b' }),
      E.latheV({ y0: 34, y1: H - 34, xc: W - 17, amp: 3.6, lambda: 22, rows: 6, step: st, swell: 5, color: c1, sw: 0.4, id: 'lathe_right_a' }),
      E.latheV({ y0: 34, y1: H - 34, xc: W - 17, amp: 3.6, lambda: 31, rows: 4, step: st, swell: 3, color: c2, sw: 0.35, id: 'lathe_right_b' })),
    rect(FIELD.x - 4, FIELD.y - 4, FIELD.w + 8, FIELD.h + 8, { fill: 'none', stroke: c2, stroke_width: 0.6, id: 'FRAME_KEYLINE_MID' }),
    rect(FIELD.x - 1, FIELD.y - 1, FIELD.w + 2, FIELD.h + 2, { fill: 'none', stroke: c1, stroke_width: 1.8, id: 'FRAME_KEYLINE_INNER' }));
}

/* L06: four corner rosettes on paper discs */
function corners(ctx, { paper: pc, c1, c2, c3, ink }) {
  return g({ id: 'CORNER_ROSETTES' }, [[26, 26], [W - 26, 26], [W - 26, H - 26], [26, H - 26]].map(([cx, cy], i) => g({ id: `corner_rosette_${i + 1}` },
    circle(cx, cy, 25, { fill: pc }),
    E.rosetteDense({ cx, cy, R: 22, c1, c2, c3, density: ctx.density * 0.5 }),
    circle(cx, cy, 25, { fill: 'none', stroke: ink, stroke_width: 0.9 }),
    circle(cx, cy, 5, { fill: ink }))));
}

/* L07: engraved numerals — Impact outlined and filled with fine ruling, not a solid block */
function numerals(ctx, str, x, y, size, { lines, outline, gap = 2.4, sw = 1.1, osw = 1.7, anchor, id, transform, under }) {
  const key = `${str}-${lines.replace('#', '')}-${gap}`;
  const fill = ctx.pat(`pat-engrave-${key}`, PT.patHatch(`pat-engrave-${key}`, { gap, angle: 0, color: lines, sw }));
  const top = N.impact(str, x, y, size, fill, { stroke: outline, stroke_width: osw, stroke_linejoin: 'round', text_anchor: anchor, transform });
  if (!under) return g({ id }, top);
  return g({ id }, N.impact(str, x, y, size, under, { text_anchor: anchor, transform }), top);
}

/* L07: issuer and legal text */
function issuer(x, y, { fill, accent, name = 'GRID CREATIVE RESERVE', words, size = 11, anchor, w }) {
  const a = { text_anchor: anchor };
  return g({ id: 'T05_ISSUER_LEGAL' },
    N.inter(name, x, y, size, fill, { weight: 800, ls: '0.3em', ...a }),
    N.inter('PROMISES TO PAY THE BEARER ON DEMAND', x, y + size + 5, size * 0.72, fill, { weight: 700, ls: '0.2em', ...a }),
    N.inter(words, x, y + size * 2 + 6, size * 0.72, accent || fill, { weight: 700, ls: '0.2em', ...a }));
}

/* L07: two signatures with captions */
function signatures(x, y, w, { color, label, seed = 5, h = 30 }) {
  const half = (w - 24) / 2;
  return g({ id: 'T05_SIGNATURES' },
    E.signature({ seed, x, y, w: half, h, color, sw: 1.1, id: 'signature_chief_designer' }),
    E.signature({ seed: seed + 9, x: x + half + 24, y, w: half, h, color, sw: 1.1, id: 'signature_treasurer' }),
    path(`M${x} ${y + h + 6}h${f1(half)}M${f1(x + half + 24)} ${y + h + 6}h${f1(half)}`, { stroke: color, stroke_width: 0.5, fill: 'none' }),
    N.inter('CHIEF DESIGNER', x, y + h + 16, 6.5, label, { weight: 700, ls: '0.2em' }),
    N.inter('TREASURER OF IDEAS', x + half + 24, y + h + 16, 6.5, label, { weight: 700, ls: '0.2em' }));
}

/* L07: microprint in the frame band, top and bottom */
function frameMicro(str, fill) {
  return g({ id: 'T05_FRAME_MICROPRINT' },
    N.micro(str, 40, 8.5, W - 80, 3.6, fill, { id: 'microprint_top' }),
    N.micro(str, 40, H - 4.5, W - 80, 3.6, fill, { id: 'microprint_bottom' }));
}

module.exports = { paper, border, corners, numerals, issuer, signatures, frameMicro };
