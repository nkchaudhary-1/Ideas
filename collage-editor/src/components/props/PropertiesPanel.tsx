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
import EditPanel from "./EditPanel";

const ICON = { image: ImageIcon, video: Film, text: Type, shape: Shapes, grid: LayoutGrid, group: GroupIcon } as const;

/** the card on the right: edit tools in Edit mode, otherwise properties of whatever is selected */
export default function PropertiesPanel({ sheet = false }: { sheet?: boolean }) {
  const kind = useStore((s) => s.project.kind);
  return kind === "edit" ? <EditPanel sheet={sheet} /> : <CollagePanel sheet={sheet} />;
}

function CollagePanel({ sheet }: { sheet: boolean }) {
  const els = useSelectedElements();
  const target = useFillTarget();
  const st = useStore.getState;
  const single = els.length === 1 ? els[0] : null;
  const Icon = single ? ICON[single.type] : els.length > 1 ? Box : null;

  return (
    <aside className={sheet ? "flex min-h-0 flex-1 flex-col overflow-hidden" : "card pop flex w-[344px] shrink-0 flex-col overflow-hidden"} data-testid="properties">
      <div className={`flex shrink-0 items-center gap-3 px-8 ${sheet ? "h-14" : "h-[72px]"}`}>
        {Icon && <Icon size={16} className="text-mute" />}
        {single ? (
          <TextInput aria="Layer name" value={single.name} onCommit={(v) => st().updateElement(single.id, { name: v || single.name })} className="h-9 flex-1 !bg-transparent !px-3 text-base !font-extrabold hover:!bg-field" />
        ) : (
          <h2 className="text-base font-extrabold tracking-tight">{els.length > 1 ? `${els.length} selected` : "Canvas"}</h2>
        )}
        {single && <span className="rounded-full bg-field px-2 py-0.5 text-2xs font-semibold capitalize text-mute">{single.type}</span>}
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto pb-6" data-testid="properties-scroll">
        {els.length === 0 && <CanvasProps />}
        {single?.type === "text" && <TextProps el={single} />}
        {single?.type === "shape" && <ShapeProps el={single} />}
        {single?.type === "grid" && <GridProps el={single} />}
        {target && <MediaProps target={target} />}
        {(single?.type === "image" || single?.type === "video") && !target && <EmptyFrame />}
        {(single?.type === "image" || single?.type === "video") && <FrameProps el={single as MediaEl} />}
        {els.length > 0 && <ArrangeSection els={els} />}
      </div>
    </aside>
  );
}

function EmptyFrame() {
  const st = useStore.getState;
  return (
    <div className="mx-3 mb-3 rounded-in-12 bg-panel2 px-5 py-5 text-xs leading-5 text-mute">
      <div className="mb-1 text-sm font-bold text-ink">Empty frame</div>
      Click it to add a photo or video, or drop one onto it.
      <button type="button" className="mt-3 block rounded-full bg-pill px-4 py-2 font-semibold text-pillink" onClick={() => st().setUI({ leftPanel: "uploads" })}>Open media</button>
    </div>
  );
}
