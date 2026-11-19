import type { Element, LayoutGrid, Rect, Slide } from "./types";
import { boundsOf } from "./geometry";

export interface SnapLine { axis: "x" | "y"; pos: number; from: number; to: number }
export interface SnapOptions { threshold: number; objects: boolean; canvas: boolean; grid: boolean; guides: boolean }

/** Column / row / baseline lines of the editorial layout grid (document coordinates). */
export function gridLines(g: LayoutGrid, w: number, h: number): { xs: number[]; ys: number[]; cols: { x: number; w: number }[] } {
  const xs: number[] = [], ys: number[] = [], cols: { x: number; w: number }[] = [];
  if (g.kind === "none") return { xs, ys, cols };
  if (g.kind === "columns" || g.kind === "modular") {
    const n = Math.max(1, g.columns);
    const cw = (w - g.margin * 2 - g.gutter * (n - 1)) / n;
    for (let i = 0; i < n; i++) {
      const x = g.margin + i * (cw + g.gutter);
      cols.push({ x, w: cw });
      xs.push(x, x + cw);
    }
  }
  if (g.kind === "modular") {
    const n = Math.max(1, g.rows);
    const rh = (h - g.margin * 2 - g.gutter * (n - 1)) / n;
    for (let i = 0; i < n; i++) { const y = g.margin + i * (rh + g.gutter); ys.push(y, y + rh); }
  }
  if (g.kind === "baseline") {
    for (let y = g.margin; y <= h - g.margin + 0.1; y += Math.max(2, g.baseline)) ys.push(y);
  }
  return { xs, ys, cols };
}

export function computeSnap(moving: Rect, slide: Slide, exclude: Set<string>, o: SnapOptions): { dx: number; dy: number; lines: SnapLine[] } {
  const tx: { pos: number; kind: string; span?: [number, number] }[] = [];
  const ty: { pos: number; kind: string; span?: [number, number] }[] = [];
  if (o.canvas) {
    tx.push({ pos: 0, kind: "c" }, { pos: slide.width / 2, kind: "c" }, { pos: slide.width, kind: "c" });
    ty.push({ pos: 0, kind: "c" }, { pos: slide.height / 2, kind: "c" }, { pos: slide.height, kind: "c" });
  }
  if (o.objects) {
    const walk = (list: Element[]) => {
      for (const e of list) {
        if (exclude.has(e.id) || !e.visible) continue;
        const b = boundsOf(e);
        tx.push({ pos: b.x, kind: "o", span: [b.y, b.y + b.h] }, { pos: b.x + b.w / 2, kind: "o", span: [b.y, b.y + b.h] }, { pos: b.x + b.w, kind: "o", span: [b.y, b.y + b.h] });
        ty.push({ pos: b.y, kind: "o", span: [b.x, b.x + b.w] }, { pos: b.y + b.h / 2, kind: "o", span: [b.x, b.x + b.w] }, { pos: b.y + b.h, kind: "o", span: [b.x, b.x + b.w] });
      }
    };
    walk(slide.elements);
  }
  if (o.guides) {
    slide.guides.x.forEach((x) => tx.push({ pos: x, kind: "g" }));
    slide.guides.y.forEach((y) => ty.push({ pos: y, kind: "g" }));
  }
  if (o.grid && slide.grid.snap) {
    const gl = gridLines(slide.grid, slide.width, slide.height);
    gl.xs.forEach((x) => tx.push({ pos: x, kind: "l" }));
    gl.ys.forEach((y) => ty.push({ pos: y, kind: "l" }));
  }
  const best = (edges: number[], targets: typeof tx) => {
    let bd = Infinity, bt: (typeof tx)[number] | null = null;
    for (const e of edges) for (const t of targets) {
      const d = t.pos - e;
      if (Math.abs(d) < Math.abs(bd) && Math.abs(d) <= o.threshold) { bd = d; bt = t; }
    }
    return { d: bt ? bd : 0, hit: bt ? bd : null };
  };
  const bx = best([moving.x, moving.x + moving.w / 2, moving.x + moving.w], tx);
  const by = best([moving.y, moving.y + moving.h / 2, moving.y + moving.h], ty);
  const dx = bx.d, dy = by.d;
  const lines: SnapLine[] = [];
  const m = { x: moving.x + dx, y: moving.y + dy, w: moving.w, h: moving.h };
  if (bx.hit !== null) {
    for (const edge of [m.x, m.x + m.w / 2, m.x + m.w]) {
      for (const t of tx) if (Math.abs(t.pos - edge) < 0.01) {
        const span = t.span ?? [0, slide.height];
        lines.push({ axis: "x", pos: t.pos, from: Math.min(span[0], m.y), to: Math.max(span[1], m.y + m.h) });
      }
    }
  }
  if (by.hit !== null) {
    for (const edge of [m.y, m.y + m.h / 2, m.y + m.h]) {
      for (const t of ty) if (Math.abs(t.pos - edge) < 0.01) {
        const span = t.span ?? [0, slide.width];
        lines.push({ axis: "y", pos: t.pos, from: Math.min(span[0], m.x), to: Math.max(span[1], m.x + m.w) });
      }
    }
  }
  return { dx, dy, lines };
}
