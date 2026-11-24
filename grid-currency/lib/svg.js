'use strict';
/*
 * Tiny SVG toolkit. No dependencies. Everything returns strings.
 * Attribute keys use snake_case in code (stroke_width) and are written kebab-case (stroke-width).
 */

const f = (n) => {
  const s = (Math.round(n * 100) / 100).toString();
  return s === '-0' ? '0' : s;
};
const f1 = (n) => {
  const s = (Math.round(n * 10) / 10).toString();
  return s === '-0' ? '0' : s;
};

const CAMEL = new Set(['viewBox', 'textLength', 'lengthAdjust', 'patternUnits', 'patternTransform',
  'preserveAspectRatio', 'clipPathUnits', 'gradientUnits', 'markerWidth']);

function attr(o = {}) {
  let out = '';
  for (const k of Object.keys(o)) {
    const v = o[k];
    if (v === undefined || v === null || v === false) continue;
    const key = CAMEL.has(k) ? k : k.replace(/_/g, '-');
    out += ` ${key}="${typeof v === 'number' ? f(v) : v}"`;
  }
  return out;
}

const flat = (kids) => kids.flat(Infinity).filter((k) => k !== undefined && k !== null && k !== false && k !== '');

const el = (tag, a, ...kids) => {
  const inner = flat(kids);
  return inner.length ? `<${tag}${attr(a)}>${inner.join('\n')}</${tag}>` : `<${tag}${attr(a)}/>`;
};
const g = (a, ...kids) => el('g', a, ...kids);
const rect = (x, y, w, h, a) => el('rect', { x, y, width: w, height: h, ...a });
const circle = (cx, cy, r, a) => el('circle', { cx, cy, r, ...a });
const ellipse = (cx, cy, rx, ry, a) => el('ellipse', { cx, cy, rx, ry, ...a });
const line = (x1, y1, x2, y2, a) => el('line', { x1, y1, x2, y2, ...a });
const path = (d, a) => el('path', { d, ...a });
const poly = (pts, a) => el('polygon', { points: pts.map((p) => `${f(p[0])},${f(p[1])}`).join(' '), ...a });
const polyline = (pts, a) => el('polyline', { points: pts.map((p) => `${f(p[0])},${f(p[1])}`).join(' '), ...a });
const comment = (s) => `<!-- ${s} -->`;
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const text = (str, a) => `<text${attr(a)}>${esc(str)}</text>`;

/* ---------- path builder ---------- */
class P {
  constructor() { this.s = ''; }
  M(x, y) { this.s += `M${f1(x)} ${f1(y)}`; return this; }
  L(x, y) { this.s += `L${f1(x)} ${f1(y)}`; return this; }
  H(x) { this.s += `H${f1(x)}`; return this; }
  V(y) { this.s += `V${f1(y)}`; return this; }
  C(x1, y1, x2, y2, x, y) { this.s += `C${f1(x1)} ${f1(y1)} ${f1(x2)} ${f1(y2)} ${f1(x)} ${f1(y)}`; return this; }
  A(rx, ry, rot, large, sweep, x, y) { this.s += `A${f(rx)} ${f(ry)} ${f(rot)} ${large ? 1 : 0} ${sweep ? 1 : 0} ${f1(x)} ${f1(y)}`; return this; }
  Z() { this.s += 'Z'; return this; }
  d() { return this.s; }
}
const pathFromPoints = (pts, close = false) => {
  const p = new P();
  pts.forEach((q, i) => (i ? p.L(q[0], q[1]) : p.M(q[0], q[1])));
  if (close) p.Z();
  return p.d();
};
/* full circle as two arcs (editable, closed) */
const circleD = (cx, cy, r) => new P().M(cx - r, cy).A(r, r, 0, 1, 1, cx + r, cy).A(r, r, 0, 1, 1, cx - r, cy).Z().d();
const rectD = (x, y, w, h) => new P().M(x, y).H(x + w).V(y + h).H(x).Z().d();
/* Catmull-Rom spline through points as cubic béziers */
function smoothD(pts, closed = false, tension = 0.5) {
  const n = pts.length;
  const p = new P();
  const at = (i) => (closed ? pts[(i + n) % n] : pts[Math.max(0, Math.min(n - 1, i))]);
  p.M(pts[0][0], pts[0][1]);
  const last = closed ? n : n - 1;
  for (let i = 0; i < last; i++) {
    const p0 = at(i - 1), p1 = at(i), p2 = at(i + 1), p3 = at(i + 2);
    const t = tension / 3 * 2;
    p.C(p1[0] + (p2[0] - p0[0]) * t / 2 * 1, p1[1] + (p2[1] - p0[1]) * t / 2 * 1,
      p2[0] - (p3[0] - p1[0]) * t / 2, p2[1] - (p3[1] - p1[1]) * t / 2, p2[0], p2[1]);
  }
  if (closed) p.Z();
  return p.d();
}

/* ---------- math ---------- */
const rad = (d) => d * Math.PI / 180;
const deg = (r) => r * 180 / Math.PI;
const lerp = (a, b, t) => a + (b - a) * t;
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const smoothstep = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
const pol = (cx, cy, r, a) => [cx + r * Math.cos(rad(a)), cy + r * Math.sin(rad(a))];
const rot = (p, c, a) => {
  const s = Math.sin(rad(a)), co = Math.cos(rad(a));
  const x = p[0] - c[0], y = p[1] - c[1];
  return [c[0] + x * co - y * s, c[1] + x * s + y * co];
};
const range = (n, from = 0) => Array.from({ length: n }, (_, i) => i + from);
function rng(seed) {
  let a = seed >>> 0;
  return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
}

/* ---------- id handling ---------- */
function suffixIds(markup, suffix) {
  const ids = new Set();
  markup.replace(/\bid="([^"]+)"/g, (_, id) => { ids.add(id); return _; });
  let out = markup;
  for (const id of [...ids].sort((a, b) => b.length - a.length)) {
    out = out.split(`id="${id}"`).join(`id="${id}${suffix}"`)
      .split(`url(#${id})`).join(`url(#${id}${suffix})`)
      .split(`href="#${id}"`).join(`href="#${id}${suffix}"`);
  }
  return out;
}

/* ---------- pretty printer (controlled input only) ---------- */
function pretty(src) {
  const toks = src.match(/<!--[\s\S]*?-->|<text\b[\s\S]*?<\/text>|<title>[\s\S]*?<\/title>|<desc>[\s\S]*?<\/desc>|<\?xml[\s\S]*?\?>|<[^>]+>/g) || [];
  let depth = 0;
  const out = [];
  for (const t of toks) {
    if (t.startsWith('</')) { depth = Math.max(0, depth - 1); out.push('  '.repeat(depth) + t); continue; }
    out.push('  '.repeat(depth) + t);
    const open = /^<[A-Za-z]/.test(t) && !t.endsWith('/>') && !/^<(text|title|desc)\b/.test(t);
    if (open) depth++;
  }
  return out.join('\n') + '\n';
}

module.exports = {
  f, f1, attr, el, g, rect, circle, ellipse, line, path, poly, polyline, comment, text, esc,
  P, pathFromPoints, circleD, rectD, smoothD,
  rad, deg, lerp, clamp, smoothstep, pol, rot, range, rng, suffixIds, pretty,
};
