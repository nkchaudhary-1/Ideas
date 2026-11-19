"use client";
import { memo, useEffect, useRef } from "react";
import { Arrow, Ellipse, Group, Line, Path, Rect, RegularPolygon, Shape, Star, Text } from "react-konva";
import type Konva from "konva";
import type { Background, Element, GridEl, MediaEl, Paint, Shadow, ShapeEl, Slide, TextEl } from "@/lib/types";
import { layoutGrid } from "@/lib/grid-engine";
import { fontStack, loadFont, nearestWeight, fontByFamily } from "@/lib/fonts";
import { useStore } from "@/lib/store";
import MediaShape from "./MediaShape";
import { useRender } from "./render-context";

// ───────────────────────── paint helpers ─────────────────────────

export function paintProps(paint: Paint | null, w: number, h: number): Record<string, unknown> {
  if (!paint) return { fill: undefined };
  if (paint.type === "solid") return { fill: paint.color };
  const a = (paint.angle * Math.PI) / 180;
  const cx = w / 2, cy = h / 2;
  const len = Math.abs(w * Math.sin(a)) + Math.abs(h * Math.cos(a));
  const dx = (Math.sin(a) * len) / 2, dy = (-Math.cos(a) * len) / 2;
  return {
    fillPriority: "linear-gradient",
    fillLinearGradientStartPoint: { x: cx - dx, y: cy - dy },
    fillLinearGradientEndPoint: { x: cx + dx, y: cy + dy },
    fillLinearGradientColorStops: paint.stops.flatMap((s) => [s.offset, s.color]),
  };
}

export function shadowProps(s: Shadow | null) {
  return s
    ? { shadowColor: s.color, shadowBlur: s.blur, shadowOffsetX: s.x, shadowOffsetY: s.y, shadowOpacity: s.opacity, shadowEnabled: true }
    : { shadowEnabled: false };
}

// ───────────────────────── background ─────────────────────────

function seeded(seed: number) {
  let s = seed >>> 0;
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
}

export function BackgroundNode({ bg, w, h }: { bg: Background; w: number; h: number }) {
  if (bg.type === "solid") return <Rect width={w} height={h} fill={bg.color} listening={false} perfectDrawEnabled={false} />;
  if (bg.type === "gradient")
    return <Rect width={w} height={h} listening={false} perfectDrawEnabled={false} {...paintProps({ type: "gradient", angle: bg.angle, stops: bg.stops }, w, h)} />;
  if (bg.type === "image")
    return <MediaShape elKey="bg" width={w} height={h} bg={bg.color} fill={bg.fill} listening={false} />;
  return (
    <Shape
      width={w}
      height={h}
      listening={false}
      perfectDrawEnabled={false}
      sceneFunc={(ctx) => {
        const c = (ctx as unknown as { _context: CanvasRenderingContext2D })._context;
        c.fillStyle = bg.bg;
        c.fillRect(0, 0, w, h);
        c.save();
        c.globalAlpha = bg.opacity;
        c.fillStyle = bg.color;
        c.strokeStyle = bg.color;
        const s = Math.max(4, bg.size);
        if (bg.pattern === "dots") {
          for (let y = s / 2; y < h; y += s) for (let x = s / 2; x < w; x += s) { c.beginPath(); c.arc(x, y, s * 0.12, 0, Math.PI * 2); c.fill(); }
        } else if (bg.pattern === "grid") {
          c.lineWidth = 1.5;
          c.beginPath();
          for (let x = 0; x <= w; x += s) { c.moveTo(x, 0); c.lineTo(x, h); }
          for (let y = 0; y <= h; y += s) { c.moveTo(0, y); c.lineTo(w, y); }
          c.stroke();
        } else if (bg.pattern === "lines") {
          c.lineWidth = Math.max(1.5, s * 0.08);
          c.beginPath();
          for (let y = s / 2; y <= h; y += s) { c.moveTo(0, y); c.lineTo(w, y); }
          c.stroke();
        } else if (bg.pattern === "checker") {
          for (let y = 0, r = 0; y < h; y += s, r++) for (let x = (r % 2) * s; x < w; x += s * 2) c.fillRect(x, y, s, s);
        } else {
          const rnd = seeded(7);
          const n = Math.round((w * h) / (bg.pattern === "paper" ? 90 : 55));
          for (let i = 0; i < n; i++) {
            c.globalAlpha = bg.opacity * (0.25 + rnd() * 0.75);
            const sz = bg.pattern === "paper" ? 1 + rnd() * 2.2 : 1 + rnd();
            c.fillRect(rnd() * w, rnd() * h, sz, sz);
          }
        }
        c.restore();
      }}
    />
  );
}

// ───────────────────────── text ─────────────────────────

export function transformText(t: string, tt: TextEl["textTransform"]) {
  if (tt === "uppercase") return t.toUpperCase();
  if (tt === "lowercase") return t.toLowerCase();
  if (tt === "capitalize") return t.replace(/\b(\p{L})(\p{L}*)/gu, (_, a: string, b: string) => a.toUpperCase() + b.toLowerCase());
  return t;
}

function TextBody({ el, hidden }: { el: TextEl; hidden: boolean }) {
  const rc = useRender();
  const ref = useRef<Konva.Text>(null);
  const f = fontByFamily(el.fontFamily);
  const nw = nearestWeight(f, el.fontWeight, el.italic);

  useEffect(() => { void loadFont(el.fontFamily, el.fontWeight, el.italic); }, [el.fontFamily, el.fontWeight, el.italic]);
  useEffect(() => {
    if (rc.mode !== "export" || !rc.registerReady) return;
    return rc.registerReady(() => document.fonts.check(`${nw.italic ? "italic " : ""}${nw.weight} 16px "${el.fontFamily}"`) || !f);
  }, [rc, el.fontFamily, nw.weight, nw.italic, f]);

  const text = transformText(el.text || " ", el.textTransform);
  const decoration = [el.underline ? "underline" : "", el.strike ? "line-through" : ""].filter(Boolean).join(" ");
  const gradient = el.fill.type === "gradient";

  // keep the stored height in step with the laid-out text (auto-height boxes)
  useEffect(() => {
    if (rc.mode !== "edit" || !el.autoHeight || !ref.current) return;
    const h = Math.ceil(ref.current.height());
    if (h > 0 && Math.abs(h - el.height) > 1) useStore.getState().updateElement(el.id, { height: h }, { history: false });
  });

  return (
    <>
      {el.background && <Rect width={el.width} height={el.height} fill={el.background.color} cornerRadius={el.background.radius} listening={false} />}
      <Text
        ref={ref}
        text={text}
        width={el.width}
        height={el.autoHeight ? undefined : el.height}
        fontFamily={fontStack(el.fontFamily)}
        fontSize={el.fontSize}
        fontStyle={`${nw.italic || el.italic ? "italic " : ""}${nw.weight}`}
        align={el.align}
        verticalAlign={el.vAlign}
        lineHeight={el.lineHeight}
        letterSpacing={el.letterSpacing}
        padding={el.padding}
        wrap="word"
        textDecoration={decoration}
        visible={!hidden}
        stroke={el.stroke?.color}
        strokeWidth={el.stroke?.width ?? 0}
        fillAfterStrokeEnabled={!!el.stroke}
        {...(gradient ? paintProps(el.fill, el.width, el.height) : { fill: (el.fill as { color: string }).color })}
        {...shadowProps(el.shadow)}
        perfectDrawEnabled={false}
      />
    </>
  );
}

// ───────────────────────── shapes ─────────────────────────

function ShapeBody({ el }: { el: ShapeEl }) {
  const { width: w, height: h } = el;
  const stroke = el.stroke ? { stroke: el.stroke.color, strokeWidth: el.stroke.width, lineCap: el.lineCap ?? "round", lineJoin: "round" as const } : {};
  const fill = paintProps(el.fill, w, h);
  const sh = shadowProps(el.shadow);
  const glass = el.glass ? { fill: `rgba(255,255,255,${0.12 * el.glass})`, stroke: "rgba(255,255,255,0.85)", strokeWidth: 2 } : {};
  const common = { ...fill, ...stroke, ...sh, ...glass, perfectDrawEnabled: false } as Record<string, unknown>;
  const m = Math.min(w, h);
  switch (el.kind) {
    case "rect": return <Rect width={w} height={h} cornerRadius={Math.min(el.radius, m / 2)} {...common} />;
    case "ellipse": return <Ellipse x={w / 2} y={h / 2} radiusX={w / 2} radiusY={h / 2} {...common} />;
    case "line": return <Line points={[0, h / 2, w, h / 2]} hitStrokeWidth={Math.max(16, el.stroke?.width ?? 0)} {...common} />;
    case "arrow": {
      const sw = el.stroke?.width ?? 6;
      return <Arrow points={[0, h / 2, w, h / 2]} pointerLength={sw * 2.6} pointerWidth={sw * 2.6} fill={el.stroke?.color} hitStrokeWidth={Math.max(16, sw)} {...common} />;
    }
    case "triangle": return <Line points={[w / 2, 0, w, h, 0, h]} closed {...common} />;
    case "polygon": return <RegularPolygon x={w / 2} y={h / 2} sides={el.sides} radius={m / 2} scaleX={w / m} scaleY={h / m} {...common} />;
    case "star": return <Star x={w / 2} y={h / 2} numPoints={el.sides} innerRadius={(m / 2) * el.innerRatio} outerRadius={m / 2} scaleX={w / m} scaleY={h / m} {...common} />;
    case "path": {
      const box = el.pathBox ?? { w: 100, h: 100 };
      return <Path data={el.path ?? ""} scaleX={w / box.w} scaleY={h / box.h} {...common} strokeScaleEnabled={false} />;
    }
  }
}

// ───────────────────────── grid ─────────────────────────

function GridBody({ el }: { el: GridEl }) {
  const { cells } = layoutGrid(el);
  return (
    <>
      {cells.map(({ id, rect, cell }) => (
        <Group key={id} x={rect.x} y={rect.y} cellId={id}>
          <MediaShape
            elKey={`${el.id}:${id}`}
            width={rect.w}
            height={rect.h}
            radius={cell.radius ?? el.radius}
            bg={cell.bg ?? el.cellBg}
            fill={cell.fill}
            stroke={el.cellStroke}
          />
        </Group>
      ))}
    </>
  );
}

// ───────────────────────── element node ─────────────────────────

export interface NodeHandlers {
  onDown?: (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>, el: Element) => void;
  onDragStart?: (e: Konva.KonvaEventObject<DragEvent>, el: Element) => void;
  onDragMove?: (e: Konva.KonvaEventObject<DragEvent>, el: Element) => void;
  onDragEnd?: (e: Konva.KonvaEventObject<DragEvent>, el: Element) => void;
  onDblClick?: (e: Konva.KonvaEventObject<MouseEvent>, el: Element) => void;
  draggable?: (el: Element) => boolean;
}

interface Props { el: Element; handlers?: NodeHandlers; nested?: boolean; editKey?: string; editingId?: string | null }

function ElementNodeImpl({ el, handlers, nested, editingId }: Props) {
  const rc = useRender();
  if (!el.visible && rc.mode === "export") return null;
  const interactive = rc.mode === "edit" && handlers && !nested;
  const common = {
    id: el.id,
    name: "el",
    elId: el.id,
    x: el.x + el.width / 2,
    y: el.y + el.height / 2,
    offsetX: el.width / 2,
    offsetY: el.height / 2,
    rotation: el.rotation,
    opacity: el.opacity,
    visible: el.visible,
    globalCompositeOperation: el.blend === "source-over" ? undefined : el.blend,
  };
  const ev = interactive
    ? {
        draggable: !!handlers!.draggable?.(el),
        onMouseDown: (e: Konva.KonvaEventObject<MouseEvent>) => handlers!.onDown?.(e, el),
        onTouchStart: (e: Konva.KonvaEventObject<TouchEvent>) => handlers!.onDown?.(e, el),
        onDragStart: (e: Konva.KonvaEventObject<DragEvent>) => handlers!.onDragStart?.(e, el),
        onDragMove: (e: Konva.KonvaEventObject<DragEvent>) => handlers!.onDragMove?.(e, el),
        onDragEnd: (e: Konva.KonvaEventObject<DragEvent>) => handlers!.onDragEnd?.(e, el),
        onDblClick: (e: Konva.KonvaEventObject<MouseEvent>) => handlers!.onDblClick?.(e, el),
        onDblTap: (e: Konva.KonvaEventObject<MouseEvent>) => handlers!.onDblClick?.(e, el),
      }
    : nested && rc.mode === "edit" ? {} : { listening: false };

  let body: React.ReactNode = null;
  switch (el.type) {
    case "image":
    case "video": {
      const m = el as MediaEl;
      body = <MediaShape elKey={el.id} width={el.width} height={el.height} shape={m.shape} radius={m.radius} bg={m.bg} fill={m.fill} stroke={m.stroke} shadow={el.shadow} />;
      break;
    }
    case "text": body = <TextBody el={el} hidden={editingId === el.id} />; break;
    case "shape": body = <ShapeBody el={el} />; break;
    case "grid": body = <GridBody el={el} />; break;
    case "group": body = el.children.map((c) => <ElementNode key={c.id} el={c} nested />); break;
  }
  const shadowGroup = el.type === "grid" || el.type === "group" ? shadowProps(el.shadow) : {};
  return (
    <Group {...common} {...ev} {...shadowGroup} width={el.width} height={el.height}>
      {body}
    </Group>
  );
}

const ElementNode = memo(ElementNodeImpl, (a, b) => a.el === b.el && a.handlers === b.handlers && a.nested === b.nested && a.editKey === b.editKey && a.editingId === b.editingId);
export default ElementNode;

export function SlideBody({ slide, handlers, transparentBg, editKey, editingId }: { slide: Slide; handlers?: NodeHandlers; transparentBg?: boolean; editKey?: string; editingId?: string | null }) {
  return (
    <Group clipX={0} clipY={0} clipWidth={slide.width} clipHeight={slide.height} name="artboard-content">
      {!transparentBg && <BackgroundNode bg={slide.background} w={slide.width} h={slide.height} />}
      {slide.elements.map((el) => (
        <ElementNode key={el.id} el={el} handlers={handlers} editKey={editKey} editingId={editingId} />
      ))}
    </Group>
  );
}
