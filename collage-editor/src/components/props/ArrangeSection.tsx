"use client";
import { AlignCenterHorizontal, AlignCenterVertical, AlignEndHorizontal, AlignEndVertical, AlignStartHorizontal, AlignStartVertical, ArrowDownToLine, ArrowUpToLine, ChevronDown, ChevronUp, Copy, FlipHorizontal2, FlipVertical2, Group as GroupIcon, Lock, Trash2, Ungroup, Unlock, StretchHorizontal, StretchVertical } from "lucide-react";
import type { BlendMode, Element } from "@/lib/types";
import { useStore } from "@/lib/store";
import { boundsOf, unionRects } from "@/lib/geometry";
import { Field, IconButton, NumberField, Section, Select, Slider, TickSlider } from "@/components/ui/controls";

const BLENDS: { value: BlendMode; label: string }[] = [
  { value: "source-over", label: "Normal" }, { value: "multiply", label: "Multiply" }, { value: "screen", label: "Screen" },
  { value: "overlay", label: "Overlay" }, { value: "soft-light", label: "Soft light" }, { value: "hard-light", label: "Hard light" },
  { value: "darken", label: "Darken" }, { value: "lighten", label: "Lighten" }, { value: "difference", label: "Difference" }, { value: "color-dodge", label: "Dodge" },
];

export default function ArrangeSection({ els }: { els: Element[] }) {
  const st = useStore.getState;
  const ids = els.map((e) => e.id);
  const single = els.length === 1 ? els[0] : null;
  const box = single ? boundsOf(single) : unionRects(els.map(boundsOf))!;
  const first = els[0];
  const setAll = (fn: (e: Element) => void, key?: string) => st().updateElements(ids, (e) => fn(e as Element), { key });

  return (
    <>
      <Section title="Arrange">
        <div className="flex items-center gap-0.5">
          <IconButton icon={<AlignStartVertical size={15} />} label="Align left" onClick={() => st().align("left", ids)} />
          <IconButton icon={<AlignCenterVertical size={15} />} label="Align centre horizontally" onClick={() => st().align("hcenter", ids)} testId="align-hcenter" />
          <IconButton icon={<AlignEndVertical size={15} />} label="Align right" onClick={() => st().align("right", ids)} />
          <span className="mx-1 h-4 w-px bg-line" />
          <IconButton icon={<AlignStartHorizontal size={15} />} label="Align top" onClick={() => st().align("top", ids)} />
          <IconButton icon={<AlignCenterHorizontal size={15} />} label="Align centre vertically" onClick={() => st().align("vcenter", ids)} />
          <IconButton icon={<AlignEndHorizontal size={15} />} label="Align bottom" onClick={() => st().align("bottom", ids)} />
          <span className="mx-1 h-4 w-px bg-line" />
          <IconButton icon={<StretchHorizontal size={15} />} label="Distribute horizontally" disabled={els.length < 3} onClick={() => st().distribute("h", ids)} />
          <IconButton icon={<StretchVertical size={15} />} label="Distribute vertically" disabled={els.length < 3} onClick={() => st().distribute("v", ids)} />
        </div>
        {single && (
          <>
            <div className="grid grid-cols-2 gap-x-4 gap-y-3">
              <NumberField label="X" width={130} value={single.x} onChange={(v) => setAll((e) => { e.x = v; }, "x")} unit="px" />
              <NumberField label="Y" width={130} value={single.y} onChange={(v) => setAll((e) => { e.y = v; }, "y")} unit="px" />
              <NumberField label="W" width={130} value={single.width} min={1} onChange={(v) => setAll((e) => { e.width = Math.max(1, v); }, "w")} unit="px" />
              <NumberField label="H" width={130} value={single.height} min={1} onChange={(v) => setAll((e) => { e.height = Math.max(1, v); }, "h")} unit="px" />
            </div>
            <TickSlider label="Rotate" testId="rotate-ruler" value={((single.rotation + 540) % 360) - 180} onChange={(v) => setAll((e) => { e.rotation = v; }, "rot")} />
          </>
        )}
        {!single && box && <div className="text-xs text-mute">{els.length} selected · {Math.round(box.w)} × {Math.round(box.h)} px</div>}
        <Slider label="Opacity" value={Math.round(first.opacity * 100)} min={0} max={100} neutral={100} unit="%" onChange={(v) => setAll((e) => { e.opacity = v / 100; }, "opacity")} onReset={() => setAll((e) => { e.opacity = 1; })} />
        <Field label="Blend"><Select width={120} value={first.blend} options={BLENDS} onChange={(v) => setAll((e) => { e.blend = v; })} /></Field>
        <div className="flex items-center gap-0.5 pt-0.5">
          <IconButton icon={<ArrowUpToLine size={15} />} label="Bring to front" shortcut="⇧⌘]" onClick={() => st().reorder("front", ids)} />
          <IconButton icon={<ChevronUp size={15} />} label="Bring forward" shortcut="⌘]" onClick={() => st().reorder("forward", ids)} />
          <IconButton icon={<ChevronDown size={15} />} label="Send backward" shortcut="⌘[" onClick={() => st().reorder("backward", ids)} />
          <IconButton icon={<ArrowDownToLine size={15} />} label="Send to back" shortcut="⇧⌘[" onClick={() => st().reorder("back", ids)} />
          <span className="mx-1 h-4 w-px bg-line" />
          <IconButton icon={<FlipHorizontal2 size={15} />} label="Flip horizontally" onClick={() => st().flip("x", ids)} />
          <IconButton icon={<FlipVertical2 size={15} />} label="Flip vertically" onClick={() => st().flip("y", ids)} />
        </div>
        <div className="flex items-center gap-0.5">
          <IconButton icon={<Copy size={15} />} label="Duplicate" shortcut="⌘D" onClick={() => st().duplicateElements(ids)} testId="duplicate" />
          <IconButton icon={first.locked ? <Unlock size={15} /> : <Lock size={15} />} label={first.locked ? "Unlock" : "Lock"} onClick={() => setAll((e) => { e.locked = !first.locked; })} />
          {els.length > 1 && <IconButton icon={<GroupIcon size={15} />} label="Group" shortcut="⌘G" onClick={() => st().group(ids)} testId="group" />}
          {single?.type === "group" && <IconButton icon={<Ungroup size={15} />} label="Ungroup" shortcut="⇧⌘G" onClick={() => st().ungroup(single.id)} />}
          <IconButton icon={<Trash2 size={15} />} label="Delete" shortcut="⌫" className="hover:!text-red-300" onClick={() => st().deleteElements(ids)} testId="delete" />
        </div>
      </Section>
    </>
  );
}
