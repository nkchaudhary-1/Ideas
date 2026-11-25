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
const EN = require('../lib/engrave');
const R = require('../lib/realism');
const CL = require('../lib/clean');
const B = require('../lib/bpcolors');
const { f, f1, g, rect, circle, path, line, poly, comment, P } = S;
const { gx, gy, FIELD, W, H } = N;

const palette = {
  primary: '#E9C928', secondary: '#D9F06A', accent: '#F29C38', pattern: '#685B16',
  paper: '#FFF6D8', ink: '#282817', highlight: '#F5E66C',
};
const NUM = { x: 1530, y: 690, size: 470 };
const E = [NUM.x - 0.275 * NUM.size, NUM.y - 0.395 * NUM.size];   // centre of the zero
const WAVE = { d: 30, r0: 3.4, R: 11, lambda: 120, tau: 520, shift: 5 };
const L = {
  logo: { x: 70, y: 52, h: 34 },
  title: { x: 70, y: 150, size: 46 },
  phrase: { x: 70, y: 182, size: 16 },
  halo: { r: 250 }, disc: { r: 150 },
  win: { x: 70, y: 232, s: 300 },
  words: { x: 70, y: 620, size: 22 },
  seal: { cx: 1530, cy: 62, r: 26 },
  reg: { x: 1330, y: 52, s: 30 },
  thread: { x: 872, w: 14 },
  sig: { x: 410, y: 636, w: 290 },
};
const markCenter = [L.win.x + L.win.s / 2, L.win.y + L.win.s / 2];
const markDots = () => RP.dots({ E: markCenter, x0: markCenter[0] - 120, y0: markCenter[1] - 120, x1: markCenter[0] + 120, y1: markCenter[1] + 120, d: 30, r0: 2, R: 12.5, lambda: 90, tau: 260 });

function build(ctx) {
  const C = ctx.C;
  const gp = (v) => ctx.gap(v);
  const IN = 24;
  const clipPrint = ctx.clip('clip-print', rect(IN, IN, W - IN * 2, H - IN * 2));
  const hole = ctx.clip('clip-no-window', path(`${S.rectD(IN, IN, W - IN * 2, H - IN * 2)}${S.rectD(L.win.x, L.win.y, L.win.s, L.win.s)}`, { clip_rule: 'evenodd' }));

  CL.ground(ctx, { paper: C.paper, field: C.paper, fibres: [C.highlight, C.secondary], seed: 50 });
  CL.frame(ctx, { line: C.pattern, ink: C.ink });

  /* ===== L03: ripple rings as overlapping translucent discs ===== */
  const discs = [[420, C.primary], [330, C.secondary], [240, C.highlight], [150, C.accent]];
  const ringsG = [];
  discs.forEach(([r, c], i) => ringsG.push(circle(E[0], E[1], r, { fill: c, id: `RIPPLE_DISC_${r}` })));
  // where discs overlap (every ring beyond the first lies inside the next): lens ink between neighbours
  ctx.add(3, comment('Concentric ripple discs, each a pale tint; each ring where two discs meet is a flat multiply ink'),
    g({ id: 'RIPPLE_DISCS', clip_path: hole }, ringsG,
      g({ id: 'RIPPLE_OVERLAP_RINGS' }, [[420, 330], [330, 240], [240, 150]].map(([ro, ri]) => path(`${S.circleD(E[0], E[1], ro)}${S.circleD(E[0], E[1], ri)}`, { fill: ctx.blend(discs.find((d) => d[0] === ro)[1], discs.find((d) => d[0] === ri)[1]), fill_rule: 'evenodd', id: `overlap_ring_${ro}_${ri}`, opacity: undefined })))));

  /* ===== L04 ===== */
  const area = `${S.rectD(IN, IN, W - IN * 2, H - IN * 2)}${S.rectD(L.win.x, L.win.y, L.win.s, L.win.s)}`;
  const dotClip = ctx.clip('clip-dots', path(area, { clip_rule: 'evenodd' }));
  const eng = [];
  const REACH = 640;
  const A = RP.dots({ E, x0: IN, y0: IN, x1: W - IN, y1: H - IN, ...WAVE, d: ctx.gap(WAVE.d), off: [8, 14] })
    .filter((p) => p.dist < REACH).map((p) => ({ ...p, r: p.r * (1 - S.smoothstep(REACH * 0.62, REACH, p.dist)) }));
  eng.push(comment('P05 Dot system: the lattice, resized and pushed by the wave. The epicentre is the zero of the numeral'));
  eng.push(path(RP.dotsD(A), { fill: C.pattern, clip_path: dotClip, id: 'P05_LATTICE_A' }));
  eng.push(comment('P02 Contour: rings at every crest, D = n · 120'));
  eng.push(g({ id: 'P02_CREST_RINGS', fill: 'none', stroke: C.ink, stroke_width: 0.5, clip_path: dotClip }, S.range(5, 1).map((n) => circle(E[0], E[1], n * WAVE.lambda, { id: `crest_${n}` }))));
  eng.push(rect(L.win.x, L.win.y, L.win.s, L.win.s, { fill: C.paper, stroke: C.ink, stroke_width: 1, id: 'SPECIMEN_WINDOW_PAPER' }));
  ctx.add(4, eng);

  /* ===== L05 ===== */
  const m = markDots();
  ctx.add(5, comment('RIPPLE specimen: 11 × 11 lattice, λ = 3 cells'),
    g({ id: 'RIPPLE_SPECIMEN' }, m.filter((p) => p.dist > 1).map((p) => circle(p.x, p.y, p.r, { fill: C.ink })),
      circle(markCenter[0], markCenter[1], m[60].r, { fill: C.accent, stroke: C.ink, stroke_width: 1.2, id: 'RIPPLE_IMPACT_POINT' })));

  /* ===== L06 ===== */
  ctx.add(6,
    CL.seal(ctx, L.seal.cx, L.seal.cy, L.seal.r, { c1: C.pattern, c2: C.accent, c3: C.primary, ink: C.ink, paper: C.paper }),
    CL.reg(L.reg.x, L.reg.y, L.reg.s, C.pattern, C.accent),
    CL.braille(780, 644, 2, C.ink),
    comment('Watermark rings around the specimen at the crests (λ = 90)'),
    g({ id: 'WATERMARK_CREST_RINGS', fill: 'none', stroke: C.pattern, stroke_width: 0.8, clip_path: ctx.clip('clip-window', rect(L.win.x, L.win.y, L.win.s, L.win.s)) }, [1, 2, 3].map((n) => circle(markCenter[0], markCenter[1], n * 90))));

  /* ===== L07 ===== */
  const T = [];
  T.push(N.gridLogo(L.logo.x, L.logo.y, L.logo.h, C.ink, {}));
  T.push(N.impact('IMPACT', L.title.x, L.title.y, L.title.size, C.accent, { id: 'T03_TITLE', letter_spacing: '0.04em' }));
  T.push(N.inter('Create meaningful change', L.phrase.x, L.phrase.y, L.phrase.size, C.ink, { weight: 700, id: 'T04_PHRASE' }));
  T.push(N.impact('50', NUM.x, NUM.y, NUM.size, C.ink, { text_anchor: 'end', id: 'T01_DENOMINATION' }));
  T.push(CL.words(L.words.x, L.words.y, 'FIFTY GRID', 'Creative Reserve · Series A 2026', { fill: C.ink, size: L.words.size }));
  T.push(N.inter('RIPPLE  ·  11 × 11  ·  λ = 3 CELLS', L.win.x, L.win.y + L.win.s + 20, 9, C.ink, { weight: 700, ls: '0.14em', id: 'T05_SPECIMEN_LABEL' }));
  T.push(N.inter('r = r0 + R · e^(−D/τ) · ½(1 + cos 2πD/λ)', L.win.x, L.win.y + L.win.s + 38, 10, C.pattern, { weight: 600, id: 'T05_FORMULA' }));
  T.push(R.issuer(430, 560, { fill: C.ink, accent: C.pattern, words: 'THE VALUE OF FIFTY GRID', size: 10 }));
  T.push(R.signatures(L.sig.x, L.sig.y, L.sig.w, { color: C.ink, label: C.pattern, seed: 50, h: 22 }));
  T.push(N.impact('50', 1476, 80, 30, C.ink, { text_anchor: 'end', id: 'T01_CORNER_NUMERAL' }));
  T.push(N.serial('M 50  0731 4408 K', 1476, 100, 8.5, C.ink, { text_anchor: 'end', id: 'T05_SERIAL_SMALL' }));
  T.push(N.serial('M 50  0731 4408 K', 430, 704, 14, C.pattern, { id: 'T05_SERIAL_PRIMARY' }));
  T.push(N.impact('50', 70, 712, 22, C.accent, { id: 'T01_CORNER_NUMERAL_BL' }));
  T.push(N.micro('CREATE MEANINGFUL CHANGE · CURRENCY FOR THE CREATIVE WORLD', 40, 18, 1520, 3.8, C.pattern, { id: 'T05_MICROPRINT_TOP' }));
  T.push(N.micro('GRID CREATIVE RESERVE · 50 GRID · RIPPLE · 50 GRID', 40, 738, 1520, 3.8, C.pattern, { id: 'T05_MICROPRINT_BOTTOM' }));
  ctx.add(7, T);

  /* ===== L08 ===== */
  const sec = [];
  sec.push(N.thread(L.thread.x, IN, H - IN, L.thread.w, { a: C.paper, b: C.accent, ink: C.ink, label: 'GRID 50 · IMPACT · GRID 50 · IMPACT' }));
  sec.push(N.tactile(1, 140, 692, C.ink, { bar: 4, h: 18, gap: 6 }));
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
    { t: 'RIPPLE lattice', d: 'Dot radius follows a damped cosine of distance from the impact point E.', layer: 'L04 · L05' },
    { t: 'Ripple discs', d: 'Four pale discs centred on E; each ring where two discs meet is a flat multiply ink.', layer: 'L03' },
    { t: 'The zero is the epicentre', d: 'E sits in the counter of the zero. The numeral is the stone, the lattice the water.', layer: 'L03 · L07' },
    { t: 'Crest rings', d: 'Contour rings at D = n · 120 pass through every crest: the wave made visible.', layer: 'L04' },
    { t: 'Dots fade with distance', d: 'Beyond 640 px the lattice has shrunk to nothing: consequences thin out.', layer: 'L04' },
  ],
  callouts: [
    { code: 'T02', label: 'GRID LOCKUP', pt: [150, 70], side: 'L' },
    { code: 'T03', label: 'THEME TITLE', pt: [190, 124], side: 'L' },
    { code: 'L05', label: 'RIPPLE SPECIMEN', pt: [220, 380], side: 'L' },
    { code: 'T02', label: 'VALUE IN WORDS', pt: [150, 626], side: 'L' },
    { code: 'T05', label: 'SIGNATURES', pt: [540, 650], side: 'L' },
    { code: 'L06', label: 'ROUNDEL SEAL', pt: [L.seal.cx, L.seal.cy], side: 'R' },
    { code: 'L03', label: 'RIPPLE DISCS', pt: [1060, 380], side: 'R' },
    { code: 'T01', label: 'DENOMINATION', pt: [1260, 470], side: 'R' },
    { code: 'L08', label: 'SECURITY THREAD', pt: [880, 300], side: 'R' },
  ],
  zones: [
    { code: 'T01', rect: [NUM.x - N.impactWidth('50', NUM.size), NUM.y - 0.79 * NUM.size, N.impactWidth('50', NUM.size), 0.79 * NUM.size] },
    { code: 'T02', rect: [L.logo.x, L.logo.y, N.gridLogoWidth(L.logo.h), L.logo.h * 1.45] },
    { code: 'T03', rect: [L.title.x, L.title.y - 0.79 * L.title.size, N.impactWidth('IMPACT', L.title.size), 0.79 * L.title.size] },
    { code: 'T04', rect: [L.phrase.x, L.phrase.y - 14, 230, 20] },
    { code: 'L05', rect: [L.win.x, L.win.y, L.win.s, L.win.s] },
    { code: 'L03', rect: [E[0] - 420, 24, W - 24 - (E[0] - 420), 702] },
    { code: 'L08', rect: [L.thread.x, 24, L.thread.w, 702] },
    { code: 'T05', rect: [430, 692, 150, 16] },
  ],
  steps,
  facts: [['LATTICE', 'd = 30 px'], ['WAVELENGTH', 'λ = 120 px (note)'], ['DECAY', 'τ = 520 px'], ['EPICENTRE', 'centre of the zero']],
  patterns: { P01: 'Roundel seal', P02: 'Crest rings', P05: 'Dot lattice' },
  samples: {
    P05: (w, h, c) => g({}, miniDots(RP.dots({ E: [w / 2, h / 2], x0: 14, y0: 10, x1: w - 14, y1: h - 8, d: 12, r0: 1, R: 4.5, lambda: 36, tau: 80 }), 0, 0, () => ({ fill: c }))),
    P02: (w, h, c) => g({ fill: 'none', stroke: c, stroke_width: 0.9 }, [1, 2, 3, 4].map((n) => circle(w / 2, h / 2, n * 14))),
  },
};

module.exports = {
  id: '50', value: 50, key: 'impact', name: 'Impact', title: 'IMPACT', phrase: 'Create meaningful change',
  palette, E, NUM, L, build, bp,
};
