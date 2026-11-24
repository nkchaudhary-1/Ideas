'use strict';
/*
 * 50 GRID — IMPACT — "Create meaningful change"
 * Symbol: RIPPLE (symbols/ripple.js) — a dot lattice reshaped by a decaying wave.
 * Composition: a dark masthead above an open field. The epicentre is the counter of the zero in "50":
 * the numeral is the stone, the lattice is the water.
 */
const S = require('../lib/svg');
const PT = require('../lib/patterns');
const N = require('../lib/note');
const RP = require('../symbols/ripple');
const B = require('../lib/bpcolors');
const { f, f1, g, rect, circle, path, line, poly, comment, P } = S;
const { gx, gy, FIELD, W, H } = N;

const palette = {
  primary: '#E9C928', secondary: '#D9F06A', accent: '#F29C38', pattern: '#685B16',
  paper: '#FFF6D8', ink: '#282817', highlight: '#F5E66C',
};
const NUM = { x: 1540, y: 680, size: 520 };
const E = [NUM.x - 0.275 * NUM.size, NUM.y - 0.395 * NUM.size];   // centre of the zero
const WAVE = { d: 30, r0: 3.2, R: 10.5, lambda: 120, tau: 520, shift: 5 };
const L = {
  head: { x: 26, y: 26, w: 1548, h: 110 },
  logo: { x: 62, y: 44, h: 40 },
  title: { x: 300, y: 112, size: 74 },
  phrase: { x: 590, y: 92, size: 26 },
  tab: { x: 1380, w: 220, h: 136 },
  win: { x: 62, y: 190, s: 300 },
  halo: { r: 250 }, disc: { r: 140 },
  thread: { x: 872, w: 18 },
  card: { x: 62, y: 500, w: 300, h: 128 },
};
const markCenter = [L.win.x + L.win.s / 2, L.win.y + L.win.s / 2];
const markDots = () => RP.dots({ E: markCenter, x0: markCenter[0] - 120, y0: markCenter[1] - 120, x1: markCenter[0] + 120, y1: markCenter[1] + 120, d: 30, r0: 2, R: 12.5, lambda: 90, tau: 260 });

function build(ctx) {
  const C = ctx.C;
  const fieldTop = L.head.y + L.head.h;
  N.base(ctx, { paper: C.paper, hairline: C.secondary });
  N.frame(ctx, { ink: C.ink, line: C.pattern, accent: C.ink, corner: C.ink });
  const fieldClip = ctx.clip('clip-field', rect(FIELD.x, FIELD.y, FIELD.w, FIELD.h));

  /* ===== L03 ===== */
  const area = `${S.rectD(FIELD.x, fieldTop, FIELD.w, FIELD.y + FIELD.h - fieldTop)}${S.rectD(L.win.x, L.win.y, L.win.s, L.win.s)}${S.rectD(L.card.x, L.card.y, L.card.w, L.card.h)}`;
  const dotClip = ctx.clip('clip-dots', path(area, { clip_rule: 'evenodd' }));
  const haloClip = ctx.clip('clip-halo', rect(FIELD.x, fieldTop, FIELD.w, FIELD.y + FIELD.h - fieldTop));
  ctx.add(3, comment('Field, masthead, halo, impact disc, specimen window, accent tab'),
    rect(FIELD.x, FIELD.y, FIELD.w, FIELD.h, { fill: C.primary, id: 'FIELD_PRIMARY' }),
    circle(E[0], E[1], L.halo.r, { fill: C.secondary, clip_path: haloClip, id: 'HALO_SECONDARY' }),
    circle(E[0], E[1], L.disc.r, { fill: C.accent, id: 'IMPACT_DISC_ACCENT' }),
    rect(L.head.x, L.head.y, L.head.w, L.head.h, { fill: C.ink, id: 'MASTHEAD_INK' }),
    rect(L.win.x, L.win.y, L.win.s, L.win.s, { fill: C.paper, stroke: C.ink, stroke_width: 1.5, id: 'SPECIMEN_WINDOW_PAPER' }),
    rect(L.card.x, L.card.y, L.card.w, L.card.h, { fill: C.paper, stroke: C.ink, stroke_width: 1.5, id: 'CAPTION_CARD_PAPER' }),
    rect(L.tab.x, 0, L.tab.w, L.tab.h, { fill: C.accent, id: 'ACCENT_TAB_TOP_RIGHT' }));

  /* ===== L04 ===== */
  const eng = [];
  const A = RP.dots({ E, x0: FIELD.x, y0: fieldTop, x1: FIELD.x + FIELD.w, y1: FIELD.y + FIELD.h, ...WAVE, off: [8, 14] });
  const Bd = RP.dots({ E, x0: FIELD.x, y0: fieldTop, x1: FIELD.x + FIELD.w, y1: FIELD.y + FIELD.h, ...WAVE, R: 5, r0: 1.4, off: [23, 29], shift: 3 });
  eng.push(comment('P05 Dot system A: the lattice, resized and pushed by the wave'));
  eng.push(path(RP.dotsD(A), { fill: C.pattern, clip_path: dotClip, id: 'P05_LATTICE_A' }));
  eng.push(comment('P05 Dot system B: a half-cell offset lattice, same wave, smaller'));
  eng.push(path(RP.dotsD(Bd), { fill: C.ink, clip_path: dotClip, id: 'P05_LATTICE_B' }));
  // contour rings at the crests, D = n·λ
  eng.push(comment('P02 Contour: rings at every crest, D = n · 120'));
  eng.push(g({ id: 'P02_CREST_RINGS', fill: 'none', stroke: C.ink, stroke_width: 0.8, clip_path: dotClip },
    S.range(12, 1).map((n) => circle(E[0], E[1], n * WAVE.lambda, { id: `crest_${n}` }))));
  // window micro-grid
  eng.push(rect(L.win.x + 8, L.win.y + 8, L.win.s - 16, L.win.s - 16, { fill: ctx.pat('pat-microgrid-15', PT.patMicroGrid('pat-microgrid-15', { size: 15, color: C.highlight, sw: 0.6, dot: 0 })), id: 'P03_WINDOW_MICROGRID' }));
  // waves on the bottom rail: amplitude and frequency grow toward the impact
  const wv = PT.waveFieldD({ x0: 420, x1: 1150, y0: 692, y1: 712, lines: 4, step: 2.5, ampFn: (u) => 1 + 7 * u * u, freqFn: (u) => 0.05 + 0.2 * u * u, phaseFn: (t) => t * 2 });
  eng.push(comment('P08 Wave system: the rail speeds up and swells toward the impact'));
  eng.push(path(wv, { fill: 'none', stroke: C.pattern, stroke_width: 0.9, id: 'P08_WAVES_RAIL' }));
  ctx.add(4, eng);

  /* ===== L05 ===== */
  const m = markDots();
  const sym = [];
  sym.push(comment('RIPPLE specimen: 11 × 11 lattice, λ = 3 cells'));
  sym.push(g({ id: 'RIPPLE_SPECIMEN' },
    m.filter((p) => p.dist > 1).map((p) => circle(p.x, p.y, p.r, { fill: C.ink })),
    circle(markCenter[0], markCenter[1], m[60].r, { fill: C.accent, stroke: C.ink, stroke_width: 1.5, id: 'RIPPLE_IMPACT_POINT' })));
  ctx.add(5, sym);

  /* ===== L06 ===== */
  const wm = [];
  wm.push(comment('Watermark rings around the specimen, at the crests (λ = 90)'));
  const winClip = ctx.clip('clip-window', rect(L.win.x, L.win.y, L.win.s, L.win.s));
  wm.push(g({ id: 'WATERMARK_CREST_RINGS', fill: 'none', stroke: C.primary, stroke_width: 1, clip_path: winClip },
    [1, 2, 3].map((n) => circle(markCenter[0], markCenter[1], n * 90))));
  const tile = ctx.pat('pat-ripple-tile', PT.patSymbol('pat-ripple-tile', g({ fill: C.pattern }, circle(5, 5, 1.6), circle(15, 5, 2.6), circle(25, 5, 1.6), circle(5, 15, 2.6), circle(15, 15, 4.6, { fill: C.accent }), circle(25, 15, 2.6), circle(5, 25, 1.6), circle(15, 25, 2.6), circle(25, 25, 1.6)), 30));
  wm.push(rect(gx(15) - 20, 686, 360, 30, { fill: tile, id: 'P06_SYMBOL_REPEAT_STRIP' }));
  ctx.add(6, wm);

  /* ===== L07 ===== */
  const T = [];
  T.push(N.gridLogo(L.logo.x, L.logo.y, L.logo.h, C.paper, {}));
  T.push(N.impact('IMPACT', L.title.x, L.title.y, L.title.size, C.primary, { id: 'T03_TITLE' }));
  T.push(N.inter('Create meaningful change', L.phrase.x, L.phrase.y, L.phrase.size, C.paper, { weight: 700, id: 'T04_PHRASE' }));
  T.push(N.inter('VALUE 05 / 05  ·  PRINCIPLE IMPACT  ·  SERIES A 2026', L.phrase.x, 118, 9, C.primary, { weight: 700, ls: '0.18em' }));
  T.push(N.impact('50', NUM.x, NUM.y, NUM.size, C.ink, { text_anchor: 'end', id: 'T01_DENOMINATION' }));
  T.push(N.impact('50', 1548, 98, 66, C.ink, { text_anchor: 'end', id: 'T01_CORNER_NUMERAL' }));
  T.push(N.serial('M 50  0731 4408 K', 1090, 76, 11, C.paper, { id: 'T05_SERIAL_PRIMARY' }));
  T.push(S.text('M 50  0731 4408 K', { transform: `translate(${FIELD.x + 12} 460) rotate(-90)`, font_family: N.INTER, font_size: 10, font_weight: 600, letter_spacing: '0.2em', fill: C.ink, id: 'T05_SERIAL_VERTICAL' }));
  T.push(N.inter('RIPPLE  ·  11 × 11  ·  λ = 3 CELLS', L.card.x + 16, L.card.y + 28, 10, C.ink, { weight: 700, ls: '0.14em', id: 'T05_SPECIMEN_LABEL' }));
  T.push(N.inter('r = r0 + R · e^(−D/τ) · ½(1 + cos 2πD/λ)', L.card.x + 16, L.card.y + 48, 10.5, C.pattern, { weight: 600, id: 'T05_FORMULA' }));
  T.push(N.micro('CREATE MEANINGFUL CHANGE', 470, 160, 360, 5.2, C.pattern, { id: 'T05_MICROTEXT_1' }));
  T.push(N.inter('The zero is the stone.', L.card.x + 16, L.card.y + 84, 14, C.ink, { weight: 700, id: 'T05_STATEMENT_1' }));
  T.push(N.inter('The lattice is everything it reaches.', L.card.x + 16, L.card.y + 104, 12.5, C.ink, { weight: 600, id: 'T05_STATEMENT_2' }));
  ctx.add(7, T);

  /* ===== L08 ===== */
  const sec = [];
  sec.push(N.thread(L.thread.x, L.head.y + L.head.h, FIELD.y + FIELD.h, L.thread.w, { a: C.paper, b: C.accent, ink: C.ink, label: 'GRID 50 · IMPACT · GRID 50 · IMPACT' }));
  sec.push(N.tactile(1, 62, 686, C.ink, { bar: 4, h: 20, gap: 6 }));
  sec.push(g({ id: 'REGISTRATION_MARKS' }, PT.regMark(gx(5) + 20, 175, 7, C.ink), PT.regMark(gx(12), 650, 7, C.ink)));
  sec.push(path(PT.crossGridD({ x: 120, y: 700, cols: 18, rows: 1, dx: 12, dy: 12, arm: 2 }), { fill: 'none', stroke: C.ink, stroke_width: 0.8, id: 'MICRO_CROSSES' }));
  ctx.add(8, sec);
}

/* ======== blueprint data ======== */
const lbl = (str, x, y, a = {}) => S.text(str, { x, y, font_family: N.INTER, font_size: 9, font_weight: 700, fill: B.TX, letter_spacing: '0.06em', ...a });
const miniDots = (ds, ox, oy, fillFn) => ds.map((p) => circle(ox + p.x, oy + p.y, Math.max(0.6, p.r), fillFn(p)));
const grid7 = (opts) => RP.dots({ E: [54, 54], x0: 12, y0: 12, x1: 96, y1: 96, d: 14, ...opts });
const steps = [
  { t: 'LATTICE', d: ['The existing world:', 'equal dots, equal spacing d.'], draw: () => g({}, miniDots(grid7({ r0: 2.6, R: 0, lambda: 1, tau: 1 }), 18, 10, () => ({ fill: B.AM })), lbl('d = 30 PX', 72, 138, { text_anchor: 'middle', fill: B.PK })) },
  { t: 'IMPACT POINT', d: ['One event E lands on a', 'lattice node.'], draw: () => g({}, miniDots(grid7({ r0: 2.6, R: 0, lambda: 1, tau: 1 }), 18, 10, () => ({ fill: B.AM, fill_opacity: 0.5 })), circle(72, 64, 8, { fill: B.PK }), lbl('E', 86, 60, { fill: B.PK })) },
  { t: 'WAVE', d: ['Radius follows a cosine of', 'distance: crests every λ.'],
    draw: () => { let d = ''; for (let x = 8; x <= 136; x += 2) { const dd = x - 8; d += `${x === 8 ? 'M' : 'L'}${x} ${f1(70 - 36 * (0.5 + 0.5 * Math.cos((2 * Math.PI * dd) / 42)))}`; } return g({}, path(d, { fill: 'none', stroke: B.AM, stroke_width: 1.6 }), line(8, 76, 136, 76, { stroke: B.CY, stroke_width: 0.8 }), lbl('λ', 50, 100, { fill: B.PK, text_anchor: 'middle' }), path('M8 90H50', { stroke: B.PK, stroke_width: 1, fill: 'none' }), lbl('r(D)', 8, 24, { fill: B.AM })); } },
  { t: 'DECAY', d: ['Multiply by e^(−D/τ):', 'consequences thin out.'],
    draw: () => { let d = '', e = ''; for (let x = 8; x <= 136; x += 2) { const dd = x - 8, env = Math.exp(-dd / 70); d += `${x === 8 ? 'M' : 'L'}${x} ${f1(76 - 50 * env * (0.5 + 0.5 * Math.cos((2 * Math.PI * dd) / 42)))}`; e += `${x === 8 ? 'M' : 'L'}${x} ${f1(76 - 50 * env)}`; } return g({}, path(e, { fill: 'none', stroke: B.CY, stroke_width: 1, stroke_dasharray: '3 3' }), path(d, { fill: 'none', stroke: B.AM, stroke_width: 1.6 }), lbl('τ = 520 PX', 72, 100, { fill: B.PK, text_anchor: 'middle' })); } },
  { t: 'RESULT', d: ['Same lattice, reshaped:', 'dots swell at each crest.'],
    draw: () => { const C0 = palette; return g({}, rect(8, 8, 128, 128, { fill: C0.paper }), miniDots(RP.dots({ E: [72, 72], x0: 12, y0: 12, x1: 132, y1: 132, d: 14, r0: 1.2, R: 6, lambda: 42, tau: 90, off: [0, 0] }).map((p) => ({ ...p, x: p.x, y: p.y })), 0, 0, (p) => ({ fill: p.dist < 1 ? C0.accent : C0.ink }))); } },
];
const wmk = markDots();
const bp = {
  symbolName: 'RIPPLE',
  serial: 'M 50  0731 4408 K',
  theme: {
    word: 'IMPACT', principle: 'Create meaningful change.',
    story: ['Impact is the value of consequence: what an action does to everything around it.',
      'The 50 note drops one event onto a calm lattice. Dots swell at each crest and are pushed outward, weaker with',
      'distance, never quite zero. The zero of the number is the point of impact, so the numeral itself is the cause.'],
    keywords: ['TRANSFORMATION', 'PROPAGATION', 'INFLUENCE'],
  },
  elements: [
    { t: 'RIPPLE lattice', d: 'Dot radius follows a damped cosine of distance from the impact point E.', layer: 'L05 · L04' },
    { t: 'Crest rings', d: 'Contour rings at D = n · 120 pass through every crest: the wave made visible.', layer: 'L04' },
    { t: 'The zero is the epicentre', d: 'E sits in the counter of the zero. The numeral is the stone, the lattice the water.', layer: 'L03 · L07' },
    { t: 'Two lattices', d: 'A half-cell offset lattice follows the same wave at lower amplitude: a second order effect.', layer: 'L04' },
    { t: 'Speeding rail', d: 'Bottom rail waves gain amplitude and frequency toward the impact.', layer: 'L04' },
  ],
  callouts: [
    { code: 'T02', label: 'GRID LOCKUP', pt: [110, 70], side: 'L' },
    { code: 'T03', label: 'THEME TITLE', pt: [380, 75], side: 'L' },
    { code: 'L05', label: 'RIPPLE SPECIMEN', pt: [212, 340], side: 'L' },
    { code: 'L04', label: 'DOT LATTICE', pt: [520, 520], side: 'L' },
    { code: 'L08', label: 'TACTILE CODE', pt: [70, 696], side: 'L' },
    { code: 'T04', label: 'SUPPORTING PHRASE', pt: [800, 90], side: 'R' },
    { code: 'L08', label: 'SECURITY THREAD', pt: [880, 330], side: 'R' },
    { code: 'T01', label: 'DENOMINATION', pt: [1130, 470], side: 'R' },
    { code: 'L03', label: 'IMPACT DISC E', pt: [E[0], E[1]], side: 'R' },
  ],
  zones: [
    { code: 'T01', rect: [NUM.x - N.impactWidth('50', NUM.size), NUM.y - 0.79 * NUM.size, N.impactWidth('50', NUM.size), 0.79 * NUM.size] },
    { code: 'T02', rect: [L.logo.x, L.logo.y, N.gridLogoWidth(L.logo.h), L.logo.h * 1.45] },
    { code: 'T03', rect: [L.title.x, L.title.y - 0.79 * L.title.size, N.impactWidth('IMPACT', L.title.size), 0.79 * L.title.size] },
    { code: 'T04', rect: [L.phrase.x, L.phrase.y - 20, 340, 26] },
    { code: 'L05', rect: [L.win.x, L.win.y, L.win.s, L.win.s] },
    { code: 'L03', circle: [E[0], E[1], L.halo.r] },
    { code: 'L08', rect: [L.thread.x, L.head.y + L.head.h, L.thread.w, FIELD.h - L.head.h] },
    { code: 'L03', rect: [L.head.x, L.head.y, L.head.w, L.head.h] },
  ],
  steps,
  facts: [['LATTICE', 'd = 30 px'], ['WAVELENGTH', 'λ = 120 px (note)'], ['DECAY', 'τ = 520 px'], ['EPICENTRE', 'centre of the zero']],
  patterns: { P02: 'Crest rings', P03: 'Window micro-grid', P05: 'Twin lattices', P06: 'Ripple tile strip', P08: 'Speeding rail' },
  samples: {
    P05: (w, h, c) => g({}, miniDots(RP.dots({ E: [w / 2, h / 2], x0: 14, y0: 10, x1: w - 14, y1: h - 8, d: 12, r0: 1, R: 4.5, lambda: 36, tau: 80 }), 0, 0, () => ({ fill: c }))),
    P02: (w, h, c) => g({ fill: 'none', stroke: c, stroke_width: 0.9 }, [1, 2, 3, 4].map((n) => circle(w / 2, h / 2, n * 14))),
  },
};

module.exports = {
  id: '50', value: 50, key: 'impact', name: 'Impact', title: 'IMPACT', phrase: 'Create meaningful change',
  palette, E, NUM, L, build, bp,
};
