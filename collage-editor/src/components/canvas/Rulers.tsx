"use client";
import { cssColor } from "@/lib/util";
import { useEffect, useRef } from "react";
import { useStore, getSlide } from "@/lib/store";

const SIZE = 20;

function pickStep(scale: number) {
  const target = 70 / scale;
  const pow = Math.pow(10, Math.floor(Math.log10(target)));
  for (const m of [1, 2, 5, 10]) if (pow * m >= target) return pow * m;
  return pow * 10;
}

/** Rulers show document pixels. Dragging out of a ruler creates a guide. */
export default function Rulers({ width, height }: { width: number; height: number }) {
  const view = useStore((s) => s.ui.view);
  const theme = useStore((s) => s.ui.theme);
  const hRef = useRef<HTMLCanvasElement>(null);
  const vRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const dpr = window.devicePixelRatio || 1;
    const draw = (cv: HTMLCanvasElement | null, horizontal: boolean) => {
      if (!cv) return;
      const len = horizontal ? width : height;
      cv.width = (horizontal ? len : SIZE) * dpr;
      cv.height = (horizontal ? SIZE : len) * dpr;
      const c = cv.getContext("2d")!;
      c.scale(dpr, dpr);
      c.fillStyle = cssColor("--c-panel");
      c.fillRect(0, 0, horizontal ? len : SIZE, horizontal ? SIZE : len);
      c.fillStyle = cssColor("--c-mute");
      c.strokeStyle = cssColor("--c-faint", 0.6);
      c.font = "9px Manrope, Inter, sans-serif";
      const step = pickStep(view.scale);
      const origin = horizontal ? view.x : view.y;
      const first = Math.floor(-origin / view.scale / step) * step;
      for (let v = first; v * view.scale + origin < len; v += step) {
        const p = v * view.scale + origin;
        if (p < SIZE) continue;
        c.beginPath();
        if (horizontal) { c.moveTo(p + 0.5, SIZE - 7); c.lineTo(p + 0.5, SIZE); c.fillText(String(Math.round(v)), p + 3, 10); }
        else { c.moveTo(SIZE - 7, p + 0.5); c.lineTo(SIZE, p + 0.5); c.save(); c.translate(10, p - 3); c.rotate(-Math.PI / 2); c.fillText(String(Math.round(v)), 0, 0); c.restore(); }
        c.stroke();
      }
    };
    draw(hRef.current, true);
    draw(vRef.current, false);
  }, [view, width, height, theme]);

  const startGuide = (axis: "x" | "y") => (e: React.PointerEvent) => {
    e.preventDefault();
    const host = (e.currentTarget as HTMLElement).parentElement!.getBoundingClientRect();
    const move = (ev: PointerEvent) => {
      const el = document.getElementById("guide-preview");
      if (!el) return;
      el.style.display = "block";
      if (axis === "x") { el.style.left = ev.clientX - host.left + "px"; el.style.top = "0"; el.style.width = "1px"; el.style.height = "100%"; }
      else { el.style.top = ev.clientY - host.top + "px"; el.style.left = "0"; el.style.height = "1px"; el.style.width = "100%"; }
    };
    const up = (ev: PointerEvent) => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      const el = document.getElementById("guide-preview");
      if (el) el.style.display = "none";
      const st = useStore.getState();
      const slide = getSlide(st.project);
      const v = st.ui.view;
      const pos = axis === "x" ? (ev.clientX - host.left - v.x) / v.scale : (ev.clientY - host.top - v.y) / v.scale;
      const limit = axis === "x" ? slide.width : slide.height;
      if (pos < 0 || pos > limit || (axis === "x" ? ev.clientX - host.left < SIZE : ev.clientY - host.top < SIZE)) return;
      st.commit((p) => { const s = p.slides.find((x) => x.id === p.activeSlideId)!; s.guides[axis].push(Math.round(pos * 100) / 100); });
      if (!st.ui.guides) st.setUI({ guides: true });
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  };

  return (
    <>
      <canvas ref={hRef} onPointerDown={startGuide("y")} style={{ position: "absolute", left: 0, top: 0, width, height: SIZE, cursor: "row-resize", zIndex: 5 }} />
      <canvas ref={vRef} onPointerDown={startGuide("x")} style={{ position: "absolute", left: 0, top: 0, width: SIZE, height, cursor: "col-resize", zIndex: 5 }} />
      <div id="guide-preview" style={{ position: "absolute", display: "none", background: "#27d3ff", pointerEvents: "none", zIndex: 6 }} />
    </>
  );
}
