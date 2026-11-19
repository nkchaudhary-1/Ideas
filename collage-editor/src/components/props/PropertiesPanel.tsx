"use client";
import { Box, Film, Group as GroupIcon, Image as ImageIcon, LayoutGrid, Shapes, Type } from "lucide-react";
import { useStore, useSelectedElements } from "@/lib/store";
import type { MediaEl } from "@/lib/types";
import ArrangeSection from "./ArrangeSection";
import CanvasProps from "./CanvasProps";
import GridProps from "./GridProps";
import MediaProps from "./MediaProps";
import { FrameProps, ShapeProps } from "./ShapeProps";
import TextProps from "./TextProps";
import { useFillTarget } from "./fill-target";
import { TextInput } from "@/components/ui/controls";

const ICON = { image: ImageIcon, video: Film, text: Type, shape: Shapes, grid: LayoutGrid, group: GroupIcon } as const;

export default function PropertiesPanel() {
  const els = useSelectedElements();
  const target = useFillTarget();
  const st = useStore.getState;
  const single = els.length === 1 ? els[0] : null;
  const Icon = single ? ICON[single.type] : els.length > 1 ? Box : null;

  return (
    <aside className="flex w-[304px] shrink-0 flex-col border-l border-line bg-panel" data-testid="properties">
      <div className="flex h-9 shrink-0 items-center gap-2 border-b border-line px-3">
        {Icon && <Icon size={14} className="text-mute" />}
        {single ? (
          <TextInput value={single.name} onCommit={(v) => st().updateElement(single.id, { name: v || single.name })} className="h-6 flex-1 !bg-transparent !ring-0 hover:!bg-panel2" />
        ) : (
          <span className="text-sm font-medium">{els.length > 1 ? `${els.length} selected` : "Canvas"}</span>
        )}
        {single && <span className="text-2xs uppercase tracking-wide text-faint">{single.type}</span>}
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto" data-testid="properties-scroll">
        {els.length === 0 && <CanvasProps />}
        {single?.type === "text" && <TextProps el={single} />}
        {single?.type === "shape" && <ShapeProps el={single} />}
        {single?.type === "grid" && <GridProps el={single} />}
        {target && <MediaProps target={target} />}
        {(single?.type === "image" || single?.type === "video") && !target && <EmptyFrame el={single as MediaEl} />}
        {(single?.type === "image" || single?.type === "video") && <FrameProps el={single as MediaEl} />}
        {els.length > 0 && <ArrangeSection els={els} />}
      </div>
    </aside>
  );
}

function EmptyFrame({ el }: { el: MediaEl }) {
  const st = useStore.getState;
  return (
    <div className="border-b border-line/70 px-3 py-3 text-xs leading-5 text-mute">
      <div className="mb-2 text-ink">Empty frame</div>
      Drop a photo or video onto it, or pick one in the Uploads panel.
      <button type="button" className="mt-2 block rounded-md bg-raised px-2.5 py-1 text-ink ring-1 ring-line hover:bg-[#383838]" onClick={() => st().setUI({ leftPanel: "uploads" })}>Open uploads</button>
      {void el}
    </div>
  );
}
