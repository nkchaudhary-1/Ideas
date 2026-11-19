"use client";
import { Group, Line, Rect } from "react-konva";
import type Konva from "konva";
import type { Element, GridEl, MediaEl, Slide } from "@/lib/types";
import { layoutGrid, findCell } from "@/lib/grid-engine";
import { gridLines, type SnapLine } from "@/lib/snap";
import MediaShape from "./MediaShape";
import { RenderContext, useRender } from "./render-context";
import { useContext } from "react";

/** places overlay content in an element's local space (centre-anchored rotation) */
export function InElement({ el, children, dx = 0, dy = 0 }: { el: Element; children: React.ReactNode; dx?: number; dy?: number }) {
  return (
    <Group x={el.x + el.width / 2} y={el.y + el.height / 2} offsetX={el.width / 2} offsetY={el.height / 2} rotation={el.rotation} listening={false}>
      <Group x={dx} y={dy}>{children}</Group>
    </Group>
  );
}

export function LayoutGridOverlay({ slide }: { slide: Slide }) {
  const g = slide.grid;
  if (!g.visible || g.kind === "none") return null;
  const { xs, ys, cols } = gridLines(g, slide.width, slide.height);
  const fillCol = g.color + "26";
  return (
    <Group listening={false}>
      {(g.kind === "columns" || g.kind === "modular") && cols.map((c, i) => <Rect key={i} x={c.x} y={0} width={c.w} height={slide.height} fill={fillCol} />)}
      {g.kind === "modular" && Array.from({ length: ys.length / 2 }, (_, i) => (
        <Rect key={"r" + i} x={0} y={ys[i * 2]} width={slide.width} height={ys[i * 2 + 1] - ys[i * 2]} fill={fillCol} />
      ))}
      {g.kind === "baseline" && ys.map((y, i) => <Line key={i} points={[0, y, slide.width, y]} stroke={g.color} strokeWidth={1} opacity={0.5} strokeScaleEnabled={false} />)}
      {g.margin > 0 && <Rect x={g.margin} y={g.margin} width={slide.width - g.margin * 2} height={slide.height - g.margin * 2} stroke={g.color} strokeWidth={1} dash={[6, 6]} opacity={0.5} strokeScaleEnabled={false} />}
      {/* x/y refs kept so tree-shaking cannot drop them in dev */}
      {xs.length < 0 && null}
    </Group>
  );
}

export function SlideBoundaries({ slide }: { slide: Slide }) {
  // panorama canvases (multiples of 1080 wide) show where the slides are cut on export
  const n = Math.round(slide.width / 1080);
  if (n < 2 || Math.abs(slide.width - n * 1080) > 1) return null;
  return (
    <Group listening={false}>
      {Array.from({ length: n - 1 }, (_, i) => (
        <Line key={i} points={[(i + 1) * 1080, 0, (i + 1) * 1080, slide.height]} stroke="#ffffff" strokeWidth={1.5} dash={[10, 8]} opacity={0.75} strokeScaleEnabled={false} />
      ))}
    </Group>
  );
}

export function SafeAreas({ slide }: { slide: Slide }) {
  const r = slide.width / slide.height;
  const common = { stroke: "#ff6b81", strokeWidth: 1.2, dash: [8, 6] as number[], opacity: 0.85, strokeScaleEnabled: false, listening: false };
  if (r < 0.62) {
    // story / reel: keep text clear of the app chrome
    return (
      <Group listening={false}>
        <Rect x={0} y={0} width={slide.width} height={250} fill="rgba(255,107,129,0.10)" />
        <Rect x={0} y={slide.height - 340} width={slide.width} height={340} fill="rgba(255,107,129,0.10)" />
        <Line points={[0, 250, slide.width, 250]} {...common} />
        <Line points={[0, slide.height - 340, slide.width, slide.height - 340]} {...common} />
      </Group>
    );
  }
  // feed: the profile grid shows a centred 3:4 crop
  const cw = Math.min(slide.width, (slide.height * 3) / 4);
  if (cw >= slide.width - 1) return null;
  return (
    <Group listening={false}>
      <Rect x={(slide.width - cw) / 2} y={0} width={cw} height={slide.height} {...common} />
    </Group>
  );
}

export function SnapLinesView({ lines, accent }: { lines: SnapLine[]; accent: string }) {
  return (
    <Group listening={false}>
      {lines.map((l, i) => (
        <Line key={i} points={l.axis === "x" ? [l.pos, l.from, l.pos, l.to] : [l.from, l.pos, l.to, l.pos]} stroke={accent} strokeWidth={1} strokeScaleEnabled={false} />
      ))}
    </Group>
  );
}

export function GuideLines({ slide, scale, onMove }: { slide: Slide; scale: number; onMove: (axis: "x" | "y", index: number, pos: number | null) => void }) {
  const big = 20000;
  const mk = (axis: "x" | "y", pos: number, i: number) => (
    <Line
      key={axis + i}
      points={axis === "x" ? [0, -big, 0, big] : [-big, 0, big, 0]}
      x={axis === "x" ? pos : 0}
      y={axis === "y" ? pos : 0}
      stroke="#27d3ff"
      strokeWidth={1}
      strokeScaleEnabled={false}
      hitStrokeWidth={10 / scale}
      draggable
      dragBoundFunc={function (this: Konva.Node, p) {
        const t = this.getAbsoluteTransform().copy();
        void t;
        return axis === "x" ? { x: p.x, y: this.absolutePosition().y } : { x: this.absolutePosition().x, y: p.y };
      }}
      onMouseEnter={(e) => { e.target.getStage()!.container().style.cursor = axis === "x" ? "col-resize" : "row-resize"; }}
      onMouseLeave={(e) => { e.target.getStage()!.container().style.cursor = ""; }}
      onDragEnd={(e) => {
        const pos = axis === "x" ? e.target.x() : e.target.y();
        const limit = axis === "x" ? slide.width : slide.height;
        onMove(axis, i, pos < -8 || pos > limit + 8 ? null : Math.round(pos * 100) / 100);
      }}
    />
  );
  return <Group>{slide.guides.x.map((p, i) => mk("x", p, i))}{slide.guides.y.map((p, i) => mk("y", p, i))}</Group>;
}

export function GridEditorOverlay({
  el, selectedCell, accent, scale, onDividerDown,
}: {
  el: GridEl;
  selectedCell: string | null;
  accent: string;
  scale: number;
  onDividerDown: (splitId: string, index: number, dir: "h" | "v") => void;
}) {
  const { cells, dividers } = layoutGrid(el);
  const sel = selectedCell ? cells.find((c) => c.id === selectedCell) : null;
  const hit = Math.max(14 / scale, el.gutter);
  return (
    <Group x={el.x + el.width / 2} y={el.y + el.height / 2} offsetX={el.width / 2} offsetY={el.height / 2} rotation={el.rotation}>
      {cells.map((c) => (
        <Rect key={c.id} x={c.rect.x} y={c.rect.y} width={c.rect.w} height={c.rect.h} stroke={accent} strokeWidth={1} opacity={0.35} dash={[4, 4]} strokeScaleEnabled={false} listening={false} cornerRadius={c.cell.radius ?? el.radius} />
      ))}
      {sel && <Rect x={sel.rect.x} y={sel.rect.y} width={sel.rect.w} height={sel.rect.h} stroke={accent} strokeWidth={2.5} strokeScaleEnabled={false} listening={false} cornerRadius={sel.cell.radius ?? el.radius} />}
      {dividers.map((d) => {
        const horizontal = d.dir === "h";
        const r = horizontal
          ? { x: d.rect.x + d.rect.w / 2 - hit / 2, y: d.rect.y, w: hit, h: d.rect.h }
          : { x: d.rect.x, y: d.rect.y + d.rect.h / 2 - hit / 2, w: d.rect.w, h: hit };
        return (
          <Rect
            key={d.splitId + d.index}
            x={r.x} y={r.y} width={r.w} height={r.h}
            fill={accent} opacity={0.001}
            onMouseEnter={(e) => { const rr = e.target as Konva.Rect; rr.opacity(0.5); e.target.getStage()!.container().style.cursor = horizontal ? "col-resize" : "row-resize"; rr.getLayer()?.batchDraw(); }}
            onMouseLeave={(e) => { const rr = e.target as Konva.Rect; rr.opacity(0.001); e.target.getStage()!.container().style.cursor = ""; rr.getLayer()?.batchDraw(); }}
            onMouseDown={(e) => { e.cancelBubble = true; onDividerDown(d.splitId, d.index, d.dir); }}
          />
        );
      })}
    </Group>
  );
}

/** crop mode: the whole picture, faded, behind the frame outline; the frame itself pans the picture */
export function CropOverlay({
  target, accent, onDown,
}: {
  target: { el: Element; rect: { x: number; y: number; w: number; h: number }; fill: import("@/lib/types").MediaFill; radius: number; key: string };
  accent: string;
  onDown: () => void;
}) {
  const parent = useContext(RenderContext);
  const { el, rect, fill } = target;
  return (
    <Group x={el.x + el.width / 2} y={el.y + el.height / 2} offsetX={el.width / 2} offsetY={el.height / 2} rotation={el.rotation}>
      <Group x={rect.x} y={rect.y}>
        <RenderContext.Provider value={{ ...parent, showPlaceholders: false }}>
          <MediaShape elKey={target.key} width={rect.w} height={rect.h} bg="transparent" fill={fill} ghost listening={false} />
        </RenderContext.Provider>
        <Rect width={rect.w} height={rect.h} stroke={accent} strokeWidth={2} strokeScaleEnabled={false} cornerRadius={target.radius} />
        <Rect
          width={rect.w} height={rect.h} fill="rgba(0,0,0,0.001)"
          onMouseEnter={(e) => { e.target.getStage()!.container().style.cursor = "grab"; }}
          onMouseLeave={(e) => { e.target.getStage()!.container().style.cursor = ""; }}
          onMouseDown={(e) => { e.cancelBubble = true; onDown(); }}
          onTouchStart={(e) => { e.cancelBubble = true; onDown(); }}
        />
      </Group>
    </Group>
  );
}

export { useRender, findCell };
export type { MediaEl };
