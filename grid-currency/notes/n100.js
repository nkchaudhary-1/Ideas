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
const B = require('../lib/bpcolors');
const { f, f1, g, rect, circle, path, line, poly, comment, P } = S;
const { gx, gy, FIELD, W, H } = N;

const palette = {
  primary: '#18866A', secondary: '#B8E4C8', accent: '#54B58D', pattern: '#125543',
  paper: '#F0F3E6', ink: '#18372E', highlight: '#8ED5B6',
};
const CARPET = { x: gx(0), y: gy(0), S: 600, levels: 3 };
const SHEET = { x: 674, y: 75, cw: 292, ch: 200 };            // 3 × 3 sheet, cells 292 × 200
const cell = (c, r) => [SHEET.x + c * SHEET.cw, SHEET.y + r * SHEET.ch, SHEET.cw, SHEET.ch];
const L = {
  logo: { h: 46 }, title: { size: 92 },
  numerals: { x: SHEET.x + 26, y: SHEET.y + SHEET.ch * 2 - 7, size: 236 },
  thread: { x: 653, w: 18 },
};

function build(ctx) {
  const C = ctx.C;
  const gp = (v) => ctx.gap(v);
  const hs = D.holes(CARPET);
  const fieldClip = ctx.clip('clip-field', rect(FIELD.x, FIELD.y, FIELD.w, FIELD.h));

  R.paper(ctx, { paper: C.paper, fibres: [C.highlight, C.secondary, C.primary, C.accent], seed: 100 });
  R.border(ctx, { c1: C.primary, c2: C.accent, ink: C.ink });

  /* ===== L03 ground ===== */
  const ruled = (x, y, w, h, color, gap, sw, angle = 0) => path(PT.hatchRectD(x, y, w, h, angle, gp(gap)), { fill: 'none', stroke: color, stroke_width: sw });
  const cellFills = [
    [0, 0, C.primary, 'A1_MICROGRID', 1.4], [1, 0, C.pattern, 'A2_TITLE', 1.2], [2, 0, C.secondary, 'A3_TESSELLATION', 1.6],
    [0, 1, C.paper, 'B1_NUMERALS', 0], [1, 1, C.paper, 'B1_NUMERALS_2', 0], [2, 1, C.secondary, 'B2_PHRASE', 1.5],
    [0, 2, C.primary, 'C1_DOTS', 1.4], [1, 2, C.secondary, 'C2_HATCH', 1.6], [2, 2, C.highlight, 'C3_LATTICE', 1.5],
  ];
  ctx.add(3, comment('Ground: ruled primary field and carpet; the sample sheet cells are ruled in their own ink on paper'),
    E.moire({ pts: E.rectPts(FIELD.x, FIELD.y, FIELD.w, FIELD.h), angle: 0, spread: 3, gap: gp(1.8), sw: 1.0, c1: C.primary, c2: C.pattern, id: 'GROUND_MOIRE_FIELD' }),
    g({ id: 'CARPET_BASE_600' }, rect(CARPET.x, CARPET.y, CARPET.S, CARPET.S, { fill: C.paper }),
      ruled(CARPET.x, CARPET.y, CARPET.S, CARPET.S, C.primary, 1.45, 1.05), ruled(CARPET.x, CARPET.y, CARPET.S, CARPET.S, C.pattern, 2.9, 0.3, 90),
      rect(CARPET.x, CARPET.y, CARPET.S, CARPET.S, { fill: 'none', stroke: C.ink, stroke_width: 1.4 })),
    g({ id: 'SAMPLE_SHEET_CELLS' }, cellFills.map(([c, r, color, id, gap]) => { const [x, y, w, h] = cell(c, r);
      return g({ id: `CELL_${id}` }, rect(x, y, w, h, { fill: C.paper }), gap ? ruled(x, y, w, h, color, gap, color === C.pattern ? 1.05 : 1.0) : ''); })));

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
  eng.push(path(sd, { fill: 'none', stroke: C.paper, stroke_width: 0.8, id: 'P03_STITCH_CROSSES' }));
  const clipCell = (id, c, r) => { const [x, y, w, h] = cell(c, r); return ctx.clip(id, rect(x, y, w, h)); };
  const [a1x, a1y, cw, ch] = cell(0, 0);
  eng.push(comment('Sample sheet textures'));
  eng.push(rect(a1x, a1y, cw, ch, { fill: ctx.pat('pat-microgrid-8', PT.patMicroGrid('pat-microgrid-8', { size: 8, color: C.paper, sw: 0.5, dot: 1, dotColor: C.highlight })), id: 'P03_SWATCH_MICROGRID' }));
  const [a3x, a3y] = cell(2, 0);
  eng.push(rect(a3x, a3y, cw, ch, { fill: ctx.pat('pat-tess-quarter', PT.patTess('pat-tess-quarter', { kind: 'quarter', size: 14, color: C.pattern, sw: 0.9, fill: C.accent })), id: 'P07_SWATCH_QUARTER_ARCS' }));
  const [c1x, c1y] = cell(0, 2);
  eng.push(rect(c1x, c1y, cw, ch, { fill: ctx.pat('pat-dots-hl', PT.patDots('pat-dots-hl', { gap: 9, r: 1.7, color: C.paper, stagger: true })), id: 'P05_SWATCH_DOTS' }));
  const [c2x, c2y] = cell(1, 2);
  eng.push(g({ id: 'P04_SWATCH_CROSSHATCH', fill: 'none', stroke: C.pattern, stroke_width: 0.7 }, path(PT.hatchRectD(c2x, c2y, cw, ch, 45, gp(6))), path(PT.hatchRectD(c2x, c2y, cw, ch, 135, gp(6)), { stroke: C.primary })));
  const [c3x, c3y] = cell(2, 2);
  eng.push(path(PT.circleMeshD({ x: c3x, y: c3y, w: cw, h: ch, r: 15, step: ctx.gap(15) }), { fill: 'none', stroke: C.pattern, stroke_width: 0.6, clip_path: clipCell('clip-cell-c3', 2, 2), id: 'P01_SWATCH_CIRCLE_LATTICE' }));
  eng.push(g({ id: 'SAMPLE_SHEET_KEYLINES', fill: 'none', stroke: C.ink, stroke_width: 1.2 },
    rect(SHEET.x, SHEET.y, SHEET.cw * 3, SHEET.ch * 3), path(`M${SHEET.x + SHEET.cw} ${SHEET.y}V${SHEET.y + SHEET.ch}M${SHEET.x + SHEET.cw} ${SHEET.y + SHEET.ch * 2}V${SHEET.y + SHEET.ch * 3}M${SHEET.x + SHEET.cw * 2} ${SHEET.y}V${SHEET.y + SHEET.ch * 3}M${SHEET.x} ${SHEET.y + SHEET.ch}H${SHEET.x + SHEET.cw * 3}M${SHEET.x} ${SHEET.y + SHEET.ch * 2}H${SHEET.x + SHEET.cw * 3}`)));
  eng.push(g({ id: 'CARPET_RULERS', fill: 'none', stroke: C.ink, stroke_width: 0.8 },
    path(D.rulerD({ ...CARPET, y: CARPET.y - 2, flip: true }), { id: 'ruler_top' }), path(D.rulerD({ ...CARPET, x: CARPET.x - 2, vertical: true, flip: true }), { id: 'ruler_left' }), path(D.rulerD({ ...CARPET, y: CARPET.y + CARPET.S + 2 }), { id: 'ruler_bottom' })));
  eng.push(E.lathe({ x0: SHEET.x + 4, x1: SHEET.x + SHEET.cw * 3 - 4, yc: 60, amp: 8, lambda: 36, rows: 6, step: gp(3), swell: 4, color: C.highlight, sw: 0.4, id: 'P01_LATHE_TOP_SHEET' }));
  ctx.add(4, eng);

  /* ===== L05 primary symbol: holes are paper with ruled tone ===== */
  const sym = [];
  const hcol = { 0: null, 1: C.secondary, 2: C.accent };
  sym.push(comment('DEPTH: 1 circle, 8 squares, 64 circles. Paper holes, ruled by level. Solid cells are the ruled carpet.'));
  sym.push(g({ id: 'DEPTH_HOLES' }, [0, 1, 2].map((lv) => g({ id: `DEPTH_LEVEL_${lv}_${lv % 2 === 0 ? 'CIRCLES' : 'SQUARES'}` },
    hs.filter((h) => h.level === lv).map((h) => (h.kind === 'circle'
      ? g({}, circle(h.cx, h.cy, h.r, { fill: C.paper }), lv ? path(PT.hatchCircleD(h.cx, h.cy, h.r, 45, gp(1.6)), { fill: 'none', stroke: hcol[lv], stroke_width: 0.75 }) : '', circle(h.cx, h.cy, h.r, { fill: 'none', stroke: C.pattern, stroke_width: lv === 0 ? 1.6 : 0.8 }))
      : g({}, rect(h.x, h.y, h.s, h.s, { fill: C.paper }), path(PT.hatchRectD(h.x, h.y, h.s, h.s, 0, gp(1.7)), { fill: 'none', stroke: hcol[lv], stroke_width: 0.9 }), rect(h.x, h.y, h.s, h.s, { fill: 'none', stroke: C.pattern, stroke_width: 1 }))))))));
  ctx.add(5, sym);

  /* ===== L06 ===== */
  const wm = [];
  const k0 = hs[0];
  const ms = k0.r * 1.36;
  const mini = D.holes({ x: k0.cx - ms / 2, y: k0.cy - ms / 2, S: ms, levels: 3 });
  wm.push(R.corners(ctx, { paper: C.paper, c1: C.primary, c2: C.pattern, c3: C.accent, ink: C.ink }));
  wm.push(comment('Watermark: the carpet again, one third scale, inside its own centre hole'));
  wm.push(g({ id: 'WATERMARK_CARPET_IN_HOLE' }, rect(k0.cx - ms / 2, k0.cy - ms / 2, ms, ms, { fill: C.paper, stroke: C.pattern, stroke_width: 0.8 }),
    path(PT.hatchRectD(k0.cx - ms / 2, k0.cy - ms / 2, ms, ms, 0, gp(1.4)), { fill: 'none', stroke: C.primary, stroke_width: 0.8 }),
    mini.map((h) => (h.kind === 'circle' ? circle(h.cx, h.cy, h.r, { fill: C.paper, stroke: C.pattern, stroke_width: 0.5 }) : rect(h.x, h.y, h.s, h.s, { fill: C.paper, stroke: C.pattern, stroke_width: 0.5 })))));
  const tile = ctx.pat('pat-craft-tile', PT.patSymbol('pat-craft-tile', g({ fill: 'none', stroke: C.secondary, stroke_width: 1 }, rect(3, 3, 14, 14), circle(10, 10, 5)), 20));
  wm.push(rect(gx(9) + 12, 690, 330, 20, { fill: tile, id: 'P06_SYMBOL_REPEAT_STRIP' }));
  wm.push(g({ id: 'NUMERAL_TAB_TOP_RIGHT' }, rect(1380, 0, 194, 75, { fill: C.paper }), ruled(1380, 0, 194, 75, C.accent, 1.4, 1.0), rect(1380, 0, 194, 75, { fill: 'none', stroke: C.ink, stroke_width: 0.9 }),
    rect(1400, 20, 150, 42, { fill: C.paper }), E.cartouche({ x: 1400, y: 20, w: 150, h: 42, notch: 7, color: C.ink, sw: 1, id: 'cartouche_numeral' })));
  ctx.add(6, wm);

  /* ===== L07 ===== */
  const Tt = [];
  Tt.push(N.gridLogo(SHEET.x + 26, SHEET.y + 40, L.logo.h, C.paper, { tagline: false }));
  Tt.push(N.impact('CRAFT', SHEET.x + SHEET.cw + 24, SHEET.y + 138, L.title.size, C.paper, { id: 'T03_TITLE', letter_spacing: '0.03em' }));
  Tt.push(N.inter('VALUE 04 / 05', SHEET.x + SHEET.cw + 24, SHEET.y + 36, 9, C.highlight, { weight: 700, ls: '0.18em' }));
  Tt.push(R.numerals(ctx, '100', L.numerals.x, L.numerals.y, L.numerals.size, { lines: C.ink, outline: C.ink, gap: 2.4, under: C.paper, id: 'T01_DENOMINATION' }));
  const [b2x, b2y] = cell(2, 1);
  Tt.push(N.inter('Care about', b2x + 24, b2y + 48, 26, C.ink, { weight: 700, id: 'T04_PHRASE' }));
  Tt.push(N.inter('every detail', b2x + 24, b2y + 80, 26, C.ink, { weight: 700 }));
  Tt.push(R.issuer(b2x + 24, b2y + 118, { fill: C.ink, accent: C.pattern, words: 'THE VALUE OF ONE HUNDRED GRID', size: 9 }));
  Tt.push(N.inter('27 × 27 divisions. 73 holes.', b2x + 24, b2y + 176, 10, C.pattern, { weight: 600 }));
  [[0, 0, 'P03 · MICRO-GRID', C.paper], [2, 0, 'P07 · QUARTER ARCS', C.ink], [0, 2, 'P05 · DOTS', C.paper], [1, 2, 'P04 · CROSSHATCH', C.ink], [2, 2, 'P01 · CIRCLE LATTICE', C.ink]].forEach(([c, r, t, col]) => {
    const [x, y, w, h] = cell(c, r);
    Tt.push(g({ id: `T05_TAG_${t.slice(0, 3)}` }, rect(x + 12, y + h - 28, t.length * 6.3 + 14, 18, { fill: col === C.paper ? C.ink : C.paper }), N.inter(t, x + 19, y + h - 15.5, 8, col === C.paper ? C.paper : C.ink, { weight: 700, ls: '0.14em' })));
  });
  Tt.push(N.impact('100', 1475, 54, 36, C.ink, { text_anchor: 'middle', id: 'T01_CORNER_NUMERAL', letter_spacing: '0.03em' }));
  Tt.push(N.serial('C 100  2218 7740 D', FIELD.x + FIELD.w - 24, 714, 13, C.paper, { text_anchor: 'end', id: 'T05_SERIAL_PRIMARY' }));
  Tt.push(N.serial('C 100  2218 7740 D', 1475, 71, 6.5, C.ink, { text_anchor: 'middle', id: 'T05_SERIAL_SMALL' }));
  Tt.push(S.text('C 100  2218 7740 D', { transform: `translate(${FIELD.x + 10} 330) rotate(-90)`, font_family: N.INTER, font_size: 9, font_weight: 600, letter_spacing: '0.2em', fill: C.ink, id: 'T05_SERIAL_VERTICAL' }));
  Tt.push(N.micro('CARE ABOUT EVERY DETAIL', SHEET.x, 40, 600, 4.6, C.highlight, { id: 'T05_MICROTEXT_1' }));
  Tt.push(R.signatures(110, 679, 290, { color: C.paper, label: C.highlight, seed: 100, h: 24 }));
  Tt.push(R.frameMicro('GRID CREATIVE RESERVE · 100 GRID · CARE ABOUT EVERY DETAIL ·', C.ink));
  ctx.add(7, Tt);

  /* ===== L08 ===== */
  const sec = [];
  sec.push(N.thread(L.thread.x, FIELD.y, FIELD.y + FIELD.h, L.thread.w, { a: C.paper, b: C.accent, ink: C.ink, label: 'GRID 100 · CRAFT · GRID 100 · CRAFT' }));
  const fs = [C.accent, C.highlight, C.secondary, C.paper, C.highlight, C.accent].map((color, k, a) => ({ at: k / (a.length - 1), color }));
  sec.push(g({ id: 'FOIL_STRIPE' }, E.iris({ x: SHEET.x + SHEET.cw * 3 + 4, y: SHEET.y, w: 24, h: SHEET.ch * 3, vertical: false, gap: gp(1.3), sw: 0.9, stops: [...fs, ...fs].map((q, i, a) => ({ at: i / (a.length - 1), color: q.color })), id: 'foil_iris' }),
    rect(SHEET.x + SHEET.cw * 3 + 4, SHEET.y, 24, SHEET.ch * 3, { fill: 'none', stroke: C.ink, stroke_width: 0.8 })));
  sec.push(N.tactile(2, 62, 688, C.paper, { bar: 4, h: 20, gap: 6 }));
  sec.push(g({ id: 'REGISTRATION_MARKS' }, PT.regMark(SHEET.x - 12, 689, 6, C.highlight)));
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
    { code: 'L06', label: 'WATERMARK IN HOLE', pt: [350, 375], side: 'L' },
    { code: 'L05', label: 'DEPTH CARPET', pt: [150, 200], side: 'L' },
    { code: 'L04', label: 'CARPET RULER', pt: [350, 73], side: 'L' },
    { code: 'L08', label: 'TACTILE CODE', pt: [75, 698], side: 'L' },
    { code: 'T02', label: 'GRID LOCKUP', pt: [880, 140], side: 'R' },
    { code: 'T03', label: 'THEME TITLE', pt: [1100, 118], side: 'R' },
    { code: 'T01', label: 'DENOMINATION', pt: [780, 284], side: 'R' },
    { code: 'T04', label: 'SUPPORTING PHRASE', pt: [1500, 330], side: 'R' },
    { code: 'L08', label: 'SECURITY THREAD', pt: [662, 560], side: 'L' },
  ],
  zones: [
    { code: 'L05', rect: carpetBox },
    { code: 'T02', rect: [SHEET.x + 26, SHEET.y + 28, N.gridLogoWidth(L.logo.h), L.logo.h * 1.45] },
    { code: 'T03', rect: [SHEET.x + SHEET.cw + 24, SHEET.y + 138 - 0.79 * L.title.size, N.impactWidth('CRAFT', L.title.size), 0.79 * L.title.size] },
    { code: 'T01', rect: [L.numerals.x, L.numerals.y - 0.79 * L.numerals.size, N.impactWidth('100', L.numerals.size), 0.79 * L.numerals.size] },
    { code: 'T04', rect: [SHEET.x + 2 * SHEET.cw + 24, SHEET.y + SHEET.ch + 38, 200, 70] },
    { code: 'L03', rect: [SHEET.x, SHEET.y, SHEET.cw * 3, SHEET.ch * 3] },
    { code: 'L08', rect: [L.thread.x, FIELD.y, L.thread.w, FIELD.h] },
    { code: 'T05', rect: [1380, 698, 160, 16] },
  ],
  steps,
  facts: [['DIVISIONS', '3 · 9 · 27'], ['HOLES', '1 + 8 + 64 = 73'], ['ALTERNATION', 'circle · square · circle'], ['CARPET', '600 px = 8 modules']],
  patterns: { P01: 'Circle lattice swatch', P03: 'Carpet grid, swatch', P04: 'Crosshatch swatch', P05: 'Dot swatch', P06: 'Square-in-circle strip', P07: 'Quarter-arc swatch' },
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
