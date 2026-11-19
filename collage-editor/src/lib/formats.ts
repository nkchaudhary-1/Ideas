import type { Format } from "./types";

/** Instagram + general social canvas presets. Pixel sizes follow Instagram's recommended 1080-wide masters. */
export const FORMATS: Format[] = [
  { id: "1-1", label: "Square", ratio: "1:1", width: 1080, height: 1080 },
  { id: "4-5", label: "Portrait", ratio: "4:5", width: 1080, height: 1350 },
  { id: "3-4", label: "Portrait", ratio: "3:4", width: 1080, height: 1440 },
  { id: "2-3", label: "Tall portrait", ratio: "2:3", width: 1080, height: 1620 },
  { id: "5-4", label: "Landscape-ish", ratio: "5:4", width: 1080, height: 864 },
  { id: "4-3", label: "Landscape", ratio: "4:3", width: 1080, height: 810 },
  { id: "3-2", label: "Landscape", ratio: "3:2", width: 1080, height: 720 },
  { id: "16-9", label: "Widescreen", ratio: "16:9", width: 1080, height: 608 },
  { id: "191-1", label: "Instagram landscape", ratio: "1.91:1", width: 1080, height: 566 },
  { id: "9-16", label: "Story / Reel", ratio: "9:16", width: 1080, height: 1920 },
];

export const CUSTOM_FORMAT = (width: number, height: number): Format => ({
  id: "custom",
  label: "Custom",
  ratio: ratioLabel(width, height),
  width: Math.round(width),
  height: Math.round(height),
});

export function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b);
}

export function ratioLabel(w: number, h: number): string {
  const g = gcd(Math.round(w), Math.round(h));
  const a = Math.round(w) / g;
  const b = Math.round(h) / g;
  if (a > 40 || b > 40) return `${(w / h).toFixed(2)}:1`;
  return `${a}:${b}`;
}

export const DEFAULT_FORMAT = FORMATS[1];

/** Multi-slide panorama formats: a photo that runs across slides is cut at the 1080 px boundaries on export. */
export const PANORAMA_FORMATS: Format[] = [
  { id: "pano-2", label: "Panorama · 2 slides", ratio: "8:5", width: 2160, height: 1350 },
  { id: "pano-3", label: "Panorama · 3 slides", ratio: "12:5", width: 3240, height: 1350 },
];
