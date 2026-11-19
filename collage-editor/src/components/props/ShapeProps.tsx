"use client";
import type { MediaEl, ShapeEl } from "@/lib/types";
import { useStore } from "@/lib/store";
import { ColorField } from "@/components/ui/ColorPicker";
import { Field, Section, Select, Slider } from "@/components/ui/controls";
import { PaintField, ShadowField, StrokeField } from "./StyleControls";

export function ShapeProps({ el }: { el: ShapeEl }) {
  const st = useStore.getState;
  const set = (fn: (e: ShapeEl) => void, key?: string) => st().updateElement(el.id, (e) => fn(e as ShapeEl), { key });
  const line = el.kind === "line" || el.kind === "arrow";
  return (
    <Section title={line ? "Line" : "Shape"}>
      {!line && <PaintField label="Fill" paint={el.fill} onChange={(p) => set((e) => { e.fill = p; }, "fill")} />}
      <StrokeField label={line ? "Line" : "Stroke"} stroke={el.stroke} onChange={(s) => set((e) => { e.stroke = s; })} max={120} />
      {el.kind === "rect" && <Slider label="Corner" value={Math.round(el.radius)} min={0} max={400} onChange={(v) => set((e) => { e.radius = v; }, "radius")} />}
      {(el.kind === "polygon" || el.kind === "star") && <Slider label="Sides" value={el.sides} min={3} max={12} onChange={(v) => set((e) => { e.sides = v; }, "sides")} />}
      {el.kind === "star" && <Slider label="Inner" value={Math.round(el.innerRatio * 100)} min={10} max={90} unit="%" onChange={(v) => set((e) => { e.innerRatio = v / 100; }, "inner")} />}
      {line && <Field label="Cap"><Select width={90} value={el.lineCap ?? "round"} options={[{ value: "round", label: "Round" }, { value: "butt", label: "Flat" }]} onChange={(v) => set((e) => { e.lineCap = v; })} /></Field>}
      {!!el.glass && <Slider label="Glass" value={Math.round(el.glass * 100)} min={0} max={200} unit="%" onChange={(v) => set((e) => { e.glass = v / 100; }, "glass")} />}
      <ShadowField shadow={el.shadow} onChange={(s) => set((e) => { e.shadow = s; })} />
    </Section>
  );
}

export function FrameProps({ el }: { el: MediaEl }) {
  const st = useStore.getState;
  const set = (fn: (e: MediaEl) => void, key?: string) => st().updateElement(el.id, (e) => fn(e as MediaEl), { key });
  return (
    <Section title="Frame">
      <Field label="Shape">
        <Select width={120} value={el.shape} options={[{ value: "rect", label: "Rectangle" }, { value: "circle", label: "Circle / ellipse" }, { value: "arch", label: "Arch" }, { value: "squircle", label: "Squircle" }, { value: "pill", label: "Pill" }]} onChange={(v) => set((e) => { e.shape = v; })} />
      </Field>
      {el.shape === "rect" && <Slider label="Corner" value={Math.round(el.radius)} min={0} max={400} onChange={(v) => set((e) => { e.radius = v; }, "radius")} onReset={() => set((e) => { e.radius = 0; })} testId="frame-radius" />}
      <Field label="Behind"><ColorField value={el.bg} onChange={(c) => set((e) => { e.bg = c; }, "bg")} /></Field>
      <StrokeField label="Border" stroke={el.stroke} onChange={(s) => set((e) => { e.stroke = s; })} />
      <ShadowField shadow={el.shadow} onChange={(s) => set((e) => { e.shadow = s; })} />
    </Section>
  );
}
