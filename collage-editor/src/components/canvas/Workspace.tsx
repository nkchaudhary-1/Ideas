"use client";
import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { Group, Layer, Rect, Stage } from "react-konva";
import type Konva from "konva";
import { useStore, getSlide } from "@/lib/store";
import type { Element, GridEl, MediaEl, MediaFill, Rect as R } from "@/lib/types";
import { boundsOf, flatten, normRect, rectsIntersect, unionRects } from "@/lib/geometry";
import { computeSnap, type SnapLine } from "@/lib/snap";
import { hitTest } from "@/lib/transform";
import { fitView, zoomAround, toDoc, viewForRect } from "@/lib/view-math";
import { layoutGrid, dragDivider, updateCell, findCell, swapFills } from "@/lib/grid-engine";
import { panFill, zoomFill } from "@/lib/media-math";
import { getAsset, mediaVersion, subscribeMedia } from "@/lib/media";
import { onFontsLoaded } from "@/lib/fonts";
import { SlideBody, type NodeHandlers } from "./ElementNode";
import { RenderContext } from "./render-context";
import { CropOverlay, GridEditorOverlay, GuideLines, LayoutGridOverlay, SafeAreas, SlideBoundaries, SnapLinesView } from "./Overlays";
import SelectionLayer from "./SelectionLayer";
import TextEditor from "./TextEditor";
import Rulers from "./Rulers";
import PanoramaHandles from "./PanoramaHandles";
import { makeMedia } from "@/lib/factory";
import { newFill } from "@/lib/media-math";

const accentOf = (a: string) => `rgb(${a.split(" ").join(",")})`;
const useFontsTick = () => {
  const [t, set] = useState(0);
  useEffect(() => onFontsLoaded(() => set((x) => x + 1)), []);
  return t;
};

type CropTarget = { el: Element; rect: R; fill: MediaFill; radius: number; key: string; gridId?: string; cellId?: string };

export function cropTargetOf(slide: ReturnType<typeof getSlide>, cropId: string | null, selectedCell: { gridId: string; cellId: string } | null): CropTarget | null {
  if (!cropId) return null;
  const el = flatten(slide.elements).find((e) => e.id === cropId);
  if (!el) return null;
  if ((el.type === "image" || el.type === "video") && el.fill?.assetId) return { el, rect: { x: 0, y: 0, w: el.width, h: el.height }, fill: el.fill, radius: el.radius, key: el.id };
  if (el.type === "grid" && selectedCell?.gridId === el.id) {
    const c = layoutGrid(el).cells.find((c) => c.id === selectedCell.cellId);
    if (c?.cell.fill?.assetId) return { el, rect: c.rect, fill: c.cell.fill, radius: c.cell.radius ?? el.radius, key: `${el.id}:${c.id}`, gridId: el.id, cellId: c.id };
  }
  return null;
}

export default function Workspace() {
  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<Konva.Stage>(null);
  const slide = useStore((s) => getSlide(s.project));
  const selection = useStore((s) => s.selection);
  const view = useStore((s) => s.ui.view);
  const tool = useStore((s) => s.ui.tool);
  const cropId = useStore((s) => s.ui.cropId);
  const editingTextId = useStore((s) => s.ui.editingTextId);
  const selectedCell = useStore((s) => s.ui.selectedCell);
  const playing = useStore((s) => s.ui.playing);
  const rulers = useStore((s) => s.ui.rulers);
  const guidesOn = useStore((s) => s.ui.guides);
  const safeAreas = useStore((s) => s.ui.safeAreas);
  const accent = accentOf(useStore((s) => s.ui.accent));
  const fitToken = useStore((s) => s.ui.fitToken);
  const mediaTick = useSyncExternalStore(subscribeMedia, mediaVersion, () => 0);
  const fontsTick = useFontsTick();

  const [size, setSize] = useState({ w: 900, h: 600 });
  const [marquee, setMarquee] = useState<R | null>(null);
  const [snapLines, setSnapLines] = useState<SnapLine[]>([]);
  const [swap, setSwap] = useState<{ x: number; y: number } | null>(null);
  const [spaceDown, setSpaceDown] = useState(false);
  const spaceRef = useRef(false);

  // ── size + fit
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      const r = el.getBoundingClientRect();
      setSize({ w: Math.max(100, r.width), h: Math.max(100, r.height) });
      useStore.getState().setUI({ canvasSize: { w: r.width, h: r.height } });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  useEffect(() => {
    useStore.getState().setView(fitView(size, { w: slide.width, h: slide.height }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fitToken, size.w, size.h, slide.id, slide.width, slide.height]);

  // ── space = pan
  useEffect(() => {
    const dn = (e: KeyboardEvent) => {
      if (e.code === "Space" && !(e.target as HTMLElement)?.closest?.("input,textarea,select,[contenteditable]")) { e.preventDefault(); spaceRef.current = true; setSpaceDown(true); }
    };
    const up = (e: KeyboardEvent) => { if (e.code === "Space") { spaceRef.current = false; setSpaceDown(false); } };
    window.addEventListener("keydown", dn);
    window.addEventListener("keyup", up);
    return () => { window.removeEventListener("keydown", dn); window.removeEventListener("keyup", up); };
  }, []);

  // ── wheel: ctrl/cmd = zoom, plain = pan (or zoom the picture in crop mode)
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const st = useStore.getState();
      const rect = el.getBoundingClientRect();
      const px = e.clientX - rect.left, py = e.clientY - rect.top;
      if (e.ctrlKey || e.metaKey) {
        const f = Math.exp(-e.deltaY * (Math.abs(e.deltaY) < 40 ? 0.01 : 0.0018));
        st.setView(zoomAround(st.ui.view, f, px, py));
        return;
      }
      const sl = getSlide(st.project);
      const ct = cropTargetOf(sl, st.ui.cropId, st.ui.selectedCell);
      if (ct && e.deltaY !== 0) {
        const nf = zoomFill(ct.fill, ct.fill.zoom * Math.exp(-e.deltaY * 0.0015));
        applyCropFill(ct, nf);
        return;
      }
      const v = st.ui.view;
      st.setView({ x: v.x - e.deltaX, y: v.y - e.deltaY });
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  // ── manual pan (space / hand tool / middle mouse)
  const onPointerDownCapture = (e: React.PointerEvent) => {
    const st = useStore.getState();
    if (!(spaceRef.current || st.ui.tool === "hand" || e.button === 1)) return;
    e.stopPropagation();
    e.preventDefault();
    const start = { x: e.clientX, y: e.clientY, vx: st.ui.view.x, vy: st.ui.view.y };
    const move = (ev: PointerEvent) => useStore.getState().setView({ x: start.vx + ev.clientX - start.x, y: start.vy + ev.clientY - start.y });
    const up = () => { window.removeEventListener("pointermove", move); window.removeEventListener("pointerup", up); };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  };

  // ── pointer in document space
  const pointer = useCallback(() => {
    const st = stageRef.current;
    const p = st?.getPointerPosition();
    if (!st || !p) return null;
    return toDoc(useStore.getState().ui.view, p.x, p.y);
  }, []);

  const applyCropFill = (ct: CropTarget, fill: MediaFill) => {
    const st = useStore.getState();
    if (ct.gridId && ct.cellId) st.gridOp(ct.gridId, (g) => { g.tree = updateCell(g.tree, ct.cellId!, { fill }) as GridEl["tree"]; }, { key: "crop" });
    else st.updateElement(ct.el.id, (e) => { (e as MediaEl).fill = fill; }, { key: "crop" });
  };

  // ── interaction state kept in refs (no re-render per mouse move)
  const marqueeStart = useRef<{ x: number; y: number; additive: boolean } | null>(null);
  const drag = useRef<{ ids: string[]; start: Map<string, { x: number; y: number }>; primary: string } | null>(null);
  const cropDrag = useRef<{ last: { x: number; y: number } } | null>(null);
  const dividerDrag = useRef<{ gridId: string; splitId: string; index: number; dir: "h" | "v"; last: { x: number; y: number } } | null>(null);
  const cellDrag = useRef<{ gridId: string; cellId: string; sx: number; sy: number; active: boolean } | null>(null);

  const toLocal = (el: Element, p: { x: number; y: number }) => {
    const cx = el.x + el.width / 2, cy = el.y + el.height / 2;
    const r = (-el.rotation * Math.PI) / 180;
    const dx = p.x - cx, dy = p.y - cy;
    return { x: dx * Math.cos(r) - dy * Math.sin(r) + el.width / 2, y: dx * Math.sin(r) + dy * Math.cos(r) + el.height / 2 };
  };

  const snapOpts = () => {
    const st = useStore.getState();
    return { threshold: 6 / st.ui.view.scale, objects: st.ui.snapObjects, canvas: st.ui.snapCanvas, grid: st.ui.snapGrid, guides: true };
  };

  const handlers = useMemo<NodeHandlers>(() => ({
    draggable: (el) => {
      const st = useStore.getState();
      if (el.locked || st.ui.tool !== "select" || spaceRef.current || st.ui.cropId || st.ui.editingTextId === el.id) return false;
      if (el.type === "grid" && st.ui.selectedCell?.gridId === el.id) return false;
      return true;
    },
    onDown: (e, el) => {
      const st = useStore.getState();
      if (spaceRef.current || st.ui.tool === "hand") return;
      const ev = e.evt as MouseEvent;
      if (ev.button === 1) return;
      e.cancelBubble = true;
      if (el.locked) return;
      if (st.ui.cropId && st.ui.cropId !== el.id) st.setUI({ cropId: null });
      if (ev.shiftKey) st.select([el.id], true);
      else if (!st.selection.includes(el.id)) st.select([el.id]);
      if (el.type === "grid") {
        const p = pointer();
        const sl = getSlide(st.project);
        const hit = p ? hitTest(sl, p.x, p.y) : null;
        if (hit && hit.el.id === el.id && hit.cellId) {
          st.setUI({ selectedCell: { gridId: el.id, cellId: hit.cellId } });
          const cell = findCell((el as GridEl).tree, hit.cellId);
          if (cell?.fill) cellDrag.current = { gridId: el.id, cellId: hit.cellId, sx: ev.clientX, sy: ev.clientY, active: false };
        } else st.setUI({ selectedCell: null });
      }
    },
    onDragStart: (e, el) => {
      const st = useStore.getState();
      const stage = e.target.getStage()!;
      if (!st.selection.includes(el.id)) st.select([el.id]);
      const ids = useStore.getState().selection;
      const start = new Map<string, { x: number; y: number }>();
      for (const id of ids) { const n = stage.findOne("#" + id); if (n) start.set(id, { x: n.x(), y: n.y() }); }
      drag.current = { ids, start, primary: el.id };
    },
    onDragMove: (e) => {
      const d = drag.current;
      if (!d) return;
      const st = useStore.getState();
      const stage = e.target.getStage()!;
      const slide = getSlide(st.project);
      const p0 = d.start.get(d.primary)!;
      let dx = e.target.x() - p0.x, dy = e.target.y() - p0.y;
      const all = flatten(slide.elements);
      const rects = d.ids.map((id) => all.find((x) => x.id === id)).filter(Boolean).map((x) => { const b = boundsOf(x!); return { x: b.x + dx, y: b.y + dy, w: b.w, h: b.h }; });
      const base = unionRects(rects);
      let lines: SnapLine[] = [];
      if (base && !(e.evt as MouseEvent).altKey) {
        const sn = computeSnap(base, slide, new Set(d.ids), snapOpts());
        dx += sn.dx; dy += sn.dy; lines = sn.lines;
      }
      for (const id of d.ids) {
        const s0 = d.start.get(id);
        const n = stage.findOne("#" + id);
        if (s0 && n) n.position({ x: s0.x + dx, y: s0.y + dy });
      }
      setSnapLines(lines);
    },
    onDragEnd: (e) => {
      const d = drag.current;
      drag.current = null;
      setSnapLines([]);
      if (!d) return;
      const p0 = d.start.get(d.primary)!;
      const dx = Math.round((e.target.x() - p0.x) * 100) / 100, dy = Math.round((e.target.y() - p0.y) * 100) / 100;
      if (dx || dy) useStore.getState().updateElements(d.ids, (el) => { el.x += dx; el.y += dy; });
    },
    onDblClick: (e, el) => {
      const st = useStore.getState();
      if (el.locked) return;
      if (el.type === "text") { st.select([el.id]); st.setUI({ editingTextId: el.id }); return; }
      if ((el.type === "image" || el.type === "video") && el.fill?.assetId) { st.select([el.id]); st.setUI({ cropId: el.id }); return; }
      if (el.type === "grid") {
        const p = pointer();
        const hit = p ? hitTest(getSlide(st.project), p.x, p.y) : null;
        if (hit?.cellId && findCell(el.tree, hit.cellId)?.fill?.assetId) { st.select([el.id]); st.setUI({ cropId: el.id, selectedCell: { gridId: el.id, cellId: hit.cellId } }); }
      }
    },
  }), [pointer]);

  // ── stage background: marquee selection
  const onStageDown = (e: Konva.KonvaEventObject<MouseEvent>) => {
    const st = useStore.getState();
    if (spaceRef.current || st.ui.tool === "hand" || e.evt.button !== 0) return;
    if (e.target !== e.target.getStage()) return;
    st.setUI({ cropId: null, editingTextId: null, selectedCell: null });
    if (!e.evt.shiftKey) st.clearSelection();
    const p = pointer();
    if (p) { marqueeStart.current = { x: p.x, y: p.y, additive: e.evt.shiftKey }; setMarquee({ x: p.x, y: p.y, w: 0, h: 0 }); }
  };

  const onStageMove = (e: Konva.KonvaEventObject<MouseEvent>) => {
    const p = pointer();
    if (!p) return;
    const st = useStore.getState();
    if (marqueeStart.current) {
      const m = marqueeStart.current;
      setMarquee(normRect(m.x, m.y, p.x, p.y));
      return;
    }
    if (dividerDrag.current) {
      const dd = dividerDrag.current;
      const g = getSlide(st.project).elements.find((x) => x.id === dd.gridId) as GridEl | undefined;
      if (!g) return;
      const lp = toLocal(g, p);
      const delta = dd.dir === "h" ? lp.x - dd.last.x : lp.y - dd.last.y;
      dd.last = lp;
      if (delta) st.gridOp(dd.gridId, (gg) => { gg.tree = dragDivider(gg as GridEl, dd.splitId, dd.index, delta) as GridEl["tree"]; }, { key: "divider" });
      return;
    }
    if (cropDrag.current) {
      const sl = getSlide(st.project);
      const ct = cropTargetOf(sl, st.ui.cropId, st.ui.selectedCell);
      if (!ct) return;
      const asset = getAsset(ct.fill.assetId);
      if (!asset) return;
      const r = (-ct.el.rotation * Math.PI) / 180;
      const dx = p.x - cropDrag.current.last.x, dy = p.y - cropDrag.current.last.y;
      const ldx = dx * Math.cos(r) - dy * Math.sin(r), ldy = dx * Math.sin(r) + dy * Math.cos(r);
      cropDrag.current.last = p;
      applyCropFill(ct, panFill(ct.fill, { w: asset.width, h: asset.height }, { w: ct.rect.w, h: ct.rect.h }, ldx, ldy));
      return;
    }
    const cd = cellDrag.current;
    if (cd) {
      if (!cd.active && Math.hypot(e.evt.clientX - cd.sx, e.evt.clientY - cd.sy) > 8) cd.active = true;
      if (cd.active) { const sp = stageRef.current!.getPointerPosition()!; setSwap({ x: sp.x, y: sp.y }); }
    }
  };

  useEffect(() => {
    const up = () => {
      const st = useStore.getState();
      if (marqueeStart.current) {
        const m = marqueeStart.current;
        marqueeStart.current = null;
        setMarquee((r) => {
          if (r && (r.w > 3 || r.h > 3)) {
            const ids = getSlide(st.project).elements.filter((e) => e.visible && !e.locked && rectsIntersect(boundsOf(e), r)).map((e) => e.id);
            if (ids.length) st.select(ids, m.additive);
          }
          return null;
        });
      }
      dividerDrag.current = null;
      cropDrag.current = null;
      const cd = cellDrag.current;
      cellDrag.current = null;
      if (cd?.active) {
        const p = pointer();
        setSwap(null);
        if (p) {
          const sl = getSlide(st.project);
          const hit = hitTest(sl, p.x, p.y);
          const srcGrid = sl.elements.find((x) => x.id === cd.gridId) as GridEl | undefined;
          if (hit && srcGrid) {
            if (hit.el.id === cd.gridId && hit.cellId && hit.cellId !== cd.cellId) {
              st.gridOp(cd.gridId, (g) => { g.tree = swapFills(g.tree, cd.cellId, hit.cellId!) as GridEl["tree"]; });
              st.setUI({ selectedCell: { gridId: cd.gridId, cellId: hit.cellId } });
            } else if (hit.el.type === "grid" && hit.cellId && hit.el.id !== cd.gridId) {
              const a = findCell(srcGrid.tree, cd.cellId)?.fill ?? null;
              const b = findCell(hit.el.tree, hit.cellId)?.fill ?? null;
              st.gridOp(cd.gridId, (g) => { g.tree = updateCell(g.tree, cd.cellId, { fill: b }) as GridEl["tree"]; });
              st.gridOp(hit.el.id, (g) => { g.tree = updateCell(g.tree, hit.cellId!, { fill: a }) as GridEl["tree"]; });
            } else if (hit.el.type === "image" || hit.el.type === "video") {
              const a = findCell(srcGrid.tree, cd.cellId)?.fill ?? null;
              const b = (hit.el as MediaEl).fill;
              st.gridOp(cd.gridId, (g) => { g.tree = updateCell(g.tree, cd.cellId, { fill: b }) as GridEl["tree"]; });
              st.updateElement(hit.el.id, (e) => { const m = e as MediaEl; m.fill = a; if (a) m.type = a.kind; });
            }
          }
        }
      } else setSwap(null);
    };
    window.addEventListener("mouseup", up);
    return () => window.removeEventListener("mouseup", up);
  }, [pointer]);

  // ── drag & drop from the library / desktop
  const onDragOver = (e: React.DragEvent) => { e.preventDefault(); e.dataTransfer.dropEffect = "copy"; };
  const onDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    const st = useStore.getState();
    const rect = containerRef.current!.getBoundingClientRect();
    const p = toDoc(st.ui.view, e.clientX - rect.left, e.clientY - rect.top);
    const sl = getSlide(st.project);
    const place = (assetId: string) => {
      const asset = getAsset(assetId);
      if (!asset) return;
      const hit = hitTest(sl, p.x, p.y);
      if (hit?.el.type === "grid" && hit.cellId) { st.setCellMedia(hit.el.id, hit.cellId, asset); st.select([hit.el.id]); st.setUI({ selectedCell: { gridId: hit.el.id, cellId: hit.cellId } }); return; }
      if (hit && (hit.el.type === "image" || hit.el.type === "video")) { st.setElementMedia(hit.el.id, asset); st.select([hit.el.id]); return; }
      const ar = asset.width / asset.height;
      const w = Math.min(sl.width * 0.6, sl.height * 0.6 * ar), h = w / ar;
      if (sl.elements.length === 0) st.addMediaToCanvas(asset);
      else st.addElement(makeMedia(asset.kind, w, h, newFill(asset.id, asset.kind), { name: asset.name.replace(/\.[^.]+$/, "") }, p.x - w / 2, p.y - h / 2));
    };
    const id = e.dataTransfer.getData("application/x-asset");
    if (id) { place(id); return; }
    const files = [...e.dataTransfer.files];
    if (files.length) {
      if (files.length === 1) {
        const assets = await st.importMedia(files);
        if (assets[0]) place(assets[0].id);
      } else st.setUI({ importOpen: true, importQueue: files });
    }
  };

  // ── derived render data
  const dpr = typeof window === "undefined" ? 1 : window.devicePixelRatio || 1;
  const ps = Math.pow(1.25, Math.round(Math.log(Math.max(0.05, view.scale * dpr)) / Math.log(1.25)));
  const rc = useMemo(() => ({ mode: "edit" as const, pixelScale: ps, playing, fontsTick, mediaTick, showPlaceholders: true }), [ps, playing, fontsTick, mediaTick]);
  const editKey = `${tool}|${spaceDown}|${cropId}|${editingTextId}|${selectedCell?.gridId ?? ""}`;
  const selEls = flatten(slide.elements).filter((e) => selection.includes(e.id));
  const editingEl = editingTextId ? (slide.elements.find((e) => e.id === editingTextId) as import("@/lib/types").TextEl | undefined) : undefined;
  const crop = cropTargetOf(slide, cropId, selectedCell);
  const selectedGrid = selEls.length === 1 && selEls[0].type === "grid" && !cropId ? (selEls[0] as GridEl) : null;
  const cursor = spaceDown || tool === "hand" ? "grab" : "default";

  return (
    <div
      ref={containerRef}
      className="relative h-full w-full overflow-hidden bg-stage dots"
      style={{ cursor }}
      onPointerDownCapture={onPointerDownCapture}
      onDragOver={onDragOver}
      onDrop={onDrop}
      data-testid="workspace"
    >
      <Stage
        ref={stageRef}
        width={size.w}
        height={size.h}
        x={view.x}
        y={view.y}
        scaleX={view.scale}
        scaleY={view.scale}
        onMouseDown={onStageDown}
        onMouseMove={onStageMove}
        onTouchStart={onStageDown as never}
        onContextMenu={(e) => e.evt.preventDefault()}
      >
        <RenderContext.Provider value={rc}>
          <Layer>
            <Rect width={slide.width} height={slide.height} fill="#000" shadowColor="#000" shadowBlur={40 / Math.max(view.scale, 0.2)} shadowOpacity={0.45} listening={false} />
            <SlideBody slide={slide} handlers={handlers} editKey={editKey} editingId={editingTextId} />
          </Layer>
          <Layer>
            <LayoutGridOverlay slide={slide} />
            <SlideBoundaries slide={slide} />
            {safeAreas && <SafeAreas slide={slide} />}
            <Rect width={slide.width} height={slide.height} stroke="rgba(255,255,255,0.18)" strokeWidth={1} strokeScaleEnabled={false} listening={false} />
            {crop && <CropOverlay target={crop} accent={accent} onDown={() => { cropDrag.current = { last: pointer() ?? { x: 0, y: 0 } }; }} />}
            {selectedGrid && (
              <GridEditorOverlay
                el={selectedGrid}
                selectedCell={selectedCell?.gridId === selectedGrid.id ? selectedCell.cellId : null}
                accent={accent}
                scale={view.scale}
                onDividerDown={(splitId, index, dir) => {
                  const p = pointer();
                  if (p) dividerDrag.current = { gridId: selectedGrid.id, splitId, index, dir, last: toLocal(selectedGrid, p) };
                }}
              />
            )}
            {guidesOn && (
              <GuideLines
                slide={slide}
                scale={view.scale}
                onMove={(axis, i, pos) =>
                  useStore.getState().commit((p) => {
                    const s = p.slides.find((x) => x.id === p.activeSlideId)!;
                    if (pos === null) s.guides[axis].splice(i, 1);
                    else s.guides[axis][i] = pos;
                  })
                }
              />
            )}
            <SnapLinesView lines={snapLines} accent="#ff3d7f" />
            <SelectionLayer ids={selection} slide={slide} accent={accent} hidden={!!cropId || !!editingTextId || tool === "hand"} />
            {marquee && <Rect x={marquee.x} y={marquee.y} width={marquee.w} height={marquee.h} fill={accent.replace("rgb", "rgba").replace(")", ",0.12)")} stroke={accent} strokeWidth={1} strokeScaleEnabled={false} listening={false} />}
            {swap && <Group />}
          </Layer>
        </RenderContext.Provider>
      </Stage>

      {swap && <div className="pointer-events-none absolute z-30 h-16 w-16 -translate-x-1/2 -translate-y-1/2 rounded border-2 border-accent bg-accent/20" style={{ left: swap.x, top: swap.y }} />}
      {editingEl && <TextEditor el={editingEl} view={view} />}
      {rulers && <Rulers width={size.w} height={size.h} />}
      <PanoramaHandles />
    </div>
  );
}

export { viewForRect };
