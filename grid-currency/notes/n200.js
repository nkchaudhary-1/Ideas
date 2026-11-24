'use strict';
/*
 * 200 GRID — EMPATHY — "Design for people"
 * Symbol: COMMON GROUND (symbols/tangent.js) — the grid inverted in a circle: two pencils of circles that touch at one point.
 * Composition: two light discs touch at the centre of a coral field; numerals stand vertically in a column on the right.
 */
const S = require('../lib/svg');
const PT = require('../lib/patterns');
const N = require('../lib/note');
const T = require('../symbols/tangent');
const B = require('../lib/bpcolors');
const { f, f1, g, rect, circle, path, line, poly, comment, P } = S;
const { gx, gy, FIELD, W, H } = N;

const palette = {
  primary: '#F16B67', secondary: '#FFD2B8', accent: '#E94E96', pattern: '#852D52',
  paper: '#FFF1E9', ink: '#49212F', highlight: '#FF9AA8',
};
const SYM = { P: [gx(8), gy(4)], C0: 262.5, kMax: 6 };
const left = () => T.pencil({ ...SYM, side: -1 });
const right = () => T.pencil({ ...SYM, side: 1 });
const L = {
  numerals: { x: 1470, y: 690, size: 330 },       // rotated -90, baseline x
  title: { x: 1559, y: 690, size: 44 },
  column: { x: 1510 },
  logo: { x: 1236, y: 46, h: 38 },
  phrase: { x: 150, y: 62, size: 22 },
  corner: { x: 62, y: 64, size: 40 },
  window: { cx: 256, cy: 375, r: 64 },
  thread: { x: 1188, w: 18 },
};

function build(ctx) {
  const C = ctx.C;
  const [px, py] = SYM.P;
  const fieldClip = ctx.clip('clip-field', rect(FIELD.x, FIELD.y, FIELD.w, FIELD.h));
  const Lf = left(), Rt = right();

  N.base(ctx, { paper: C.paper, hairline: C.secondary });
  N.frame(ctx, { ink: C.ink, line: C.pattern, accent: C.accent, corner: C.accent });

  /* ===== L03 ===== */
  ctx.add(3, comment('Colour fields: one coral field, a magenta column that bleeds off the right edge'),
    rect(FIELD.x, FIELD.y, FIELD.w, FIELD.h, { fill: C.primary, id: 'FIELD_PRIMARY' }),
    rect(L.column.x, 0, W - L.column.x, H, { fill: C.accent, id: 'COLUMN_ACCENT_TITLE' }),
    g({ id: 'DISCS_K1' }, circle(Lf[0].cx, Lf[0].cy, Lf[0].r, { fill: C.secondary, id: 'disc_left_k1' }), circle(Rt[0].cx, Rt[0].cy, Rt[0].r, { fill: C.paper, id: 'disc_right_k1' })));

  /* ===== L04 ===== */
  const eng = [];
  // orthogonal pencils: the other half of the inverted grid, hairlines over everything
  eng.push(comment('P02 Contour — the orthogonal pencils (centres on the vertical axis), crossing the mark at 90°'));
  eng.push(g({ id: 'P02_ORTHOGONAL_PENCILS', fill: 'none', stroke: C.pattern, stroke_width: 0.8, clip_path: fieldClip },
    [-1, 1].flatMap((sy) => T.pencil({ ...SYM, side: sy, axis: 'y' }).map((c) => circle(c.cx, c.cy, c.r, { id: `orth_${sy > 0 ? 'down' : 'up'}_${c.k}` })))));
  // guilloché rails
  const braid = (yc, shift, x0) => PT.braidD({ x0, x1: L.thread.x - 12, yc, amp: 8, lambda: 44, k: 4, shift });
  eng.push(comment('P01 Guilloché braids on the rails'));
  eng.push(path(braid(52, 0, 400), { fill: 'none', stroke: C.pattern, stroke_width: 0.7, id: 'P01_BRAID_TOP' }));
  eng.push(path(braid(698, 1.2, 520), { fill: 'none', stroke: C.pattern, stroke_width: 0.7, id: 'P01_BRAID_BOTTOM' }));
  // fine eccentric rings inside both discs: harmonic contour (k up to 24)
  const fine = [];
  for (let k = 7; k <= 24; k++) { const c = SYM.C0 / k; fine.push(circle(px - c, py, c), circle(px + c, py, c)); }
  eng.push(comment('P02 Contour — the harmonic series continues: r = C0/k for k = 7 … 24 (hairlines near the contact point)'));
  eng.push(g({ id: 'P02_HARMONIC_RINGS', fill: 'none', stroke: C.ink, stroke_width: 0.5 }, fine));
  // a line through P is its own inverse: the fan of rays from P is the third family of the inverted grid
  const fanD = (a0, a1) => {
    let d = '';
    for (let a = a0; a <= a1; a += 2.5) {
      const th = a * Math.PI / 180, Lr = 2 * SYM.C0 * Math.abs(Math.cos(th));
      d += `M${f1(px)} ${f1(py)}L${f1(px + Lr * Math.cos(th))} ${f1(py + Lr * Math.sin(th))}`;
    }
    return d;
  };
  eng.push(comment('P04 Hatching — rays from P: lines through P invert to themselves, so the crescents are hatched toward the contact point'));
  eng.push(g({ id: 'P04_FAN_FROM_CONTACT_POINT', fill: 'none', stroke_width: 0.55 },
    path(fanD(92, 268), { stroke: C.accent, id: 'fan_left' }),
    path(fanD(-88, 88), { stroke: C.pattern, id: 'fan_right' })));
  ctx.add(4, eng);

  /* ===== L05 primary symbol ===== */
  const sym = [];
  const lcol = [C.secondary, C.primary, C.secondary, C.highlight, C.secondary, C.accent];
  const rcol = [C.paper, C.secondary, C.paper, C.primary, C.paper, C.accent];
  sym.push(comment('COMMON GROUND: two pencils of circles, all tangent at P. Largest first.'));
  [['LEFT', Lf, lcol], ['RIGHT', Rt, rcol]].forEach(([nm, fam, cols]) => {
    sym.push(g({ id: `COMMON_GROUND_${nm}_PENCIL` }, fam.map((c) => circle(c.cx, c.cy, c.r, { fill: c.k === 1 ? 'none' : cols[c.k - 1], stroke: C.ink, stroke_width: 1.3, id: `${nm.toLowerCase()}_k${c.k}_r${f(c.r)}` }))));
  });
  // intersection nodes of the two pencils (images of grid vertices)
  const nd = T.nodes({ P: SYM.P, C0: SYM.C0, kMax: 4 }).filter((n) => Math.hypot(n.x - px, n.y - py) > 3);
  sym.push(g({ id: 'COMMON_GROUND_NODES' }, nd.map((n) => circle(n.x, n.y, 2.6, { fill: C.ink }))));
  sym.push(circle(px, py, 6.5, { fill: C.ink, stroke: C.paper, stroke_width: 2, id: 'COMMON_GROUND_CONTACT_POINT' }));
  ctx.add(5, sym);

  /* ===== L06 ===== */
  const wm = [];
  wm.push(comment('Medallion at the contact point: forty-eight circles through P, a rosette of perspectives'));
  const rs = 62;
  wm.push(g({ id: 'MEDALLION_ROSETTE_AT_P', fill: 'none', stroke: C.ink, stroke_width: 0.5 },
    S.range(48).map((i) => { const a = (i * 7.5) * Math.PI / 180; return circle(px + rs * Math.cos(a), py + rs * Math.sin(a), rs); })));
  wm.push(comment('Watermark window in the left disc: the outlined mark'));
  const w = L.window, sc = 0.13;
  const wp = (x, y) => [w.cx + (x - px) * sc * 1 + 0, w.cy + (y - py) * sc];
  wm.push(g({ id: 'WATERMARK_WINDOW' },
    circle(w.cx, w.cy, w.r, { fill: C.paper, stroke: C.ink, stroke_width: 1.2 }),
    g({ fill: 'none', stroke: C.primary, stroke_width: 1 },
      [...Lf, ...Rt].map((c) => circle(w.cx + (c.cx - px) * sc + 0, w.cy + (c.cy - py) * sc, c.r * sc)))));
  ctx.add(6, wm);

  /* ===== L07 ===== */
  const Tt = [];
  Tt.push(N.gridLogo(L.logo.x, L.logo.y, L.logo.h, C.ink, {}));
  Tt.push(N.impact('200', L.corner.x, L.corner.y, L.corner.size, C.ink, { id: 'T01_CORNER_NUMERAL' }));
  Tt.push(N.inter('Design for people', L.phrase.x, L.phrase.y, L.phrase.size, C.ink, { weight: 700, id: 'T04_PHRASE' }));
  Tt.push(N.impact('200', 0, 0, L.numerals.size, C.ink, { transform: `translate(${L.numerals.x} ${L.numerals.y}) rotate(-90)`, id: 'T01_DENOMINATION' }));
  Tt.push(N.impact('EMPATHY', 0, 0, L.title.size, C.paper, { transform: `translate(${L.title.x} ${L.title.y}) rotate(-90)`, letter_spacing: '0.04em', id: 'T03_TITLE' }));
  Tt.push(N.serial('E 200  6041 8872 F', 62, 712, 11, C.ink, { id: 'T05_SERIAL_PRIMARY' }));
  Tt.push(S.text('E 200  6041 8872 F', { transform: `translate(${FIELD.x + FIELD.w - 8} 330) rotate(90)`, font_family: N.INTER, font_size: 10, font_weight: 600, letter_spacing: '0.2em', fill: C.paper, id: 'T05_SERIAL_VERTICAL' }));
  Tt.push(N.micro('DESIGN FOR PEOPLE', px - 70, 112 - 0, 140, 5, C.pattern, { id: 'T05_MICROTEXT_1', y: 98 }));
  Tt.push(g({ id: 'T05_INFO_ROW' }, [['VALUE', '03 / 05'], ['PRINCIPLE', 'EMPATHY'], ['SERIES', 'A 2026']].map(([k, v], i) =>
    g({}, N.inter(k, L.logo.x + i * 90, 132, 8, C.pattern, { weight: 700, ls: '0.18em' }), N.inter(v, L.logo.x + i * 90, 146, 11, C.ink, { weight: 700, ls: '0.06em' })))));
  ctx.add(7, Tt);

  /* ===== L08 ===== */
  const sec = [];
  sec.push(N.thread(L.thread.x, FIELD.y, FIELD.y + FIELD.h, L.thread.w, { a: C.paper, b: C.accent, ink: C.ink, label: 'GRID 200 · EMPATHY · GRID 200 · EMPATHY' }));
  sec.push(N.tactile(3, 300, 676, C.ink, { bar: 4, h: 20, gap: 6 }));
  sec.push(g({ id: 'REGISTRATION_MARKS' }, PT.regMark(gx(2), 100, 7, C.ink), PT.regMark(gx(14), 650, 7, C.ink)));
  sec.push(path(PT.crossGridD({ x: 380, y: 706, cols: 18, rows: 1, dx: 14, dy: 12, arm: 2 }), { fill: 'none', stroke: C.ink, stroke_width: 0.8, id: 'MICRO_CROSSES' }));
  ctx.add(8, sec);
}

/* ======== blueprint data ======== */
const lbl = (str, x, y, a = {}) => S.text(str, { x, y, font_family: N.INTER, font_size: 9, font_weight: 700, fill: B.TX, letter_spacing: '0.06em', ...a });
const fit = (box, k = 1) => { const s = Math.min((box.w - 24) / (2 * SYM.C0 * 2 / 2 * 2), 0.1) ; return s; };
const boxMap = (b, sc, off = 0) => ({ sc, X: (x) => b.w / 2 + (x - SYM.P[0]) * sc + off, Y: (y) => b.h / 2 + 2 + (y - SYM.P[1]) * sc });
const steps = [
  { t: 'GRID & POINT', d: ['A grid, and a vertex P', 'to look from.'],
    draw: (b) => { const m = 18; let d = ''; for (let i = 0; i <= 8; i++) d += `M${6 + i * m} 14V140M6 ${14 + i * m * 1.0}H138`; return g({}, path(d, { stroke: B.CY, stroke_width: 0.7, fill: 'none' }), circle(78, 77, 4.5, { fill: B.PK }), lbl('P', 86, 72, { fill: B.PK })); } },
  { t: 'INVERT A LINE', d: ['A line y = a becomes a circle', 'through P, tangent to the axis.'],
    draw: (b) => g({}, line(6, 78, 138, 78, { stroke: B.CY, stroke_width: 0.8, stroke_dasharray: '3 3' }), line(78, 12, 78, 142, { stroke: B.CY, stroke_width: 0.8, stroke_dasharray: '3 3' }),
      line(8, 30, 136, 30, { stroke: B.TX, stroke_width: 1.2 }), circle(78, 54, 24, { fill: 'none', stroke: B.AM, stroke_width: 1.6 }), circle(78, 78, 3.5, { fill: B.PK }),
      lbl('y = a', 118, 25, { fill: B.TX }), lbl('r = C0 / k', 78, 126, { fill: B.AM, text_anchor: 'middle' })) },
  { t: 'HARMONIC SERIES', d: ['r = C0, C0/2, C0/3 …', 'all tangent at P.'],
    draw: (b) => { const m = boxMap(b, 0.2); return g({}, [...left()].map((c) => circle(m.X(c.cx) + 44, m.Y(c.cy), c.r * 0.2, { fill: 'none', stroke: B.AM, stroke_width: 1.3 })), circle(m.X(px_()) + 44, m.Y(py_()), 3.5, { fill: B.PK })); } },
  { t: 'TWO PENCILS', d: ['Left and right of P: two', 'perspectives, one contact.'],
    draw: (b) => { const m = boxMap(b, 0.125); return g({}, [...left(), ...right()].map((c) => circle(m.X(c.cx), m.Y(c.cy), c.r * 0.125, { fill: 'none', stroke: B.AM, stroke_width: 1.2 })), circle(m.X(px_()), m.Y(py_()), 3.5, { fill: B.PK })); } },
  { t: 'CROSS AT 90°', d: ['The vertical pencils cross them', 'at right angles: the net.'],
    draw: (b) => { const m = boxMap(b, 0.125); return g({}, [...left(), ...right()].map((c) => circle(m.X(c.cx), m.Y(c.cy), c.r * 0.125, { fill: 'none', stroke: B.AM, stroke_width: 1.1 })),
      [-1, 1].flatMap((sy) => T.pencil({ ...SYM, side: sy, axis: 'y' }).map((c) => circle(m.X(c.cx), m.Y(c.cy), c.r * 0.125, { fill: 'none', stroke: B.CY, stroke_width: 0.9 }))),
      T.nodes({ P: SYM.P, C0: SYM.C0, kMax: 3 }).map((n) => circle(m.X(n.x), m.Y(n.y), 1.6, { fill: B.PK }))); } },
];
function px_() { return SYM.P[0]; } function py_() { return SYM.P[1]; }

const bp = {
  symbolName: 'COMMON GROUND',
  serial: 'E 200  6041 8872 F',
  theme: {
    word: 'EMPATHY', principle: 'Design for people.',
    story: ['Empathy is the value of standing somewhere else. The 200 note inverts the GRID itself in a circle: the same lines,',
      'now seen from another point. Two perspectives, left and right, share exactly one point of contact, and every',
      'circle that crosses between them does so at a right angle. Understanding is geometry, not decoration.'],
    keywords: ['CONNECTION', 'PERSPECTIVE', 'UNDERSTANDING'],
  },
  elements: [
    { t: 'Two pencils of circles', d: 'Left and right families, all tangent at P, radii C0 / k: a harmonic series.', layer: 'L05' },
    { t: 'The grid, inverted', d: 'Grid lines become circles through P. The mark is the grid seen from another point.', layer: 'L05' },
    { t: 'Right-angle crossings', d: 'Vertical pencils cross the mark at 90°; their intersections are the dotted nodes.', layer: 'L04 · L05' },
    { t: 'Rosette at the contact point', d: 'Forty-eight circles through P: every direction a perspective can arrive from.', layer: 'L06' },
    { t: 'Vertical numerals', d: 'The denomination stands in its own column, read from the side, like a spine.', layer: 'L07' },
  ],
  callouts: [
    { code: 'T01', label: 'CORNER NUMERAL', pt: [80, 50], side: 'L' },
    { code: 'T04', label: 'SUPPORTING PHRASE', pt: [200, 52], side: 'L' },
    { code: 'L06', label: 'WATERMARK WINDOW', pt: [256, 375], side: 'L' },
    { code: 'L08', label: 'TACTILE CODE', pt: [320, 686], side: 'L' },
        { code: 'L05', label: 'LEFT PENCIL', pt: [330, 560], side: 'L' },
    { code: 'L05', label: 'CONTACT POINT P', pt: [650, 375], side: 'R' },
    { code: 'L05', label: 'RIGHT PENCIL', pt: [900, 330], side: 'R' },
    { code: 'T01', label: 'DENOMINATION', pt: [1340, 420], side: 'R' },
    { code: 'T05', label: 'SERIAL (VERTICAL)', pt: [1568, 500], side: 'R' },
  ],
  zones: [
    { code: 'T01', rect: [L.numerals.x - 0.79 * L.numerals.size, L.numerals.y - N.impactWidth('200', L.numerals.size), 0.79 * L.numerals.size, N.impactWidth('200', L.numerals.size)] },
    { code: 'T02', rect: [L.logo.x, L.logo.y, N.gridLogoWidth(L.logo.h), L.logo.h * 1.45] },
    { code: 'T03', rect: [L.title.x - 0.79 * L.title.size, L.title.y - N.impactWidth('EMPATHY', L.title.size), 0.79 * L.title.size, N.impactWidth('EMPATHY', L.title.size)] },
    { code: 'T04', rect: [L.phrase.x, L.phrase.y - 18, 200, 24] },
    { code: 'L05', rect: [px_() - 2 * SYM.C0, py_() - SYM.C0, 4 * SYM.C0, 2 * SYM.C0] },
    { code: 'L06', circle: [L.window.cx, L.window.cy, L.window.r] },
    { code: 'L08', rect: [L.thread.x, FIELD.y, L.thread.w, FIELD.h] },
    { code: 'T05', rect: [62, 700, 150, 16] },
  ],
  steps,
  facts: [['C0', '3.5 modules = 262.5 px'], ['RADII', 'C0 / k  (k = 1 … 6)'], ['CONTACT', 'P = col 8, row 4'], ['ANGLE', 'pencils cross at 90°']],
  patterns: { P01: 'Braided rails', P02: 'Orthogonal + harmonic rings', P04: 'Rays from P in the crescents', P05: 'Intersection nodes' },
  samples: {
    P05: (w, h, c) => g({}, T.nodes({ P: [w / 2, h / 2], C0: 40, kMax: 4 }).map((n) => circle(n.x, n.y, 1.8, { fill: c }))),
    P02: (w, h, c) => g({ fill: 'none', stroke: c, stroke_width: 0.9 }, [1, 2, 3, 4, 5].map((k) => circle(w / 2 - 40 / k, h / 2, 40 / k)), [1, 2, 3, 4, 5].map((k) => circle(w / 2 + 40 / k, h / 2, 40 / k))),
  },
};

module.exports = {
  id: '200', value: 200, key: 'empathy', name: 'Empathy', title: 'EMPATHY', phrase: 'Design for people',
  palette, SYM, L, left, right, build, bp,
};
