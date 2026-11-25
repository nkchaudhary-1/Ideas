'use strict';
/*
 * 1000 GRID — CREATIVITY — "Imagine beyond the existing"
 * Symbol: UNFOLD (see symbols/unfold.js)
 * Composition: three bands read left to right — type, engraving, symbol — while the spiral of squares
 * keeps growing past the edge of the note.
 */
const S = require('../lib/svg');
const PT = require('../lib/patterns');
const N = require('../lib/note');
const E = require('../lib/engrave');
const R = require('../lib/realism');
const CL = require('../lib/clean');
const U = require('../symbols/unfold');
const { f, f1, g, rect, circle, path, line, poly, comment, P } = S;
const B = require('../lib/bpcolors');
const { gx, gy, FIELD, W, H } = N;

const palette = {
  primary: '#6C46C1', secondary: '#DCD5F6', accent: '#FF8A42', pattern: '#3C1C79',
  paper: '#F5EBD9', ink: '#211B31', highlight: '#BCA8FF',
};

/* ---- symbol geometry shared by note + blueprint ---- */
const SYM = {
  o: [800, 452],               // the shared corner
  u: (75 / Math.SQRT2) * 1.3,  // first square's diagonal = 1.3 modules at this scale
  a0: -45, dir: 1,
};
const hero = () => U.squares({ ...SYM, n: 6 });
const big = () => U.squares({ ...SYM, n: 5, from: 6 });
const chain = () => U.squares({ ...SYM, n: 10 });

const L = {
  logo: { x: 70, y: 52, h: 34 },
  title: { x: 70, y: 196, size: 46 },
  phrase: { x: 70, y: 228, size: 16 },
  issuer: { x: 70, y: 296 },
  seal: { cx: 160, cy: 438, r: 58 },
  sig: { x: 70, y: 566, w: 290 },
  numerals: { x: 960, y: 500, size: 250 },
  words: { x: 962, y: 552, size: 26 },
  reg: { x: 1404, y: 50, s: 34 },
  thread: { x: 916, w: 14 },
};

function build(ctx) {
  const C = ctx.C;
  const o = SYM.o;
  const sq = chain();
  const heroSq = hero();
  const gp = (v) => ctx.gap(v);
  const IN = 24;
  const vis = (pts) => E.clipToRect(pts, IN, IN, W - IN, H - IN);
  const col = [C.accent, C.secondary, C.primary, C.highlight, C.primary, C.secondary, C.highlight, C.primary, C.secondary, C.primary];

  /* ===== L01 / L02 ===== */
  CL.ground(ctx, { paper: C.paper, fibres: [C.highlight, C.secondary], seed: 1000 });
  CL.frame(ctx, { line: C.primary, ink: C.ink });

  /* ===== L03 the field of squares: pale tints, every overlap its own ink ===== */
  const ring = [];
  ring.push(g({ id: 'P02_POLAR_RINGS', fill: 'none', stroke: C.primary, stroke_width: 0.5 },
    S.range(10).map((j) => circle(o[0], o[1], 75 * Math.pow(Math.SQRT2, j), { id: `ring_${j}` }))));
  // Largest first. After each square, the half of it that nests in the next square, in the overlap ink.
  // Smaller squares then sit on top, so the seed stays visible.
  const stack = [];
  [...sq].reverse().forEach((q) => {
    const v = vis(q.pts);
    if (v.length >= 3) stack.push(poly(v, { fill: col[q.k], id: `K${q.k}_${f(q.side)}px` }));
    if (q.k <= 8) { const ov = vis(U.nestedHalf(q)); if (ov.length >= 3) stack.push(poly(ov, { fill: ctx.blend(col[q.k], col[q.k + 1]), id: `overlap_K${q.k}_K${q.k + 1}` })); }
  });
  ctx.add(3, comment('Ten squares share one corner. Each is a pale tint; the half that nests in the next square is a flat multiply ink'),
    g({ id: 'SQUARES_AND_OVERLAPS_K0_K9' }, stack));

  /* ===== L04 engraving: kept to a few exact fine-line passages ===== */
  const eng = [];
  eng.push(comment('P02 Contour: polar rings at 75 px · √2^j around the shared corner, clipped to the print area'));
  const clipPrint = ctx.clip('clip-print', rect(IN, IN, W - IN * 2, H - IN * 2));
  eng.push(g({ clip_path: clipPrint }, ring));
  eng.push(comment('P08 Lathe-work rail along the foot of the note'));
  eng.push(E.lathe({ x0: 60, x1: 880, yc: 688, amp: 8, lambda: 38, rows: 7, step: gp(3), swell: 3, color: C.primary, sw: 0.4, id: 'P08_LATHE_RAIL' }));
  ctx.add(4, eng);

  /* ===== L05 primary symbol: the spiral through the far corners ===== */
  const spiral = U.spiralPoints({ ...SYM, from: -2, to: 5, steps: 14 });
  const sym = [];
  sym.push(comment('UNFOLD: the logarithmic spiral through every far corner, and the corner itself'));
  sym.push(path(S.smoothD(spiral), { fill: 'none', stroke: C.ink, stroke_width: 1.6, id: 'UNFOLD_LOG_SPIRAL' }));
  sym.push(g({ id: 'UNFOLD_FAR_CORNER_NODES' }, heroSq.map((q) => circle(q.F[0], q.F[1], 4.2, { fill: C.paper, stroke: C.ink, stroke_width: 1.2 }))));
  sym.push(circle(o[0], o[1], 5.5, { fill: C.ink, id: 'UNFOLD_ORIGIN' }));
  ctx.add(5, sym);

  /* ===== L06 seal, registration, tactile dots ===== */
  ctx.add(6,
    CL.seal(ctx, L.seal.cx, L.seal.cy, L.seal.r, { c1: C.primary, c2: C.highlight, c3: C.pattern, ink: C.ink, paper: C.paper }),
    CL.reg(L.reg.x, L.reg.y, L.reg.s, C.paper, C.accent),
    CL.braille(1420, 540, 3, C.paper));

  /* ===== L07 typography ===== */
  const T = [];
  T.push(N.gridLogo(L.logo.x, L.logo.y, L.logo.h, C.ink, {}));
  T.push(N.impact('CREATIVITY', L.title.x, L.title.y, L.title.size, C.primary, { id: 'T03_TITLE', letter_spacing: '0.04em' }));
  T.push(N.inter('Imagine beyond the existing', L.phrase.x, L.phrase.y, L.phrase.size, C.ink, { weight: 700, id: 'T04_PHRASE' }));
  T.push(R.issuer(L.issuer.x, L.issuer.y, { fill: C.ink, accent: C.primary, words: 'THE VALUE OF ONE THOUSAND GRID', size: 10 }));
  T.push(R.signatures(L.sig.x, L.sig.y, L.sig.w, { color: C.ink, label: C.primary, seed: 1000 }));
  T.push(N.impact('1000', L.numerals.x, L.numerals.y, L.numerals.size, C.paper, { id: 'T01_DENOMINATION' }));
  T.push(CL.words(L.words.x, L.words.y, 'ONE THOUSAND GRID', 'Creative Reserve · Series A 2026', { fill: C.paper, size: L.words.size }));
  T.push(N.impact('1000', 1530, 80, 30, C.paper, { text_anchor: 'end', id: 'T01_CORNER_NUMERAL' }));
  T.push(N.impact('1000', 70, 710, 22, C.primary, { id: 'T01_CORNER_NUMERAL_BL' }));
  T.push(N.serial('K 1000  4817 2260 B', 1530, 106, 8.5, C.paper, { text_anchor: 'end', id: 'T05_SERIAL_SMALL' }));
  T.push(N.serial('K 1000  4817 2260 B', 1530, 704, 14, C.paper, { text_anchor: 'end', id: 'T05_SERIAL_PRIMARY' }));
  T.push(N.micro('IMAGINE BEYOND THE EXISTING · CURRENCY FOR THE CREATIVE WORLD', 40, 18, 1520, 3.8, C.primary, { id: 'T05_MICROPRINT_TOP' }));
  T.push(N.micro('GRID CREATIVE RESERVE · 1000 GRID · UNFOLD · 1000 GRID', 40, 738, 1520, 3.8, C.primary, { id: 'T05_MICROPRINT_BOTTOM' }));
  ctx.add(7, T);

  /* ===== L08 security ===== */
  const sec = [];
  sec.push(N.thread(L.thread.x, IN, H - IN, L.thread.w, { a: C.paper, b: C.accent, ink: C.ink, label: 'GRID 1000 · CREATIVITY · GRID 1000 · CREATIVITY' }));
  sec.push(N.tactile(5, 70, 640, C.ink, { bar: 4, h: 18, gap: 6 }));
  ctx.add(8, sec);
}

/* ======== blueprint data ======== */
const fitHero = (box, pad = 14) => {
  const bb = U.bbox(hero());
  const sc = Math.min((box.w - pad * 2) / (bb.x1 - bb.x0), (box.h - pad * 2 - 6) / (bb.y1 - bb.y0));
  const bc = [(bb.x0 + bb.x1) / 2, (bb.y0 + bb.y1) / 2];
  return { sc, map: (p) => [box.w / 2 + (p[0] - bc[0]) * sc, box.h / 2 + 4 + (p[1] - bc[1]) * sc] };
};
const lbl = (str, x, y, a = {}) => S.text(str, { x, y, font_family: N.INTER, font_size: 9, font_weight: 700, fill: B.TX, letter_spacing: '0.06em', ...a });

const steps = [
  { t: 'GRID & ORIGIN', d: ['Origin O on a grid vertex.', 'K0 diagonal = 1 module.'],
    draw: (b) => {
      const m = 36, ox = 30, oy = 84;
      let d = '';
      for (let i = -1; i <= 4; i++) d += `M${ox + i * m} 30V150`;
      for (let j = -2; j <= 1; j++) d += `M0 ${oy + j * m}H144`;
      return g({}, path(d, { stroke: B.CY, stroke_width: 0.7, fill: 'none', stroke_dasharray: '2 3' }),
        poly([[ox, oy], [ox + m / 2, oy - m / 2], [ox + m, oy], [ox + m / 2, oy + m / 2]], { fill: B.AM, fill_opacity: 0.28, stroke: B.AM, stroke_width: 1.6 }),
        line(ox, oy + 22, ox + m, oy + 22, { stroke: B.PK, stroke_width: 1.2 }),
        lbl('1 MODULE', ox + m / 2, oy + 34, { text_anchor: 'middle', fill: B.PK }),
        circle(ox, oy, 4, { fill: B.TX }), lbl('O', ox - 10, oy - 6), lbl('K0', ox + m / 2 + 6, oy - 14, { fill: B.AM }));
    } },
  { t: 'TURN 45° · GROW ×√2', d: ['K1 side = K0 diagonal.', 'Area doubles.'],
    draw: (b) => {
      const ox = 24, oy = 46, a = 56;
      const arc = new P().M(ox + 30, oy).A(30, 30, 0, 0, 0, ox + 30 * Math.cos(Math.PI / 4), oy - 30 * Math.sin(Math.PI / 4)).d();
      return g({},
        poly([[ox, oy], [ox + a, oy], [ox + a, oy + a], [ox, oy + a]], { fill: B.CY, fill_opacity: 0.12, stroke: B.CY, stroke_width: 1.6 }),
        poly([[ox, oy], [ox + a / 2, oy - a / 2], [ox + a, oy], [ox + a / 2, oy + a / 2]], { fill: B.AM, fill_opacity: 0.3, stroke: B.AM, stroke_width: 1.6 }),
        path(arc, { fill: 'none', stroke: B.PK, stroke_width: 1.3 }), lbl('45°', ox + 36, oy - 8, { fill: B.PK }),
        line(ox, oy, ox + a, oy, { stroke: B.TX, stroke_width: 0.9, stroke_dasharray: '3 3' }),
        circle(ox, oy, 4, { fill: B.TX }),
        lbl('K0', ox + a / 2, oy - a / 2 - 5, { fill: B.AM, text_anchor: 'middle' }), lbl('K1', ox + a / 2, oy + a - 6, { fill: B.CY, text_anchor: 'middle' }),
        lbl('diagonal K0 = side K1', b.w / 2, 128, { text_anchor: 'middle', fill: B.TX, font_size: 8.5 }),
        lbl('side × √2  ·  area × 2', b.w / 2, 141, { text_anchor: 'middle', fill: B.PK, font_size: 8.5 }));
    } },
  { t: 'REPEAT × 6', d: ['Eight rays, one every 45°.', 'K0 … K5 from one corner.'],
    draw: (b) => {
      const F = fitHero(b), o_ = F.map(SYM.o);
      let rays = '';
      for (let k = 0; k < 8; k++) { const a = Math.PI / 4 * k; rays += `M${f(o_[0])} ${f(o_[1])}l${f(Math.cos(a) * 90)} ${f(Math.sin(a) * 90)}`; }
      return g({}, path(rays, { stroke: B.CY, stroke_width: 0.7, stroke_dasharray: '2 3', fill: 'none' }),
        hero().map((q) => poly(q.pts.map(F.map), { fill: 'none', stroke: B.AM, stroke_width: 1.3 })),
        circle(o_[0], o_[1], 3.5, { fill: B.TX }));
    } },
  { t: 'NEST', d: ['Half of every square sits', 'inside the next one.'],
    draw: (b) => {
      const F = fitHero(b);
      const hs = hero();
      return g({},
        hs.map((q) => g({}, poly([q.o, q.A, q.F].map(F.map), { fill: B.AM, fill_opacity: 0.32, stroke: B.AM, stroke_width: 1.2 }),
          q.k ? poly([q.o, q.A, q.C].map(F.map), { fill: 'url(#bp-pat-hatch)', stroke: B.PK, stroke_width: 1 }) : '')),
        lbl('HATCH = OVERLAP', 8, 140, { fill: B.PK, font_size: 8 }));
    } },
  { t: 'RESULT', d: ['Overlaps become negative', 'space; spiral emerges.'],
    draw: (b) => {
      const F = fitHero(b);
      const hs = hero();
      const cols = [C0.accent, C0.paper, C0.highlight, C0.secondary, C0.paper, C0.highlight];
      return g({},
        rect(6, 6, b.w - 12, b.h - 12, { fill: C0.primary }),
        hs.map((q) => g({}, poly([q.o, q.A, q.F].map(F.map), { fill: cols[q.k], stroke: C0.ink, stroke_width: 0.9 }),
          q.k ? poly([q.o, q.A, q.C].map(F.map), { fill: C0.primary, stroke: C0.ink, stroke_width: 0.9 }) : '')),
        path(S.smoothD(U.spiralPoints({ ...SYM, from: -2, to: 5, steps: 10 }).map(F.map)), { fill: 'none', stroke: C0.accent, stroke_width: 1.8 }));
    } },
];
const C0 = palette;

const heroBox = U.bbox(hero());
const bp = {
  symbolName: 'UNFOLD',
  serial: 'K 1000  4817 2260 B',
  theme: {
    word: 'CREATIVITY', principle: 'Imagine beyond the existing.',
    story: ['Creativity is the first value of the currency: the ability to see what does not exist yet and make it real.',
      'The 1000 note states one rule, turn 45° and grow by √2, and repeats it until the form leaves the page.',
      'The grid is not a limit on the idea. It is the ground the idea departs from.'],
    keywords: ['POSSIBILITY', 'EXPLORATION', 'EMERGENCE'],
  },
  elements: [
    { t: 'UNFOLD as layers', d: 'Ten squares share one corner; each is turned 45° and grown by √2, drawn in a pale tint.', layer: 'L03' },
    { t: 'Overlaps are their own ink', d: 'The half of each square that nests in the next is a flat multiply of the two inks.', layer: 'L03' },
    { t: 'Logarithmic spiral', d: 'Every far corner lies on r = u√2·e^0.44φ: a curve from straight edges.', layer: 'L05' },
    { t: 'Roundel seal', d: 'Seventy-two rotated ellipses ring the GRID module: the guilloché, kept small.', layer: 'L06' },
    { t: 'Value in words', d: 'Amount and issuer under the numerals, with registration square and tactile dots.', layer: 'L07 · L06' },
  ],
  callouts: [
    { code: 'T02', label: 'GRID LOCKUP', pt: [150, 70], side: 'L' },
    { code: 'T03', label: 'THEME TITLE', pt: [330, 176], side: 'L' },
    { code: 'L06', label: 'ROUNDEL SEAL', pt: [L.seal.cx, L.seal.cy], side: 'L' },
    { code: 'T05', label: 'SIGNATURES', pt: [215, 585], side: 'L' },
    { code: 'L08', label: 'TACTILE CODE', pt: [110, 649], side: 'L' },
    { code: 'L03', label: 'SQUARES AND OVERLAPS', pt: [700, 330], side: 'R' },
    { code: 'L08', label: 'SECURITY THREAD', pt: [923, 300], side: 'R' },
    { code: 'T01', label: 'DENOMINATION', pt: [1180, 400], side: 'R' },
    { code: 'T02', label: 'VALUE IN WORDS', pt: [1100, 560], side: 'R' },
    { code: 'L06', label: 'REGISTRATION', pt: [1421, 67], side: 'R' },
  ],
  zones: [
    { code: 'T01', rect: [L.numerals.x, L.numerals.y - 0.79 * L.numerals.size, N.impactWidth('1000', L.numerals.size), 0.79 * L.numerals.size] },
    { code: 'T02', rect: [L.logo.x, L.logo.y, N.gridLogoWidth(L.logo.h), L.logo.h * 1.45] },
    { code: 'T03', rect: [L.title.x, L.title.y - 0.79 * L.title.size, N.impactWidth('CREATIVITY', L.title.size), 0.79 * L.title.size] },
    { code: 'T04', rect: [L.phrase.x, L.phrase.y - 14, 250, 20] },
    { code: 'L05', rect: [heroBox.x0, heroBox.y0, heroBox.x1 - heroBox.x0, heroBox.y1 - heroBox.y0] },
    { code: 'L06', circle: [L.seal.cx, L.seal.cy, L.seal.r] },
    { code: 'L08', rect: [L.thread.x, 24, L.thread.w, 702] },
    { code: 'T05', rect: [1380, 690, 150, 16] },
  ],
  steps,
  facts: [['UNIT u', '75 ÷ √2 = 53.03 px'], ['TURN', '45° per square, clockwise'], ['GROWTH', '× √2 per step · × 2 per 90°'], ['ODD SQUARES', '1 · 2 · 4 · 8 · 16 modules']],
  patterns: { P01: 'Roundel seal', P02: 'Polar rings', P08: 'Lathe-work rail' },
  samples: {
    P06: (w, h, c) => g({ fill: 'none', stroke: c, stroke_width: 1 },
      [0, 1, 2].map((i) => g({ transform: `translate(${14 + i * 46} 14) scale(2.8)` },
        U.squares({ o: [5, 15], u: 2.3, a0: -45, dir: 1, n: 5 }).map((q) => poly([q.o, q.A, q.F], { stroke_width: 0.4 }))))),
  },
};

module.exports = {
  id: '1000', value: 1000, key: 'creativity', name: 'Creativity', title: 'CREATIVITY', phrase: 'Imagine beyond the existing',
  palette, SYM, L, hero, big, build, bp,
};
