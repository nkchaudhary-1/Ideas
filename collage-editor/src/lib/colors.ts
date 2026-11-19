import { clamp } from "./util";

export interface RGB { r: number; g: number; b: number }
export interface HSL { h: number; s: number; l: number }
export interface HSV { h: number; s: number; v: number }

export function hexToRgb(hex: string): RGB | null {
  let h = hex.trim().replace("#", "");
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  if (h.length === 8) h = h.slice(0, 6);
  if (!/^[0-9a-fA-F]{6}$/.test(h)) return null;
  const n = parseInt(h, 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

export const rgbToHex = ({ r, g, b }: RGB) =>
  "#" + [r, g, b].map((v) => clamp(Math.round(v), 0, 255).toString(16).padStart(2, "0")).join("");

export function rgbToHsv({ r, g, b }: RGB): HSV {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min;
  let h = 0;
  if (d) {
    if (max === r) h = ((g - b) / d) % 6;
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60;
    if (h < 0) h += 360;
  }
  return { h, s: max ? d / max : 0, v: max };
}

export function hsvToRgb({ h, s, v }: HSV): RGB {
  const c = v * s, x = c * (1 - Math.abs(((h / 60) % 2) - 1)), m = v - c;
  let r = 0, g = 0, b = 0;
  if (h < 60) [r, g, b] = [c, x, 0];
  else if (h < 120) [r, g, b] = [x, c, 0];
  else if (h < 180) [r, g, b] = [0, c, x];
  else if (h < 240) [r, g, b] = [0, x, c];
  else if (h < 300) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  return { r: (r + m) * 255, g: (g + m) * 255, b: (b + m) * 255 };
}

export function rgbToHsl({ r, g, b }: RGB): HSL {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let h = 0, s = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60;
  }
  return { h, s, l };
}

export function hslToRgb({ h, s, l }: HSL): RGB {
  const c = (1 - Math.abs(2 * l - 1)) * s, x = c * (1 - Math.abs(((h / 60) % 2) - 1)), m = l - c / 2;
  let r = 0, g = 0, b = 0;
  if (h < 60) [r, g, b] = [c, x, 0];
  else if (h < 120) [r, g, b] = [x, c, 0];
  else if (h < 180) [r, g, b] = [0, c, x];
  else if (h < 240) [r, g, b] = [0, x, c];
  else if (h < 300) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  return { r: (r + m) * 255, g: (g + m) * 255, b: (b + m) * 255 };
}

/** accepts #rgb, #rrggbb, #rrggbbaa, rgb(), rgba() → {hex, alpha} */
export function parseColor(c: string): { hex: string; alpha: number } {
  const m = c.match(/rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)(?:[,\s/]+([\d.]+%?))?\s*\)/i);
  if (m) {
    const a = m[4] === undefined ? 1 : m[4].endsWith("%") ? parseFloat(m[4]) / 100 : parseFloat(m[4]);
    return { hex: rgbToHex({ r: +m[1], g: +m[2], b: +m[3] }), alpha: a };
  }
  const h = c.replace("#", "");
  if (h.length === 8) return { hex: "#" + h.slice(0, 6), alpha: parseInt(h.slice(6), 16) / 255 };
  const rgb = hexToRgb(c);
  return { hex: rgb ? rgbToHex(rgb) : "#000000", alpha: 1 };
}

export function withAlpha(hex: string, alpha: number): string {
  const rgb = hexToRgb(hex) ?? { r: 0, g: 0, b: 0 };
  return alpha >= 1 ? rgbToHex(rgb) : `rgba(${rgb.r},${rgb.g},${rgb.b},${Math.round(alpha * 1000) / 1000})`;
}

export const luminance = (hex: string) => {
  const c = hexToRgb(hex) ?? { r: 0, g: 0, b: 0 };
  return (0.2126 * c.r + 0.7152 * c.g + 0.0722 * c.b) / 255;
};

/** Median-cut palette from an image: returns up to `n` hex colours, most common first. */
export function dominantColors(source: CanvasImageSource, sw: number, sh: number, n = 6): string[] {
  const size = 64;
  const k = size / Math.max(sw, sh);
  const w = Math.max(1, Math.round(sw * k)), h = Math.max(1, Math.round(sh * k));
  const cv = document.createElement("canvas");
  cv.width = w; cv.height = h;
  const ctx = cv.getContext("2d", { willReadFrequently: true })!;
  ctx.drawImage(source, 0, 0, w, h);
  const d = ctx.getImageData(0, 0, w, h).data;
  const px: number[][] = [];
  for (let i = 0; i < d.length; i += 4) if (d[i + 3] > 200) px.push([d[i], d[i + 1], d[i + 2]]);
  if (!px.length) return [];
  const boxes: number[][][] = [px];
  while (boxes.length < n) {
    boxes.sort((a, b) => b.length - a.length);
    const box = boxes.shift()!;
    if (box.length < 2) { boxes.push(box); break; }
    const ranges = [0, 1, 2].map((c) => Math.max(...box.map((p) => p[c])) - Math.min(...box.map((p) => p[c])));
    const ch = ranges.indexOf(Math.max(...ranges));
    box.sort((a, b) => a[ch] - b[ch]);
    const mid = box.length >> 1;
    boxes.push(box.slice(0, mid), box.slice(mid));
  }
  return boxes
    .filter((b) => b.length)
    .sort((a, b) => b.length - a.length)
    .map((b) => rgbToHex({ r: b.reduce((s, p) => s + p[0], 0) / b.length, g: b.reduce((s, p) => s + p[1], 0) / b.length, b: b.reduce((s, p) => s + p[2], 0) / b.length }));
}

export const PALETTES: { name: string; colors: string[] }[] = [
  { name: "From your posts", colors: ["#ffffff", "#000000", "#ce6161", "#e5ff65", "#f5efe6", "#1c1c1c"] },
  { name: "Editorial", colors: ["#111111", "#f3f0ea", "#e63b2e", "#2b4cff", "#d9d4c7", "#8a8578"] },
  { name: "Sunset", colors: ["#2b1b3d", "#8e2f5a", "#ef5b5b", "#ff9a56", "#ffd36e", "#fff3d6"] },
  { name: "Coast", colors: ["#0b2545", "#13497b", "#2f80b7", "#8ed1e8", "#e4f4f7", "#f2c14e"] },
  { name: "Forest", colors: ["#16231a", "#2d4a34", "#5d8a5a", "#a9c28a", "#e7ecd3", "#c9863a"] },
  { name: "Mono", colors: ["#000000", "#2a2a2a", "#6b6b6b", "#aaaaaa", "#dddddd", "#ffffff"] },
  { name: "Pastel", colors: ["#ffd6e0", "#ffe9c7", "#fff7bd", "#d4f2d2", "#cfe8ff", "#e3d7ff"] },
  { name: "Festive", colors: ["#6a0f2f", "#c22b4a", "#f09a2b", "#ffd84d", "#2c7a4b", "#fff1d6"] },
];
