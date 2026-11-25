'use strict';
/*
 * 100 GRID — CRAFT — "Care about every detail"
 * Symbol: DEPTH (symbols/depth.js) — a 3 × 3 × 3 carpet with circle, square, circle holes.
 * Composition: a material sample board. The carpet stands on the left; the right is a 3 × 3 sheet of swatches,
 * each cell its own finish, with the numerals taking the whole middle row. Everything divides by three.
 */
const S = require('../lib/svg');
const PT = require('../lib/patterns');
const N = require('../lib/note');
const D = require('../symbols/depth');
const E = require('../lib/engrave');
const R = require('../lib/realism');
const CL = require('../lib/clean');
const B = require('../lib/bpcolors');
const { f, f1, g, rect, circle, path, line, poly, comment, P } = S;
const { gx, gy, FIELD, W, H } = N;

const palette = {
  primary: '#18866A', secondary: '#B8E4C8', accent: '#54B58D', pattern: '#125543',
  paper: '#F0F3E6', ink: '#18372E', highlight: '#8ED5B6',
};
const CARPET = { x: 74, y: 70, S: 540, levels: 3 };
const SHEET = { x: 704, y: 70, cw: 276, ch: 180 };            // 3 x 3 sheet, cells 276 x 180
const cell = (c, r) => [SHEET.x + c * SHEET.cw, SHEET.y + r * SHEET.ch, SHEET.cw, SHEET.ch];
const L = {
  logo: { h: 38 }, title: { size: 76 },
  numerals: { x: SHEET.x + 22, y: SHEET.y + SHEET.ch * 2 - 12, size: 196 },
  thread: { x: 680, w: 14 },
};

function build(ctx) {
  const C = ctx.C;
  const gp = (v) => ctx.gap(v);
  const hs = D.holes(CARPET);
  const IN = 24;
  const clipPrint = ctx.clip('clip-print', rect(IN, IN, W - IN * 2, H - IN * 2));

  CL.ground(ctx, { paper: C.paper, fibres: [C.highlight, C.secondary], seed: 100 });
  CL.frame(ctx, { line: C.primary, ink: C.ink });

  /* ===== L03: the carpet, and a sample sheet of nine cells, each its own finish ===== */
  const tint = [
    [0, 0, C.primary], [1, 0, C.pattern], [2, 0, C.secondary],
    [0, 1, C.paper], [1, 1, C.paper], [2, 1, C.highlight],
    [0, 2, C.secondary], [1, 2, C.paper], [2, 2, C.highlight],
  ];
  ctx.add(3, comment('Carpet base, and the 3 × 3 sample sheet: pale tints with a flat multiply ink where cells overlap'),
    rect(CARPET.x, CARPET.y, CARPET.S, CARPET.S, { fill: C.primary, id: 'CARPET_BASE_600' }),
    g({ id: 'SAMPLE_SHEET_CELLS' }, tint.map(([c, r, color]) => { const [x, y, w, h] = cell(c, r); return rect(x, y, w, h, { fill: color, id: `CELL_${c}${r}` }); })),
    (() => {
      const nx = SHEET.x + SHEET.cw, ny = SHEET.y + SHEET.ch * 2, r = 62;
      const quad = [[0, 1, C.paper], [1, 1, C.paper], [0, 2, C.secondary], [1, 2, C.paper]];
      return g({ id: 'SHEET_OVERLAP_CIRCLE' }, quad.map(([c, rr, base]) => { const [x, y, w, h] = cell(c, rr); const cl = ctx.clip(`clip-ov-${c}${rr}`, rect(x, y, w, h));
        return g({ clip_path: cl, id: `overlap_${c}${rr}` }, circle(nx, ny, r, { fill: ctx.blend(C.accent, base) })); }));
    })());

  /* ===== L04 ===== */
  const eng = [];
  eng.push(comment('P03 Construction grid across the carpet, one hairline per 600 / 27 px'));
  eng.push(path(D.gridD(CARPET), { fill: 'none', stroke: C.pattern, stroke_width: 0.4, id: 'P03_CARPET_GRID_27' }));
  const st = CARPET.S / 27, hc0 = hs[0];
  let sd = '', count = 0;
  for (let i = 0; i < 27; i++) for (let j = 0; j < 27; j++) {
    const d = (n, k) => Math.floor(n / Math.pow(3, k)) % 3;
    const cx = CARPET.x + (i + 0.5) * st, cy = CARPET.y + (j + 0.5) * st;
    if (d(i, 2) === 1 && d(j, 2) === 1) { if (Math.hypot(cx - hc0.cx, cy - hc0.cy) < hc0.r - 2) continue; }
    else if ((d(i, 1) === 1 && d(j, 1) === 1) || (d(i, 0) === 1 && d(j, 0) === 1)) continue;
    sd += `M${f1(cx - 3)} ${f1(cy - 3)}l6 6M${f1(cx + 3)} ${f1(cy - 3)}l-6 6`; count++;
  }
  eng.push(comment(`P03 Stitches: a cross in each of the ${count} solid cells that are not holes`));
  eng.push(path(sd, { fill: 'none', stroke: C.highlight, stroke_width: 0.8, id: 'P03_STITCH_CROSSES' }));
  const clipCell = (id, c, r) => { const [x, y, w, h] = cell(c, r); return ctx.clip(id, rect(x, y, w, h)); };
  const [a1x, a1y, cw, ch] = cell(0, 0);
  eng.push(comment('Sample sheet finishes: micro-grid, quarter arcs, dots, crosshatch, circle lattice'));
  eng.push(rect(a1x, a1y, cw, ch, { fill: ctx.pat('pat-microgrid-8', PT.patMicroGrid('pat-microgrid-8', { size: 8, color: C.highlight, sw: 0.5, dot: 1, dotColor: C.paper })), id: 'P03_SWATCH_MICROGRID' }));
  const [a3x, a3y] = cell(2, 0);
  eng.push(rect(a3x, a3y, cw, ch, { fill: ctx.pat('pat-tess-quarter', PT.patTess('pat-tess-quarter', { kind: 'quarter', size: 14, color: C.primary, sw: 0.9, fill: C.accent })), id: 'P07_SWATCH_QUARTER_ARCS' }));
  const [c1x, c1y] = cell(0, 2);
  eng.push(rect(c1x, c1y, cw, ch, { fill: ctx.pat('pat-dots-hl', PT.patDots('pat-dots-hl', { gap: 9, r: 1.7, color: C.primary, stagger: true })), id: 'P05_SWATCH_DOTS' }));
  const [c2x, c2y] = cell(1, 2);
  eng.push(g({ id: 'P04_SWATCH_CROSSHATCH', fill: 'none', stroke: C.primary, stroke_width: 0.7 }, path(PT.hatchRectD(c2x, c2y, cw, ch, 45, gp(7))), path(PT.hatchRectD(c2x, c2y, cw, ch, 135, gp(7)), { stroke: C.accent })));
  const [c3x, c3y] = cell(2, 2);
  eng.push(path(PT.circleMeshD({ x: c3x, y: c3y, w: cw, h: ch, r: 15, step: ctx.gap(15) }), { fill: 'none', stroke: C.primary, stroke_width: 0.6, clip_path: clipCell('clip-cell-c3', 2, 2), id: 'P01_SWATCH_CIRCLE_LATTICE' }));
  eng.push(g({ id: 'CARPET_RULERS', fill: 'none', stroke: C.ink, stroke_width: 0.8 },
    path(D.rulerD({ ...CARPET, y: CARPET.y - 2, flip: true }), { id: 'ruler_top' }), path(D.rulerD({ ...CARPET, x: CARPET.x - 2, vertical: true, flip: true }), { id: 'ruler_left' }), path(D.rulerD({ ...CARPET, y: CARPET.y + CARPET.S + 2 }), { id: 'ruler_bottom' })));
  ctx.add(4, eng);

  /* ===== L05 primary symbol: holes are paper; levels 1 and 2 get a translucent-looking tint ===== */
  const sym = [];
  const hcol = { 0: C.paper, 1: C.secondary, 2: C.highlight };
  sym.push(comment('DEPTH: 1 circle, 8 squares, 64 circles. Holes are paper, then pale tints. Solid cells are the carpet.'));
  sym.push(g({ id: 'DEPTH_HOLES' }, [0, 1, 2].map((lv) => g({ id: `DEPTH_LEVEL_${lv}_${lv % 2 === 0 ? 'CIRCLES' : 'SQUARES'}` },
    hs.filter((h) => h.level === lv).map((h) => (h.kind === 'circle'
      ? circle(h.cx, h.cy, h.r, { fill: hcol[lv], stroke: C.pattern, stroke_width: lv === 0 ? 1.4 : 0.7 })
      : rect(h.x, h.y, h.s, h.s, { fill: hcol[lv], stroke: C.pattern, stroke_width: 0.9 })))))));
  ctx.add(5, sym);

  /* ===== L06 ===== */
  const k0 = hs[0];
  const ms = k0.r * 1.36;
  const mini = D.holes({ x: k0.cx - ms / 2, y: k0.cy - ms / 2, S: ms, levels: 3 });
  ctx.add(6,
    CL.seal(ctx, 112, 668, 34, { c1: C.primary, c2: C.accent, c3: C.pattern, ink: C.ink, paper: C.paper }),
    CL.reg(1494, 628, 30, C.primary, C.accent),
    CL.braille(1396, 640, 3, C.ink),
    comment('Watermark: the carpet again, one third scale, inside its own centre hole'),
    g({ id: 'WATERMARK_CARPET_IN_HOLE' }, rect(k0.cx - ms / 2, k0.cy - ms / 2, ms, ms, { fill: C.primary }),
      mini.map((h) => (h.kind === 'circle' ? circle(h.cx, h.cy, h.r, { fill: h.level === 0 ? C.paper : C.highlight }) : rect(h.x, h.y, h.s, h.s, { fill: C.secondary })))));

  /* ===== L07 ===== */
  const Tt = [];
  Tt.push(N.gridLogo(SHEET.x + 22, SHEET.y + 30, L.logo.h, C.paper, { tagline: false }));
  Tt.push(N.impact('CRAFT', SHEET.x + SHEET.cw + 22, SHEET.y + 118, L.title.size, C.paper, { id: 'T03_TITLE', letter_spacing: '0.03em' }));
  Tt.push(N.inter('VALUE 04 / 05', SHEET.x + SHEET.cw + 22, SHEET.y + 36, 9, C.highlight, { weight: 700, ls: '0.18em' }));
  Tt.push(N.impact('100', L.numerals.x, L.numerals.y, L.numerals.size, C.ink, { id: 'T01_DENOMINATION' }));
  const [b2x, b2y] = cell(2, 1);
  Tt.push(N.inter('Care about', b2x + 22, b2y + 46, 24, C.ink, { weight: 700, id: 'T04_PHRASE' }));
  Tt.push(N.inter('every detail', b2x + 22, b2y + 76, 24, C.ink, { weight: 700 }));
  Tt.push(CL.words(b2x + 22, b2y + 118, 'ONE HUNDRED GRID', 'Creative Reserve', { fill: C.ink, size: 15 }));
  [[0, 0, 'P03 · MICRO-GRID'], [2, 0, 'P07 · QUARTER ARCS'], [0, 2, 'P05 · DOTS'], [1, 2, 'P04 · CROSSHATCH'], [2, 2, 'P01 · CIRCLE LATTICE']].forEach(([c, r, t]) => {
    const [x, y, w, h] = cell(c, r);
    Tt.push(g({ id: `T05_TAG_${t.slice(0, 3)}` }, rect(x + 10, y + h - 26, t.length * 6.3 + 14, 17, { fill: C.paper }), N.inter(t, x + 17, y + h - 14, 8, C.ink, { weight: 700, ls: '0.14em' })));
  });
  Tt.push(N.impact('100', 1532, 58, 30, C.ink, { text_anchor: 'end', id: 'T01_CORNER_NUMERAL' }));
    Tt.push(N.serial('C 100  2218 7740 D', 1530, 704, 14, C.primary, { text_anchor: 'end', id: 'T05_SERIAL_PRIMARY' }));
  Tt.push(N.impact('100', 170, 686, 26, C.primary, { id: 'T01_CORNER_NUMERAL_BL' }));
  Tt.push(R.signatures(SHEET.x, 638, 290, { color: C.ink, label: C.primary, seed: 100, h: 22 }));
  Tt.push(R.issuer(1040, 640, { fill: C.ink, accent: C.primary, words: 'THE VALUE OF ONE HUNDRED GRID', size: 10 }));
  Tt.push(N.micro('CARE ABOUT EVERY DETAIL · CURRENCY FOR THE CREATIVE WORLD', 40, 18, 1520, 3.8, C.primary, { id: 'T05_MICROPRINT_TOP' }));
  Tt.push(N.micro('GRID CREATIVE RESERVE · 100 GRID · DEPTH · 100 GRID', 40, 738, 1520, 3.8, C.primary, { id: 'T05_MICROPRINT_BOTTOM' }));
  ctx.add(7, Tt);

  /* ===== L08 ===== */
  const sec = [];
  sec.push(N.thread(L.thread.x, IN, H - IN, L.thread.w, { a: C.paper, b: C.accent, ink: C.ink, label: 'GRID 100 · CRAFT · GRID 100 · CRAFT' }));
  sec.push(N.tactile(2, 290, 652, C.ink, { bar: 4, h: 18, gap: 6 }));
  ctx.add(8, sec);
}

/* ======== blueprint data ======== */
const lbl = (str, x, y, a = {}) => S.text(str, { x, y, font_family: N.INTER, font_size: 9, font_weight: 700, fill: B.TX, letter_spacing: '0.06em', ...a });
const mk = (S0, lv, opts = {}) => {
  const o = 17, ox = 17;
  return D.holes({ x: ox, y: o, S: S0, levels: lv });
};
const stepDraw = (levels, grid, extra = '') => (b) => {
  const S0 = 108, x = 18, y = 12;
  const hs = D.holes({ x, y, S: S0, levels });
  return g({}, rect(x, y, S0, S0, { fill: 'none', stroke: B.AM, stroke_width: 1.4 }),
    grid ? path(D.gridD({ x, y, S: S0, levels: grid }), { stroke: B.CY, stroke_width: 0.6, fill: 'none' }) : '',
    hs.map((h) => (h.kind === 'circle' ? circle(h.cx, h.cy, h.r, { fill: B.AM, fill_opacity: 0.3, stroke: B.AM, stroke_width: 1 }) : rect(h.x, h.y, h.s, h.s, { fill: B.VI, fill_opacity: 0.35, stroke: B.VI, stroke_width: 0.9 }))), extra);
};
const steps = [
  { t: 'DIVIDE × 3', d: ['Square S = 8 modules,', 'cut into 3 × 3 cells.'], draw: (b) => { const x = 18, y = 12, S0 = 108; return g({}, rect(x, y, S0, S0, { fill: 'none', stroke: B.AM, stroke_width: 1.4 }), path(D.gridD({ x, y, S: S0, levels: 1 }), { stroke: B.CY, stroke_width: 1, fill: 'none' }), lbl('200 PX', x + S0 / 2, 138, { text_anchor: 'middle', fill: B.PK })); } },
  { t: 'LEVEL 0 · CIRCLE', d: ['The centre cell becomes', 'a circle hole.'], draw: stepDraw(1, 1, lbl('1 HOLE', 72, 138, { text_anchor: 'middle', fill: B.PK })) },
  { t: 'LEVEL 1 · SQUARES', d: ['8 cells divide again;', 'each centre is a square.'], draw: stepDraw(2, 2, lbl('1 + 8 = 9 HOLES', 72, 138, { text_anchor: 'middle', fill: B.PK })) },
  { t: 'LEVEL 2 · CIRCLES', d: ['64 cells divide once more;', 'circles again.'], draw: stepDraw(3, 3, lbl('1 + 8 + 64 = 73', 72, 138, { text_anchor: 'middle', fill: B.PK })) },
  { t: 'RESULT', d: ['Flat colour by level: paper,', 'mint, accent.'],
    draw: () => { const x = 18, y = 12, S0 = 108; const hs = D.holes({ x, y, S: S0, levels: 3 }); const C0 = palette;
      return g({}, rect(x, y, S0, S0, { fill: C0.primary }), hs.map((h) => (h.kind === 'circle' ? circle(h.cx, h.cy, h.r, { fill: h.level === 0 ? C0.paper : C0.accent }) : rect(h.x, h.y, h.s, h.s, { fill: C0.secondary }))), lbl('512 SOLID CELLS', 72, 138, { text_anchor: 'middle', fill: B.PK })); } },
];
const carpetBox = [CARPET.x, CARPET.y, CARPET.S, CARPET.S];
const bp = {
  symbolName: 'DEPTH',
  serial: 'C 100  2218 7740 D',
  theme: {
    word: 'CRAFT', principle: 'Care about every detail.',
    story: ['Craft is the value of finishing: every scale looked after, including the ones nobody checks.',
      'The 100 note is a carpet divided by three, three times. The shape of the hole alternates with every scale, so no',
      'level repeats the one above it. The same rule lays out the whole note: a sample sheet of nine finished cells.'],
    keywords: ['PRECISION', 'REPETITION', 'REFINEMENT'],
  },
  elements: [
    { t: 'DEPTH carpet', d: '3 × 3 × 3 subdivision: 1 circle, 8 squares, 64 circles. 73 holes, 512 solid cells.', layer: 'L05' },
    { t: 'Circle, square, circle', d: 'The hole alternates with every scale, so no level imitates the one above.', layer: 'L05' },
    { t: 'The note follows the rule', d: 'The right side is a 3 × 3 sheet, cells 292 × 200, numerals across the middle row.', layer: 'L03' },
    { t: 'Watermark inside the hole', d: 'The carpet repeats at one third scale inside its own centre: craft within craft.', layer: 'L06' },
    { t: 'Measured edges', d: 'Rulers on the carpet carry ticks at 27, 9 and 3 divisions, longest at the thirds.', layer: 'L04' },
  ],
  callouts: [
    { code: 'L06', label: 'WATERMARK IN HOLE', pt: [374, 375], side: 'L' },
    { code: 'L05', label: 'DEPTH CARPET', pt: [174, 170], side: 'L' },
    { code: 'L04', label: 'CARPET RULER', pt: [374, 73], side: 'L' },
    { code: 'T05', label: 'SIGNATURES', pt: [850, 650], side: 'L' },
    { code: 'T02', label: 'GRID LOCKUP', pt: [850, 120], side: 'R' },
    { code: 'T03', label: 'THEME TITLE', pt: [1110, 150], side: 'R' },
    { code: 'T01', label: 'DENOMINATION', pt: [850, 330], side: 'R' },
    { code: 'T04', label: 'SUPPORTING PHRASE', pt: [1380, 310], side: 'R' },
    { code: 'L06', label: 'ROUNDEL SEAL', pt: [112, 668], side: 'L' },
  ],
  zones: [
    { code: 'L05', rect: carpetBox },
    { code: 'T02', rect: [SHEET.x + 22, SHEET.y + 30, N.gridLogoWidth(L.logo.h), L.logo.h * 1.0] },
    { code: 'T03', rect: [SHEET.x + SHEET.cw + 22, SHEET.y + 118 - 0.79 * L.title.size, N.impactWidth('CRAFT', L.title.size), 0.79 * L.title.size] },
    { code: 'T01', rect: [L.numerals.x, L.numerals.y - 0.79 * L.numerals.size, N.impactWidth('100', L.numerals.size), 0.79 * L.numerals.size] },
    { code: 'T04', rect: [SHEET.x + 2 * SHEET.cw + 22, SHEET.y + SHEET.ch + 30, 200, 70] },
    { code: 'L03', rect: [SHEET.x, SHEET.y, SHEET.cw * 3, SHEET.ch * 3] },
    { code: 'L08', rect: [L.thread.x, 24, L.thread.w, 702] },
    { code: 'T05', rect: [1380, 690, 150, 16] },
  ],
  steps,
  facts: [['DIVISIONS', '3 · 9 · 27'], ['HOLES', '1 + 8 + 64 = 73'], ['ALTERNATION', 'circle · square · circle'], ['CARPET', '600 px = 8 modules']],
  patterns: { P01: 'Seal, circle lattice swatch', P03: 'Carpet grid, swatch', P04: 'Crosshatch swatch', P05: 'Dot swatch', P07: 'Quarter-arc swatch' },
  samples: {
    P07: (w, h, c) => rect(8, 8, w - 16, h - 16, { fill: 'url(#bp-pat-quarter)' }),
    P06: (w, h, c) => g({ fill: 'none', stroke: c, stroke_width: 1 }, [0, 1, 2, 3].flatMap((i) => [0, 1].map((j) => g({}, rect(14 + i * 34, 14 + j * 34, 26, 26), circle(27 + i * 34, 27 + j * 34, 9))))),
    P01: (w, h, c) => g({ fill: 'none', stroke: c, stroke_width: 0.7, clip_path: 'url(#bp-clip-sample)' }, path(PT.circleMeshD({ x: 8, y: 8, w: w - 16, h: h - 16, r: 11, step: 11 }))),
  },
  extraDefs: [PT.patTess('bp-pat-quarter', { kind: 'quarter', size: 10, color: B.VI, sw: 0.8, fill: B.VI }), '<clipPath id="bp-clip-sample"><rect x="8" y="8" width="140" height="74"/></clipPath>'].join('\n'),
};

module.exports = {
  id: '100', value: 100, key: 'craft', name: 'Craft', title: 'CRAFT', phrase: 'Care about every detail',
  palette, CARPET, SHEET, build, bp,
};
