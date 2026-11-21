"use client";
import { placeElements, startDrag, endDrag, type ElementsItem } from "@/lib/drop";
import { makeFrame } from "@/lib/factory";
import type { FrameShape } from "@/lib/types";
import { Section } from "@/components/ui/controls";

const FRAMES: { id: string; name: string; w: number; h: number; shape: FrameShape; radius: number }[] = [
  { id: "rect", name: "Rectangle", w: 560, h: 420, shape: "rect", radius: 0 },
  { id: "square", name: "Square", w: 480, h: 480, shape: "rect", radius: 0 },
  { id: "rounded", name: "Rounded", w: 480, h: 600, shape: "rect", radius: 64 },
  { id: "card", name: "Card", w: 480, h: 610, shape: "rect", radius: 32 },
  { id: "portrait", name: "Portrait", w: 420, h: 560, shape: "rect", radius: 24 },
  { id: "landscape", name: "Landscape", w: 640, h: 420, shape: "rect", radius: 24 },
  { id: "circle", name: "Circle", w: 440, h: 440, shape: "circle", radius: 0 },
  { id: "ellipse", name: "Ellipse", w: 560, h: 360, shape: "circle", radius: 0 },
  { id: "arch", name: "Arch", w: 400, h: 560, shape: "arch", radius: 0 },
  { id: "pill", name: "Pill", w: 560, h: 280, shape: "pill", radius: 0 },
  { id: "squircle", name: "Squircle", w: 440, h: 440, shape: "squircle", radius: 0 },
];

/** a frame about 70% of the area it lands in, centred */
const item = (f: (typeof FRAMES)[number]): ElementsItem => ({
  kind: "elements",
  build: (aw, ah) => {
    const s = Math.min(1, (aw * 0.7) / f.w, (ah * 0.7) / f.h);
    const w = f.w * s, h = f.h * s;
    return [makeFrame(w, h, { shape: f.shape, radius: f.radius * s, name: f.name + " frame" }, (aw - w) / 2, (ah - h) / 2)];
  },
});

export default function FramesPanel() {
  return (
    <div className="h-full overflow-y-auto" data-testid="frames-panel">
      <div className="px-8 pb-5 text-xs leading-5 text-mute max-[899px]:pb-2"><span className="max-[899px]:hidden">Frames are windows for photos and videos. Drop media onto one, then double-click to move or zoom the picture inside it.</span><span className="hidden max-[899px]:inline">Windows for your photos and videos.</span></div>
      <Section title="Choose a frame">
        <div className="grid grid-cols-3 gap-3">
          {FRAMES.map((f) => {
            const k = 44 / Math.max(f.w, f.h);
            return (
              <button key={f.id} type="button" title={f.name} data-testid={`frame-${f.id}`} draggable onDragStart={(e) => startDrag(e, item(f))} onDragEnd={endDrag} onClick={() => placeElements(item(f))}  className="group flex h-24 flex-col items-center justify-center gap-2 rounded p-2 hover:bg-ink/5">
                <span className="grid h-12 w-full place-items-center">
                  <span className="bg-ink/70" data-radius-free style={{ width: f.w * k, height: f.h * k, borderRadius: f.shape === "circle" ? "50%" : f.shape === "pill" ? 999 : f.shape === "arch" ? `${f.w * k}px ${f.w * k}px 0 0` : f.shape === "squircle" ? "36%" : Math.min(f.radius * k * 0.6, 12) }} />
                </span>
                <span className="text-2xs text-mute group-hover:text-ink">{f.name}</span>
              </button>
            );
          })}
        </div>
      </Section>
    </div>
  );
}
