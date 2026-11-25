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
  block: { x: FIELD.x, y: FIELD.y, w: gx(5) - FIELD.x, h: FIELD.h },          // type column
  medallion: { cx: 650, cy: 238, r: 138, win: 72 },
  numerals: { x: 62, y: 640, size: 280 },
  title: { x: 62, y: 176, size: 58 },
  phrase: { x: 62, y: 208, size: 20 },
  logo: { x: 62, y: 46, h: 40 },
  thread: { x: gx(17) + 6, w: 18 },
  foil: { x: gx(17) - 28, w: 24 },
};

function build(ctx) {
  const C = ctx.C;
  const o = SYM.o;
  const bigSq = big();
  const heroSq = hero();
  const gp = (v) => ctx.gap(v);
  const fieldClip = ctx.clip('clip-field', rect(FIELD.x, FIELD.y, FIELD.w, FIELD.h));
  const blockClip = ctx.clip('clip-block-secondary', rect(L.block.x, L.block.y, L.block.w, L.block.h));
  const violetClip = ctx.clip('clip-block-primary', rect(gx(5), FIELD.y, FIELD.x + FIELD.w - gx(5), FIELD.h));
  const NOTE = [0, 0, W, H];
  const violetPts = E.rectPts(gx(5), FIELD.y, FIELD.x + FIELD.w - gx(5), FIELD.h);

  /* ===== L01 paper ===== */
  R.paper(ctx, { paper: C.paper, fibres: [C.highlight, C.secondary, C.primary, C.accent], seed: 1000 });

  /* ===== L02 border ===== */
  R.border(ctx, { c1: C.primary, c2: C.highlight, ink: C.ink });

  /* ===== L03 ground: tone is made of lines ===== */
  ctx.add(3, comment('Ground tints. Fine ruled fields on paper: an iris blend in the type column, a moiré in the field'),
    E.iris({ x: L.block.x, y: L.block.y, w: L.block.w, h: L.block.h, vertical: false, gap: gp(1.5), sw: 0.7, id: 'GROUND_IRIS_TYPE_COLUMN',
      stops: [{ at: 0, color: C.secondary }, { at: 0.3, color: C.highlight }, { at: 0.55, color: C.secondary }, { at: 0.8, color: C.highlight }, { at: 1, color: C.secondary }] }),
    E.moire({ pts: violetPts, angle: -6, spread: 4, gap: gp(1.9), sw: 0.95, c1: C.primary, c2: C.pattern, id: 'GROUND_MOIRE_FIELD' }));
  const bigColors = { 6: C.pattern, 7: C.primary, 8: C.pattern, 9: C.primary, 10: C.pattern };
  ctx.add(3, comment('The spiral keeps growing: K6 to K10, engraved, running past the edge of the note'),
    g({ id: 'SPIRAL_CONTINUES_BEYOND_NOTE' },
      [...bigSq].reverse().map((q) => {
        const vis = E.clipToRect(q.pts, 0, 0, W, H);
        if (vis.length < 3) return '';
        return g({ id: `K${q.k}_${f(q.side)}px` }, poly(vis, { fill: C.paper }),
          E.ramp({ pts: vis, angle: q.ang, gap: gp(q.k % 2 ? 2.2 : 1.9), w0: 0.5, w1: 1.7, color: bigColors[q.k] }));
      })));

  /* ===== L04 engraving ===== */
  const eng = [];
  const m = L.medallion;
  eng.push(comment('P01 Guilloché: the medallion. Seventy-two rotated ellipses, three families, two trochoids'));
  eng.push(g({ id: 'P01_GUILLOCHE_MEDALLION' },
    circle(m.cx, m.cy, m.r + 3, { fill: C.paper }),
    E.rosetteDense({ cx: m.cx, cy: m.cy, R: m.r, c1: C.primary, c2: C.pattern, c3: C.highlight, density: ctx.density }),
    circle(m.cx, m.cy, m.r + 3, { fill: 'none', stroke: C.ink, stroke_width: 1.1 }),
    circle(m.cx, m.cy, m.r - 10, { fill: 'none', stroke: C.primary, stroke_width: 0.6 })));
  eng.push(comment('P08 Lathe-work bands on the top and bottom rails'));
  [['TOP', 52], ['BOTTOM', 676]].forEach(([nm, yc]) => {
    const mk = (x0, x1, col) => E.lathe({ x0, x1, yc, amp: 9, lambda: 40, rows: 7, step: gp(3), swell: 4, color: col, sw: 0.4 });
    eng.push(g({ id: `P08_LATHE_${nm}` }, mk(FIELD.x + 12, gx(5) - 4, C.primary), mk(gx(5) + 4, FIELD.x + FIELD.w - 12, C.highlight)));
  });
  const ringClip = ctx.clip('clip-rings', rect(gx(11) + 10, FIELD.y, FIELD.x + FIELD.w - gx(11) - 10, FIELD.h));
  eng.push(comment('P02 Contour: polar rings at 75 px · √2^j around the origin'));
  eng.push(g({ id: 'P02_POLAR_RINGS', fill: 'none', stroke: C.highlight, stroke_width: 0.7, clip_path: ringClip },
    S.range(10).map((j) => circle(o[0], o[1], 75 * Math.pow(Math.SQRT2, j), { id: `ring_${j}` }))));
  ctx.add(4, eng);

  /* ===== L05 primary symbol: line-engraved pleats ===== */
  const tone = [C.accent, C.ink, C.highlight, C.pattern, C.ink, C.highlight];
  const sym = [];
  sym.push(comment('UNFOLD, engraved. Each pleat is paper shaded by weight-ramped lines; the overlap half is a ghost of ruled primary'));
  sym.push(g({ id: 'UNFOLD_PLEATS' }, heroSq.map((s) => g({ id: `UNFOLD_PLEAT_${s.k}` },
    poly([s.o, s.A, s.F], { fill: C.paper, id: `pleat_${s.k}_free` }),
    E.ramp({ pts: [s.o, s.A, s.F], angle: s.ang + 90, gap: gp(s.k < 2 ? 1.4 : 2.1), w0: 0.15, w1: s.k === 1 || s.k === 4 ? 1.1 : 1.0, color: tone[s.k] }),
    poly([s.o, s.A, s.F], { fill: 'none', stroke: C.ink, stroke_width: 1.1, stroke_linejoin: 'miter' }),
    s.k ? g({ id: `pleat_${s.k}_overlap` }, poly([s.o, s.A, s.C], { fill: C.paper }),
      path(PT.hatchPolyD([s.o, s.A, s.C], s.ang + 45, gp(2.0)), { fill: 'none', stroke: C.primary, stroke_width: 0.7 }),
      path(PT.hatchPolyD([s.o, s.A, s.C], s.ang - 45, gp(2.0)), { fill: 'none', stroke: C.pattern, stroke_width: 0.35 }),
      poly([s.o, s.A, s.C], { fill: 'none', stroke: C.ink, stroke_width: 1.1 })) : ''))));
  const last = heroSq[heroSq.length - 1];
  sym.push(g({ id: 'UNFOLD_K5_NESTED_HALF' }, poly([last.o, last.F, last.B], { fill: C.paper }),
    E.ramp({ pts: [last.o, last.F, last.B], angle: last.ang + 180, gap: gp(2.1), w0: 0.15, w1: 0.9, color: C.highlight }),
    poly([last.o, last.F, last.B], { fill: 'none', stroke: C.ink, stroke_width: 1.1 })));
  const spiral = U.spiralPoints({ ...SYM, from: -2, to: 5, steps: 14 });
  sym.push(path(S.smoothD(spiral), { fill: 'none', stroke: C.accent, stroke_width: 2.2, id: 'UNFOLD_LOG_SPIRAL' }));
  sym.push(path(S.smoothD(spiral), { fill: 'none', stroke: C.ink, stroke_width: 0.5, id: 'UNFOLD_LOG_SPIRAL_KEYLINE' }));
  sym.push(g({ id: 'UNFOLD_FAR_CORNER_NODES' }, heroSq.map((s) => circle(s.F[0], s.F[1], 4, { fill: C.paper, stroke: C.ink, stroke_width: 1.2 }))));
  sym.push(circle(o[0], o[1], 5, { fill: C.ink, id: 'UNFOLD_ORIGIN' }));
  ctx.add(5, sym);

  /* ===== L06 secondary: watermark window, corner rosettes, numeral tabs ===== */
  const wm = [];
  wm.push(R.corners(ctx, { paper: C.paper, c1: C.primary, c2: C.pattern, c3: C.highlight, ink: C.ink }));
  const tabFill = (x, y, w, h, id) => g({ id }, rect(x, y, w, h, { fill: C.paper }),
    path(PT.hatchRectD(x, y, w, h, 0, gp(1.5)), { fill: 'none', stroke: C.accent, stroke_width: 1.05 }),
    path(PT.hatchRectD(x, y, w, h, 90, gp(1.5)), { fill: 'none', stroke: C.highlight, stroke_width: 0.4 }),
    rect(x, y, w, h, { fill: 'none', stroke: C.ink, stroke_width: 0.9 }));
  wm.push(comment('Numeral tabs: ruled orange on paper, bleeding off the note'),
    tabFill(1380, 0, 220, 112, 'TAB_TOP_RIGHT'), tabFill(1380, 672, 220, 78, 'TAB_BOTTOM_RIGHT'),
    E.cartouche({ x: 1408, y: 22, w: 164, h: 62, notch: 9, color: C.ink, sw: 1.1, id: 'CARTOUCHE_NUMERAL' }));
  wm.push(comment('Watermark window: paper disc holding the outlined UNFOLD, centred on its own bounding box'));
  const bb = U.bbox(heroSq);
  const sc = (m.win * 1.55) / Math.max(bb.x1 - bb.x0, bb.y1 - bb.y0);
  const bc = [(bb.x0 + bb.x1) / 2, (bb.y0 + bb.y1) / 2];
  const wmPt = (p) => [m.cx + (p[0] - bc[0]) * sc, m.cy + (p[1] - bc[1]) * sc];
  wm.push(g({ id: 'WATERMARK_WINDOW' },
    circle(m.cx, m.cy, m.win, { fill: C.paper, stroke: C.ink, stroke_width: 1.2 }),
    circle(m.cx, m.cy, m.win - 5, { fill: 'none', stroke: C.primary, stroke_width: 0.5 }),
    g({ fill: 'none', stroke: C.primary, stroke_width: 0.9, stroke_linejoin: 'miter' },
      heroSq.map((q) => poly([q.o, q.A, q.F].map(wmPt), {})), poly([last.o, last.F, last.B].map(wmPt), {})),
    path(S.smoothD(U.spiralPoints({ ...SYM, from: -2, to: 5, steps: 10 }).map(wmPt)), { fill: 'none', stroke: C.accent, stroke_width: 1.4 }),
    circle(...wmPt(o), 2, { fill: C.ink })));
  const mini = U.squares({ o: [5, 15], u: 2.3, a0: -45, dir: 1, n: 5 });
  const tile = ctx.pat('pat-unfold-tile', PT.patSymbol('pat-unfold-tile', g({}, mini.map((q, i) => poly([q.o, q.A, q.F], { fill: i % 2 ? C.highlight : C.secondary }))), 24));
  wm.push(rect(gx(12) + 8, 692, 330, 18, { fill: tile, id: 'P06_SYMBOL_REPEAT_STRIP' }));
  ctx.add(6, wm);

  /* ===== L07 typography ===== */
  const T = [];
  const ty = ctx.clip('clip-numerals-on-field', rect(gx(5), 0, W, H));
  T.push(N.gridLogo(L.logo.x, L.logo.y, L.logo.h, C.ink, {}));
  T.push(N.impact('CREATIVITY', L.title.x, L.title.y, L.title.size, C.primary, { id: 'T03_TITLE', letter_spacing: '0.04em' }));
  T.push(N.inter('Imagine beyond the existing', L.phrase.x, L.phrase.y, L.phrase.size, C.ink, { weight: 700, id: 'T04_PHRASE' }));
  T.push(R.issuer(L.block.x + 36, 252, { fill: C.ink, accent: C.primary, words: 'THE VALUE OF ONE THOUSAND GRID', size: 11 }));
  T.push(R.signatures(L.block.x + 36, 318, L.block.w - 72, { color: C.ink, label: C.primary, seed: 1000 }));
  T.push(N.micro('CURRENCY FOR THE CREATIVE WORLD', L.block.x + 36, 392, L.block.w - 72, 4.6, C.primary, { id: 'T05_MICROTEXT_2' }));
  T.push(comment('T01 denomination: engraved numerals. Ink ruling on the type column, paper ruling once they cross onto the field'));
  T.push(R.numerals(ctx, '1000', L.numerals.x, L.numerals.y, L.numerals.size, { lines: C.ink, outline: C.ink, id: 'T01_DENOMINATION' }));
  T.push(g({ clip_path: ty, id: 'T01_DENOMINATION_OVERPRINT' }, R.numerals(ctx, '1000', L.numerals.x, L.numerals.y, L.numerals.size, { lines: C.paper, outline: C.paper })));
  T.push(N.impact('1000', 1490, 66, 44, C.ink, { text_anchor: 'middle', id: 'T01_CORNER_NUMERAL_TR', letter_spacing: '0.03em' }));
  T.push(N.serial('K 1000  4817 2260 B', 1490, 101, 8.5, C.ink, { text_anchor: 'middle', id: 'T05_SERIAL_SMALL' }));
  T.push(N.serial('K 1000  4817 2260 B', 1490, 720, 13, C.ink, { text_anchor: 'middle', id: 'T05_SERIAL_PRIMARY' }));
  T.push(S.text('K 1000  4817 2260 B', { transform: `translate(${FIELD.x + FIELD.w - 8} 150) rotate(90)`, font_family: N.INTER, font_size: 9, font_weight: 600, letter_spacing: '0.2em', fill: C.highlight, id: 'T05_SERIAL_VERTICAL' }));
  T.push(N.micro('IMAGINE BEYOND THE EXISTING', gx(5) + 36, 98, 400, 4.6, C.highlight, { id: 'T05_MICROTEXT_1' }));
  T.push(R.frameMicro('GRID CREATIVE RESERVE · 1000 GRID · IMAGINE BEYOND THE EXISTING ·', C.ink));
  ctx.add(7, T);

  /* ===== L08 security ===== */
  const sec = [];
  sec.push(N.thread(L.thread.x, FIELD.y, FIELD.y + FIELD.h, L.thread.w, { a: C.paper, b: C.accent, ink: C.ink, label: 'GRID 1000 · CREATIVITY · GRID 1000 · CREATIVITY' }));
  const fs = [];
  for (let k = 0; k < 6; k++) fs.push({ at: k / 5.001, color: [C.accent, C.highlight, C.secondary, C.paper, C.highlight, C.accent][k] });
  sec.push(comment('Foil stripe, drawn the way iris printing is: interleaved fine lines changing colour along the strip'),
    g({ id: 'FOIL_STRIPE' }, E.iris({ x: L.foil.x, y: FIELD.y, w: L.foil.w, h: FIELD.h, vertical: false, gap: gp(1.3), sw: 0.9, stops: [...fs, ...fs.map((q) => ({ at: q.at, color: q.color }))].map((q, i, a) => ({ at: i / (a.length - 1), color: q.color })), id: 'foil_iris' }),
      rect(L.foil.x, FIELD.y, L.foil.w, FIELD.h, { fill: 'none', stroke: C.ink, stroke_width: 0.8 })));
  sec.push(N.tactile(5, 66, 692, C.ink, { bar: 4, h: 20, gap: 6 }));
  sec.push(g({ id: 'REGISTRATION_MARKS' }, PT.regMark(gx(5), 118, 7, C.accent), PT.regMark(gx(5), 650, 7, C.accent)));
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
    P01: 'Medallion, borders, rosettes', P02: 'Polar rings', P04: 'Ruled ground, pleat shading',
    P06: 'Pleat tile strip', P08: 'Lathe-work rails',
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
