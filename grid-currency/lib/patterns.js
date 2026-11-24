'use strict';
/*
 * GRID pattern families.
 *   P01 Guilloché        P02 Contour         P03 Micro-grid     P04 Hatching
 *   P05 Dot systems      P06 Symbol repeat   P07 Tessellation   P08 Wave systems
 *
 * Two kinds of generator:
 *   pat*()  -> a reusable <pattern> definition (goes in <defs>), used as fill="url(#id)"
 *   *D()    -> explicit path data (editable geometry, clipped by exact maths, no filter, no raster)
 */
const S = require('./svg');
const { f, f1, el, g, path, line, circle, ellipse, P, rad, pol, range, lerp } = S;

/* ================= <pattern> definitions ================= */

/* P04 hatching: parallel lines at any angle */
function patHatch(id, { gap = 6, angle = 45, color, sw = 0.8 }) {
  return el('pattern', { id, patternUnits: 'userSpaceOnUse', width: gap, height: gap, patternTransform: `rotate(${angle})` },
    line(0, gap / 2, gap, gap / 2, { stroke: color, stroke_width: sw }));
}

/* P03 micro-grid: hairline cells with a dot at every crossing */
function patMicroGrid(id, { size = 8, color, sw = 0.5, dot = 0.9, dotColor }) {
  return el('pattern', { id, patternUnits: 'userSpaceOnUse', width: size, height: size },
    path(`M0 0H${size}M0 0V${size}`, { fill: 'none', stroke: color, stroke_width: sw }),
    dot ? circle(0, 0, dot, { fill: dotColor || color }) : '');
}

/* P05 dot systems: square or staggered lattice */
function patDots(id, { gap = 8, r = 1.2, color, stagger = false }) {
  if (!stagger) {
    return el('pattern', { id, patternUnits: 'userSpaceOnUse', width: gap, height: gap },
      circle(gap / 2, gap / 2, r, { fill: color }));
  }
  return el('pattern', { id, patternUnits: 'userSpaceOnUse', width: gap, height: gap * 2 },
    circle(gap / 2, gap / 2, r, { fill: color }), circle(0, gap * 1.5, r, { fill: color }), circle(gap, gap * 1.5, r, { fill: color }));
}

/* P07 tessellation. kinds: tri (triangle lattice), diamond, scale (overlapping arcs), quarter (quarter-circle tiles), cross */
function patTess(id, { kind = 'tri', size = 16, color, sw = 0.8, fill }) {
  const s = size;
  let body, w = s, h = s;
  if (kind === 'tri') {
    h = s * Math.sqrt(3) / 2;
    body = path(`M0 ${f(h)}L${f(s / 2)} 0L${f(s)} ${f(h)}ZM0 0L${f(s / 2)} ${f(h)}L${f(s)} 0`, { fill: 'none', stroke: color, stroke_width: sw });
    body = path(`M0 0H${f(s)}M0 ${f(h)}H${f(s)}M0 ${f(h)}L${f(s / 2)} 0L${f(s)} ${f(h)}M${f(s / 2)} ${f(h)}L${f(s)} 0M0 0L${f(s / 2)} ${f(h)}`, { fill: 'none', stroke: color, stroke_width: sw });
  } else if (kind === 'diamond') {
    body = path(`M${f(s / 2)} 0L${f(s)} ${f(s / 2)}L${f(s / 2)} ${f(s)}L0 ${f(s / 2)}Z`, { fill: fill || 'none', stroke: color, stroke_width: sw });
  } else if (kind === 'scale') {
    body = path(`M0 ${f(s / 2)}A${f(s / 2)} ${f(s / 2)} 0 0 1 ${f(s)} ${f(s / 2)}M${f(-s / 2)} ${f(s)}A${f(s / 2)} ${f(s / 2)} 0 0 1 ${f(s / 2)} ${f(s)}M${f(s / 2)} ${f(s)}A${f(s / 2)} ${f(s / 2)} 0 0 1 ${f(s * 1.5)} ${f(s)}`, { fill: 'none', stroke: color, stroke_width: sw });
  } else if (kind === 'quarter') {
    w = h = s * 2;
    body = g({}, path(`M0 0H${s}A${s} ${s} 0 0 1 0 ${s}Z`, { fill: fill || color }),
      path(`M${s * 2} ${s * 2}H${s}A${s} ${s} 0 0 1 ${s * 2} ${s}Z`, { fill: fill || color }),
      path(`M${s * 2} 0V${s}A${s} ${s} 0 0 1 ${s} 0Z`, { fill: 'none', stroke: color, stroke_width: sw }),
      path(`M0 ${s * 2}V${s}A${s} ${s} 0 0 1 ${s} ${s * 2}Z`, { fill: 'none', stroke: color, stroke_width: sw }));
  } else { // cross
    body = path(`M${f(s / 2)} ${f(s * 0.25)}V${f(s * 0.75)}M${f(s * 0.25)} ${f(s / 2)}H${f(s * 0.75)}`, { stroke: color, stroke_width: sw });
  }
  return el('pattern', { id, patternUnits: 'userSpaceOnUse', width: w, height: h }, body);
}

/* P06 symbol repetition tile: pass any markup drawn inside a (0..size) box */
function patSymbol(id, markup, size, spacing) {
  const sp = spacing || size;
  return el('pattern', { id, patternUnits: 'userSpaceOnUse', width: sp, height: sp }, markup);
}

/* ================= exact line clipping ================= */

/* Hatch lines across a convex polygon, as one path. angle in degrees, gap in px, phase shifts the lines. */
function hatchPolyD(pts, angle, gap, phase = 0) {
  const a = rad(angle), dx = Math.cos(a), dy = Math.sin(a), nx = -dy, ny = dx;
  const proj = pts.map((p) => p[0] * nx + p[1] * ny);
  const lo = Math.min(...proj), hi = Math.max(...proj);
  let out = '';
  for (let t = Math.ceil((lo - phase) / gap) * gap + phase; t <= hi; t += gap) {
    let umin = Infinity, umax = -Infinity;
    for (let i = 0; i < pts.length; i++) {
      const A = pts[i], B = pts[(i + 1) % pts.length];
      const sa = A[0] * nx + A[1] * ny - t, sb = B[0] * nx + B[1] * ny - t;
      if ((sa < 0 && sb > 0) || (sa > 0 && sb < 0) || sa === 0 || sb === 0) {
        const k = sa === sb ? 0 : sa / (sa - sb);
        const X = sa === 0 ? A[0] : sb === 0 ? B[0] : A[0] + (B[0] - A[0]) * k;
        const Y = sa === 0 ? A[1] : sb === 0 ? B[1] : A[1] + (B[1] - A[1]) * k;
        const u = X * dx + Y * dy;
        umin = Math.min(umin, u); umax = Math.max(umax, u);
      }
    }
    if (umax > umin + 0.5) {
      out += `M${f1(nx * t + dx * umin)} ${f1(ny * t + dy * umin)}L${f1(nx * t + dx * umax)} ${f1(ny * t + dy * umax)}`;
    }
  }
  return out;
}
const hatchRectD = (x, y, w, h, angle, gap, phase) => hatchPolyD([[x, y], [x + w, y], [x + w, y + h], [x, y + h]], angle, gap, phase);

function hatchCircleD(cx, cy, r, angle, gap, phase = 0) {
  const a = rad(angle), dx = Math.cos(a), dy = Math.sin(a), nx = -dy, ny = dx;
  let out = '';
  const c = cx * nx + cy * ny;
  for (let t = Math.ceil((c - r - phase) / gap) * gap + phase; t <= c + r; t += gap) {
    const off = t - c;
    if (Math.abs(off) >= r) continue;
    const half = Math.sqrt(r * r - off * off);
    const mx = cx + nx * off, my = cy + ny * off;
    out += `M${f1(mx - dx * half)} ${f1(my - dy * half)}L${f1(mx + dx * half)} ${f1(my + dy * half)}`;
  }
  return out;
}

/* ================= P01 guilloché ================= */

/* Rosette from n rotated ellipses. Classic spirograph look, tiny and editable. */
function rosette({ cx, cy, rx, ry, n = 36, start = 0, span = 180, color, sw = 0.6 }) {
  return g({ fill: 'none', stroke: color, stroke_width: sw },
    range(n).map((i) => ellipse(cx, cy, rx, ry, { transform: `rotate(${f(start + i * span / n)} ${f(cx)} ${f(cy)})` })));
}

/* Hypotrochoid: (R-r)cos t + d cos(((R-r)/r) t) ... one closed guilloché curve */
function trochoidD({ cx, cy, R, r, d, turns, steps = 480 }) {
  const k = (R - r) / r;
  const T = turns || r / gcd(Math.round(R), Math.round(r));
  const pts = [];
  for (let i = 0; i <= steps; i++) {
    const t = (i / steps) * T * Math.PI * 2;
    pts.push([cx + (R - r) * Math.cos(t) + d * Math.cos(k * t), cy + (R - r) * Math.sin(t) - d * Math.sin(k * t)]);
  }
  return S.pathFromPoints(pts, true);
}
function gcd(a, b) { return b ? gcd(b, a % b) : a; }

/* Interlaced sine band: k waves, phase shifted, the banknote braid. Returns one path. */
function braidD({ x0, x1, yc, amp, lambda, k = 4, step = 3, shift = 0 }) {
  let d = '';
  for (let j = 0; j < k; j++) {
    const ph = shift + (j * Math.PI * 2) / k;
    for (let x = x0, first = true; x <= x1 + 0.01; x += step, first = false) {
      const y = yc + amp * Math.sin(((x - x0) / lambda) * Math.PI * 2 + ph);
      d += `${first ? 'M' : 'L'}${f1(x)} ${f1(y)}`;
    }
  }
  return d;
}
/* Same braid on a vertical axis */
function braidVD({ y0, y1, xc, amp, lambda, k = 4, step = 3, shift = 0 }) {
  let d = '';
  for (let j = 0; j < k; j++) {
    const ph = shift + (j * Math.PI * 2) / k;
    for (let y = y0, first = true; y <= y1 + 0.01; y += step, first = false) {
      const x = xc + amp * Math.sin(((y - y0) / lambda) * Math.PI * 2 + ph);
      d += `${first ? 'M' : 'L'}${f1(x)} ${f1(y)}`;
    }
  }
  return d;
}

/* Lattice guilloché: two offset circle families (diamond mesh), clipped by caller. */
function circleMeshD({ x, y, w, h, r, step }) {
  const p = new P();
  for (let cx = x - r; cx <= x + w + r; cx += step) {
    for (let cy = y - r; cy <= y + h + r; cy += step) {
      p.M(cx - r, cy).A(r, r, 0, 1, 1, cx + r, cy).A(r, r, 0, 1, 1, cx - r, cy);
    }
  }
  return p.d();
}

/* ================= P08 wave systems ================= */

/* A field of horizontal waves whose amplitude and wavelength are functions of x (for frequency modulation). */
function waveFieldD({ x0, x1, y0, y1, lines, ampFn, freqFn, step = 3, phaseFn = () => 0 }) {
  let d = '';
  for (let i = 0; i < lines; i++) {
    const t = lines === 1 ? 0.5 : i / (lines - 1);
    const yb = lerp(y0, y1, t);
    let ph = phaseFn(t);
    for (let x = x0, first = true; x <= x1 + 0.01; x += step, first = false) {
      const u = (x - x0) / (x1 - x0);
      const y = yb + ampFn(u, t) * Math.sin(ph + freqFn(u, t) * (x - x0));
      d += `${first ? 'M' : 'L'}${f1(x)} ${f1(y)}`;
    }
  }
  return d;
}

/* ================= P02 contour ================= */

/* Concentric inset outlines of a convex polygon (like a topographic stepping). Returns one path. */
function insetPolyD(pts, step, count) {
  const c = pts.reduce((a, p) => [a[0] + p[0] / pts.length, a[1] + p[1] / pts.length], [0, 0]);
  // for squares/rects/regular shapes the inset of a convex polygon by distance dd is found by moving every edge inward.
  let d = '';
  const n = pts.length;
  const edges = pts.map((p, i) => {
    const q = pts[(i + 1) % n];
    const ex = q[0] - p[0], ey = q[1] - p[1], L = Math.hypot(ex, ey);
    let nx = -ey / L, ny = ex / L;
    if ((c[0] - p[0]) * nx + (c[1] - p[1]) * ny < 0) { nx = -nx; ny = -ny; }
    return { p, nx, ny, ex, ey };
  });
  for (let k = 1; k <= count; k++) {
    const dd = k * step;
    const lines = edges.map((e) => ({ x: e.p[0] + e.nx * dd, y: e.p[1] + e.ny * dd, ex: e.ex, ey: e.ey }));
    const out = [];
    for (let i = 0; i < n; i++) {
      const a = lines[(i + n - 1) % n], b = lines[i];
      const den = a.ex * b.ey - a.ey * b.ex;
      if (Math.abs(den) < 1e-9) { out.push([b.x, b.y]); continue; }
      const t = ((b.x - a.x) * b.ey - (b.y - a.y) * b.ex) / den;
      out.push([a.x + a.ex * t, a.y + a.ey * t]);
    }
    // stop when the polygon inverts
    const area = out.reduce((s, p, i) => { const q = out[(i + 1) % n]; return s + (p[0] * q[1] - q[0] * p[1]); }, 0) / 2;
    const area0 = pts.reduce((s, p, i) => { const q = pts[(i + 1) % n]; return s + (p[0] * q[1] - q[0] * p[1]); }, 0) / 2;
    if (area * area0 <= 0 || Math.abs(area) < 4) break;
    d += S.pathFromPoints(out, true);
  }
  return d;
}

/* ================= marks / micro elements ================= */

/* Ruler ticks along a horizontal or vertical axis: major every `major` steps */
function ticksD({ x, y, len, step, major = 5, tick = 4, majorTick = 8, vertical = false, flip = false }) {
  let d = '';
  const n = Math.floor(len / step);
  for (let i = 0; i <= n; i++) {
    const t = i * step, L = i % major === 0 ? majorTick : tick, s = flip ? -L : L;
    d += vertical ? `M${f1(x)} ${f1(y + t)}h${f1(s)}` : `M${f1(x + t)} ${f1(y)}v${f1(s)}`;
  }
  return d;
}

/* Registration cross with ring */
function regMark(cx, cy, r, color, sw = 0.8) {
  return g({ fill: 'none', stroke: color, stroke_width: sw },
    circle(cx, cy, r), path(`M${f1(cx - r * 1.5)} ${f1(cy)}H${f1(cx + r * 1.5)}M${f1(cx)} ${f1(cy - r * 1.5)}V${f1(cy + r * 1.5)}`));
}

/* Grid of crosses (micro elements) */
function crossGridD({ x, y, cols, rows, dx, dy, arm = 2 }) {
  let d = '';
  for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) {
    const cx = x + i * dx, cy = y + j * dy;
    d += `M${f1(cx - arm)} ${f1(cy)}H${f1(cx + arm)}M${f1(cx)} ${f1(cy - arm)}V${f1(cy + arm)}`;
  }
  return d;
}

module.exports = {
  patHatch, patMicroGrid, patDots, patTess, patSymbol,
  hatchPolyD, hatchRectD, hatchCircleD,
  rosette, trochoidD, braidD, braidVD, circleMeshD, waveFieldD, insetPolyD,
  ticksD, regMark, crossGridD,
};
