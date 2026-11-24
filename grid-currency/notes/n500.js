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
const R = require('../symbols/resolve');
const B = require('../lib/bpcolors');
const { f, f1, g, rect, circle, path, line, poly, comment, P } = S;
const { gx, gy, FIELD, W, H } = N;

const palette = {
  primary: '#246BFD', secondary: '#BDE8FF', accent: '#00A6D6', pattern: '#123D8C',
  paper: '#F4F7F4', ink: '#10223C', highlight: '#7CC7FF',
};

const L = {
  block: { x: 26, y: 26, w: 494, h: 206 },
  logo: { x: 62, y: 44, h: 40 },
  title: { x: 62, y: 176, size: 72 },
  phrase: { x: 62, y: 212, size: 22 },
  bundle: { x0: 26, x1: 1640, cy: 440, t: 24, G: 24 },
  numerals: { x: 1080, y: 536, size: 243 },
  window: { x: 1110, y: 50, w: 340, h: 150 },
  band: { y: 640 },
  thread: { x: 1016, w: 18 },
};
const bundle = () => R.stripes(L.bundle);

function build(ctx) {
  const C = ctx.C;
  const Rz = bundle();
  const fieldClip = ctx.clip('clip-field', rect(FIELD.x, FIELD.y, FIELD.w, FIELD.h));

  N.base(ctx, { paper: C.paper, hairline: C.secondary });
  N.frame(ctx, { ink: C.ink, line: C.pattern, accent: C.primary, corner: C.primary });

  /* ===== L03 ===== */
  ctx.add(3, comment('Colour fields'),
    rect(FIELD.x, FIELD.y, FIELD.w, FIELD.h, { fill: C.primary, id: 'FIELD_PRIMARY' }),
    rect(L.block.x, L.block.y, L.block.w, L.block.h, { fill: C.accent, id: 'BLOCK_ACCENT_TITLE' }),
    rect(FIELD.x, L.band.y, FIELD.w, FIELD.y + FIELD.h - L.band.y, { fill: C.pattern, id: 'BAND_PATTERN_BOTTOM' }),
    rect(L.window.x, L.window.y, L.window.w, L.window.h, { fill: C.paper, id: 'WINDOW_PAPER' }));

  /* ===== L04 ===== */
  const eng = [];
  // micro-grid density ladder: 6 · 12 · 24 · flat. Clipped to the field minus the title block and the window.
  const holes = `${S.rectD(FIELD.x, FIELD.y, FIELD.w, L.band.y - FIELD.y)}${S.rectD(L.block.x, L.block.y, L.block.w, L.block.h)}${S.rectD(L.window.x, L.window.y, L.window.w, L.window.h)}`;
  const ladderClip = ctx.clip('clip-ladder', path(holes, { clip_rule: 'evenodd' }));
  const sizes = [6, 12, 24];
  const colsX = [FIELD.x, Rz.boundaries[1], Rz.boundaries[2], Rz.boundaries[3]];
  eng.push(comment('P03 Micro-grid density ladder: cell 6, 12, 24 px, then flat — it thins out as the stripes merge'));
  eng.push(g({ id: 'P03_MICROGRID_LADDER', clip_path: ladderClip },
    sizes.map((sz, i) => rect(colsX[i], FIELD.y, colsX[i + 1] - colsX[i], L.band.y - FIELD.y, {
      fill: ctx.pat(`pat-microgrid-${sz}`, PT.patMicroGrid(`pat-microgrid-${sz}`, { size: sz, color: C.pattern, sw: 0.6, dot: sz === 6 ? 0.8 : 1.1, dotColor: C.highlight })),
      id: `ladder_${sz}px` }))));
  // vertical hatch inside the stripes, density halving
  const stripeClip = ctx.clip('clip-stripes', Rz.d.map((d) => path(d)));
  const hc = R.hatchColumns(Rz);
  eng.push(comment('P04 Hatching inside the stripes: gap 4, 8, 16, then solid'));
  eng.push(g({ id: 'P04_HATCH_STRIPES', clip_path: stripeClip, fill: 'none', stroke: C.pattern },
    hc.map((h) => path(h.d, { stroke_width: h.gap === 4 ? 0.7 : h.gap === 8 ? 1 : 1.4, id: `hatch_gap_${h.gap}` }))));
  // bottom band: waves that flatten
  const wv = PT.waveFieldD({ x0: 480, x1: FIELD.x + FIELD.w - 12, y0: 654, y1: 688, lines: 6, step: 3,
    ampFn: (u) => 12 * (1 - S.smoothstep(0.0, 0.55, u)), freqFn: (u) => 0.085, phaseFn: (t) => t * 2.4 });
  eng.push(comment('P08 Wave system: amplitude falls to zero, the lines run straight'));
  eng.push(path(wv, { fill: 'none', stroke: C.highlight, stroke_width: 0.9, id: 'P08_WAVES_BOTTOM_BAND' }));
  // window: nine lines converge and straighten
  const w = L.window;
  const wl = [];
  for (let i = 0; i < 9; i++) {
    let d = '';
    for (let x = w.x + 10; x <= w.x + w.w - 10; x += 2.5) {
      const u = (x - w.x) / w.w;
      const y = w.y + w.h / 2 + (i - 4) * 13 * (1 - S.smoothstep(0.35, 0.95, u)) + (14 * (1 - S.smoothstep(0.1, 0.7, u))) * Math.sin(0.09 * (x - w.x) + i * 0.7);
      d += `${d ? 'L' : 'M'}${f1(x)} ${f1(y)}`;
    }
    wl.push(d);
  }
  eng.push(comment('P08 Window: nine lines settle into one'));
  eng.push(path(wl.join(''), { fill: 'none', stroke: C.primary, stroke_width: 1.1, id: 'P08_WAVES_WINDOW' }));
  // dots in the title block
  eng.push(rect(L.block.x + 360, L.block.y + 14, 120, 86, { fill: ctx.pat('pat-dots-ink', PT.patDots('pat-dots-ink', { gap: 8, r: 1.2, color: C.ink, stagger: true })), id: 'P05_DOT_FIELD_BLOCK' }));
  ctx.add(4, eng);

  /* ===== L05 primary symbol ===== */
  const sym = [];
  sym.push(comment('RESOLVE: eight stripes, thickness constant, gaps closing 8 → 4 → 2 → 1'));
  sym.push(g({ id: 'RESOLVE_STRIPES', clip_path: fieldClip }, Rz.d.map((d, i) => path(d, { fill: C.secondary, id: `stripe_${i + 1}` }))));
  // hatch on top is in L04 (below). Put the hatch above the stripes by re-drawing here, so it is visible
  sym.push(g({ id: 'RESOLVE_STRIPE_HATCH', clip_path: stripeClip, fill: 'none', stroke: C.pattern },
    hc.map((h) => path(h.d, { stroke_width: h.gap === 4 ? 0.7 : h.gap === 8 ? 1 : 1.4 }))));
  const top = L.bundle.cy - Rz.height0 / 2 - 16, bot = L.bundle.cy + Rz.height0 / 2 + 16;
  sym.push(g({ id: 'RESOLVE_STAGE_MARKERS' },
    Rz.stageX.map(([a, b], k) => g({}, path(`M${f1(b)} ${f1(top)}V${f1(bot)}`, { stroke: C.accent, stroke_width: 1.4, stroke_dasharray: '3 3', fill: 'none' }),
      circle(b, L.bundle.cy, 6, { fill: C.accent, stroke: C.ink, stroke_width: 1.4 })))));
  ctx.add(5, sym);

  /* ===== L06 ===== */
  const gh = R.stripes({ x0: 560, x1: 1090, cy: 128, t: 8, G: 8, wob: { A: 5, k: 0.05, end: 0.3 }, step: 5, over: 0 });
  ctx.add(6, comment('Watermark: the bundle again, outline only, at one third scale'),
    g({ id: 'WATERMARK_BUNDLE', fill: 'none', stroke: C.highlight, stroke_width: 0.8 }, gh.d.map((d) => path(d))),
    rect(L.window.x, L.window.y, L.window.w, L.window.h, { fill: 'none', stroke: C.ink, stroke_width: 1.2, id: 'WINDOW_KEYLINE' }));

  /* ===== L07 ===== */
  const T = [];
  T.push(N.gridLogo(L.logo.x, L.logo.y, L.logo.h, C.ink, {}));
  T.push(N.impact('CLARITY', L.title.x, L.title.y, L.title.size, C.ink, { id: 'T03_TITLE' }));
  T.push(N.inter('Make the complex simple', L.phrase.x, L.phrase.y, L.phrase.size, C.ink, { weight: 700, id: 'T04_PHRASE' }));
  T.push(N.impact('500', L.numerals.x, L.numerals.y, L.numerals.size, C.ink, { id: 'T01_DENOMINATION' }));
  T.push(N.impact('500', 1536, 86, 44, C.paper, { text_anchor: 'end', id: 'T01_CORNER_NUMERAL' }));
  [['8', Rz.x0 + 40], ['4', Rz.stageX[0][1]], ['2', Rz.stageX[1][1]], ['1', Rz.stageX[2][1]]].forEach(([n, x], i) => {
    T.push(g({ id: `T05_STAGE_LABEL_${n}` },
      N.inter(n, x, 252, 34, C.paper, { weight: 800, text_anchor: 'middle' }),
      N.inter(n === '1' ? 'BAR' : 'STRIPES', x, 264, 7.5, C.highlight, { weight: 700, ls: '0.2em', text_anchor: 'middle' })));
  });
  T.push(N.inter('8 STRIPES → 1 BAR  ·  BAR HEIGHT 8 t = NUMERAL CAP HEIGHT', 1085, 574, 11, C.paper, { weight: 700, ls: '0.14em', id: 'T05_ANNOTATION' }));
  T.push(N.inter('Nothing is removed. Everything is resolved.', 1085, 606, 15, C.secondary, { weight: 600, id: 'T05_STATEMENT' }));
  T.push(N.serial('A 500  2290 5316 C', FIELD.x + FIELD.w - 24, 710, 11, C.paper, { text_anchor: 'end', id: 'T05_SERIAL_PRIMARY' }));
  T.push(S.text('A 500  2290 5316 C', { transform: `translate(${FIELD.x + FIELD.w - 8} 240) rotate(90)`, font_family: N.INTER, font_size: 10, font_weight: 600, letter_spacing: '0.2em', fill: C.highlight, id: 'T05_SERIAL_VERTICAL' }));
  T.push(N.micro('MAKE THE COMPLEX SIMPLE', 1110, 226, 340, 5.2, C.highlight, { id: 'T05_MICROTEXT_1' }));
  T.push(N.micro('CURRENCY FOR THE CREATIVE WORLD', 62, 232 - 0, 420, 5, C.ink, { id: 'T05_MICROTEXT_2', y: 224 }));
  T.push(g({ id: 'T05_INFO_ROW' }, [['VALUE', '02 / 05'], ['PRINCIPLE', 'CLARITY'], ['SERIES', 'A 2026']].map(([k, v], i) =>
    g({}, N.inter(k, 62 + i * 96, 672 + 0, 8, C.highlight, { weight: 700, ls: '0.18em', y: 668 }), N.inter(v, 62 + i * 96, 684, 11, C.paper, { weight: 700, ls: '0.06em' })))));
  ctx.add(7, T);

  /* ===== L08 ===== */
  const sec = [];
  sec.push(N.thread(L.thread.x, FIELD.y, L.band.y, L.thread.w, { a: C.paper, b: C.accent, ink: C.ink, label: 'GRID 500 · CLARITY · GRID 500 · CLARITY' }));
  sec.push(N.tactile(4, 400, 674, C.paper, { bar: 4, h: 20, gap: 6 }));
  sec.push(g({ id: 'REGISTRATION_MARKS' }, PT.regMark(L.block.x + L.block.w, 100, 7, C.ink), PT.regMark(gx(5), 650, 7, C.highlight)));
  sec.push(path(PT.crossGridD({ x: 760, y: 292 - 0, cols: 14, rows: 1, dx: 14, dy: 12, arm: 2 }), { fill: 'none', stroke: C.highlight, stroke_width: 0.8, id: 'MICRO_CROSSES' }));
  ctx.add(8, sec);
}

/* ======== blueprint data ======== */
const lbl = (str, x, y, a = {}) => S.text(str, { x, y, font_family: N.INTER, font_size: 9, font_weight: 700, fill: B.TX, letter_spacing: '0.06em', ...a });
/* mini stripes for construction steps. state 0..3 = how many stages have closed */
function mini(state, extra = '') {
  const tt = 7, G = 7, x = 14, wd = 116, y0 = 24;
  const gapsClosed = (i) => state > R.gapStage(i) - 0 && state >= R.gapStage(i) + 1;
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
    { t: 'RESOLVE bundle', d: 'Eight stripes of equal thickness close their gaps in three stages: 8, 4, 2, 1.', layer: 'L05' },
    { t: 'Area is conserved', d: 'Stripe thickness never changes, so the final bar is exactly 8 t: the numeral cap height.', layer: 'L05 · L07' },
    { t: 'Density ladder', d: 'Micro-grid cell 6, 12, 24 px then flat; stripe hatching 4, 8, 16 px then solid.', layer: 'L04' },
    { t: 'Settling wobble', d: 'A travelling wave decays to zero before the first merge: noise becoming order.', layer: 'L05' },
    { t: 'Waves that flatten', d: 'Rail and window lines lose amplitude until they run straight and parallel.', layer: 'L04 · L06' },
  ],
  callouts: [
    { code: 'T02', label: 'GRID LOCKUP', pt: [110, 66], side: 'L' },
    { code: 'T03', label: 'THEME TITLE', pt: [160, 140], side: 'L' },
    { code: 'T04', label: 'SUPPORTING PHRASE', pt: [150, 206], side: 'L' },
    { code: 'L05', label: 'RESOLVE BUNDLE', pt: [260, 440], side: 'L' },
    { code: 'L08', label: 'TACTILE CODE', pt: [410, 686], side: 'L' },
    { code: 'L04', label: 'WAVE WINDOW', pt: [1290, 125], side: 'R' },
    { code: 'T01', label: 'DENOMINATION', pt: [1280, 440], side: 'R' },
    { code: 'L08', label: 'SECURITY THREAD', pt: [1025, 300], side: 'R' },
    { code: 'T05', label: 'SERIAL NUMBER', pt: [1480, 706], side: 'R' },
  ],
  zones: [
    { code: 'T01', rect: [L.numerals.x, L.numerals.y - 0.79 * L.numerals.size, N.impactWidth('500', L.numerals.size), 0.79 * L.numerals.size] },
    { code: 'T02', rect: [L.logo.x, L.logo.y, N.gridLogoWidth(L.logo.h), L.logo.h * 1.45] },
    { code: 'T03', rect: [L.title.x, L.title.y - 0.79 * L.title.size, N.impactWidth('CLARITY', L.title.size), 0.79 * L.title.size] },
    { code: 'T04', rect: [L.phrase.x, L.phrase.y - 18, 260, 24] },
    { code: 'L05', rect: [bb.x0 + 0, L.bundle.cy - 180, 1548, 360] },
    { code: 'L04', rect: [L.window.x, L.window.y, L.window.w, L.window.h] },
    { code: 'L08', rect: [L.thread.x, FIELD.y, L.thread.w, L.band.y - FIELD.y] },
    { code: 'T05', rect: [1380, 698, 160, 16] },
  ],
  steps,
  facts: [['STRIPES', '8 · 4 · 2 · 1'], ['THICKNESS', 't = 24 px, constant'], ['BAR', '8 t = 192 px = cap height'], ['DENSITY', 'halves each stage']],
  patterns: { P03: 'Density-ladder columns', P04: 'Stripe hatching, halving', P05: 'Title block corner', P08: 'Bottom band, window' },
  samples: {
    P03: (w, h, c) => g({}, [0, 1, 2].map((i) => rect(8 + i * ((w - 16) / 3), 8, (w - 16) / 3, h - 16, { fill: `url(#bp-mg-${i})` }))),
  },
  extraDefs: [6, 12, 24].map((sz, i) => PT.patMicroGrid(`bp-mg-${i}`, { size: sz / 1.5, color: B.VI, sw: 0.6, dot: 0.9 })).join('\n'),
};

module.exports = {
  id: '500', value: 500, key: 'clarity', name: 'Clarity', title: 'CLARITY', phrase: 'Make the complex simple',
  palette, L, bundle, build, bp,
};
