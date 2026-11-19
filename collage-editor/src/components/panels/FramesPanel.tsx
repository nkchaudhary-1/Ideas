"use client";
import { useStore, getSlide } from "@/lib/store";
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

export default function FramesPanel() {
  const st = useStore.getState;
  const sl = useStore((s) => getSlide(s.project));
  return (
    <div className="h-full overflow-y-auto" data-testid="frames-panel">
      <div className="border-b border-line p-3 text-xs leading-5 text-mute">Frames are windows for photos and videos. Drop media onto one, then double-click to move or zoom the picture inside it.</div>
      <Section title="Frames">
        <div className="grid grid-cols-3 gap-2">
          {FRAMES.map((f) => {
            const k = 44 / Math.max(f.w, f.h);
            return (
              <button key={f.id} type="button" title={f.name} data-testid={`frame-${f.id}`} onClick={() => {
                const s = Math.min(1, (sl.width * 0.7) / f.w, (sl.height * 0.7) / f.h) * (sl.width / 1080 > 1 ? 1 : 1);
                const w = f.w * s, h = f.h * s;
                st().addElement(makeFrame(w, h, { shape: f.shape, radius: f.radius * s, name: f.name + " frame" }, (sl.width - w) / 2, (sl.height - h) / 2));
              }} className="group flex flex-col items-center gap-1 rounded-md p-1.5 hover:bg-white/5">
                <span className="grid h-12 w-full place-items-center">
                  <span className="bg-ink/70" style={{ width: f.w * k, height: f.h * k, borderRadius: f.shape === "circle" ? "50%" : f.shape === "pill" ? 999 : f.shape === "arch" ? `${f.w * k}px ${f.w * k}px 0 0` : f.shape === "squircle" ? "36%" : Math.min(f.radius * k * 0.6, 12) }} />
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
