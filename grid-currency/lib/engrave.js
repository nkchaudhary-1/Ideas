'use strict';
/*
 * Engraving toolkit: what makes the notes read as printed currency rather than flat vector art.
 * Everything is still flat ink on paper. Tone comes from line weight and line density, never from gradients,
 * opacity or filters. Colour transitions are made the way iris printing makes them: interleaved fine lines.
 */
const S = require('./svg');
const PT = require('./patterns');
const { f, f1, g, rect, circle, path, line, el, P, rad, lerp, clamp, smoothstep, range, rng, smoothD } = S;

/* ---- hatch segments across a convex polygon, each with its position t (0..1) across the field ---- */
function hatchSegs(pts, angle, gap, phase = 0) {
  const a = rad(angle), dx = Math.cos(a), dy = Math.sin(a), nx = -dy, ny = dx;
  const proj = pts.map((p) => p[0] * nx + p[1] * ny);
  const lo = Math.min(...proj), hi = Math.max(...proj);
  const out = [];
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
    if (umax > umin + 0.5) out.push({ x1: nx * t + dx * umin, y1: ny * t + dy * umin, x2: nx * t + dx * umax, y2: ny * t + dy * umax, t: (t - lo) / Math.max(1e-6, hi - lo) });
  }
  return out;
}

/* Engraved tone field: parallel lines whose weight ramps across the field (this is how an engraver draws a gradient in flat ink). */
function ramp({ pts, angle = 0, gap = 2, w0 = 0.3, w1 = 1.2, color, ease = (t) => t, id, phase = 0 }) {
  const segs = hatchSegs(pts, angle, gap, phase);
  return g({ id, stroke: color, fill: 'none' }, segs.map((s) => line(s.x1, s.y1, s.x2, s.y2, { stroke_width: Math.round(lerp(w0, w1, ease(s.t)) * 100) / 100 })));
}
const rectPts = (x, y, w, h) => [[x, y], [x + w, y], [x + w, y + h], [x, y + h]];

/* Concentric rings with weight ramping from inside to outside */
function rings({ cx, cy, r0, r1, gap, w0, w1, color, id, ease = (t) => t }) {
  const out = [];
  for (let r = r0; r <= r1; r += gap) out.push(circle(cx, cy, r, { stroke_width: Math.round(lerp(w0, w1, ease((r - r0) / (r1 - r0))) * 100) / 100 }));
  return g({ id, fill: 'none', stroke: color }, out);
}

/*
 * Iris field: fine parallel lines whose COLOUR changes across the field by interleaving.
 * stops: [{at:0..1, color}], lines run perpendicular to the blend direction.
 * Between two stops the two colours alternate line by line in the proportion the blend asks for (ordered dither).
 */
function iris({ x, y, w, h, vertical = true, gap = 1.6, sw = 0.7, stops, id }) {
  const buckets = new Map();
  const n = Math.floor((vertical ? w : h) / gap);
  for (let i = 0; i <= n; i++) {
    const u = i / n;
    let k = 0; while (k < stops.length - 2 && u > stops[k + 1].at) k++;
    const a = stops[k], b = stops[k + 1];
    const t = clamp((u - a.at) / Math.max(1e-6, b.at - a.at), 0, 1);
    const col = t > [0.125, 0.625, 0.375, 0.875][i % 4] ? b.color : a.color;
    const d = vertical ? `M${f1(x + i * gap)} ${f1(y)}V${f1(y + h)}` : `M${f1(x)} ${f1(y + i * gap)}H${f1(x + w)}`;
    buckets.set(col, (buckets.get(col) || '') + d);
  }
  return g({ id, fill: 'none', stroke_width: sw }, [...buckets.entries()].map(([c, d]) => path(d, { stroke: c })));
}

/* Moiré ruling: two line sets a few degrees apart */
function moire({ pts, angle = 0, spread = 3, gap = 1.8, sw = 0.8, c1, c2, id }) {
  const d = (a) => hatchSegs(pts, a, gap).map((s) => `M${f1(s.x1)} ${f1(s.y1)}L${f1(s.x2)} ${f1(s.y2)}`).join('');
  return g({ id, fill: 'none', stroke_width: sw }, path(d(angle - spread), { stroke: c1 }), path(d(angle + spread), { stroke: c2 || c1 }));
}

/* Lathe-work band: rows of sine lines whose amplitude swells and fades (the interference you see in border guilloché) */
function lathe({ x0, x1, yc, amp, lambda, rows = 10, step = 2, swell = 3, color, sw = 0.4, id }) {
  let d = '';
  for (let j = 0; j < rows; j++) {
    const ph = (j * Math.PI * 2) / rows;
    for (let x = x0, first = true; x <= x1 + 0.01; x += step, first = false) {
      const u = (x - x0) / (x1 - x0);
      const env = 0.45 + 0.55 * Math.abs(Math.sin(Math.PI * swell * u));
      const y = yc + amp * env * Math.sin(((x - x0) / lambda) * Math.PI * 2 + ph);
      d += `${first ? 'M' : 'L'}${f1(x)} ${f1(y)}`;
    }
  }
  return path(d, { fill: 'none', stroke: color, stroke_width: sw, id });
}
function latheV({ y0, y1, xc, amp, lambda, rows = 10, step = 2, swell = 3, color, sw = 0.4, id }) {
  let d = '';
  for (let j = 0; j < rows; j++) {
    const ph = (j * Math.PI * 2) / rows;
    for (let y = y0, first = true; y <= y1 + 0.01; y += step, first = false) {
      const u = (y - y0) / (y1 - y0);
      const env = 0.45 + 0.55 * Math.abs(Math.sin(Math.PI * swell * u));
      const x = xc + amp * env * Math.sin(((y - y0) / lambda) * Math.PI * 2 + ph);
      d += `${first ? 'M' : 'L'}${f1(x)} ${f1(y)}`;
    }
  }
  return path(d, { fill: 'none', stroke: color, stroke_width: sw, id });
}

/* Dense rosette: three rotated-ellipse families, two trochoids, a toothed outer ring */
function rosetteDense({ cx, cy, R, c1, c2, c3, id, density = 1 }) {
  const n = (k) => Math.max(8, Math.round(k * density));
  return g({ id, fill: 'none' },
    PT.rosette({ cx, cy, rx: R, ry: R * 0.40, n: n(72), span: 180, color: c1, sw: 0.35 }),
    PT.rosette({ cx, cy, rx: R * 0.78, ry: R * 0.30, n: n(60), span: 180, start: 1.5, color: c2, sw: 0.3 }),
    PT.rosette({ cx, cy, rx: R * 0.52, ry: R * 0.2, n: n(48), span: 180, start: 3, color: c3, sw: 0.3 }),
    path(PT.trochoidD({ cx, cy, R: R * 0.72, r: R * 0.30, d: R * 0.46, steps: 600 }), { stroke: c1, stroke_width: 0.45 }),
    path(PT.trochoidD({ cx, cy, R: R * 0.62, r: R * 0.26, d: R * 0.30, steps: 600 }), { stroke: c2, stroke_width: 0.4 }),
    circle(cx, cy, R, { stroke: c1, stroke_width: 0.9 }),
    circle(cx, cy, R * 0.94, { stroke: c2, stroke_width: 0.5 }),
    path(S.range(n(120)).map((i) => { const a = (i / n(120)) * Math.PI * 2; return `M${f1(cx + Math.cos(a) * R * 0.94)} ${f1(cy + Math.sin(a) * R * 0.94)}L${f1(cx + Math.cos(a) * R * 1.03)} ${f1(cy + Math.sin(a) * R * 1.03)}`; }).join(''), { stroke: c1, stroke_width: 0.4 }));
}

/* Paper fibres: short curved hairlines in a few colours, plus rare coloured planchettes */
function fibres({ seed, n, x, y, w, h, colors, len = [8, 30], sw = [0.3, 0.7] }) {
  const r = rng(seed), by = new Map();
  for (let i = 0; i < n; i++) {
    const px = x + r() * w, py = y + r() * h, L = lerp(len[0], len[1], r()), a = r() * Math.PI * 2, bend = (r() - 0.5) * L * 0.7;
    const ex = px + Math.cos(a) * L, ey = py + Math.sin(a) * L;
    const cx = (px + ex) / 2 - Math.sin(a) * bend, cy = (py + ey) / 2 + Math.cos(a) * bend;
    const c = colors[Math.floor(r() * colors.length)], wd = (Math.round(lerp(sw[0], sw[1], r()) * 10) / 10).toFixed(1);
    const key = c + '|' + wd;
    by.set(key, (by.get(key) || '') + `M${f1(px)} ${f1(py)}Q${f1(cx)} ${f1(cy)} ${f1(ex)} ${f1(ey)}`);
  }
  return [...by.entries()].map(([k, d]) => { const [c, wd] = k.split('|'); return path(d, { fill: 'none', stroke: c, stroke_width: +wd }); });
}

/* A hand signature: a looping scribble with a final underline. Fictional by construction (seeded noise). */
function signature({ seed, x, y, w, h, color, sw = 1.1, id }) {
  const r = rng(seed);
  const N = 16, pts = [];
  const ph = [r() * 6, r() * 6, r() * 6];
  for (let i = 0; i <= N; i++) {
    const u = i / N, env = Math.sin(Math.PI * Math.min(1, u * 1.15)) * 0.9 + 0.1;
    pts.push([x + w * u + Math.sin(i * 2.3 + ph[0]) * w * 0.07, y + h * 0.55 + Math.sin(i * 1.9 + ph[1]) * h * 0.42 * env + Math.sin(i * 0.7 + ph[2]) * h * 0.1]);
  }
  const tail = [[x + w * 0.1, y + h * 0.92], [x + w * 0.5, y + h * (0.88 + r() * 0.06)], [x + w * 1.02, y + h * (0.8 + r() * 0.1)]];
  return g({ id, fill: 'none', stroke: color, stroke_width: sw, stroke_linecap: 'round', stroke_linejoin: 'round' },
    path(smoothD(pts, false, 0.9)), path(smoothD(tail, false, 0.9), { stroke_width: sw * 0.7 }));
}

/* Notched cartouche frame (numeral window) */
function cartouche({ x, y, w, h, notch = 8, color, sw = 1, inset = 4, id }) {
  const frame = (ix, iy, iw, ih, k) => `M${f1(ix + k)} ${f1(iy)}H${f1(ix + iw - k)}L${f1(ix + iw)} ${f1(iy + k)}V${f1(iy + ih - k)}L${f1(ix + iw - k)} ${f1(iy + ih)}H${f1(ix + k)}L${f1(ix)} ${f1(iy + ih - k)}V${f1(iy + k)}Z`;
  return g({ id, fill: 'none', stroke: color }, path(frame(x, y, w, h, notch), { stroke_width: sw }), path(frame(x + inset, y + inset, w - inset * 2, h - inset * 2, notch - 2), { stroke_width: sw * 0.5 }));
}

/* Rows of microprint (real text, 3 to 5 px). Fills `width` exactly. */
function microRows({ str, x, y, width, size, rows, gap, fill, N, id }) {
  return g({ id }, range(rows).map((i) => N.micro(str, x, y + i * gap, width, size, fill)));
}

/* Sutherland-Hodgman: clip a polygon to an axis-aligned rectangle */
function clipToRect(pts, x0, y0, x1, y1) {
  const edges = [
    [(p) => p[0] >= x0, (a, b) => [x0, a[1] + (b[1] - a[1]) * (x0 - a[0]) / (b[0] - a[0])]],
    [(p) => p[0] <= x1, (a, b) => [x1, a[1] + (b[1] - a[1]) * (x1 - a[0]) / (b[0] - a[0])]],
    [(p) => p[1] >= y0, (a, b) => [a[0] + (b[0] - a[0]) * (y0 - a[1]) / (b[1] - a[1]), y0]],
    [(p) => p[1] <= y1, (a, b) => [a[0] + (b[0] - a[0]) * (y1 - a[1]) / (b[1] - a[1]), y1]],
  ];
  let out = pts;
  for (const [inside, cross] of edges) {
    const inp = out; out = [];
    inp.forEach((cur, i) => {
      const prev = inp[(i + inp.length - 1) % inp.length];
      if (inside(cur)) { if (!inside(prev)) out.push(cross(prev, cur)); out.push(cur); } else if (inside(prev)) out.push(cross(prev, cur));
    });
    if (!out.length) break;
  }
  return out;
}

module.exports = { clipToRect, hatchSegs, ramp, rectPts, rings, iris, moire, lathe, latheV, rosetteDense, fibres, signature, cartouche, microRows };
