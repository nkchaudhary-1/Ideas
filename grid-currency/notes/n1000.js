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
  o: [gx(15), gy(4)],          // grid vertex (col 15, row 4)
  u: 75 / Math.SQRT2,          // first square's diagonal = one 75 px module
  a0: -45, dir: 1,
};
const hero = () => U.squares({ ...SYM, n: 6 });
const big = () => U.squares({ ...SYM, n: 5, from: 6 });

/* layout constants (also used for the blueprint wireframe) */
const L = {
  block: { x: FIELD.x, y: FIELD.y, w: gx(5) - FIELD.x, h: FIELD.h },          // lavender type column
  medallion: { cx: 650, cy: 238, r: 138, win: 72 },
  numerals: { x: 62, y: 640, size: 330 },
  title: { x: 62, y: 212, size: 66 },
  phrase: { x: 62, y: 252, size: 21 },
  logo: { x: 62, y: 46, h: 40 },
  thread: { x: gx(17) + 6, w: 18 },
};

function build(ctx) {
  const C = ctx.C;
  const o = SYM.o;
  const bigSq = big();
  const heroSq = hero();
  const fieldClip = ctx.clip('clip-field', rect(FIELD.x, FIELD.y, FIELD.w, FIELD.h));
  const blockClip = ctx.clip('clip-block-secondary', rect(L.block.x, L.block.y, L.block.w, L.block.h));
  const violetClip = ctx.clip('clip-block-primary', rect(gx(5), FIELD.y, FIELD.x + FIELD.w - gx(5), FIELD.h));

  /* ===== L01 ===== */
  N.base(ctx, { paper: C.paper, hairline: C.secondary });

  /* ===== L02 ===== */
  N.frame(ctx, { ink: C.ink, line: C.pattern, accent: C.primary, corner: C.primary });

  /* ===== L03 geometric construction ===== */
  const bigColors = { 6: C.pattern, 7: C.primary, 8: C.pattern, 9: C.primary, 10: C.pattern };
  ctx.add(3, comment('Colour blocks'),
    rect(L.block.x, L.block.y, L.block.w, L.block.h, { fill: C.secondary, id: 'BLOCK_SECONDARY_TYPE_COLUMN' }),
    rect(gx(5), FIELD.y, FIELD.x + FIELD.w - gx(5), FIELD.h, { fill: C.primary, id: 'BLOCK_PRIMARY_FIELD' }));
  ctx.add(3, comment('The spiral keeps growing: K6 to K10 run past the edge of the note (unclipped, they break the frame)'),
    g({ id: 'SPIRAL_CONTINUES_BEYOND_NOTE' },
      [...bigSq].reverse().map((s) => poly(s.pts, { fill: bigColors[s.k], id: `K${s.k}_${f(s.side)}px` }))));

  /* ===== L04 engraving ===== */
  const eng = [];
  // contour: concentric insets inside every big square, each turned with its square
  eng.push(comment('P02 Contour — inset outlines follow each large square'));
  eng.push(g({ id: 'P02_CONTOUR_BIG_SQUARES', fill: 'none', stroke: C.highlight, stroke_width: 0.7 },
    bigSq.map((s) => path(PT.insetPolyD(s.pts, 14 + (s.k % 2) * 4, 18), { clip_path: fieldClip, id: `contour_K${s.k}` }))));
  // polar rings around the origin, radius = 75 px · √2^j  (the same growth rule as the squares)
  const ringClip = ctx.clip('clip-rings', rect(gx(11) + 10, FIELD.y, FIELD.x + FIELD.w - gx(11) - 10, FIELD.h));
  eng.push(comment('P02 Contour — polar rings at 75 px · √2^j around the origin'));
  eng.push(g({ id: 'P02_POLAR_RINGS', fill: 'none', stroke: C.highlight, stroke_width: 0.9, clip_path: ringClip },
    S.range(10).map((j) => circle(o[0], o[1], 75 * Math.pow(Math.SQRT2, j), { id: `ring_${j}` }))));
  // hatching in K7 and K9 along their own edge direction
  eng.push(comment('P04 Hatching — aligned with the edge direction of each square'));
  eng.push(g({ id: 'P04_HATCH_BIG_SQUARES', fill: 'none', stroke: C.pattern, stroke_width: 0.6 },
    bigSq.filter((s) => s.k % 2).map((s) => path(PT.hatchPolyD(s.pts, s.ang, 6), { clip_path: fieldClip, id: `hatch_K${s.k}` }))));

  // guilloché medallion in the middle band
  const m = L.medallion;
  const medClip = ctx.clip('clip-medallion', circle(m.cx, m.cy, m.r));
  eng.push(comment('P01 Guilloché — medallion: rotated-ellipse rosettes and hypotrochoids'));
  eng.push(g({ id: 'P01_GUILLOCHE_MEDALLION' },
    circle(m.cx, m.cy, m.r, { fill: C.secondary, id: 'medallion_disc' }),
    g({ clip_path: medClip },
      PT.rosette({ cx: m.cx, cy: m.cy, rx: m.r * 0.98, ry: m.r * 0.42, n: 48, span: 180, color: C.primary, sw: 0.7 }),
      PT.rosette({ cx: m.cx, cy: m.cy, rx: m.r * 0.72, ry: m.r * 0.3, n: 36, span: 180, start: 2.5, color: C.pattern, sw: 0.6 }),
      path(PT.trochoidD({ cx: m.cx, cy: m.cy, R: 96, r: 40, d: 62, steps: 520 }), { fill: 'none', stroke: C.primary, stroke_width: 0.9 }),
      path(PT.trochoidD({ cx: m.cx, cy: m.cy, R: 96, r: 40, d: 40, steps: 520 }), { fill: 'none', stroke: C.pattern, stroke_width: 0.7 })),
    circle(m.cx, m.cy, m.r, { fill: 'none', stroke: C.ink, stroke_width: 1.5 }),
    circle(m.cx, m.cy, m.r - 8, { fill: 'none', stroke: C.primary, stroke_width: 0.8 })));

  // braid bands top and bottom rail (two colours clipped to the two blocks)
  const braidTop = { x0: FIELD.x + 12, x1: FIELD.x + FIELD.w - 12, yc: 52, amp: 9, lambda: 56, k: 5 };
  const braidBot = { ...braidTop, yc: 676, lambda: 48, k: 4, shift: 1 };
  eng.push(comment('P01 Guilloché — braided rail bands, top and bottom'));
  [['TOP', braidTop], ['BOTTOM', braidBot]].forEach(([nm, b]) => {
    const d = PT.braidD(b);
    eng.push(g({ id: `P01_BRAID_${nm}`, fill: 'none', stroke_width: 0.7 },
      path(d, { stroke: C.primary, clip_path: blockClip }),
      path(d, { stroke: C.highlight, clip_path: violetClip })));
  });

  // micro-grid + dots in the type column between phrase and numerals
  const mgPat = ctx.pat('pat-microgrid-secondary', PT.patMicroGrid('pat-microgrid-secondary', { size: 8, color: C.highlight, sw: 0.5, dot: 1 }));
  const dotPat = ctx.pat('pat-dots-primary', PT.patDots('pat-dots-primary', { gap: 7, r: 1.1, color: C.highlight, stagger: true }));
  eng.push(comment('P03 Micro-grid and P05 Dot system'));
  eng.push(rect(L.block.x + 36, 312, L.block.w - 72, 34, { fill: mgPat, id: 'P03_MICROGRID_ZONE' }));
  eng.push(rect(gx(5) + 36, 70, 400, 20, { fill: dotPat, id: 'P05_DOT_ZONE' }));
  ctx.add(4, eng);

  /* ===== L05 primary symbol ===== */
  // UNFOLD: six pleats T0..T5 (isosceles right triangles O-A-F) chained corner to corner, then the last
  // square's nested half. The overlap half of every pleat (O-A-C) is left as negative space, hatched.
  const heroColors = [C.accent, C.paper, C.highlight, C.secondary, C.paper, C.highlight];
  const sym = [];
  sym.push(comment('UNFOLD pleats. Overlap halves are negative space with hatching: the ghost of the previous square'));
  const pleats = heroSq.map((s) => g({ id: `UNFOLD_PLEAT_${s.k}` },
    poly([s.o, s.A, s.F], { fill: heroColors[s.k], stroke: C.ink, stroke_width: 1.3, stroke_linejoin: 'miter', id: `pleat_${s.k}_free` }),
    s.k ? poly([s.o, s.A, s.C], { fill: C.primary, stroke: C.ink, stroke_width: 1.3, id: `pleat_${s.k}_overlap` }) : '',
    s.k ? path(PT.hatchPolyD([s.o, s.A, s.C], s.ang + 45, 4.5), { fill: 'none', stroke: C.pattern, stroke_width: 0.6 }) : '',
    s.k % 2 === 0 && s.k ? path(PT.hatchPolyD([s.A, s.F, s.C], s.ang + 90, 4), { fill: 'none', stroke: C.pattern, stroke_width: 0.45 }) : ''));
  const last = heroSq[heroSq.length - 1];
  sym.push(g({ id: 'UNFOLD_PLEATS' }, pleats,
    poly([last.o, last.F, last.B], { fill: C.paper, stroke: C.ink, stroke_width: 1.3, id: 'UNFOLD_K5_NESTED_HALF' })));
  const spiral = U.spiralPoints({ ...SYM, from: -2, to: 5, steps: 14 });
  sym.push(path(S.smoothD(spiral), { fill: 'none', stroke: C.accent, stroke_width: 2.6, id: 'UNFOLD_LOG_SPIRAL' }));
  sym.push(g({ id: 'UNFOLD_FAR_CORNER_NODES' }, heroSq.map((s) => circle(s.F[0], s.F[1], 4.5, { fill: C.ink, stroke: C.accent, stroke_width: 1.6 }))));
  sym.push(circle(o[0], o[1], 5.5, { fill: C.ink, id: 'UNFOLD_ORIGIN' }));
  ctx.add(5, sym);

  /* ===== L06 secondary symbol + watermark ===== */
  const wm = [];
  wm.push(comment('Accent tabs: the denomination and serial sit on orange, bleeding off the note'),
    rect(1380, 0, 220, 112, { fill: C.accent, id: 'ACCENT_TAB_TOP' }),
    rect(1380, 672, 220, 78, { fill: C.accent, id: 'ACCENT_TAB_BOTTOM' }));
  wm.push(comment('Watermark window: paper disc holding an outlined UNFOLD, centred on its own bounding box'));
  const bb = U.bbox(heroSq);
  const sc = (m.win * 1.55) / Math.max(bb.x1 - bb.x0, bb.y1 - bb.y0);
  const bc = [(bb.x0 + bb.x1) / 2, (bb.y0 + bb.y1) / 2];
  const wmPt = (p) => [m.cx + (p[0] - bc[0]) * sc, m.cy + (p[1] - bc[1]) * sc];
  wm.push(g({ id: 'WATERMARK_WINDOW' },
    circle(m.cx, m.cy, m.win, { fill: C.paper, stroke: C.ink, stroke_width: 1.2 }),
    g({ fill: 'none', stroke: C.primary, stroke_width: 1, stroke_linejoin: 'miter' },
      heroSq.map((s) => poly([s.o, s.A, s.F].map(wmPt), {})),
      poly([last.o, last.F, last.B].map(wmPt), {})),
    path(S.smoothD(U.spiralPoints({ ...SYM, from: -2, to: 5, steps: 10 }).map(wmPt)), { fill: 'none', stroke: C.accent, stroke_width: 1.4 }),
    circle(...wmPt(o), 2, { fill: C.ink })));
  // P06 symbol repetition: a <pattern> of miniature pleat fans fills a strip on the bottom rail
  const mini = U.squares({ o: [5, 15], u: 2.3, a0: -45, dir: 1, n: 5 });
  const tile = ctx.pat('pat-unfold-tile', PT.patSymbol('pat-unfold-tile',
    g({}, mini.map((q, i) => poly([q.o, q.A, q.F], { fill: i % 2 ? C.highlight : C.secondary }))), 24));
  wm.push(rect(gx(12) + 8, 692, 400, 24, { fill: tile, id: 'P06_SYMBOL_REPEAT_STRIP' }));
  ctx.add(6, wm);

  /* ===== L07 typography ===== */
  const T = [];
  const ty = ctx.clip('clip-numerals-on-violet', rect(gx(5), 0, W, H));
  T.push(comment('T02 GRID lockup'));
  T.push(N.gridLogo(L.logo.x, L.logo.y, L.logo.h, C.ink, {}));
  T.push(comment('T03 title and T04 phrase'));
  T.push(N.impact('CREATIVITY', L.title.x, L.title.y, L.title.size, C.primary, { id: 'T03_TITLE' }));
  T.push(N.inter('Imagine beyond the existing', L.phrase.x, L.phrase.y, L.phrase.size, C.ink, { weight: 700, id: 'T04_PHRASE' }));
  T.push(comment('T01 denomination — ink on the type column, paper once it crosses onto the field'));
  T.push(N.impact('1000', L.numerals.x, L.numerals.y, L.numerals.size, C.ink, { id: 'T01_DENOMINATION' }));
  T.push(g({ clip_path: ty, id: 'T01_DENOMINATION_OVERPRINT' }, N.impact('1000', L.numerals.x, L.numerals.y, L.numerals.size, C.paper)));
  T.push(comment('Corner numerals and serials'));
  T.push(N.impact('1000', FIELD.x + FIELD.w - 34, 84, 44, C.ink, { text_anchor: 'end', id: 'T01_CORNER_NUMERAL_TR' }));
  T.push(N.serial('K 1000  4817 2260 B', FIELD.x + FIELD.w - 34, 716, 11, C.ink, { text_anchor: 'end', id: 'T05_SERIAL_PRIMARY' }));
  T.push(S.text('K 1000  4817 2260 B', { transform: `translate(${FIELD.x + FIELD.w - 6} 120) rotate(90)`, font_family: N.INTER, font_size: 10, font_weight: 600, letter_spacing: '0.2em', fill: C.highlight, id: 'T05_SERIAL_VERTICAL' }));
  T.push(N.micro('IMAGINE BEYOND THE EXISTING', gx(5) + 36, 98, 400, 5.2, C.highlight, { id: 'T05_MICROTEXT_1' }));
  T.push(g({ id: 'T05_INFO_ROW' },
    [['VALUE', '01 / 05'], ['PRINCIPLE', 'CREATIVITY'], ['SERIES', 'A 2026'], ['SIZE', '160×75 MM']].map(([k, v], i) => g({},
      N.inter(k, L.block.x + 36 + i * 88, 284 + 0, 8, C.primary, { weight: 700, ls: '0.18em' }),
      N.inter(v, L.block.x + 36 + i * 88, 300, 11, C.ink, { weight: 700, ls: '0.06em' })))));
  T.push(N.micro('CURRENCY FOR THE CREATIVE WORLD', L.block.x + 36, 350, L.block.w - 72, 5.2, C.primary, { id: 'T05_MICROTEXT_2' }));
  ctx.add(7, T);

  /* ===== L08 security & accents ===== */
  const sec = [];
  sec.push(N.thread(L.thread.x, FIELD.y, FIELD.y + FIELD.h, L.thread.w, { a: C.paper, b: C.accent, ink: C.ink, label: 'GRID 1000 · CREATIVITY · GRID 1000 · CREATIVITY' }));
  sec.push(N.tactile(5, 66, 690, C.ink, { bar: 4, h: 20, gap: 6 }));
  sec.push(g({ id: 'REGISTRATION_MARKS' }, PT.regMark(gx(5), 118, 7, C.accent), PT.regMark(gx(5), 650, 7, C.accent)));
  sec.push(path(PT.crossGridD({ x: gx(11) + 8, y: gy(7) - 8, cols: 12, rows: 2, dx: 12, dy: 12, arm: 2 }), { fill: 'none', stroke: C.highlight, stroke_width: 0.7, id: 'MICRO_CROSSES' }));
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
    { t: 'UNFOLD pleat fan', d: 'Six squares share one corner; each is turned 45° and grown by √2.', layer: 'L05' },
    { t: 'Logarithmic spiral', d: 'Every far corner lies on r = u√2·e^0.44φ: a curve from straight edges.', layer: 'L05' },
    { t: 'The spiral outgrows the note', d: 'K6 to K10 keep growing and break the frame. The idea exceeds the page.', layer: 'L03' },
    { t: 'Guilloché medallion', d: 'Rotated ellipses and trochoids ring a window holding the outlined mark.', layer: 'L04 · L06' },
    { t: 'Type crossing colour', d: 'The numerals turn from ink to paper as they leave the type column.', layer: 'L07' },
  ],
  callouts: [
    { code: 'T02', label: 'GRID LOCKUP', pt: [110, 70], side: 'L' },
    { code: 'T03', label: 'THEME TITLE', pt: [200, 180], side: 'L' },
    { code: 'L06', label: 'WATERMARK', pt: [650, 238], side: 'L' },
    { code: 'T01', label: 'DENOMINATION', pt: [260, 520], side: 'L' },
    { code: 'L08', label: 'TACTILE CODE', pt: [90, 700], side: 'L' },
    { code: 'L05', label: 'UNFOLD SYMBOL', pt: [1010, 250], side: 'R' },
    { code: 'L03', label: 'SPIRAL BEYOND NOTE', pt: [1460, 220], side: 'R' },
    { code: 'L08', label: 'SECURITY THREAD', pt: [1334, 470], side: 'R' },
    { code: 'T05', label: 'SERIAL NUMBER', pt: [1480, 705], side: 'R' },
  ],
  zones: [
    { code: 'T01', rect: [L.numerals.x, L.numerals.y - 0.79 * L.numerals.size, N.impactWidth('1000', L.numerals.size), 0.79 * L.numerals.size] },
    { code: 'T02', rect: [L.logo.x, L.logo.y, N.gridLogoWidth(L.logo.h), L.logo.h * 1.45] },
    { code: 'T03', rect: [L.title.x, L.title.y - 0.79 * L.title.size, N.impactWidth('CREATIVITY', L.title.size), 0.79 * L.title.size] },
    { code: 'T04', rect: [L.phrase.x, L.phrase.y - 18, 306, 24] },
    { code: 'L04', circle: [L.medallion.cx, L.medallion.cy, L.medallion.r] },
    { code: 'L05', rect: [heroBox.x0, heroBox.y0, heroBox.x1 - heroBox.x0, heroBox.y1 - heroBox.y0] },
    { code: 'L08', rect: [L.thread.x, FIELD.y, L.thread.w, FIELD.h] },
    { code: 'T05', rect: [1380, 694, 160, 16] },
  ],
  steps,
  facts: [['UNIT u', '75 ÷ √2 = 53.03 px'], ['TURN', '45° per square, clockwise'], ['GROWTH', '× √2 per step · × 2 per 90°'], ['ODD SQUARES', '1 · 2 · 4 · 8 · 16 modules']],
  patterns: {
    P01: 'Medallion, braided rails', P02: 'Polar rings, insets', P03: 'Type column strip', P04: 'Square hatching, pleats',
    P05: 'Top band', P06: 'Pleat tile strip',
  },
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
