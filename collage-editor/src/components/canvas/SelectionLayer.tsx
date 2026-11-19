"use client";
import { useEffect, useRef } from "react";
import { Transformer } from "react-konva";
import type Konva from "konva";
import type { Element, Slide } from "@/lib/types";
import { flatten } from "@/lib/geometry";
import { useStore } from "@/lib/store";
import { applyTransform, type Anchor } from "@/lib/transform";

const ALL = ["top-left", "top-center", "top-right", "middle-left", "middle-right", "bottom-left", "bottom-center", "bottom-right"];
const SIDES_ONLY = ["middle-left", "middle-right"];
const CORNERS_AND_SIDES = ["top-left", "top-right", "bottom-left", "bottom-right", "middle-left", "middle-right"];

export default function SelectionLayer({ ids, slide, accent, hidden }: { ids: string[]; slide: Slide; accent: string; hidden: boolean }) {
  const trRef = useRef<Konva.Transformer>(null);
  const els = flatten(slide.elements);
  const selected = ids.map((id) => els.find((e) => e.id === id)).filter(Boolean) as Element[];

  useEffect(() => {
    const tr = trRef.current;
    const stage = tr?.getStage();
    if (!tr || !stage) return;
    const nodes = hidden ? [] : (selected.map((e) => stage.findOne("#" + e.id)).filter(Boolean) as Konva.Node[]);
    tr.nodes(nodes);
    tr.getLayer()?.batchDraw();
  });

  let anchors = ALL;
  if (selected.length === 1) {
    const e = selected[0];
    if (e.type === "text") anchors = CORNERS_AND_SIDES;
    if (e.type === "shape" && (e.kind === "line" || e.kind === "arrow")) anchors = SIDES_ONLY;
  }

  const onEnd = () => {
    const tr = trRef.current;
    if (!tr) return;
    const anchor = tr.getActiveAnchor() as Anchor;
    const nodes = tr.nodes();
    const updates = new Map<string, { cx: number; cy: number; sx: number; sy: number; rotation: number }>();
    for (const n of nodes) {
      updates.set(n.id(), { cx: n.x(), cy: n.y(), sx: n.scaleX(), sy: n.scaleY(), rotation: n.rotation() });
      n.scaleX(1);
      n.scaleY(1);
    }
    useStore.getState().updateElements([...updates.keys()], (e) => {
      const u = updates.get(e.id);
      if (u) applyTransform(e, { ...u, anchor });
    });
  };

  return (
    <Transformer
      ref={trRef}
      keepRatio
      rotateEnabled
      rotationSnaps={[0, 45, 90, 135, 180, 225, 270, 315]}
      rotationSnapTolerance={4}
      enabledAnchors={anchors}
      borderStroke={accent}
      borderStrokeWidth={1.5}
      anchorStroke={accent}
      anchorFill="#ffffff"
      anchorSize={9}
      anchorCornerRadius={2}
      rotateAnchorOffset={26}
      ignoreStroke
      boundBoxFunc={(o, n) => (n.width < 10 || n.height < 4 ? o : n)}
      onTransformEnd={onEnd}
    />
  );
}
