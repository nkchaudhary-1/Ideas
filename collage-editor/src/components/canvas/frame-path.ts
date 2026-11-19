import type { FrameShape } from "@/lib/types";

type P = CanvasRenderingContext2D | Path2D;

/** Build a closed path for a frame shape on a 2D context or Path2D. */
export function framePath(c: P, w: number, h: number, shape: FrameShape, radius: number) {
  const m = Math.min(w, h);
  if (shape === "circle") {
    c.ellipse(w / 2, h / 2, Math.max(0.01, w / 2), Math.max(0.01, h / 2), 0, 0, Math.PI * 2);
    return;
  }
  if (shape === "arch") {
    const r = w / 2;
    c.moveTo(0, h);
    c.lineTo(0, r);
    c.arc(r, r, r, Math.PI, 0);
    c.lineTo(w, h);
    c.closePath();
    return;
  }
  const r = Math.max(0, Math.min(shape === "pill" ? m / 2 : shape === "squircle" ? m * 0.36 : radius, m / 2));
  if (r <= 0) { c.rect(0, 0, w, h); return; }
  c.moveTo(r, 0);
  c.lineTo(w - r, 0);
  c.arcTo(w, 0, w, r, r);
  c.lineTo(w, h - r);
  c.arcTo(w, h, w - r, h, r);
  c.lineTo(r, h);
  c.arcTo(0, h, 0, h - r, r);
  c.lineTo(0, r);
  c.arcTo(0, 0, r, 0, r);
  c.closePath();
}
