'use strict';
/*
 * 500 GRID — CLARITY — "Make the complex simple"
 * Symbol: RESOLVE (symbols/resolve.js)
 * Composition: one horizontal flow. A wobbling bundle of eight stripes settles, pairs, merges and arrives as a single
 * bar exactly as tall as the numerals. Everything behind it thins out in step: 6 · 12 · 24 px micro-grids, then flat.
 */
const S = require('../lib/svg');
const PT = require('../lib/patterns');
const N = require('../lib/note');
const R_ = require('../symbols/resolve');
const E = require('../lib/engrave');
const R = require('../lib/realism');
const CL = require('../lib/clean');
const B = require('../lib/bpcolors');
const { f, f1, g, rect, circle, path, line, poly, comment, P } = S;
const { gx, gy, FIELD, W, H } = N;

const palette = {
  primary: '#246BFD', secondary: '#BDE8FF', accent: '#00A6D6', pattern: '#123D8C',
  paper: '#F4F7F4', ink: '#10223C', highlight: '#7CC7FF',
};

const L = {
  logo: { x: 70, y: 52, h: 34 },
  title: { x: 70, y: 150, size: 46 },
  phrase: { x: 70, y: 182, size: 16 },
  bundle: { x0: 24, x1: 1640, cy: 440, t: 24, G: 24, wob: { A: 24, k: 0.02, end: 0.3, dphi: 2.1 } },
  numerals: { x: 1085, y: 536, size: 243 },
  words: { x: 1085, y: 596, size: 24 },
  window: { x: 1110, y: 56, w: 340, h: 150 },
  hatch: { x: 470, y: 56, w: 290, h: 94 },
  seal: { cx: 850, cy: 104, r: 44 },
  reg: { x: 1476, y: 224, s: 34 },
  thread: { x: 1016, w: 14 },
  sig: { x: 70, y: 652, w: 290 },
};
const bundle = () => R_.stripes(L.bundle);

function build(ctx) {
  const C = ctx.C;
  const Rz = bundle();
  const gp = (v) => ctx.gap(v);
  const IN = 24;
  const w = L.window;
  const clipPrint = ctx.clip('clip-print', rect(IN, IN, W - IN * 2, H - IN * 2));
  const top = L.bundle.cy - Rz.height0 / 2, bot = L.bundle.cy + Rz.height0 / 2;

  CL.ground(ctx, { paper: C.paper, fibres: [C.highlight, C.secondary], seed: 500 });
  CL.frame(ctx, { line: C.primary, ink: C.ink });

  /* ===== L03: a pale band behind the bundle, the stripes, and the overlap ink where they cross ===== */
  const stripeClips = Rz.d.map((d, i) => ctx.clip(`clip-stripe-${i}`, path(d)));
  const crossClip = ctx.clip('clip-crossing-zone', rect(IN, top - 30, Rz.boundaries[1] - IN, bot - top + 60));
  const cross = ink => ink;
  ctx.add(3, comment('A pale band behind the bundle'),
    rect(IN, top - 36, W - IN * 2, bot - top + 72, { fill: C.secondary, id: 'BAND_SECONDARY_BEHIND_BUNDLE' }),
    comment('Eight stripes, one ink. Where the wobble makes neighbours cross, the overlap is a flat multiply ink'),
    g({ id: 'RESOLVE_STRIPES', clip_path: clipPrint }, Rz.d.map((d, i) => path(d, { fill: C.primary, id: `stripe_${i + 1}` }))),
    g({ id: 'RESOLVE_STRIPE_OVERLAPS', clip_path: crossClip },
      Rz.d.slice(0, 7).map((d, i) => g({ clip_path: stripeClips[i] }, path(Rz.d[i + 1], { fill: ctx.blend(C.primary, C.primary), id: `overlap_${i + 1}_${i + 2}` })))));

  /* ===== L04 ===== */
  const eng = [];
  const stripeClip = ctx.clip('clip-stripes-union', Rz.d.map((d) => path(d)));
  const hc = R_.hatchColumns(Rz);
  eng.push(comment('P04 Hatching inside the stripes: gap 4, 8, 16, then solid. The density halves as the stripes merge'));
  eng.push(g({ id: 'P04_HATCH_STRIPES', clip_path: stripeClip, fill: 'none', stroke: C.paper },
    hc.map((h) => path(h.d, { stroke_width: h.gap === 4 ? 0.55 : h.gap === 8 ? 0.8 : 1.1, id: `hatch_gap_${h.gap}` }))));
  eng.push(CL.band(L.hatch.x, L.hatch.y, L.hatch.w, L.hatch.h, { color: C.accent, angle: 45, gap: gp(9), sw: 3.2, ground: C.secondary, id: 'P04_STRIPE_BLOCK' }));
  const wl = [];
  for (let i = 0; i < 9; i++) {
    let d = '';
    for (let x = w.x + 10; x <= w.x + w.w - 10; x += gp(2.5)) {
      const u = (x - w.x) / w.w;
      const y = w.y + w.h / 2 + (i - 4) * 13 * (1 - S.smoothstep(0.35, 0.95, u)) + (14 * (1 - S.smoothstep(0.1, 0.7, u))) * Math.sin(0.09 * (x - w.x) + i * 0.7);
      d += `${d ? 'L' : 'M'}${f1(x)} ${f1(y)}`;
    }
    wl.push(d);
  }
  eng.push(comment('P08 Window: nine lines settle into one'));
  eng.push(rect(w.x, w.y, w.w, w.h, { fill: C.paper, stroke: C.primary, stroke_width: 1.2, id: 'WINDOW_PAPER' }));
  eng.push(path(wl.join(''), { fill: 'none', stroke: C.primary, stroke_width: 1.3, id: 'P08_WAVES_WINDOW' }));
  ctx.add(4, eng);

  /* ===== L05 primary symbol: the stage markers ===== */
  const sym = [];
  sym.push(comment('RESOLVE stage markers: where each merge completes'));
  sym.push(g({ id: 'RESOLVE_STAGE_MARKERS' }, Rz.stageX.map(([a, b]) => g({}, path(`M${f1(b)} ${f1(top - 16)}V${f1(bot + 16)}`, { stroke: C.ink, stroke_width: 0.9, stroke_dasharray: '3 3', fill: 'none' }),
    circle(b, L.bundle.cy, 5.5, { fill: C.paper, stroke: C.ink, stroke_width: 1.4 })))));
  ctx.add(5, sym);

  /* ===== L06 ===== */
  ctx.add(6,
    CL.seal(ctx, L.seal.cx, L.seal.cy, L.seal.r, { c1: C.primary, c2: C.highlight, c3: C.pattern, ink: C.ink, paper: C.paper }),
    CL.reg(L.reg.x, L.reg.y, L.reg.s, C.primary, C.accent),
    CL.braille(1420, 604, 3, C.ink));

  /* ===== L07 ===== */
  const T = [];
  T.push(N.gridLogo(L.logo.x, L.logo.y, L.logo.h, C.ink, {}));
  T.push(N.impact('CLARITY', L.title.x, L.title.y, L.title.size, C.accent, { id: 'T03_TITLE', letter_spacing: '0.04em' }));
  T.push(N.inter('Make the complex simple', L.phrase.x, L.phrase.y, L.phrase.size, C.ink, { weight: 700, id: 'T04_PHRASE' }));
  T.push(N.impact('500', L.numerals.x, L.numerals.y, L.numerals.size, C.paper, { id: 'T01_DENOMINATION' }));
  T.push(CL.words(L.words.x, L.words.y + 18, 'FIVE HUNDRED GRID', 'Creative Reserve · Series A 2026', { fill: C.ink, size: L.words.size }));
  [['8', Rz.x0 + 46], ['4', Rz.stageX[0][1]], ['2', Rz.stageX[1][1]], ['1', Rz.stageX[2][1]]].forEach(([n, x]) => {
    T.push(g({ id: `T05_STAGE_LABEL_${n}` }, N.inter(n, x, top - 22, 30, C.ink, { weight: 800, text_anchor: 'middle' }),
      N.inter(n === '1' ? 'BAR' : 'STRIPES', x, top - 8, 7.5, C.ink, { weight: 700, ls: '0.2em', text_anchor: 'middle' })));
  });
  T.push(R.issuer(400, 656, { fill: C.ink, accent: C.primary, words: 'THE VALUE OF FIVE HUNDRED GRID', size: 10 }));
  T.push(R.signatures(L.sig.x, L.sig.y, L.sig.w, { color: C.ink, label: C.primary, seed: 500, h: 22 }));
  T.push(N.impact('500', 1530, 80, 30, C.ink, { text_anchor: 'end', id: 'T01_CORNER_NUMERAL' }));
  T.push(N.serial('A 500  2290 5316 C', 1530, 106, 8.5, C.ink, { text_anchor: 'end', id: 'T05_SERIAL_SMALL' }));
  T.push(N.serial('A 500  2290 5316 C', 1530, 704, 14, C.primary, { text_anchor: 'end', id: 'T05_SERIAL_PRIMARY' }));
  T.push(N.micro('MAKE THE COMPLEX SIMPLE · CURRENCY FOR THE CREATIVE WORLD', 40, 18, 1520, 3.8, C.primary, { id: 'T05_MICROPRINT_TOP' }));
  T.push(N.micro('GRID CREATIVE RESERVE · 500 GRID · RESOLVE · 500 GRID', 40, 738, 1520, 3.8, C.primary, { id: 'T05_MICROPRINT_BOTTOM' }));
  ctx.add(7, T);

  /* ===== L08 ===== */
  const sec = [];
  sec.push(N.thread(L.thread.x, IN, H - IN, L.thread.w, { a: C.paper, b: C.accent, ink: C.ink, label: 'GRID 500 · CLARITY · GRID 500 · CLARITY' }));
  sec.push(N.tactile(4, 1436, 652, C.ink, { bar: 4, h: 18, gap: 6 }));
  ctx.add(8, sec);
}

/* ======== blueprint data ======== */
const lbl = (str, x, y, a = {}) => S.text(str, { x, y, font_family: N.INTER, font_size: 9, font_weight: 700, fill: B.TX, letter_spacing: '0.06em', ...a });
/* mini stripes for construction steps. state 0..3 = how many stages have closed */
function mini(state, extra = '') {
  const tt = 7, G = 7, x = 14, wd = 116, y0 = 24;
  const gapsClosed = (i) => state > R_.gapStage(i) - 0 && state >= R_.gapStage(i) + 1;
  let y = y0; const out = [];
  for (let i = 0; i < 8; i++) {
    out.push(rect(x, y, wd, tt, { fill: B.AM, fill_opacity: 0.3, stroke: B.AM, stroke_width: 1.2 }));
    y += tt + (i < 7 ? (gapsClosed(i) ? 0 : G) : 0);
  }
  return g({}, out, extra);
}
const steps = [
  { t: '8 STRIPES', d: ['Equal thickness t, gap G.', 'Wobble settles first.'],
    draw: () => mini(0, g({}, lbl('t', 138, 31, { fill: B.PK }), lbl('G', 138, 38 + 3, { fill: B.CY }), lbl('WOBBLE → 0', 72, 142, { text_anchor: 'middle', fill: B.PK, font_size: 8 }))) },
  { t: '8 → 4', d: ['Gaps 0 · 2 · 4 · 6 close:', 'the pairs touch.'], draw: () => mini(1, lbl('STAGE 1', 72, 142, { text_anchor: 'middle', fill: B.PK, font_size: 8 })) },
  { t: '4 → 2', d: ['Gaps 1 · 5 close:', 'quads form.'], draw: () => mini(2, lbl('STAGE 2', 72, 142, { text_anchor: 'middle', fill: B.PK, font_size: 8 })) },
  { t: '2 → 1', d: ['Gap 3 closes: one bar,', 'height = 8 t.'], draw: () => mini(3, g({}, path('M10 24V80', { stroke: B.CY, stroke_width: 1.2, fill: 'none' }), lbl('8t', 6, 56, { fill: B.CY, text_anchor: 'end' }), lbl('= NUMERAL CAP HEIGHT', 72, 142, { text_anchor: 'middle', fill: B.PK, font_size: 8 }))) },
  { t: 'DENSITY ÷ 2', d: ['Hatch gap 4 · 8 · 16 · solid,', 'one step per stage.'],
    draw: (b) => {
      const o = [];
      [4, 8, 16].forEach((gp, i) => {
        const x = 8 + i * 30;
        let d = '';
        for (let xx = x; xx < x + 28; xx += gp / 2.5) d += `M${f1(xx)} 24V120`;
        o.push(path(d, { stroke: B.VI, stroke_width: 0.9, fill: 'none' }), lbl(String(gp), x + 14, 134, { text_anchor: 'middle', fill: B.PK }));
      });
      o.push(rect(98, 24, 36, 96, { fill: B.VI, fill_opacity: 0.55 }), lbl('SOLID', 116, 134, { text_anchor: 'middle', fill: B.PK }));
      return g({}, o);
    } },
];

const bb = { x0: L.bundle.x0, y0: L.bundle.cy - 180, x1: 1574 };
const bp = {
  symbolName: 'RESOLVE',
  serial: 'A 500  2290 5316 C',
  theme: {
    word: 'CLARITY', principle: 'Make the complex simple.',
    story: ['Clarity is the value of reduction: keeping what matters and letting the rest settle.',
      'The 500 note starts with eight restless stripes. They calm, pair up, merge and arrive as a single bar, exactly',
      'as tall as the number it carries. Nothing is removed; everything is resolved.'],
    keywords: ['REDUCTION', 'STRUCTURE', 'RESOLUTION'],
  },
  elements: [
    { t: 'RESOLVE bundle', d: 'Eight stripes of equal thickness close their gaps in three stages: 8, 4, 2, 1.', layer: 'L03' },
    { t: 'Overlaps are their own ink', d: 'Where the early wobble makes neighbours cross, the overlap is a flat multiply ink.', layer: 'L03' },
    { t: 'Area is conserved', d: 'Stripe thickness never changes, so the bar is exactly 8 t: the numeral cap height.', layer: 'L03 · L07' },
    { t: 'Density halves', d: 'Hatching inside the stripes runs 4, 8, 16 px then solid, one step per stage.', layer: 'L04' },
    { t: 'Waves that flatten', d: 'Window and rail lines lose amplitude until they run straight and parallel.', layer: 'L04' },
  ],
  callouts: [
    { code: 'T02', label: 'GRID LOCKUP', pt: [150, 70], side: 'L' },
    { code: 'T03', label: 'THEME TITLE', pt: [330, 120], side: 'L' },
    { code: 'L03', label: 'RESOLVE BUNDLE', pt: [260, 440], side: 'L' },
    { code: 'T05', label: 'SIGNATURES', pt: [215, 668], side: 'L' },
    { code: 'L08', label: 'TACTILE CODE', pt: [1452, 660], side: 'R' },
    { code: 'L06', label: 'ROUNDEL SEAL', pt: [L.seal.cx, L.seal.cy], side: 'R' },
    { code: 'L04', label: 'WAVE WINDOW', pt: [1290, 130], side: 'R' },
    { code: 'T01', label: 'DENOMINATION', pt: [1280, 430], side: 'R' },
    { code: 'T02', label: 'VALUE IN WORDS', pt: [1200, 620], side: 'R' },
  ],
  zones: [
    { code: 'T01', rect: [L.numerals.x, L.numerals.y - 0.79 * L.numerals.size, N.impactWidth('500', L.numerals.size), 0.79 * L.numerals.size] },
    { code: 'T02', rect: [L.logo.x, L.logo.y, N.gridLogoWidth(L.logo.h), L.logo.h * 1.45] },
    { code: 'T03', rect: [L.title.x, L.title.y - 0.79 * L.title.size, N.impactWidth('CLARITY', L.title.size), 0.79 * L.title.size] },
    { code: 'T04', rect: [L.phrase.x, L.phrase.y - 14, 230, 20] },
    { code: 'L03', rect: [24, L.bundle.cy - 180, 1552, 360] },
    { code: 'L04', rect: [L.window.x, L.window.y, L.window.w, L.window.h] },
    { code: 'L08', rect: [L.thread.x, 24, L.thread.w, 702] },
    { code: 'T05', rect: [1380, 690, 150, 16] },
  ],
  steps,
  facts: [['STRIPES', '8 · 4 · 2 · 1'], ['THICKNESS', 't = 24 px, constant'], ['BAR', '8 t = 192 px = cap height'], ['DENSITY', 'halves each stage']],
  patterns: { P01: 'Roundel seal', P04: 'Stripe hatching, stripe block', P08: 'Wave window' },
  samples: {
  },
  extraDefs: [6, 12, 24].map((sz, i) => PT.patMicroGrid(`bp-mg-${i}`, { size: sz / 1.5, color: B.VI, sw: 0.6, dot: 0.9 })).join('\n'),
};

module.exports = {
  id: '500', value: 500, key: 'clarity', name: 'Clarity', title: 'CLARITY', phrase: 'Make the complex simple',
  palette, L, bundle, build, bp,
};
