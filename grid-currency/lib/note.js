'use strict';
/*
 * Shared GRID banknote architecture.
 *   - 1600 x 750 viewBox (160 x 75 mm, 10 units per mm)
 *   - 20-column modular grid, 75 px module, 50 px side margin, 75 px top/bottom rails (20 x 8 modules)
 *   - 26 px frame band, art field inside it
 *   - eight named layers, always in the same order
 */
const S = require('./svg');
const PT = require('./patterns');
const { fontFallbackStyle } = require('./fonts');
const { f, f1, el, g, rect, circle, path, line, text, comment, P } = S;

const W = 1600, H = 750;
const GRID = { x0: 50, y0: 75, cell: 75, cols: 20, rows: 8 };
const gx = (i) => GRID.x0 + GRID.cell * i;
const gy = (j) => GRID.y0 + GRID.cell * j;
const FIELD = { x: 26, y: 26, w: W - 52, h: H - 52 };
const IMPACT = "Impact, 'GRID Impact Fallback', Haettenschweiler, 'Arial Narrow Bold', sans-serif";
const INTER = "'Inter Display', Inter, 'Helvetica Neue', Arial, sans-serif";

const LAYERS = [
  ['L01_BASE_PAPER', 'Base paper colour and foundation: paper field, modular grid hairlines'],
  ['L02_BORDER_FRAME', 'Border, keylines, ruler band, corner details'],
  ['L03_GEOMETRIC_CONSTRUCTION', 'Colour blocks and the large geometric composition'],
  ['L04_ENGRAVING_GUILLOCHE', 'Guilloché, contour, hatching, micro-grids, dot systems'],
  ['L05_PRIMARY_SYMBOL', 'The denomination symbol and its construction'],
  ['L06_SECONDARY_SYMBOL_WATERMARK', 'Watermark window, repeated symbol, supporting forms'],
  ['L07_TYPOGRAPHY', 'Denomination, GRID, title, phrase, serials, microcopy'],
  ['L08_SECURITY_ACCENTS', 'Thread, tactile code, latent image, registration, micro-elements'],
];

class Ctx {
  constructor(def, opts = {}) {
    this.def = def;
    this.C = def.palette;                 // the seven colour roles
    this.defs = [];
    this.ids = new Set();
    this.L = LAYERS.map(() => []);
    this.opts = opts;
  }
  add(n, ...kids) { this.L[n - 1].push(...kids.flat(Infinity).filter(Boolean)); }
  def_(id, markup) { if (!this.ids.has(id)) { this.ids.add(id); this.defs.push(markup); } return `url(#${id})`; }
  clip(id, shape) { return this.def_(id, el('clipPath', { id }, shape)); }
  pat(id, markup) { return this.def_(id, markup); }
}

/* ---------- type ---------- */
const impact = (str, x, y, size, fill, a = {}) => text(str, { x, y, font_family: IMPACT, font_size: size, fill, ...a });
const inter = (str, x, y, size, fill, a = {}) => text(str, { x, y, font_family: INTER, font_size: size, fill, font_weight: a.weight || 600, letter_spacing: a.ls, ...stripKeys(a, ['weight', 'ls']) });
const stripKeys = (o, ks) => Object.fromEntries(Object.entries(o).filter(([k]) => !ks.includes(k)));

/* Approximate Impact advance widths (em). Used only for layout maths, never written as textLength. */
const IMPACT_ADV = { digit: 0.55, space: 0.18, I: 0.29, M: 0.74, W: 0.79, E: 0.46, F: 0.44, L: 0.42, T: 0.47, Z: 0.47, J: 0.35, def: 0.55 };
const impactWidth = (str, size, ls = 0) => [...str].reduce((a, ch) => a + size * (/\d/.test(ch) ? IMPACT_ADV.digit : ch === ' ' ? IMPACT_ADV.space : IMPACT_ADV[ch] || IMPACT_ADV.def) + ls, 0);
const IMPACT_CAP = 0.79;

/* Repeating microtext that fills exactly `width` px. Tiny, but real text. */
function micro(str, x, y, width, size, fill, a = {}) {
  const unit = size * 0.8;                       // rough advance per character at tracking .14em
  const reps = Math.max(1, Math.ceil(width / (str.length * unit)));
  return text((str + ' ').repeat(reps).trim(), { x, y, font_family: INTER, font_size: size, font_weight: 700, letter_spacing: '0.14em', fill, textLength: width, lengthAdjust: 'spacing', ...a });
}

/* ---------- GRID lockup: module mark (three squares and one circle) + wordmark + tagline ---------- */
function gridMark(x, y, s, fill) {
  const gap = s * 0.12, m = (s - gap) / 2;
  return g({ id: undefined },
    rect(x, y, m, m, { fill }), rect(x + m + gap, y, m, m, { fill }), rect(x, y + m + gap, m, m, { fill }),
    circle(x + m + gap + m / 2, y + m + gap + m / 2, m / 2, { fill }));
}
function gridLogo(x, y, h, fill, { tagline = true, tagFill, id = 'GRID_LOGO' } = {}) {
  const wx = x + h * 1.2;
  return g({ id },
    gridMark(x, y, h * 0.92, fill),
    impact('GRID', wx, y + h * 0.9, h * 1.12, fill),
    tagline ? inter('CURRENCY FOR THE CREATIVE WORLD', wx + 1, y + h * 0.9 + h * 0.34, h * 0.2, tagFill || fill, { weight: 700, ls: '0.16em' }) : '');
}
const gridLogoWidth = (h) => h * 1.2 + impactWidth('GRID', h * 1.12);

/* ---------- serial numbers ---------- */
function serial(str, x, y, size, fill, a = {}) {
  return inter(str, x, y, size, fill, { weight: 600, ls: '0.2em', ...a });
}

/* ---------- tactile code: n raised bars (5 = 1000 … 1 = 50) ---------- */
function tactile(n, x, y, fill, { bar = 5, h = 26, gap = 7, vertical = false } = {}) {
  return g({ id: 'TACTILE_CODE' }, ...S.range(n).map((i) => vertical
    ? rect(x, y + i * (bar + gap), h, bar, { fill })
    : rect(x + i * (bar + gap), y, bar, h, { fill })));
}

/* ---------- security thread: vertical strip of alternating cells with microtext ---------- */
function thread(x, y0, y1, w, { a, b, ink, label }) {
  const cells = [];
  const seg = w * 2.2;
  for (let y = y0, i = 0; y < y1; y += seg, i++) {
    cells.push(rect(x, y, w, Math.min(seg, y1 - y), { fill: i % 2 ? a : b }));
  }
  return g({ id: 'SECURITY_THREAD' }, cells,
    rect(x, y0, w, y1 - y0, { fill: 'none', stroke: ink, stroke_width: 1 }),
    text(label, { x: 0, y: 0, transform: `translate(${f(x + w * 0.7)} ${f(y1 - 8)}) rotate(-90)`, font_family: INTER, font_size: w * 0.5, font_weight: 700, letter_spacing: '0.18em', fill: ink, textLength: (y1 - y0) - 16, lengthAdjust: 'spacing' }));
}

/* ---------- frame (L02): ruler band, keylines, corner arcs ---------- */
function frame(ctx, { ink, line: lc, accent, corner }) {
  const { x, y, w, h } = FIELD;
  const out = [];
  // ruler band along all four edges
  out.push(path(PT.ticksD({ x: 20, y: 6, len: W - 40, step: 5, major: 10, tick: 4, majorTick: 8 }), { stroke: lc, stroke_width: 0.8, fill: 'none', id: 'FRAME_RULER_TOP' }));
  out.push(path(PT.ticksD({ x: 20, y: H - 6, len: W - 40, step: 5, major: 10, tick: 4, majorTick: 8, flip: true }), { stroke: lc, stroke_width: 0.8, fill: 'none', id: 'FRAME_RULER_BOTTOM' }));
  out.push(path(PT.ticksD({ x: 6, y: 20, len: H - 40, step: 5, major: 10, tick: 4, majorTick: 8, vertical: true }), { stroke: lc, stroke_width: 0.8, fill: 'none', id: 'FRAME_RULER_LEFT' }));
  out.push(path(PT.ticksD({ x: W - 6, y: 20, len: H - 40, step: 5, major: 10, tick: 4, majorTick: 8, vertical: true, flip: true }), { stroke: lc, stroke_width: 0.8, fill: 'none', id: 'FRAME_RULER_RIGHT' }));
  // keylines
  out.push(rect(14, 14, W - 28, H - 28, { fill: 'none', stroke: ink, stroke_width: 1.2, id: 'FRAME_KEYLINE_OUTER' }));
  out.push(rect(x - 1, y - 1, w + 2, h + 2, { fill: 'none', stroke: accent || ink, stroke_width: 2, id: 'FRAME_KEYLINE_INNER' }));
  // corner arcs: three concentric quarter circles at every corner
  const cs = [[0, 0, 0], [W, 0, 90], [W, H, 180], [0, H, 270]];
  out.push(g({ id: 'FRAME_CORNERS', fill: 'none', stroke: corner || ink, stroke_width: 1 },
    cs.map(([cx, cy, a]) => g({ transform: `translate(${cx} ${cy}) rotate(${a})` },
      path(`M26 0A26 26 0 0 1 0 26`), path(`M20 0A20 20 0 0 1 0 20`), path(`M14 0A14 14 0 0 1 0 14`)))));
  ctx.add(2, comment('Frame: ruler band, keylines and concentric corners'), out);
}

/* ---------- base (L01): paper and the modular grid ---------- */
function base(ctx, { paper, hairline }) {
  const hl = [];
  let d = '';
  for (let i = 0; i <= GRID.cols; i++) d += `M${gx(i)} ${FIELD.y}V${FIELD.y + FIELD.h}`;
  for (let j = 0; j <= GRID.rows; j++) d += `M${FIELD.x} ${gy(j)}H${FIELD.x + FIELD.w}`;
  ctx.add(1, rect(0, 0, W, H, { fill: paper, id: 'PAPER' }),
    path(d, { fill: 'none', stroke: hairline, stroke_width: 0.5, id: 'MODULAR_GRID_20x8' }));
}

/* ---------- assemble ---------- */
function assemble(ctx, { title, desc, id }) {
  const layers = LAYERS.map(([lid, note], i) => [
    comment(`${lid.slice(0, 3)} — ${note}`),
    g({ id: lid }, ctx.L[i]),
  ]);
  const svg = el('svg', { xmlns: 'http://www.w3.org/2000/svg', viewBox: `0 0 ${W} ${H}`, width: W, height: H, id, role: 'img', 'aria-label': title },
    el('title', {}, S.esc(title)),
    el('desc', {}, S.esc(desc)),
    el('defs', { id: 'DEFS_PATTERNS_CLIPS' }, ctx.defs, fontFallbackStyle()),
    layers);
  return S.pretty(`<?xml version="1.0" encoding="UTF-8"?>\n${svg}`);
}

module.exports = {
  W, H, GRID, gx, gy, FIELD, IMPACT, INTER, LAYERS, IMPACT_CAP,
  Ctx, impact, inter, impactWidth, micro, gridMark, gridLogo, gridLogoWidth, serial, tactile, thread, frame, base, assemble,
};
