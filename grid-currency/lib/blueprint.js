'use strict';
/*
 * Blueprint frame — 2400 x 1600. One layout, five notes.
 *
 *   header
 *   row 1   P01 final banknote (wide)                          | P02 theme       / P03 key visual elements
 *   row 2   P04 wireframe: layout and grid | P05 symbol construction | P06 palette and colour separation
 *   row 3   P07 pattern system             | P08 SVG layer structure  | P09 specifications and type
 *
 * Section map from the brief:  A=P01  B=P08  C=P05  D=P06  E=P07  F=P09 (type)  G=P06 (separation)  H=P09
 */
const S = require('./svg');
const PT = require('./patterns');
const N = require('./note');
const B = require('./bpcolors');
const { fontFallbackStyle } = require('./fonts');
const { f, f1, g, rect, circle, path, line, poly, text, comment, el, P } = S;
const { BG, CY, AM, VI, GR, PK, TX, GD } = B;
const { IMPACT, INTER, GRID } = N;

const W = 2400, H = 1600;
const COL = { A: [48, 700], B: [772, 800], C: [1596, 756] };
const ROW = { 1: [136, 660], 2: [818, 360], 3: [1200, 360] };
const BAR = 44;

const bt = (str, x, y, o = {}) => text(str, {
  x, y, font_family: o.impact ? IMPACT : INTER, font_size: o.size || 13,
  font_weight: o.impact ? undefined : (o.weight || 500), letter_spacing: o.ls, fill: o.fill || TX,
  text_anchor: o.anchor, opacity: o.op, id: o.id, transform: o.transform,
});
const para = (lines, x, y, lh, o = {}) => lines.map((l, i) => bt(l, x, y + i * lh, o));

/* ---------------- panel chrome ---------------- */
function panel(id, [x, w], [y, h], num, title, tag, content) {
  const tick = (cx, cy, dx, dy) => path(`M${cx} ${cy + dy * 10}V${cy}H${cx + dx * 10}`, { fill: 'none', stroke: CY, stroke_width: 1.4 });
  return g({ id },
    rect(x, y, w, h, { fill: BG, stroke: GD, stroke_width: 1.2 }),
    rect(x + 1, y + BAR, w - 2, h - BAR - 1, { fill: 'url(#bp-dots)' }),
    path(`M${x} ${y + BAR}H${x + w}`, { stroke: GD, stroke_width: 1.2, fill: 'none' }),
    bt(num, x + 20, y + 28, { size: 13, weight: 800, fill: CY, ls: '0.12em' }),
    bt(title, x + 52, y + 28, { size: 13, weight: 700, ls: '0.14em' }),
    bt(tag, x + w - 20, y + 28, { size: 10.5, weight: 600, op: 0.5, ls: '0.14em', anchor: 'end' }),
    tick(x, y, 1, 1), tick(x + w, y, -1, 1), tick(x, y + h, 1, -1), tick(x + w, y + h, -1, -1),
    g({ transform: `translate(${x} ${y + BAR})` }, content));
}

/* ---------------- header ---------------- */
function header(def, frameNo, notesMeta) {
  const out = [];
  out.push(N.gridMark(48, 30, 52, TX));
  out.push(text('GRID', { x: 118, y: 80, font_family: IMPACT, font_size: 70, fill: TX }));
  out.push(bt('CURRENCY FOR THE CREATIVE WORLD', 120, 100, { size: 10.5, weight: 700, ls: '0.2em', fill: TX, op: 0.7 }));
  out.push(path('M410 30V100', { stroke: GD, stroke_width: 1.4 }));
  out.push(bt('DESIGN BLUEPRINT  ·  SERIES A', 432, 52, { size: 13, weight: 700, ls: '0.22em', fill: CY }));
  out.push(bt(`FRAME ${frameNo} / 05`, 432, 78, { size: 26, weight: 800, ls: '0.04em' }));
  out.push(bt(`${def.value} GRID  ·  ${def.title}  ·  ${def.phrase.toUpperCase()}`, 432, 100, { size: 11, weight: 600, ls: '0.18em', op: 0.62 }));
  // frame index: five tabs
  const tx0 = W - 48 - 5 * 112 - 4 * 10;
  notesMeta.forEach((n, i) => {
    const x = tx0 + i * 122, cur = n.id === def.id;
    out.push(g({ id: `FRAME_TAB_${n.id}` },
      rect(x, 30, 112, 70, { fill: cur ? CY : 'none', stroke: cur ? CY : GD, stroke_width: 1.4 }),
      bt(`0${i + 1}`, x + 10, 49, { size: 10.5, weight: 800, fill: cur ? BG : CY, ls: '0.14em' }),
      text(String(n.value), { x: x + 10, y: 90, font_family: IMPACT, font_size: 38, fill: cur ? BG : TX }),
      bt(n.name.toUpperCase(), x + 102, 49, { size: 9, weight: 700, fill: cur ? BG : TX, ls: '0.14em', anchor: 'end', op: cur ? 1 : 0.6 })));
  });
  out.push(path(PT.ticksD({ x: 48, y: 118, len: W - 96, step: 8, major: 5, tick: 4, majorTick: 9 }), { stroke: GD, stroke_width: 1, fill: 'none' }));
  return g({ id: 'BP_HEADER' }, out);
}

/* ---------------- shared defs ---------------- */
function bpDefs() {
  return [
    PT.patDots('bp-dots', { gap: 20, r: 0.9, color: GD }),
    PT.patMicroGrid('bp-pat-microgrid', { size: 8, color: VI, sw: 0.6, dot: 1 }),
    PT.patDots('bp-pat-dots', { gap: 8, r: 1.4, color: VI, stagger: true }),
    PT.patHatch('bp-pat-hatch', { gap: 6, angle: 45, color: VI, sw: 0.9 }),
    PT.patTess('bp-pat-tess', { kind: 'tri', size: 18, color: VI, sw: 0.8 }),
  ].join('\n');
}
const gridBackdrop = () => {
  let d = '', d2 = '';
  for (let x = 0; x <= W; x += 40) (x % 200 ? (d += `M${x} 0V${H}`) : (d2 += `M${x} 0V${H}`));
  for (let y = 0; y <= H; y += 40) (y % 200 ? (d += `M0 ${y}H${W}`) : (d2 += `M0 ${y}H${W}`));
  return g({ id: 'BP_BACKDROP_GRID' }, path(d, { stroke: GD, stroke_width: 0.5, fill: 'none', opacity: 0.55 }), path(d2, { stroke: GD, stroke_width: 1, fill: 'none' }));
};

/* ---------------- P01 final banknote ---------------- */
const useNote = (x, y, s, extra = {}) => g({ transform: `translate(${f(x)} ${f(y)}) scale(${s})`, ...extra }, el('use', { 'xlink:href': '#BP_NOTE_ASSEMBLED' }));

function p01(def) {
  const [, w] = COL.A, ww = COL.B[0] + COL.B[1] - COL.A[0];
  const h = ROW[1][1] - BAR;
  const sc = 0.68, nw = 1600 * sc, nh = 750 * sc;
  const nx = (ww - nw) / 2, ny = 50;
  const out = [];
  out.push(useNote(nx, ny, sc, { id: 'BP_FINAL_NOTE' }));
  out.push(rect(nx, ny, nw, nh, { fill: 'none', stroke: CY, stroke_width: 1 }));
  // dimension lines
  out.push(g({ id: 'BP_DIMENSIONS', stroke: CY, stroke_width: 1, fill: 'none' },
    path(`M${nx} ${ny - 14}H${nx + nw}M${nx} ${ny - 20}V${ny - 8}M${nx + nw} ${ny - 20}V${ny - 8}`)));
  out.push(bt('160 × 75 MM  ·  1600 × 750 UNITS', nx + nw / 2, ny - 22, { size: 11, weight: 700, ls: '0.18em', fill: CY, anchor: 'middle' }));
  // callouts: numbered markers on the note, a tidy legend in each margin (no leader lines)
  const left = [], right = [];
  def.bp.callouts.forEach((c) => (c.side === 'L' ? left : right).push(c));
  let calloutN = 0;
  const place = (list, side) => {
    list.sort((a, b) => a.pt[1] - b.pt[1]);
    const step = Math.min(58, (nh - 48) / Math.max(1, list.length));
    const total = step * (list.length - 1);
    list.forEach((c, i) => {
      const n = ++calloutN, id = String(n).padStart(2, '0');
      const px = nx + c.pt[0] * sc, py = ny + c.pt[1] * sc;
      const ly = ny + (nh - total) / 2 + i * step;
      const cx = side === 'L' ? nx - 42 : nx + nw + 30;
      const tx = side === 'L' ? cx - 18 : cx + 18;
      const anchor = side === 'L' ? 'end' : 'start';
      out.push(g({ id: `BP_CALLOUT_${id}_${c.code}` },
        circle(px, py, 9.5, { fill: BG, stroke: PK, stroke_width: 1.6 }),
        bt(String(n), px, py + 4, { size: 11, weight: 800, fill: PK, anchor: 'middle' }),
        circle(cx, ly, 10, { fill: 'none', stroke: PK, stroke_width: 1.5 }),
        bt(String(n), cx, ly + 4, { size: 11, weight: 800, fill: PK, anchor: 'middle' }),
        bt(c.label, tx, ly - 1, { size: 11, weight: 700, ls: '0.08em', anchor }),
        bt(c.code, tx, ly + 14, { size: 10, weight: 700, fill: CY, ls: '0.12em', anchor })));
    });
  };
  place(left, 'L'); place(right, 'R');
  return panel('PANEL_01_FINAL_BANKNOTE', [COL.A[0], ww], ROW[1], '01', 'FINAL BANKNOTE', 'SECTION A  ·  ASSEMBLED  ·  8 LAYERS', out);
}

/* ---------------- P02 theme ---------------- */
function p02(def) {
  const t = def.bp.theme;
  const [, w] = COL.C;
  const o = [];
  o.push(text(t.word, { x: 28, y: 96, font_family: IMPACT, font_size: 86, fill: AM, id: 'BP_THEME_WORD' }));
  o.push(bt(`${def.value} GRID  ·  VALUE 0${def.bp.frameNo.slice(-1)} OF 05`, w - 28, 40, { size: 10.5, weight: 700, ls: '0.16em', anchor: 'end', fill: CY }));
  o.push(bt(t.principle, 28, 132, { size: 22, weight: 700 }));
  o.push(...para(t.story, 28, 164, 20, { size: 13.5, op: 0.78 }));
  const chips = t.keywords;
  let cx = 28;
  chips.forEach((k) => {
    const cw = k.length * 8.2 + 26;
    o.push(g({}, rect(cx, 248, cw, 26, { fill: 'none', stroke: CY, stroke_width: 1.2 }), bt(k, cx + 13, 265, { size: 10.5, weight: 700, ls: '0.14em', fill: CY })));
    cx += cw + 10;
  });
  return panel('PANEL_02_THEME', COL.C, [ROW[1][0], 320], '02', 'THEMATIC EXPLANATION', 'KEY DESIGN PRINCIPLE', o);
}

/* ---------------- P03 key visual elements ---------------- */
function p03(def) {
  const els = def.bp.elements;
  const o = [];
  const rh = 46;
  els.forEach((e, i) => {
    const y = 14 + i * rh;
    o.push(g({ id: `BP_ELEMENT_${i + 1}` },
      circle(36, y + 16, 12, { fill: 'none', stroke: PK, stroke_width: 1.4 }),
      bt(String(i + 1), 36, y + 20.5, { size: 12, weight: 800, fill: PK, anchor: 'middle' }),
      bt(e.t, 62, y + 14, { size: 13.5, weight: 700 }),
      bt(e.layer, COL.C[1] - 24, y + 14, { size: 10.5, weight: 700, fill: CY, ls: '0.12em', anchor: 'end' }),
      bt(e.d, 62, y + 32, { size: 12, op: 0.72 })));
  });
  return panel('PANEL_03_KEY_VISUAL_ELEMENTS', COL.C, [ROW[1][0] + 344, 316], '03', 'KEY VISUAL ELEMENTS', 'SYMBOL MEANING  ·  GEOMETRIC METAPHORS', o);
}

/* ---------------- P04 wireframe ---------------- */
function p04(def) {
  const sc = 0.36, nx = 44, ny = 30, nw = 1600 * sc, nh = 750 * sc;
  const o = [];
  o.push(useNote(nx, ny, sc));
  o.push(rect(nx, ny, nw, nh, { fill: BG, opacity: 0.8 }));
  const X = (v) => nx + v * sc, Y = (v) => ny + v * sc;
  let dv = '', dh = '';
  for (let i = 0; i <= GRID.cols; i++) dv += `M${f(X(N.gx(i)))} ${f(Y(N.FIELD.y))}V${f(Y(N.FIELD.y + N.FIELD.h))}`;
  for (let j = 0; j <= GRID.rows; j++) dh += `M${f(X(N.FIELD.x))} ${f(Y(N.gy(j)))}H${f(X(N.FIELD.x + N.FIELD.w))}`;
  o.push(path(dv + dh, { stroke: CY, stroke_width: 0.7, fill: 'none', id: 'BP_WIREFRAME_GRID' }));
  for (let i = 0; i < GRID.cols; i++) o.push(bt(String(i + 1).padStart(2, '0'), X(N.gx(i) + 37.5), ny - 8, { size: 7.5, weight: 700, fill: CY, anchor: 'middle' }));
  'ABCDEFGH'.split('').forEach((c, j) => o.push(bt(c, nx - 12, Y(N.gy(j) + 40), { size: 8.5, weight: 700, fill: CY, anchor: 'middle' })));
  o.push(g({ fill: 'none', id: 'BP_MARGINS' },
    rect(X(0), Y(0), nw, nh, { stroke: TX, stroke_width: 1 }),
    rect(X(N.FIELD.x), Y(N.FIELD.y), N.FIELD.w * sc, N.FIELD.h * sc, { stroke: PK, stroke_width: 1, stroke_dasharray: '4 3' }),
    rect(X(N.gx(0)), Y(N.gy(0)), 1500 * sc, 600 * sc, { stroke: AM, stroke_width: 1.2, stroke_dasharray: '6 3' })));
  const colors = [AM, GR, PK, VI, AM, GR, PK, VI, AM, GR, PK, VI];
  def.bp.zones.forEach((z, i) => {
    const c = colors[i % colors.length];
    if (z.circle) o.push(circle(X(z.circle[0]), Y(z.circle[1]), z.circle[2] * sc, { fill: 'none', stroke: c, stroke_width: 1.4, stroke_dasharray: '5 3' }));
    else {
      const [zx, zy, zw, zh] = z.rect;
      o.push(rect(X(zx), Y(zy), zw * sc, zh * sc, { fill: 'none', stroke: c, stroke_width: 1.4, stroke_dasharray: '5 3' }));
    }
    const lx = z.circle ? X(z.circle[0] - z.circle[2]) : X(z.rect[0]);
    const ly = z.circle ? Y(z.circle[1] - z.circle[2]) : Y(z.rect[1]);
    o.push(g({}, rect(lx, ly - 11, 26, 11, { fill: c }), bt(z.code, lx + 13, ly - 2.5, { size: 8, weight: 800, fill: BG, anchor: 'middle', ls: '0.04em' })));
  });
  // legend
  const ly = ny + nh + 22;
  o.push(g({ id: 'BP_WIREFRAME_LEGEND' },
    path(`M44 ${ly - 4}h22`, { stroke: CY, stroke_width: 1.6 }), bt('MODULE 75 PX  ·  20 × 8', 72, ly, { size: 9.5, weight: 700, ls: '0.1em' }),
    path(`M232 ${ly - 4}h22`, { stroke: AM, stroke_width: 1.6, stroke_dasharray: '6 3' }), bt('SAFE ZONE 50 / 75', 260, ly, { size: 9.5, weight: 700, ls: '0.1em' }),
    path(`M388 ${ly - 4}h22`, { stroke: PK, stroke_width: 1.6, stroke_dasharray: '4 3' }), bt('FIELD 26 PX', 416, ly, { size: 9.5, weight: 700, ls: '0.1em' }),
    path(`M504 ${ly - 4}h22`, { stroke: GR, stroke_width: 1.6, stroke_dasharray: '5 3' }), bt('ZONES', 532, ly, { size: 9.5, weight: 700, ls: '0.1em' })));
  return panel('PANEL_04_WIREFRAME', COL.A, ROW[2], '04', 'WIREFRAME  —  LAYOUT & GRID', '20 × 8 MODULES  ·  MARGINS  ·  ZONES', o);
}

/* ---------------- P05 symbol construction ---------------- */
function p05(def) {
  const o = [];
  const bw = 144, bh = 150, gap = 14, x0 = 14;
  def.bp.steps.forEach((s, i) => {
    const x = x0 + i * (bw + gap);
    o.push(g({ id: `BP_SYMBOL_STEP_${i + 1}` },
      rect(x, 14, bw, bh, { fill: 'none', stroke: GD, stroke_width: 1.2 }),
      g({ transform: `translate(${x} 14)` }, g({ clip_path: 'url(#bp-clip-step)' }, s.draw({ w: bw, h: bh }))),
      circle(x + 14, 28, 9, { fill: BG, stroke: AM, stroke_width: 1.3 }),
      bt(String(i + 1), x + 14, 32, { size: 10.5, weight: 800, fill: AM, anchor: 'middle' }),
      bt(s.t, x + 2, 186, { size: 10.5, weight: 800, ls: '0.1em', fill: AM }),
      ...para(s.d, x + 2, 202, 14, { size: 10.5, op: 0.72 })));
  });
  // facts
  const fy = 262;
  def.bp.facts.forEach(([k, v], i) => {
    const x = 14 + i * 196;
    o.push(g({}, path(`M${x} ${fy - 14}h180`, { stroke: GD, stroke_width: 1 }),
      bt(k, x, fy, { size: 9.5, weight: 700, ls: '0.16em', fill: CY }),
      bt(v, x, fy + 18, { size: 12.5, weight: 700 })));
  });
  return panel('PANEL_05_SYMBOL_CONSTRUCTION', COL.B, ROW[2], '05', `PRIMARY SYMBOL  —  ${def.bp.symbolName}`, 'SECTION C  ·  CONSTRUCTION', o);
}

/* ---------------- P06 palette + separation ---------------- */
const ROLES = [['primary', 'C01', 'PRIMARY'], ['secondary', 'C02', 'SECONDARY'], ['accent', 'C03', 'ACCENT'], ['pattern', 'C04', 'PATTERN'], ['paper', 'C05', 'PAPER'], ['ink', 'C06', 'INK'], ['highlight', 'C07', 'HIGHLIGHT']];
function p06(def, ex) {
  const C = def.palette, o = [];
  const sw = 94, gp = 12, x0 = 14;
  ROLES.forEach(([k, code, name], i) => {
    const x = x0 + i * (sw + gp);
    o.push(g({ id: `BP_SWATCH_${code}` },
      rect(x, 14, sw, 58, { fill: C[k], stroke: TX, stroke_width: 0.8 }),
      bt(code, x, 90, { size: 10.5, weight: 800, fill: CY, ls: '0.12em' }),
      bt(name, x, 104, { size: 10, weight: 700, ls: '0.1em' }),
      bt(C[k], x, 120, { size: 12.5, weight: 600, ls: '0.04em', fill: GR }),
      bt(ex.coverage ? `${(ex.coverage[k] * 100).toFixed(1)}% of surface` : '', x, 136, { size: 9.5, weight: 700, fill: AM })));
  });
  // plates
  o.push(bt('FLAT-COLOUR SEPARATION  ·  ONE PLATE PER ROLE', x0, 162, { size: 9.5, weight: 800, ls: '0.16em', fill: PK }));
  const ps = sw / 1600;
  ROLES.forEach(([k, code], i) => {
    const x = x0 + i * (sw + gp);
    o.push(g({ id: `BP_PLATE_${code}` },
      rect(x, 170, sw, 44, { fill: '#0B121C', stroke: GD, stroke_width: 1 }),
      g({ transform: `translate(${x} 170) scale(${f(sw / 1600)})` }, g({ clip_path: 'url(#bp-clip-note)' }, ex.plates[k]))));
  });
  // coverage bar
  const by = 250, bw = 7 * sw + 6 * gp;
  o.push(bt('SURFACE COVERAGE', x0, by - 8, { size: 9.5, weight: 800, ls: '0.16em', fill: PK }));
  let cx = x0;
  ROLES.forEach(([k]) => {
    const pct = ex.coverage ? ex.coverage[k] : 1 / 7, w = bw * pct;
    o.push(rect(cx, by, w, 16, { fill: C[k], stroke: BG, stroke_width: 0.6 }));
    cx += w;
  });
  o.push(...para(['Seven flat fills, no gradients, no transparency, no effects. Every overprint is an', 'explicit colour layer; every pattern uses a colour from this palette only.'], x0, 292, 15, { size: 11.5, op: 0.72 }));
  return panel('PANEL_06_COLOUR_SYSTEM', COL.C, ROW[2], '06', 'COLOUR  —  ROLES, HEX & SEPARATION', 'SECTIONS D + G  ·  C01 – C07', o);
}

/* ---------------- P07 patterns ---------------- */
const PATS = [
  ['P01', 'GUILLOCHÉ', 'Interwoven rotated ellipses, trochoids, braids'],
  ['P02', 'CONTOUR', 'Offset outlines, concentric rings'],
  ['P03', 'MICRO-GRID', 'Hairline cells with a dot at each crossing'],
  ['P04', 'HATCHING', 'Directional line fields'],
  ['P05', 'DOT SYSTEMS', 'Square and staggered dot lattices'],
  ['P06', 'SYMBOL REPEAT', 'Tiles built from the denomination symbol'],
  ['P07', 'TESSELLATION', 'Repeating geometric tiles'],
  ['P08', 'WAVE SYSTEMS', 'Mathematical flowing lines'],
];
function sample(code, w, h, def) {
  const cx = w / 2, cy = h / 2, c = VI;
  const custom = def.bp.samples && def.bp.samples[code];
  if (custom) return custom(w, h, c);
  switch (code) {
    case 'P01': return g({}, PT.rosette({ cx: 40, cy, rx: 34, ry: 15, n: 28, color: c, sw: 0.7 }),
      path(PT.braidD({ x0: 86, x1: w - 8, yc: cy, amp: 12, lambda: 30, k: 4, step: 2 }), { fill: 'none', stroke: c, stroke_width: 0.8 }));
    case 'P02': return g({ fill: 'none', stroke: c, stroke_width: 0.9 },
      path(PT.insetPolyD([[10, 8], [w / 2 - 4, 8], [w / 2 - 4, h - 8], [10, h - 8]], 5, 10)),
      ...[8, 16, 24, 32, 40].map((r) => circle(w * 0.75, cy, r)));
    case 'P03': return rect(8, 8, w - 16, h - 16, { fill: 'url(#bp-pat-microgrid)' });
    case 'P04': return g({ fill: 'none', stroke: c, stroke_width: 0.9 }, path(PT.hatchRectD(8, 8, (w - 24) / 2, h - 16, 45, 5)), path(PT.hatchRectD(w / 2 + 4, 8, (w - 24) / 2, h - 16, 135, 5)));
    case 'P05': return rect(8, 8, w - 16, h - 16, { fill: 'url(#bp-pat-dots)' });
    case 'P06': return g({ fill: 'none', stroke: c, stroke_width: 1 }, [0, 1, 2].map((i) => circle(30 + i * 40, 30, 14)), [0, 1, 2].map((i) => circle(50 + i * 40, 60, 14)));
    case 'P07': return rect(8, 8, w - 16, h - 16, { fill: 'url(#bp-pat-tess)' });
    case 'P08': return path(PT.waveFieldD({ x0: 8, x1: w - 8, y0: 14, y1: h - 14, lines: 9, ampFn: (u) => 3 + 9 * Math.sin(u * Math.PI), freqFn: (u) => 0.08 + 0.1 * u, step: 2 }), { fill: 'none', stroke: c, stroke_width: 0.9 });
    default: return '';
  }
}
function p07(def) {
  const o = [];
  const cw = 156, ch = 136, gp = 16, x0 = 14, y0 = 14;
  PATS.forEach(([code, name, desc], i) => {
    const x = x0 + (i % 4) * (cw + gp), y = y0 + Math.floor(i / 4) * (ch + gp);
    const used = def.bp.patterns[code];
    o.push(g({ id: `BP_PATTERN_${code}`, opacity: used ? undefined : 0.38 },
      rect(x, y, cw, ch, { fill: 'none', stroke: used ? VI : GD, stroke_width: 1.2 }),
      g({ transform: `translate(${x} ${y})` }, sample(code, cw, 90, def)),
      path(`M${x} ${y + 92}H${x + cw}`, { stroke: used ? VI : GD, stroke_width: 1 }),
      bt(code, x + 8, y + 108, { size: 10.5, weight: 800, fill: used ? PK : CY, ls: '0.1em' }),
      bt(name, x + 36, y + 108, { size: 10, weight: 700, ls: '0.1em' }),
      bt(used || 'not used on this note', x + 8, y + 124, { size: 9.5, op: 0.72 })));
  });
  return panel('PANEL_07_PATTERN_SYSTEM', COL.A, ROW[3], '07', 'PATTERN SYSTEM', 'SECTION E  ·  P01 – P08  ·  HIGHLIGHT = IN USE', o);
}

/* ---------------- P08 exploded layers ---------------- */
function p08(def, ex) {
  const o = [];
  const s = 0.19;
  const ex_ = [0.95, 0.25], ey_ = [-0.45, 0.3];
  const ox = 110, oy = 182;
  const rows = [];
  N.LAYERS.forEach(([id, role], i) => {
    const tx = ox, ty = oy - i * 24;
    o.push(g({ id: `BP_EXPLODED_${id.slice(0, 3)}`, transform: `translate(${tx} ${ty}) matrix(${f(ex_[0])} ${f(ex_[1])} ${f(ey_[0])} ${f(ey_[1])} 0 0)` },
      rect(0, 0, 1600 * s, 750 * s, { fill: '#16273A', stroke: i === 0 ? CY : CY, stroke_width: 1.2 }),
      g({ transform: `scale(${s})`, clip_path: 'url(#bp-clip-note)' }, el('use', { 'xlink:href': `#${id}` })),
      rect(0, 0, 1600 * s, 750 * s, { fill: 'none', stroke: CY, stroke_width: 1.2 })));
    const rx = tx + ex_[0] * 1600 * s, ry = ty + ex_[1] * 1600 * s - 4;
    rows.push({ id, role, i, rx, ry });
  });
  // legend column
  const lx = 470, lh = 31, ly0 = 16;
  rows.forEach((r) => {
    const y = ly0 + (7 - r.i) * lh;
    o.push(g({ id: `BP_LAYER_LEGEND_${r.id.slice(0, 3)}` },
      path(`M${f(r.rx)} ${f(r.ry)}L${lx - 14} ${y + 8}`, { stroke: PK, stroke_width: 0.9, stroke_dasharray: '3 3', fill: 'none' }),
      circle(r.rx, r.ry, 2.8, { fill: PK }),
      bt(r.id.slice(0, 3), lx, y + 8, { size: 12, weight: 800, fill: CY, ls: '0.1em' }),
      bt(r.id.slice(4).replace(/_/g, ' '), lx + 34, y + 8, { size: 11, weight: 700, ls: '0.08em' }),
      bt(`${ex.layerCounts[r.i]} elements`, COL.B[1] - 16, y + 8, { size: 10, weight: 600, fill: AM, anchor: 'end' }),
      bt(N.LAYERS[r.i][1].split(':')[0], lx + 34, y + 21, { size: 9.5, op: 0.66 })));
  });
  return panel('PANEL_08_SVG_LAYER_STRUCTURE', COL.B, ROW[3], '08', 'SVG LAYER STRUCTURE  —  EXPLODED', 'SECTION B  ·  L01 – L08  ·  NAMED GROUPS', o);
}

/* ---------------- P09 specs + type ---------------- */
function p09(def, ex) {
  const o = [];
  const rows = [
    ['DIMENSIONS', '160 × 75 mm  (ratio 2.133)'],
    ['SVG VIEWBOX', '0 0 1600 750  ·  10 units per mm'],
    ['GRID', '20 × 8 modules  ·  75 px square'],
    ['MARGINS', '50 px sides  ·  75 px rails  ·  26 px frame'],
    ['LAYERS', '8  ·  L01 … L08  ·  fixed order'],
    ['COLOUR', '7 roles  ·  flat fills only'],
    ['TYPE', 'Impact  +  Inter Display'],
    ['PATTERNS', Object.keys(def.bp.patterns).join('  ')],
    ['SYMBOL', def.bp.symbolName],
    ['FILE', `${ex.sizeKb} KB  ·  no raster  ·  no filter`],
  ];
  rows.forEach(([k, v], i) => {
    const y = 18 + i * 28;
    o.push(g({}, path(`M16 ${y + 8}H${356}`, { stroke: GD, stroke_width: 1 }),
      bt(k, 16, y + 2, { size: 9.5, weight: 800, ls: '0.14em', fill: CY }),
      bt(v, 116, y + 2, { size: 11.5, weight: 600 })));
  });
  // type specimens
  const tx = 392;
  o.push(path(`M${tx - 14} 12V${316 - 12}`, { stroke: GD, stroke_width: 1.2 }));
  o.push(bt('TYPOGRAPHY HIERARCHY', tx, 20, { size: 9.5, weight: 800, ls: '0.16em', fill: GR }));
  const spec = [
    ['T01', 'IMPACT', String(def.value), 'impact', 54],
    ['T02', 'IMPACT', 'GRID', 'impact', 26],
    ['T03', 'IMPACT', def.title, 'impact', 22],
    ['T04', 'INTER DISPLAY 700', def.phrase, 'inter', 14],
    ['T05', 'INTER DISPLAY 600', def.bp.serial, 'inter', 11],
    ['T06', 'INTER DISPLAY 500', 'Blueprint annotation', 'inter', 11],
  ];
  let y = 40;
  spec.forEach(([code, face, str, kind, size]) => {
    const rowH = kind === 'impact' ? Math.max(40, size * 0.8 + 18) : 36;
    o.push(g({ id: `BP_TYPE_${code}` },
      bt(code, tx, y + 11, { size: 9.5, weight: 800, fill: GR, ls: '0.12em' }),
      bt(face, tx, y + 24, { size: 8.5, weight: 600, op: 0.6, ls: '0.08em' }),
      kind === 'impact' ? text(str, { x: tx + 110, y: y + 4 + size * 0.79, font_family: IMPACT, font_size: size, fill: TX })
        : bt(str, tx + 110, y + 20, { size, weight: code === 'T04' ? 700 : code === 'T05' ? 600 : 500, ls: code === 'T05' ? '0.2em' : undefined })));
    y += rowH;
  });
  return panel('PANEL_09_SPECIFICATIONS', COL.C, ROW[3], '09', 'SPECIFICATIONS & TYPE', 'SECTIONS F + H', o);
}

/* ---------------- plates: palette substitution on the note markup ---------------- */
function plate(def, role, markup) {
  const C = def.palette;
  let out = markup.replace(/<rect[^>]*id="PAPER"[^>]*\/>/, '');
  Object.entries(C).forEach(([k, hex]) => {
    if (k === role) return;
    out = out.split(`fill="${hex}"`).join('fill="none"').split(`stroke="${hex}"`).join('stroke="none"');
  });
  return S.suffixIds(out, `-pl-${role}`);
}

/* ---------------- assemble ---------------- */
function buildBlueprint(def, ctx, { frameNo, notesMeta, coverage, noteSvgBytes }) {
  def.bp.frameNo = frameNo;
  const layersMarkup = N.LAYERS.map(([id], i) => g({ id }, ctx.L[i])).join('\n');
  const defsMarkup = ctx.defs.join('\n');
  const layerCounts = ctx.L.map((l) => (l.join('').match(/<(path|rect|circle|ellipse|line|polygon|polyline|text)\b/g) || []).length);
  const plates = {};
  ROLES.forEach(([k]) => {
    plates[k] = plate(def, k, `<defs>${defsMarkup}</defs>${layersMarkup}`);
  });
  const ex = { coverage, plates, layerCounts, sizeKb: Math.round(noteSvgBytes / 1024) };
  const defs = el('defs', { id: 'BP_DEFS' },
    bpDefs(),
    def.bp.extraDefs || '',
    defsMarkup,
    N.LAYERS.map(([id], i) => g({ id }, ctx.L[i])),
    el('clipPath', { id: 'bp-clip-note' }, rect(0, 0, 1600, 750)),
    el('clipPath', { id: 'bp-clip-step' }, rect(0, 0, 144, 150)),
    g({ id: 'BP_NOTE_ASSEMBLED', clip_path: 'url(#bp-clip-note)' }, N.LAYERS.map(([id]) => el('use', { 'xlink:href': `#${id}` }))),
    fontFallbackStyle());
  const body = [
    rect(0, 0, W, H, { fill: BG, id: 'BP_BACKGROUND' }),
    gridBackdrop(),
    header(def, frameNo, notesMeta),
    p01(def), p02(def), p03(def),
    p04(def), p05(def), p06(def, ex),
    p07(def), p08(def, ex), p09(def, ex),
  ];
  const svg = el('svg', { xmlns: 'http://www.w3.org/2000/svg', 'xmlns:xlink': 'http://www.w3.org/1999/xlink', viewBox: `0 0 ${W} ${H}`, width: W, height: H, id: `GRID_${def.id}_BLUEPRINT`, role: 'img', 'aria-label': `GRID ${def.value} ${def.name} blueprint` },
    el('title', {}, S.esc(`GRID ${def.value} — ${def.name} — Blueprint (frame ${frameNo} of 05)`)),
    el('desc', {}, S.esc(`Design blueprint for the ${def.value} GRID banknote: final note, theme, key elements, wireframe, symbol construction, colour system, patterns, SVG layers and specifications.`)),
    defs, body);
  return S.pretty(`<?xml version="1.0" encoding="UTF-8"?>\n${svg}`);
}

/* Panel rectangles on the 2400 x 1600 sheet, for the viewer's zoom chips. */
const PANELS = [
  { n: 0, label: 'Whole sheet', x: 0, y: 0, w: 2400, h: 1600 },
  { n: 1, label: 'Banknote', x: COL.A[0], y: ROW[1][0], w: COL.B[0] + COL.B[1] - COL.A[0], h: ROW[1][1] },
  { n: 2, label: 'Theme', x: COL.C[0], y: ROW[1][0], w: COL.C[1], h: 320 },
  { n: 3, label: 'Key elements', x: COL.C[0], y: ROW[1][0] + 344, w: COL.C[1], h: 316 },
  { n: 4, label: 'Wireframe', x: COL.A[0], y: ROW[2][0], w: COL.A[1], h: ROW[2][1] },
  { n: 5, label: 'Symbol', x: COL.B[0], y: ROW[2][0], w: COL.B[1], h: ROW[2][1] },
  { n: 6, label: 'Colour', x: COL.C[0], y: ROW[2][0], w: COL.C[1], h: ROW[2][1] },
  { n: 7, label: 'Patterns', x: COL.A[0], y: ROW[3][0], w: COL.A[1], h: ROW[3][1] },
  { n: 8, label: 'Layers', x: COL.B[0], y: ROW[3][0], w: COL.B[1], h: ROW[3][1] },
  { n: 9, label: 'Specs', x: COL.C[0], y: ROW[3][0], w: COL.C[1], h: ROW[3][1] },
];
module.exports = { buildBlueprint, bt, para, PATS, ROLES, PANELS, W, H };
