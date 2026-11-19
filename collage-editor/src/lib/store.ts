import { create } from "zustand";
import { produce, type Draft } from "immer";
import type {
  Asset, Background, Element, Format, GridEl, Id, MediaEl, MediaFill, Project, ProjectKind, ProjectMeta, Slide, TextEl,
} from "./types";
import { cloneElement, cloneSlide, makeGrid, makeMedia, makeProject, makeSlide } from "./factory";
import { boundsOf, findInTree, flatten, rotatePoint, unionRects } from "./geometry";
import { uid, clamp, debounce } from "./util";
import { dbAll, dbDelete, dbGet, dbPut } from "./db";
import { DEFAULT_FORMAT } from "./formats";
import { newFill } from "./media-math";
import { slideFills } from "./timeline";
import { allAssets, getAsset, loadAssets, importFiles, removeAsset } from "./media";
import { findCell, mapCells, updateCell, cellsOf, cloneTree, swapFills, removeCell, splitCell, dragDivider, setWeights, type GridPreset, treeFromPreset } from "./grid-engine";

export type PanelId = "templates" | "layouts" | "uploads" | "text" | "elements" | "backgrounds" | "frames" | "layers" | "palettes" | "projects";
export type SaveStatus = "saved" | "saving" | "unsaved" | "error";

export interface UIState {
  leftPanel: PanelId | null;
  rightOpen: boolean;
  view: { scale: number; x: number; y: number };
  tool: "select" | "hand";
  rulers: boolean;
  guides: boolean;
  snapObjects: boolean;
  snapCanvas: boolean;
  snapGrid: boolean;
  safeAreas: boolean;
  cropId: Id | null;
  editingTextId: Id | null;
  selectedCell: { gridId: Id; cellId: Id } | null;
  playing: boolean;
  previewOpen: boolean;
  exportOpen: boolean;
  importOpen: boolean;
  newProjectOpen: boolean;
  shortcutsOpen: boolean;
  projectsOpen: boolean;
  fitToken: number;
  accent: string;
  toast: { id: number; text: string; kind: "info" | "error" | "ok" } | null;
  recentColors: string[];
  importQueue: File[];
  libraryFilter: "all" | "image" | "video";
  canvasSize: { w: number; h: number };
  assetSelection: string[];
}

interface History { past: Project[]; future: Project[]; lastKey: string | null; lastTime: number }

export interface Store {
  ready: boolean;
  project: Project;
  history: History;
  selection: Id[];
  assets: Asset[];
  saveStatus: SaveStatus;
  ui: UIState;
  projects: ProjectMeta[];

  // lifecycle
  init(): Promise<void>;
  refreshAssets(): void;
  refreshProjects(): Promise<void>;
  newProject(opts: { kind: ProjectKind; format: Format; name?: string }): Project;
  openProject(id: Id): Promise<void>;
  deleteProject(id: Id): Promise<void>;
  duplicateProject(id: Id): Promise<void>;
  renameProject(name: string): void;

  // document edits
  commit(recipe: (p: Draft<Project>) => void, opts?: { key?: string; history?: boolean }): void;
  undo(): void;
  redo(): void;

  // ui
  setUI(patch: Partial<UIState>): void;
  toast(text: string, kind?: "info" | "error" | "ok"): void;
  addRecentColor(hex: string): void;
  setView(v: Partial<UIState["view"]>): void;
  requestFit(): void;

  // selection
  select(ids: Id[], additive?: boolean): void;
  selectAll(): void;
  clearSelection(): void;

  // slides
  setActiveSlide(id: Id): void;
  addSlide(opts?: { afterId?: Id; slide?: Slide }): Id;
  duplicateSlide(id: Id): void;
  deleteSlide(id: Id): void;
  moveSlide(from: number, to: number): void;
  renameSlide(id: Id, name: string): void;
  setBackground(bg: Background, allSlides?: boolean): void;
  setFormat(format: Format, opts?: { content?: "none" | "stretch" | "fit" }): void;
  applySlide(slide: Slide): void;

  // elements
  addElement(el: Element, opts?: { select?: boolean; index?: number }): void;
  updateElement(id: Id, patch: Partial<Element> | ((e: Draft<Element>) => void), opts?: { key?: string; history?: boolean }): void;
  updateElements(ids: Id[], patch: (e: Draft<Element>) => void, opts?: { key?: string; history?: boolean }): void;
  deleteElements(ids?: Id[]): void;
  duplicateElements(ids?: Id[]): void;
  reorder(how: "front" | "back" | "forward" | "backward", ids?: Id[]): void;
  moveLayer(id: Id, toIndex: number): void;
  group(ids?: Id[]): void;
  ungroup(id?: Id): void;
  align(how: "left" | "right" | "top" | "bottom" | "hcenter" | "vcenter", ids?: Id[]): void;
  distribute(axis: "h" | "v", ids?: Id[]): void;
  flip(axis: "x" | "y", ids?: Id[]): void;
  copy(): void;
  paste(): void;
  nudge(dx: number, dy: number): void;

  // media + grids
  setElementMedia(elId: Id, asset: Asset): void;
  setCellMedia(gridId: Id, cellId: Id, asset: Asset): void;
  addMediaToCanvas(asset: Asset, at?: { x: number; y: number }): void;
  applyGridPreset(preset: GridPreset): void;
  gridOp(gridId: Id, op: (g: Draft<GridEl>) => void, opts?: { key?: string }): void;
  replaceAsset(assetId: Id): void;
  deleteAsset(assetId: Id): Promise<boolean>;
  importMedia(files: File[]): Promise<Asset[]>;
}

// ───────────────────────── helpers ─────────────────────────

const LS_KEY = "collage-studio:ui";
function loadUIPrefs(): Partial<UIState> {
  try { return JSON.parse(localStorage.getItem(LS_KEY) || "{}"); } catch { return {}; }
}
const savePrefs = debounce((ui: UIState) => {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify({ accent: ui.accent, recentColors: ui.recentColors, rulers: ui.rulers, snapObjects: ui.snapObjects, snapCanvas: ui.snapCanvas, snapGrid: ui.snapGrid, safeAreas: ui.safeAreas }));
  } catch { /* storage may be blocked */ }
}, 400);

export const getSlide = (p: Project, id = p.activeSlideId): Slide => p.slides.find((s) => s.id === id) ?? p.slides[0];

export function scaleElement(e: Draft<Element>, sx: number, sy: number, tsx = Math.min(sx, sy)) {
  e.x *= sx; e.y *= sy; e.width *= sx; e.height *= sy;
  if (e.type === "text") { e.fontSize *= tsx; e.letterSpacing *= tsx; e.padding *= tsx; }
  if (e.type === "shape") { e.radius *= tsx; if (e.stroke) e.stroke.width *= tsx; }
  if (e.type === "grid") { e.margin *= tsx; e.gutter *= tsx; e.radius *= tsx; }
  if (e.type === "image" || e.type === "video") { e.radius *= tsx; if (e.stroke) e.stroke.width *= tsx; }
  if (e.type === "group") e.children.forEach((c) => scaleElement(c, sx, sy, tsx));
}

/** where a library file is referenced: the open project (live state) and every saved project */
async function assetUsage(assetId: Id): Promise<{ project: string; count: number }[]> {
  const countIn = (p: Project) => p.slides.reduce((n, sl) => n + slideFills(sl).filter((f) => f.assetId === assetId).length, 0);
  const open = useStore.getState().project;
  const out: { project: string; count: number }[] = [];
  const c = countIn(open);
  if (c) out.push({ project: open.name, count: c });
  for (const p of await dbAll<Project>("projects")) {
    if (p.id === open.id) continue;
    const n = countIn(p);
    if (n) out.push({ project: p.name, count: n });
  }
  return out;
}
let clipboard: Element[] = [];
let toastId = 0;

const emptyHistory = (): History => ({ past: [], future: [], lastKey: null, lastTime: 0 });

function meta(p: Project): ProjectMeta {
  return { id: p.id, name: p.name, kind: p.kind, updatedAt: p.updatedAt, slideCount: p.slides.length, ratio: p.format.ratio };
}

const initialProject = () => makeProject("single", DEFAULT_FORMAT);

export const useStore = create<Store>()((set, get) => {
  const commit: Store["commit"] = (recipe, opts = {}) => {
    const s = get();
    const produced = produce(s.project, (d) => { recipe(d); });
    if (produced === s.project) return;
    // immer freezes its result, so stamp the time on a shallow copy (slides stay structurally shared)
    const next: Project = { ...produced, updatedAt: Date.now() };
    const h = s.history;
    const now = performance.now();
    const coalesce = opts.key && h.lastKey === opts.key && now - h.lastTime < 900;
    let history: History;
    if (opts.history === false) history = h;
    else if (coalesce) history = { ...h, lastTime: now };
    else history = { past: [...h.past, s.project].slice(-150), future: [], lastKey: opts.key ?? null, lastTime: now };
    set({ project: next, history, saveStatus: "unsaved" });
  };

  const activeSlide = () => getSlide(get().project);
  const selOr = (ids?: Id[]) => ids ?? get().selection;

  const topLevel = (slide: Slide, ids: Id[]) => {
    const set_ = new Set(ids);
    return slide.elements.filter((e) => set_.has(e.id));
  };

  return {
    ready: false,
    project: initialProject(),
    history: emptyHistory(),
    selection: [],
    assets: [],
    saveStatus: "saved",
    projects: [],
    ui: {
      leftPanel: "uploads",
      rightOpen: true,
      view: { scale: 0.5, x: 0, y: 0 },
      tool: "select",
      rulers: false,
      guides: true,
      snapObjects: true,
      snapCanvas: true,
      snapGrid: true,
      safeAreas: false,
      cropId: null,
      editingTextId: null,
      selectedCell: null,
      playing: false,
      previewOpen: false,
      exportOpen: false,
      importOpen: false,
      newProjectOpen: false,
      shortcutsOpen: false,
      projectsOpen: false,
      fitToken: 0,
      accent: "212 245 106",
      toast: null,
      recentColors: [],
      importQueue: [],
      libraryFilter: "all",
      canvasSize: { w: 900, h: 600 },
      assetSelection: [],
    },

    // ───────── lifecycle ─────────
    async init() {
      if (get().ready) return;
      const prefs = loadUIPrefs();
      set((s) => ({ ui: { ...s.ui, ...prefs } }));
      await loadAssets();
      set({ assets: allAssets() });
      await get().refreshProjects();
      const last = localStorage.getItem("collage-studio:last");
      if (last && (await dbGet<Project>("projects", last))) await get().openProject(last);
      else set((s) => ({ ui: { ...s.ui, newProjectOpen: true } }));
      set({ ready: true });
    },
    refreshAssets() { set({ assets: allAssets() }); },
    async refreshProjects() {
      const list = await dbAll<Project>("projects");
      const thumbs = await Promise.all(list.map((p) => dbGet<string>("kv", `thumb:${p.id}`).catch(() => undefined)));
      set({ projects: list.map((p, i) => ({ ...meta(p), thumb: thumbs[i] })).sort((a, b) => b.updatedAt - a.updatedAt) });
    },
    newProject({ kind, format, name }) {
      const p = makeProject(kind, format, name ?? (kind === "carousel" ? "Untitled carousel" : "Untitled design"));
      set({ project: p, history: emptyHistory(), selection: [], saveStatus: "unsaved", ui: { ...get().ui, cropId: null, editingTextId: null, selectedCell: null, newProjectOpen: false, fitToken: get().ui.fitToken + 1 } });
      try { localStorage.setItem("collage-studio:last", p.id); } catch {}
      return p;
    },
    async openProject(id) {
      const p = await dbGet<Project>("projects", id);
      if (!p) return;
      set({ project: p, history: emptyHistory(), selection: [], saveStatus: "saved", ui: { ...get().ui, cropId: null, editingTextId: null, selectedCell: null, projectsOpen: false, newProjectOpen: false, fitToken: get().ui.fitToken + 1 } });
      try { localStorage.setItem("collage-studio:last", id); } catch {}
    },
    async deleteProject(id) {
      await dbDelete("projects", id);
      await dbDelete("kv", `thumb:${id}`).catch(() => {});
      await get().refreshProjects();
      if (get().project.id === id) {
        const next = get().projects[0];
        if (next) await get().openProject(next.id);
        else get().setUI({ newProjectOpen: true });
      }
    },
    async duplicateProject(id) {
      const p = await dbGet<Project>("projects", id);
      if (!p) return;
      const copy: Project = { ...structuredClone(p), id: uid("proj"), name: `${p.name} copy`, createdAt: Date.now(), updatedAt: Date.now() };
      copy.slides = copy.slides.map((s) => cloneSlide(s, s.name));
      copy.activeSlideId = copy.slides[0].id;
      await dbPut("projects", copy.id, copy);
      const th = await dbGet<string>("kv", `thumb:${id}`).catch(() => undefined);
      if (th) await dbPut("kv", `thumb:${copy.id}`, th).catch(() => {});
      await get().refreshProjects();
      get().toast("Project duplicated", "ok");
    },
    renameProject(name) { commit((p) => { p.name = name.trim() || "Untitled design"; }, { key: "rename" }); },

    // ───────── history ─────────
    commit,
    undo() {
      const { history, project } = get();
      if (!history.past.length) return;
      const prev = history.past[history.past.length - 1];
      set({ project: prev, history: { past: history.past.slice(0, -1), future: [project, ...history.future], lastKey: null, lastTime: 0 }, saveStatus: "unsaved" });
      pruneSelection();
    },
    redo() {
      const { history, project } = get();
      if (!history.future.length) return;
      const next = history.future[0];
      set({ project: next, history: { past: [...history.past, project], future: history.future.slice(1), lastKey: null, lastTime: 0 }, saveStatus: "unsaved" });
      pruneSelection();
    },

    // ───────── ui ─────────
    setUI(patch) { set((s) => ({ ui: { ...s.ui, ...patch } })); savePrefs(get().ui); },
    toast(text, kind = "info") {
      const id = ++toastId;
      set((s) => ({ ui: { ...s.ui, toast: { id, text, kind } } }));
      setTimeout(() => { if (get().ui.toast?.id === id) set((s) => ({ ui: { ...s.ui, toast: null } })); }, kind === "error" ? 7000 : 2600);
    },
    addRecentColor(hex) {
      set((s) => ({ ui: { ...s.ui, recentColors: [hex, ...s.ui.recentColors.filter((c) => c !== hex)].slice(0, 14) } }));
      savePrefs(get().ui);
    },
    setView(v) { set((s) => ({ ui: { ...s.ui, view: { ...s.ui.view, ...v } } })); },
    requestFit() { set((s) => ({ ui: { ...s.ui, fitToken: s.ui.fitToken + 1 } })); },

    // ───────── selection ─────────
    select(ids, additive = false) {
      set((s) => {
        const sel = additive ? (ids.every((i) => s.selection.includes(i)) ? s.selection.filter((i) => !ids.includes(i)) : [...new Set([...s.selection, ...ids])]) : ids;
        const keepCell = sel.length === 1 && s.ui.selectedCell?.gridId === sel[0];
        return { selection: sel, ui: { ...s.ui, selectedCell: keepCell ? s.ui.selectedCell : null, cropId: sel.length === 1 && s.ui.cropId === sel[0] ? s.ui.cropId : null, editingTextId: sel.includes(s.ui.editingTextId ?? "") ? s.ui.editingTextId : null } };
      });
    },
    selectAll() { set({ selection: activeSlide().elements.filter((e) => !e.locked && e.visible).map((e) => e.id) }); },
    clearSelection() { set((s) => ({ selection: [], ui: { ...s.ui, selectedCell: null, cropId: null, editingTextId: null } })); },

    // ───────── slides ─────────
    setActiveSlide(id) {
      if (get().project.activeSlideId === id) return;
      set((s) => ({ project: { ...s.project, activeSlideId: id }, selection: [], saveStatus: "unsaved", ui: { ...s.ui, cropId: null, editingTextId: null, selectedCell: null, playing: false, fitToken: s.ui.fitToken + 1 } }));
    },
    addSlide(opts = {}) {
      const p = get().project;
      const base = getSlide(p);
      const slide = opts.slide ? structuredClone(opts.slide) : makeSlide(p.format.width, p.format.height, `Slide ${p.slides.length + 1}`, structuredClone(base.background));
      slide.id = uid("slide");
      if (!opts.slide) { slide.grid = structuredClone(base.grid); }
      const id = slide.id;
      commit((d) => {
        const idx = opts.afterId ? d.slides.findIndex((s) => s.id === opts.afterId) + 1 : d.slides.length;
        d.slides.splice(idx, 0, slide as Draft<Slide>);
        d.activeSlideId = id;
        if (d.kind === "single" || d.kind === "collage") d.kind = "carousel";
      });
      set((s) => ({ selection: [], ui: { ...s.ui, fitToken: s.ui.fitToken + 1 } }));
      return id;
    },
    duplicateSlide(id) {
      const src = get().project.slides.find((s) => s.id === id);
      if (!src) return;
      const copy = cloneSlide(src);
      commit((d) => {
        const idx = d.slides.findIndex((s) => s.id === id) + 1;
        d.slides.splice(idx, 0, copy as Draft<Slide>);
        d.activeSlideId = copy.id;
        if (d.kind === "single" || d.kind === "collage") d.kind = "carousel";
      });
      set({ selection: [] });
    },
    deleteSlide(id) {
      if (get().project.slides.length <= 1) { get().toast("A project needs at least one slide", "error"); return; }
      commit((d) => {
        const idx = d.slides.findIndex((s) => s.id === id);
        d.slides.splice(idx, 1);
        if (d.activeSlideId === id) d.activeSlideId = d.slides[Math.max(0, idx - 1)].id;
      });
      set({ selection: [] });
    },
    moveSlide(from, to) {
      commit((d) => {
        if (from === to || from < 0 || to < 0 || from >= d.slides.length || to >= d.slides.length) return;
        const [s] = d.slides.splice(from, 1);
        d.slides.splice(to, 0, s);
      });
    },
    renameSlide(id, name) { commit((d) => { const s = d.slides.find((x) => x.id === id); if (s) s.name = name; }, { key: "rename-slide-" + id }); },
    setBackground(bg, all = false) {
      commit((d) => {
        for (const s of d.slides) if (all || s.id === d.activeSlideId) s.background = structuredClone(bg) as Draft<Background>;
      }, { key: "bg" });
    },
    setFormat(format, opts = {}) {
      const mode = opts.content ?? "stretch";
      commit((d) => {
        const all = d.kind === "carousel";
        for (const s of d.slides) {
          if (!all && s.id !== d.activeSlideId) continue;
          const sx = format.width / s.width, sy = format.height / s.height;
          if (mode === "stretch") s.elements.forEach((e) => scaleElement(e, sx, sy));
          else if (mode === "fit") {
            const k = Math.min(sx, sy);
            s.elements.forEach((e) => { scaleElement(e, k, k); e.x += (format.width - s.width * k) / 2; e.y += (format.height - s.height * k) / 2; });
          }
          s.width = format.width; s.height = format.height;
          s.guides = { x: [], y: [] };
        }
        d.format = format as Draft<Format>;
      });
      get().requestFit();
    },
    applySlide(slide) {
      const s = structuredClone(slide);
      commit((d) => {
        const target = d.slides.find((x) => x.id === d.activeSlideId)!;
        target.elements = s.elements as Draft<Element>[];
        target.background = s.background as Draft<Background>;
        target.grid = s.grid as Draft<Slide["grid"]>;
      });
      set({ selection: [] });
    },

    // ───────── elements ─────────
    addElement(el, opts = {}) {
      commit((d) => {
        const sl = d.slides.find((s) => s.id === d.activeSlideId)!;
        if (opts.index !== undefined) sl.elements.splice(opts.index, 0, el as Draft<Element>);
        else sl.elements.push(el as Draft<Element>);
      });
      if (opts.select !== false) get().select([el.id]);
    },
    updateElement(id, patch, opts) {
      commit((d) => {
        const sl = d.slides.find((s) => s.id === d.activeSlideId)!;
        const f = findInTree(sl.elements as Element[], id);
        if (!f) return;
        const e = f.el as Draft<Element>;
        if (typeof patch === "function") patch(e);
        else Object.assign(e, patch);
      }, { key: opts?.key, history: opts?.history });
    },
    updateElements(ids, patch, opts) {
      commit((d) => {
        const sl = d.slides.find((s) => s.id === d.activeSlideId)!;
        for (const id of ids) {
          const f = findInTree(sl.elements as Element[], id);
          if (f) patch(f.el as Draft<Element>);
        }
      }, { key: opts?.key, history: opts?.history });
    },
    deleteElements(ids) {
      const target = selOr(ids);
      if (!target.length) return;
      commit((d) => {
        const sl = d.slides.find((s) => s.id === d.activeSlideId)!;
        for (const id of target) {
          const f = findInTree(sl.elements as Element[], id);
          if (f) f.list.splice(f.index, 1);
        }
      });
      set((s) => ({ selection: s.selection.filter((i) => !target.includes(i)), ui: { ...s.ui, cropId: null, editingTextId: null, selectedCell: null } }));
    },
    duplicateElements(ids) {
      const target = selOr(ids);
      const sl = activeSlide();
      const copies: Element[] = [];
      commit((d) => {
        const dsl = d.slides.find((s) => s.id === d.activeSlideId)!;
        for (const id of target) {
          const f = findInTree(sl.elements, id);
          const fd = findInTree(dsl.elements as Element[], id);
          if (!f || !fd) continue;
          const c = cloneElement(f.el, 24);
          c.name = f.el.name;
          copies.push(c);
          fd.list.splice(fd.index + 1, 0, c as Draft<Element>);
        }
      });
      if (copies.length) get().select(copies.map((c) => c.id));
    },
    reorder(how, ids) {
      const target = new Set(selOr(ids));
      if (!target.size) return;
      commit((d) => {
        const sl = d.slides.find((s) => s.id === d.activeSlideId)!;
        const lists = new Set<Draft<Element>[]>();
        for (const id of target) { const f = findInTree(sl.elements as Element[], id); if (f) lists.add(f.list as Draft<Element>[]); }
        for (const list of lists) {
          const picked = list.filter((e) => target.has(e.id));
          const rest = list.filter((e) => !target.has(e.id));
          let out: Draft<Element>[];
          if (how === "front") out = [...rest, ...picked];
          else if (how === "back") out = [...picked, ...rest];
          else {
            out = [...list];
            const idxs = picked.map((p) => list.indexOf(p));
            if (how === "forward") for (const i of idxs.reverse()) { if (i < out.length - 1 && !target.has(out[i + 1].id)) [out[i], out[i + 1]] = [out[i + 1], out[i]]; }
            else for (const i of idxs) { if (i > 0 && !target.has(out[i - 1].id)) [out[i], out[i - 1]] = [out[i - 1], out[i]]; }
          }
          list.splice(0, list.length, ...out);
        }
      });
    },
    moveLayer(id, toIndex) {
      commit((d) => {
        const sl = d.slides.find((s) => s.id === d.activeSlideId)!;
        const f = findInTree(sl.elements as Element[], id);
        if (!f) return;
        const [e] = f.list.splice(f.index, 1);
        f.list.splice(clamp(toIndex, 0, f.list.length), 0, e);
      });
    },
    group(ids) {
      const sl = activeSlide();
      const els = topLevel(sl, selOr(ids));
      if (els.length < 2) return;
      const bb = unionRects(els.map(boundsOf))!;
      const gid = uid("el");
      commit((d) => {
        const dsl = d.slides.find((s) => s.id === d.activeSlideId)!;
        const idxs = els.map((e) => dsl.elements.findIndex((x) => x.id === e.id));
        const top = Math.max(...idxs);
        const children = els.map((e) => ({ ...structuredClone(e), x: e.x - bb.x, y: e.y - bb.y }));
        const g: Element = { id: gid, name: "Group", type: "group", x: bb.x, y: bb.y, width: bb.w, height: bb.h, rotation: 0, opacity: 1, visible: true, locked: false, blend: "source-over", shadow: null, children };
        const ids2 = new Set(els.map((e) => e.id));
        const kept = dsl.elements.filter((e) => !ids2.has(e.id));
        const insertAt = top - (idxs.length - 1);
        kept.splice(insertAt, 0, g as Draft<Element>);
        dsl.elements.splice(0, dsl.elements.length, ...kept);
      });
      get().select([gid]);
    },
    ungroup(id) {
      const target = id ?? get().selection[0];
      const sl = activeSlide();
      const g = sl.elements.find((e) => e.id === target);
      if (!g || g.type !== "group") return;
      const gc = { x: g.x + g.width / 2, y: g.y + g.height / 2 };
      const out = g.children.map((c) => {
        const cc = { x: g.x + c.x + c.width / 2, y: g.y + c.y + c.height / 2 };
        const rp = g.rotation ? rotatePoint(cc.x, cc.y, gc.x, gc.y, g.rotation) : cc;
        return { ...structuredClone(c), x: rp.x - c.width / 2, y: rp.y - c.height / 2, rotation: c.rotation + g.rotation, opacity: c.opacity * g.opacity };
      });
      commit((d) => {
        const dsl = d.slides.find((s) => s.id === d.activeSlideId)!;
        const i = dsl.elements.findIndex((e) => e.id === target);
        dsl.elements.splice(i, 1, ...(out as Draft<Element>[]));
      });
      get().select(out.map((o) => o.id));
    },
    align(how, ids) {
      const sl = activeSlide();
      const els = topLevel(sl, selOr(ids));
      if (!els.length) return;
      const ref = els.length === 1 ? { x: 0, y: 0, w: sl.width, h: sl.height } : unionRects(els.map(boundsOf))!;
      commit((d) => {
        const dsl = d.slides.find((s) => s.id === d.activeSlideId)!;
        for (const e of els) {
          const b = boundsOf(e);
          const t = dsl.elements.find((x) => x.id === e.id)!;
          if (how === "left") t.x += ref.x - b.x;
          if (how === "right") t.x += ref.x + ref.w - (b.x + b.w);
          if (how === "hcenter") t.x += ref.x + ref.w / 2 - (b.x + b.w / 2);
          if (how === "top") t.y += ref.y - b.y;
          if (how === "bottom") t.y += ref.y + ref.h - (b.y + b.h);
          if (how === "vcenter") t.y += ref.y + ref.h / 2 - (b.y + b.h / 2);
        }
      });
    },
    distribute(axis, ids) {
      const sl = activeSlide();
      const els = topLevel(sl, selOr(ids));
      if (els.length < 3) { get().toast("Select three or more elements to distribute", "info"); return; }
      const items = els.map((e) => ({ e, b: boundsOf(e) })).sort((a, b) => (axis === "h" ? a.b.x - b.b.x : a.b.y - b.b.y));
      const first = items[0].b, last = items[items.length - 1].b;
      const span = axis === "h" ? last.x + last.w - first.x : last.y + last.h - first.y;
      const total = items.reduce((s, i) => s + (axis === "h" ? i.b.w : i.b.h), 0);
      const gap = (span - total) / (items.length - 1);
      let pos = axis === "h" ? first.x : first.y;
      commit((d) => {
        const dsl = d.slides.find((s) => s.id === d.activeSlideId)!;
        for (const it of items) {
          const t = dsl.elements.find((x) => x.id === it.e.id)!;
          if (axis === "h") t.x += pos - it.b.x; else t.y += pos - it.b.y;
          pos += (axis === "h" ? it.b.w : it.b.h) + gap;
        }
      });
    },
    flip(axis, ids) {
      const target = selOr(ids);
      commit((d) => {
        const sl = d.slides.find((s) => s.id === d.activeSlideId)!;
        for (const id of target) {
          const f = findInTree(sl.elements as Element[], id);
          const e = f?.el as Draft<Element> | undefined;
          if (!e) continue;
          if ((e.type === "image" || e.type === "video") && e.fill) { if (axis === "x") e.fill.flipX = !e.fill.flipX; else e.fill.flipY = !e.fill.flipY; }
          else e.rotation = (-e.rotation + (axis === "y" ? 180 : 0)) % 360;
        }
      });
    },
    copy() {
      const sl = activeSlide();
      clipboard = topLevel(sl, get().selection).map((e) => structuredClone(e));
      if (clipboard.length) get().toast(`Copied ${clipboard.length} element${clipboard.length > 1 ? "s" : ""}`, "info");
    },
    paste() {
      if (!clipboard.length) return;
      const copies = clipboard.map((e) => cloneElement(e, 24));
      clipboard = clipboard.map((e) => ({ ...e, x: e.x + 24, y: e.y + 24 }));
      commit((d) => {
        const sl = d.slides.find((s) => s.id === d.activeSlideId)!;
        sl.elements.push(...(copies as Draft<Element>[]));
      });
      get().select(copies.map((c) => c.id));
    },
    nudge(dx, dy) {
      const ids = get().selection;
      if (!ids.length) return;
      get().updateElements(ids, (e) => { e.x += dx; e.y += dy; }, { key: "nudge" });
    },

    // ───────── media + grids ─────────
    setElementMedia(elId, asset) {
      commit((d) => {
        const sl = d.slides.find((s) => s.id === d.activeSlideId)!;
        const f = findInTree(sl.elements as Element[], elId);
        const e = f?.el as Draft<MediaEl> | undefined;
        if (!e || (e.type !== "image" && e.type !== "video")) return;
        const prev = e.fill;
        const nf = newFill(asset.id, asset.kind);
        if (prev) { nf.adjustments = prev.adjustments; nf.filter = prev.filter; }
        e.fill = nf as Draft<MediaFill>;
        if (!prev && e.bg === "#2b2b2b") e.bg = "transparent"; // the grey is the empty-frame placeholder, not part of the photo
        e.type = asset.kind;
        if (e.name === "Frame" || e.name === "Image" || e.name === "Video") e.name = asset.kind === "video" ? "Video" : "Image";
      });
    },
    setCellMedia(gridId, cellId, asset) {
      commit((d) => {
        const sl = d.slides.find((s) => s.id === d.activeSlideId)!;
        const f = findInTree(sl.elements as Element[], gridId);
        const g = f?.el as Draft<GridEl> | undefined;
        if (!g || g.type !== "grid") return;
        const cur = findCell(g.tree, cellId);
        const nf = newFill(asset.id, asset.kind);
        if (cur?.fill) { nf.adjustments = structuredClone(cur.fill.adjustments); nf.filter = { ...cur.fill.filter }; }
        g.tree = updateCell(g.tree, cellId, { fill: nf }) as Draft<GridEl["tree"]>;
      });
    },
    addMediaToCanvas(asset, at) {
      const sl = activeSlide();
      const ar = asset.width / asset.height;
      let w = Math.min(sl.width * 0.8, sl.height * 0.8 * ar);
      let h = w / ar;
      if (h > sl.height * 0.8) { h = sl.height * 0.8; w = h * ar; }
      // first thing on an empty slide fills it (single-image workflow)
      const empty = sl.elements.length === 0;
      const frame = empty ? { x: 0, y: 0, w: sl.width, h: sl.height } : { x: at?.x ?? (sl.width - w) / 2, y: at?.y ?? (sl.height - h) / 2, w, h };
      const el = makeMedia(asset.kind, frame.w, frame.h, newFill(asset.id, asset.kind), { name: asset.name.replace(/\.[^.]+$/, "") }, frame.x, frame.y);
      get().addElement(el);
    },
    applyGridPreset(preset) {
      const sl = activeSlide();
      const sel = get().selection;
      const existing = sel.length === 1 ? sl.elements.find((e) => e.id === sel[0] && e.type === "grid") : null;
      if (existing && existing.type === "grid") {
        // keep photos: pour existing media into the new cells in order
        const old = cellsOf(existing.tree).map((c) => c.fill).filter(Boolean) as MediaFill[];
        let tree = treeFromPreset(preset);
        let i = 0;
        tree = mapCells(tree, (c) => (i < old.length ? { ...c, fill: old[i++] } : c));
        commit((d) => {
          const f = findInTree((d.slides.find((s) => s.id === d.activeSlideId)!.elements) as Element[], existing.id);
          const g = f?.el as Draft<GridEl>;
          g.tree = tree as Draft<GridEl["tree"]>;
          g.name = preset.name;
          if (preset.gutter !== undefined) g.gutter = preset.gutter;
          if (preset.margin !== undefined) g.margin = preset.margin;
          if (preset.radius !== undefined) g.radius = preset.radius;
        });
        set((s) => ({ ui: { ...s.ui, selectedCell: null } }));
        return;
      }
      const g = makeGrid(preset, sl.width, sl.height);
      get().addElement(g);
    },
    gridOp(gridId, op, opts) {
      commit((d) => {
        const sl = d.slides.find((s) => s.id === d.activeSlideId)!;
        const f = findInTree(sl.elements as Element[], gridId);
        if (f?.el.type === "grid") op(f.el as Draft<GridEl>);
      }, { key: opts?.key });
    },
    replaceAsset(assetId) { get().toast("Pick a photo or video from the library to replace it", "info"); void assetId; },
    async deleteAsset(assetId) {
      // never leave a frame pointing at a file that no longer exists (it would also stall exports waiting for it)
      const uses = await assetUsage(assetId);
      if (uses.length) {
        const a = allAssets().find((x) => x.id === assetId);
        get().toast(`“${a?.name ?? "This file"}” is still used in ${uses.map((u) => `${u.project}${u.count > 1 ? ` (${u.count}×)` : ""}`).join(", ")}. Remove or replace it there first.`, "error");
        return false;
      }
      await removeAsset(assetId);
      set({ assets: allAssets() });
      return true;
    },
    async importMedia(files) {
      const res = await importFiles(files);
      set({ assets: allAssets() });
      if (res.rejected.length) get().toast(res.rejected.map((r) => `${r.name}: ${r.reason}`).join("\n"), "error");
      return res.assets;
    },
  };

  function pruneSelection() {
    const sl = getSlide(get().project);
    const ids = new Set(flatten(sl.elements).map((e) => e.id));
    set((s) => ({ selection: s.selection.filter((i) => ids.has(i)), ui: { ...s.ui, cropId: s.ui.cropId && ids.has(s.ui.cropId) ? s.ui.cropId : null, editingTextId: null } }));
  }
});

if (typeof window !== "undefined") (window as unknown as { __store?: typeof useStore }).__store = useStore; // test/debug handle

// ───────────────────────── autosave ─────────────────────────

const doSave = debounce(async () => {
  const s = useStore.getState();
  if (s.saveStatus !== "unsaved") return;
  useStore.setState({ saveStatus: "saving" });
  try {
    await dbPut("projects", s.project.id, s.project);
    useStore.setState((st) => ({ saveStatus: st.project === s.project ? "saved" : "unsaved" }));
    void useStore.getState().refreshProjects();
    thumbJob();
    if (useStore.getState().saveStatus === "unsaved") doSave();
  } catch {
    useStore.setState({ saveStatus: "error" });
  }
}, 700);

/** a small cover image per project for the Projects dialog; rendered with the real scene, a little after the save settles */
const thumbJob = debounce(async () => {
  const p = useStore.getState().project;
  try {
    const { makeThumb } = await import("./export/thumb");
    const t = await makeThumb(p.slides[0]);
    if (t) { await dbPut("kv", `thumb:${p.id}`, t); void useStore.getState().refreshProjects(); }
  } catch { /* thumbnails are a nicety, never an error */ }
}, 2500);

let lastProject: Project | null = null;
useStore.subscribe((s) => {
  if (s.project !== lastProject) {
    lastProject = s.project;
    if (s.saveStatus === "unsaved") doSave();
  }
});

// handy selectors
export const useActiveSlide = () => useStore((s) => getSlide(s.project));
export function useSelectedElements(): Element[] {
  const sel = useStore((s) => s.selection);
  const slide = useStore((s) => getSlide(s.project));
  const all = flatten(slide.elements);
  return sel.map((id) => all.find((e) => e.id === id)).filter(Boolean) as Element[];
}

export { getAsset };
export type { TextEl };
export const gridHelpers = { findCell, updateCell, mapCells, swapFills, removeCell, splitCell, dragDivider, setWeights, cloneTree };
