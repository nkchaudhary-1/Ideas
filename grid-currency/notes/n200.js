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
const E = require('../lib/engrave');
const R = require('../lib/realism');
const CL = require('../lib/clean');
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
  logo: { x: 1236, y: 52, h: 34 },
  title: { x: 1236, y: 150, size: 44 },
  phrase: { x: 1236, y: 182, size: 16 },
  numerals: { x: 1470, y: 700, size: 290 },          // rotated -90, baseline x
  words: { x: 70, y: 80, size: 17 },
  seal: { cx: 130, cy: 590, r: 44 },
  reg: { x: 1500, y: 600, s: 34 },
  thread: { x: 1188, w: 14 },
  sig: { x: 440, y: 654, w: 300 },
  window: { cx: 256, cy: 375, r: 64 },
};

function build(ctx) {
  const C = ctx.C;
  const [px, py] = SYM.P;
  const gp = (v) => ctx.gap(v);
  const IN = 24;
  const clipPrint = ctx.clip('clip-print', rect(IN, IN, W - IN * 2, H - IN * 2));
  const Lf = left(), Rt = right();
  const orth = [-1, 1].map((sy) => T.pencil({ ...SYM, side: sy, axis: 'y' }));       // up, down

  CL.ground(ctx, { paper: C.paper, fibres: [C.highlight, C.secondary], seed: 200 });
  CL.frame(ctx, { line: C.accent, ink: C.ink });

  /* ===== L03: two discs and four lens overlaps ===== */
  const discL = { geom: (a) => circle(Lf[0].cx, Lf[0].cy, Lf[0].r, a) }, discR = { geom: (a) => circle(Rt[0].cx, Rt[0].cy, Rt[0].r, a) };
  const clipL = ctx.clip('clip-disc-left', circle(Lf[0].cx, Lf[0].cy, Lf[0].r)), clipR = ctx.clip('clip-disc-right', circle(Rt[0].cx, Rt[0].cy, Rt[0].r));
  const upC = orth[0][0], dnC = orth[1][0];
  const lens = (id, clip, c, ink) => g({ id: `OVERLAP_${id}`, clip_path: clip }, circle(c.cx, c.cy, c.r, { fill: ink }));
  ctx.add(3, comment('Two discs. The vertical pencil circles cross them: each lens is a flat multiply ink'),
    g({ id: 'DISCS_K1' }, circle(Lf[0].cx, Lf[0].cy, Lf[0].r, { fill: C.primary, id: 'disc_left_k1' }), circle(Rt[0].cx, Rt[0].cy, Rt[0].r, { fill: C.highlight, id: 'disc_right_k1' })),
    g({ id: 'LENS_OVERLAPS', clip_path: clipPrint },
      lens('UP_LEFT', clipL, upC, ctx.blend(C.primary, C.secondary)), lens('UP_RIGHT', clipR, upC, ctx.blend(C.highlight, C.secondary)),
      lens('DOWN_LEFT', clipL, dnC, ctx.blend(C.primary, C.highlight)), lens('DOWN_RIGHT', clipR, dnC, ctx.blend(C.highlight, C.highlight))));

  /* ===== L04: fine lines, kept light ===== */
  const eng = [];
  eng.push(comment('P02 Contour: the vertical pencils as hairlines (centres on the vertical axis), crossing the mark at 90°'));
  eng.push(g({ id: 'P02_ORTHOGONAL_PENCILS', fill: 'none', stroke: C.pattern, stroke_width: 0.6, clip_path: clipPrint },
    orth.flatMap((fam, i) => fam.slice(0, 4).map((c) => circle(c.cx, c.cy, c.r, { id: `orth_${i ? 'down' : 'up'}_${c.k}` })))));
  const fine = [];
  for (let k = 7; k <= 24; k++) { const c = SYM.C0 / k; fine.push(circle(px - c, py, c), circle(px + c, py, c)); }
  eng.push(g({ id: 'P02_HARMONIC_RINGS', fill: 'none', stroke: C.ink, stroke_width: 0.4 }, fine));
  const fanD = (a0, a1) => {
    let d = '';
    for (let a = a0; a <= a1; a += 3 / ctx.density) {
      const th = a * Math.PI / 180, Lr = 2 * SYM.C0 * Math.abs(Math.cos(th));
      d += `M${f1(px)} ${f1(py)}L${f1(px + Lr * Math.cos(th))} ${f1(py + Lr * Math.sin(th))}`;
    }
    return d;
  };
  eng.push(comment('P04 Hatching: rays from P (lines through P invert to themselves)'));
  eng.push(g({ id: 'P04_FAN_FROM_CONTACT_POINT', fill: 'none', stroke_width: 0.4 }, path(fanD(92, 268), { stroke: C.accent, id: 'fan_left' }), path(fanD(-88, 88), { stroke: C.primary, id: 'fan_right' })));
  ctx.add(4, eng);

  /* ===== L05 primary symbol: the nested pencils ===== */
  const sym = [];
  const lcol = [null, C.secondary, C.primary, C.paper, C.highlight, C.accent];
  const rcol = [null, C.secondary, C.primary, C.paper, C.secondary, C.accent];
  sym.push(comment('COMMON GROUND: two pencils of circles, all tangent at P. Largest first.'));
  [['LEFT', Lf, lcol], ['RIGHT', Rt, rcol]].forEach(([nm, fam, cols]) => {
    sym.push(g({ id: `COMMON_GROUND_${nm}_PENCIL` }, fam.map((c) => c.k === 1
      ? circle(c.cx, c.cy, c.r, { fill: 'none', stroke: C.ink, stroke_width: 1, id: `${nm.toLowerCase()}_k1_r${f(c.r)}` })
      : circle(c.cx, c.cy, c.r, { fill: cols[c.k - 1], stroke: C.ink, stroke_width: 0.9, id: `${nm.toLowerCase()}_k${c.k}_r${f(c.r)}` }))));
  });
  const nd = T.nodes({ P: SYM.P, C0: SYM.C0, kMax: 4 }).filter((n) => Math.hypot(n.x - px, n.y - py) > 3);
  sym.push(g({ id: 'COMMON_GROUND_NODES' }, nd.map((n) => circle(n.x, n.y, 2.4, { fill: C.ink }))));
  sym.push(circle(px, py, 6, { fill: C.ink, stroke: C.paper, stroke_width: 2, id: 'COMMON_GROUND_CONTACT_POINT' }));
  ctx.add(5, sym);

  /* ===== L06 ===== */
  const w = L.window, sc = 0.13;
  ctx.add(6,
    CL.seal(ctx, L.seal.cx, L.seal.cy, L.seal.r, { c1: C.accent, c2: C.primary, c3: C.pattern, ink: C.ink, paper: C.paper }),
    CL.reg(L.reg.x, L.reg.y, L.reg.s, C.accent, C.primary),
    CL.braille(1500, 500, 3, C.ink),
    comment('Watermark window in the left disc: the outlined mark'),
    g({ id: 'WATERMARK_WINDOW' }, circle(w.cx, w.cy, w.r, { fill: C.paper, stroke: C.ink, stroke_width: 1 }),
      g({ fill: 'none', stroke: C.primary, stroke_width: 0.9 }, [...Lf, ...Rt].map((c) => circle(w.cx + (c.cx - px) * sc, w.cy + (c.cy - py) * sc, c.r * sc)))));

  /* ===== L07 ===== */
  const Tt = [];
  Tt.push(N.gridLogo(L.logo.x, L.logo.y, L.logo.h, C.ink, {}));
  Tt.push(N.impact('EMPATHY', L.title.x, L.title.y, L.title.size, C.accent, { id: 'T03_TITLE', letter_spacing: '0.04em' }));
  Tt.push(N.inter('Design for people', L.phrase.x, L.phrase.y, L.phrase.size, C.ink, { weight: 700, id: 'T04_PHRASE' }));
  Tt.push(N.impact('200', 0, 0, L.numerals.size, C.ink, { transform: `translate(${L.numerals.x} ${L.numerals.y}) rotate(-90)`, id: 'T01_DENOMINATION' }));
  Tt.push(CL.words(L.words.x, L.words.y, 'TWO HUNDRED GRID', 'Creative Reserve', { fill: C.ink, size: L.words.size }));
  Tt.push(R.issuer(790, 664, { fill: C.ink, accent: C.accent, words: 'THE VALUE OF TWO HUNDRED GRID', size: 10 }));
  Tt.push(R.signatures(L.sig.x, L.sig.y, L.sig.w, { color: C.ink, label: C.accent, seed: 200, h: 22 }));
  Tt.push(N.impact('200', 1530, 80, 30, C.ink, { text_anchor: 'end', id: 'T01_CORNER_NUMERAL' }));
  Tt.push(N.impact('200', 70, 712, 22, C.accent, { id: 'T01_CORNER_NUMERAL_BL' }));
  Tt.push(N.serial('E 200  6041 8872 F', 1530, 106, 8.5, C.ink, { text_anchor: 'end', id: 'T05_SERIAL_SMALL' }));
  Tt.push(N.serial('E 200  6041 8872 F', 1530, 704, 14, C.accent, { text_anchor: 'end', id: 'T05_SERIAL_PRIMARY' }));
  Tt.push(N.micro('DESIGN FOR PEOPLE · CURRENCY FOR THE CREATIVE WORLD', 40, 18, 1520, 3.8, C.accent, { id: 'T05_MICROPRINT_TOP' }));
  Tt.push(N.micro('GRID CREATIVE RESERVE · 200 GRID · COMMON GROUND · 200 GRID', 40, 738, 1520, 3.8, C.accent, { id: 'T05_MICROPRINT_BOTTOM' }));
  ctx.add(7, Tt);

  /* ===== L08 ===== */
  const sec = [];
  sec.push(N.thread(L.thread.x, IN, H - IN, L.thread.w, { a: C.paper, b: C.accent, ink: C.ink, label: 'GRID 200 · EMPATHY · GRID 200 · EMPATHY' }));
  sec.push(N.tactile(3, 70, 652, C.ink, { bar: 4, h: 18, gap: 6 }));
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
    { t: 'Lenses are their own ink', d: 'The vertical pencil circles cross each disc; every lens is a flat multiply ink.', layer: 'L03' },
    { t: 'Rays from the contact point', d: 'Lines through P invert to themselves: the hairline fan aims every crescent at P.', layer: 'L04' },
    { t: 'Vertical numerals', d: 'The denomination stands in its own column, read from the side, like a spine.', layer: 'L07' },
  ],
  callouts: [
    { code: 'T02', label: 'VALUE IN WORDS', pt: [150, 80], side: 'L' },
    { code: 'L06', label: 'WATERMARK WINDOW', pt: [256, 375], side: 'L' },
    { code: 'L05', label: 'LEFT PENCIL', pt: [330, 520], side: 'L' },
    { code: 'L06', label: 'ROUNDEL SEAL', pt: [L.seal.cx, L.seal.cy], side: 'L' },
    { code: 'T05', label: 'SIGNATURES', pt: [590, 668], side: 'L' },
    { code: 'L03', label: 'LENS OVERLAP', pt: [650, 230], side: 'R' },
    { code: 'L05', label: 'CONTACT POINT P', pt: [650, 375], side: 'R' },
    { code: 'L05', label: 'RIGHT PENCIL', pt: [920, 330], side: 'R' },
    { code: 'T01', label: 'DENOMINATION', pt: [1340, 460], side: 'R' },
    { code: 'T03', label: 'THEME TITLE', pt: [1330, 130], side: 'R' },
  ],
  zones: [
    { code: 'T01', rect: [L.numerals.x - 0.79 * L.numerals.size, L.numerals.y - N.impactWidth('200', L.numerals.size), 0.79 * L.numerals.size, N.impactWidth('200', L.numerals.size)] },
    { code: 'T02', rect: [L.logo.x, L.logo.y, N.gridLogoWidth(L.logo.h), L.logo.h * 1.45] },
    { code: 'T03', rect: [L.title.x, L.title.y - 0.79 * L.title.size, N.impactWidth('EMPATHY', L.title.size), 0.79 * L.title.size] },
    { code: 'T04', rect: [L.phrase.x, L.phrase.y - 14, 170, 20] },
    { code: 'L05', rect: [px_() - 2 * SYM.C0, py_() - SYM.C0, 4 * SYM.C0, 2 * SYM.C0] },
    { code: 'L06', circle: [L.window.cx, L.window.cy, L.window.r] },
    { code: 'L08', rect: [L.thread.x, 24, L.thread.w, 702] },
    { code: 'T05', rect: [1380, 690, 150, 16] },
  ],
  steps,
  facts: [['C0', '3.5 modules = 262.5 px'], ['RADII', 'C0 / k  (k = 1 … 6)'], ['CONTACT', 'P = col 8, row 4'], ['ANGLE', 'pencils cross at 90°']],
  patterns: { P01: 'Roundel seal', P02: 'Orthogonal + harmonic rings', P04: 'Rays from P', P05: 'Intersection nodes' },
  samples: {
    P05: (w, h, c) => g({}, T.nodes({ P: [w / 2, h / 2], C0: 40, kMax: 4 }).map((n) => circle(n.x, n.y, 1.8, { fill: c }))),
    P02: (w, h, c) => g({ fill: 'none', stroke: c, stroke_width: 0.9 }, [1, 2, 3, 4, 5].map((k) => circle(w / 2 - 40 / k, h / 2, 40 / k)), [1, 2, 3, 4, 5].map((k) => circle(w / 2 + 40 / k, h / 2, 40 / k))),
  },
};

module.exports = {
  id: '200', value: 200, key: 'empathy', name: 'Empathy', title: 'EMPATHY', phrase: 'Design for people',
  palette, SYM, L, left, right, build, bp,
};
