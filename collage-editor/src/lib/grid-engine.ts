import type { GridCell, GridEl, GridNode, GridSplit, Id, MediaFill, Rect } from "./types";
import { uid, clamp } from "./util";

/**
 * Grid layout engine. A grid is a tree of splits and cells:
 *   split h = children side by side (columns), split v = children stacked (rows).
 * Cells are real slots (each holds a MediaFill) and every boundary is a weight that can be dragged.
 */

export interface CellRect { id: Id; rect: Rect; cell: GridCell }
export interface Divider { splitId: Id; index: number; dir: "h" | "v"; rect: Rect; area: Rect }

export function layoutGrid(el: Pick<GridEl, "tree" | "width" | "height" | "margin" | "gutter">) {
  const cells: CellRect[] = [];
  const dividers: Divider[] = [];
  const area: Rect = { x: el.margin, y: el.margin, w: Math.max(1, el.width - el.margin * 2), h: Math.max(1, el.height - el.margin * 2) };

  const walk = (node: GridNode, r: Rect) => {
    if (node.kind === "cell") {
      cells.push({ id: node.id, rect: r, cell: node });
      return;
    }
    const n = node.children.length;
    const sum = node.weights.reduce((a, b) => a + b, 0) || 1;
    const horizontal = node.dir === "h";
    const total = (horizontal ? r.w : r.h) - el.gutter * (n - 1);
    let pos = horizontal ? r.x : r.y;
    node.children.forEach((child, i) => {
      const size = (total * node.weights[i]) / sum;
      const cr: Rect = horizontal ? { x: pos, y: r.y, w: size, h: r.h } : { x: r.x, y: pos, w: r.w, h: size };
      walk(child, cr);
      pos += size;
      if (i < n - 1) {
        dividers.push({
          splitId: node.id,
          index: i,
          dir: node.dir,
          area: r,
          rect: horizontal ? { x: pos, y: r.y, w: el.gutter, h: r.h } : { x: r.x, y: pos, w: r.w, h: el.gutter },
        });
        pos += el.gutter;
      }
    });
  };
  walk(el.tree, area);
  return { cells, dividers, area };
}

// ───────────────────────── immutable tree operations ─────────────────────────

export const cell = (fill: MediaFill | null = null): GridCell => ({ kind: "cell", id: uid("c"), fill, bg: null, radius: null });

export function cellsOf(node: GridNode): GridCell[] {
  return node.kind === "cell" ? [node] : node.children.flatMap(cellsOf);
}

export const cellCount = (node: GridNode) => cellsOf(node).length;

export function mapCells(node: GridNode, fn: (c: GridCell) => GridCell): GridNode {
  if (node.kind === "cell") return fn(node);
  return { ...node, children: node.children.map((c) => mapCells(c, fn)) };
}

export function findCell(node: GridNode, id: Id): GridCell | null {
  return cellsOf(node).find((c) => c.id === id) ?? null;
}

export function updateCell(node: GridNode, id: Id, patch: Partial<GridCell> | ((c: GridCell) => Partial<GridCell>)): GridNode {
  return mapCells(node, (c) => (c.id === id ? { ...c, ...(typeof patch === "function" ? patch(c) : patch) } : c));
}

export function setWeights(node: GridNode, splitId: Id, weights: number[]): GridNode {
  if (node.kind === "cell") return node;
  if (node.id === splitId) return { ...node, weights };
  return { ...node, children: node.children.map((c) => setWeights(c, splitId, weights)) };
}

export function findSplit(node: GridNode, id: Id): GridSplit | null {
  if (node.kind === "cell") return null;
  if (node.id === id) return node;
  for (const c of node.children) {
    const f = findSplit(c, id);
    if (f) return f;
  }
  return null;
}

/** Split a cell in two. If its parent already splits in that direction the new cell joins as a sibling. */
export function splitCell(root: GridNode, cellId: Id, dir: "h" | "v"): GridNode {
  const visit = (node: GridNode, parent: GridSplit | null): GridNode => {
    if (node.kind === "cell") {
      if (node.id !== cellId) return node;
      return { kind: "split", id: uid("s"), dir, weights: [1, 1], children: [node, cell()] };
    }
    const idx = node.children.findIndex((c) => c.kind === "cell" && c.id === cellId);
    if (idx >= 0 && node.dir === dir) {
      const children = [...node.children];
      children.splice(idx + 1, 0, cell());
      const weights = [...node.weights];
      weights.splice(idx + 1, 0, weights[idx]);
      return { ...node, children, weights };
    }
    return { ...node, children: node.children.map((c) => visit(c, node)) };
  };
  return visit(root, null);
}

/** Remove a cell; neighbours absorb its space. Collapses single-child splits. */
export function removeCell(root: GridNode, cellId: Id): GridNode {
  if (root.kind === "cell") return root; // never remove the last cell
  const visit = (node: GridNode): GridNode | null => {
    if (node.kind === "cell") return node.id === cellId ? null : node;
    const kept: { n: GridNode; w: number }[] = [];
    node.children.forEach((c, i) => {
      const v = visit(c);
      if (v) kept.push({ n: v, w: node.weights[i] });
    });
    if (kept.length === 0) return null;
    if (kept.length === 1) return kept[0].n;
    return { ...node, children: kept.map((k) => k.n), weights: kept.map((k) => k.w) };
  };
  return visit(root) ?? root;
}

export function swapFills(root: GridNode, a: Id, b: Id): GridNode {
  const ca = findCell(root, a);
  const cb = findCell(root, b);
  if (!ca || !cb) return root;
  return mapCells(root, (c) => (c.id === a ? { ...c, fill: cb.fill } : c.id === b ? { ...c, fill: ca.fill } : c));
}

/** Move the divider `index` of a split by `delta` px, keeping a minimum cell size. */
export function dragDivider(el: GridEl, splitId: Id, index: number, delta: number): GridNode {
  const { dividers } = layoutGrid(el);
  const div = dividers.find((d) => d.splitId === splitId && d.index === index);
  const split = findSplit(el.tree, splitId);
  if (!div || !split) return el.tree;
  const horizontal = split.dir === "h";
  const n = split.children.length;
  const total = (horizontal ? div.area.w : div.area.h) - el.gutter * (n - 1);
  const sum = split.weights.reduce((a, b) => a + b, 0);
  const pxPerWeight = total / sum;
  const w = [...split.weights];
  const pair = w[index] + w[index + 1];
  const min = Math.min(pair / 2, (40 / pxPerWeight));
  let a = w[index] + delta / pxPerWeight;
  a = clamp(a, min, pair - min);
  w[index] = a;
  w[index + 1] = pair - a;
  return setWeights(el.tree, splitId, w);
}

/** Fresh ids for a preset tree so every instance is independent. */
export function cloneTree(node: GridNode): GridNode {
  if (node.kind === "cell") return { ...node, id: uid("c") };
  return { ...node, id: uid("s"), children: node.children.map(cloneTree) };
}

// ───────────────────────── preset DSL ─────────────────────────

type Spec = "C" | { dir: "h" | "v"; items: { w: number; n: Spec }[] };
const C: Spec = "C";
type Item = Spec | [number, Spec];
const mk = (dir: "h" | "v") => (...items: Item[]): Spec => ({ dir, items: items.map((i) => (Array.isArray(i) ? { w: i[0], n: i[1] } : { w: 1, n: i })) });
const H = mk("h");
const V = mk("v");

function build(spec: Spec): GridNode {
  if (spec === "C") return cell();
  return { kind: "split", id: uid("s"), dir: spec.dir, weights: spec.items.map((i) => i.w), children: spec.items.map((i) => build(i.n)) };
}

export interface GridPreset {
  id: string;
  name: string;
  group: "Basic" | "Asymmetric" | "Dense" | "Editorial" | "From your posts";
  spec: Spec;
  gutter?: number;
  margin?: number;
  radius?: number;
}

export const GRID_PRESETS: GridPreset[] = [
  // Basic
  { id: "one", name: "1 image", group: "Basic", spec: C },
  { id: "two-v", name: "2 stacked", group: "Basic", spec: V(C, C) },
  { id: "two-h", name: "2 side by side", group: "Basic", spec: H(C, C) },
  { id: "three-v", name: "3 stacked", group: "Basic", spec: V(C, C, C) },
  { id: "three-h", name: "3 columns", group: "Basic", spec: H(C, C, C) },
  { id: "four", name: "4 equal", group: "Basic", spec: V(H(C, C), H(C, C)) },
  { id: "four-strips", name: "4 strips", group: "Basic", spec: H(C, C, C, C) },
  // Asymmetric
  { id: "three-big-left", name: "3 · big left", group: "Asymmetric", spec: H([2, C], [1, V(C, C)]) },
  { id: "three-big-top", name: "3 · big top", group: "Asymmetric", spec: V([2, C], [1, H(C, C)]) },
  { id: "four-asym", name: "4 asymmetric", group: "Asymmetric", spec: H([3, V(C, C)], [2, V(C, C)]) },
  { id: "four-quad", name: "4 quadrants", group: "Asymmetric", spec: H(V([3, C], [2, C]), V([2, C], [3, C])) },
  { id: "split", name: "Split", group: "Asymmetric", spec: H(C, V(C, C)) },
  { id: "asym", name: "Asymmetric", group: "Asymmetric", spec: H([1, C], [2, V([2, C], [1, H(C, C)])]) },
  { id: "two-uneven", name: "2 uneven", group: "Asymmetric", spec: V([5, C], [8, C]) },
  // Dense
  { id: "five", name: "5 images", group: "Dense", spec: V([3, H(C, C, C)], [2, H(C, C)]) },
  { id: "six", name: "6 (3×2)", group: "Dense", spec: V(H(C, C, C), H(C, C, C)) },
  { id: "six-tall", name: "6 (2×3)", group: "Dense", spec: V(H(C, C), H(C, C), H(C, C)) },
  { id: "eight", name: "8 images", group: "Dense", spec: V(H(C, C, C, C), H(C, C, C, C)) },
  { id: "nine", name: "9 images", group: "Dense", spec: V(H(C, C, C), H(C, C, C), H(C, C, C)), gutter: 12 },
  { id: "twelve", name: "12 images", group: "Dense", spec: V(H(C, C, C), H(C, C, C), H(C, C, C), H(C, C, C)), gutter: 10 },
  // Editorial
  { id: "magazine", name: "Magazine", group: "Editorial", spec: H([3, V([3, C], [2, H(C, C)])], [2, V(C, C, C)]) },
  { id: "editorial", name: "Editorial", group: "Editorial", spec: V([2, H([3, C], [2, V(C, C)])], [1, H(C, C, C)]) },
  { id: "mosaic", name: "Mosaic", group: "Editorial", spec: H([2, V([2, C], [1, C])], [3, V([1, C], [2, H(C, C)])]) },
  { id: "pinterest", name: "Pinterest", group: "Editorial", spec: H(V([3, C], [2, C], [3, C]), V([2, C], [3, C], [2, C]), V([3, C], [3, C])) },
  { id: "film", name: "Film strip", group: "Editorial", spec: V(C, C, C, C), gutter: 10, margin: 40, radius: 6 },
  { id: "story", name: "Storytelling", group: "Editorial", spec: V([5, C], [2, H(C, C, C)]) },
  // Exact structures found in the Figma posts
  { id: "fig-quad", name: "2×2 (your posts)", group: "From your posts", spec: V(H(C, C), H(C, C)), gutter: 32, margin: 48, radius: 32 },
  { id: "fig-stack3", name: "3 stacked cards", group: "From your posts", spec: V(C, C, C), gutter: 30, margin: 48, radius: 64 },
  { id: "fig-stack2", name: "2 stacked cards", group: "From your posts", spec: V(C, C), gutter: 48, margin: 48, radius: 64 },
  { id: "fig-card", name: "Single card", group: "From your posts", spec: C, gutter: 0, margin: 48, radius: 64 },
];

export const presetById = (id: string) => GRID_PRESETS.find((p) => p.id === id);

export function presetCellCount(p: GridPreset): number {
  const n = (s: Spec): number => (s === "C" ? 1 : s.items.reduce((a, i) => a + n(i.n), 0));
  return n(p.spec);
}

export function treeFromPreset(p: GridPreset): GridNode {
  return build(p.spec);
}

/** Rank presets for N uploaded images (deterministic, no AI): exact cell count first, then closest. */
export function suggestPresets(count: number, aspect: number): GridPreset[] {
  return [...GRID_PRESETS]
    .map((p) => ({ p, n: presetCellCount(p) }))
    .filter((x) => x.p.group !== "From your posts" || x.n === count)
    .sort((a, b) => Math.abs(a.n - count) - Math.abs(b.n - count) || (a.p.group === "Basic" ? -1 : 1) - (b.p.group === "Basic" ? -1 : 1) || (aspect < 1 ? 0 : 0))
    .slice(0, 8)
    .map((x) => x.p);
}
