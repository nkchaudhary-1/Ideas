import { makeFrame } from "./factory";
import type { FrameShape } from "./types";
import type { ElementsItem } from "./drop";

export interface FramePreset { id: string; name: string; w: number; h: number; shape: FrameShape; radius: number }

/** the windows for photos and videos in the Elements & frames panel */
export const FRAMES: FramePreset[] = [
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
export const frameItem = (f: FramePreset): ElementsItem => ({
  kind: "elements",
  build: (aw, ah) => {
    const s = Math.min(1, (aw * 0.7) / f.w, (ah * 0.7) / f.h);
    const w = f.w * s, h = f.h * s;
    return [makeFrame(w, h, { shape: f.shape, radius: f.radius * s, name: f.name + " frame" }, (aw - w) / 2, (ah - h) / 2)];
  },
});
