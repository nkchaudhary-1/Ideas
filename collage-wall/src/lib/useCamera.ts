import { useCallback, useEffect, useMemo, useRef } from "react";
import type { World } from "../types";

export interface Camera {
  x: number;
  y: number;
  k: number;
}

export const MIN_K = 0.04;
export const MAX_K = 3;

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const reduceMotion = () => window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;

interface Options {
  /** Called at most once per animation frame while the camera moves. */
  onChange: (cam: Camera, size: { w: number; h: number }) => void;
  /** When false (e.g. the focused view is open) keyboard shortcuts are ignored. */
  keysEnabled: boolean;
}

/**
 * A small 2D camera over the wall: pan, pinch/ctrl-wheel zoom, drag with inertia,
 * animated fly-to. The transform is written straight to the DOM (no React state per frame).
 */
export function useCamera(world: World, { onChange, keysEnabled }: Options) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const worldRef = useRef<HTMLDivElement>(null);
  const cam = useRef<Camera>({ x: 0, y: 0, k: 0.5 });
  const size = useRef({ w: 1, h: 1 });
  const frame = useRef(0);
  const anim = useRef(0);
  const dragged = useRef(false);
  const lastK = useRef(-1);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const keysRef = useRef(keysEnabled);
  keysRef.current = keysEnabled;
  const worldData = useRef(world);
  worldData.current = world;

  const clampCam = useCallback((c: Camera): Camera => {
    const w = worldData.current;
    const W = w.width * c.k;
    const H = w.height * c.k;
    const m = 120;
    const s = size.current;
    return {
      k: c.k,
      x: W + 2 * m <= s.w ? (s.w - W) / 2 : clamp(c.x, s.w - W - m, m),
      y: H + 2 * m <= s.h ? (s.h - H) / 2 : clamp(c.y, s.h - H - m, m),
    };
  }, []);

  const apply = useCallback(() => {
    const c = cam.current;
    const el = worldRef.current;
    const vp = viewportRef.current;
    if (el) el.style.transform = `translate3d(${c.x}px,${c.y}px,0) scale(${c.k})`;
    if (vp && lastK.current !== c.k) {
      lastK.current = c.k;
      vp.style.setProperty("--k", String(c.k));
      vp.style.setProperty("--inv", String(1 / c.k));
    }
    if (!frame.current) {
      frame.current = requestAnimationFrame(() => {
        frame.current = 0;
        onChangeRef.current(cam.current, size.current);
      });
    }
  }, []);

  const set = useCallback(
    (next: Camera) => {
      cam.current = clampCam({ ...next, k: clamp(next.k, MIN_K, MAX_K) });
      apply();
    },
    [apply, clampCam],
  );

  const stop = useCallback(() => {
    cancelAnimationFrame(anim.current);
    anim.current = 0;
  }, []);

  const animateTo = useCallback(
    (target: Camera, ms = 700) => {
      stop();
      const to = clampCam({ ...target, k: clamp(target.k, MIN_K, MAX_K) });
      if (reduceMotion() || ms <= 0) return set(to);
      const from = { ...cam.current };
      const t0 = performance.now();
      const tick = (now: number) => {
        const t = clamp((now - t0) / ms, 0, 1);
        const e = ease(t);
        // interpolate zoom in log space so it feels even
        const k = Math.exp(Math.log(from.k) + (Math.log(to.k) - Math.log(from.k)) * e);
        cam.current = { k, x: from.x + (to.x - from.x) * e, y: from.y + (to.y - from.y) * e };
        apply();
        anim.current = t < 1 ? requestAnimationFrame(tick) : 0;
      };
      anim.current = requestAnimationFrame(tick);
    },
    [apply, clampCam, set, stop],
  );

  const zoomAt = useCallback(
    (factor: number, px: number, py: number) => {
      const c = cam.current;
      const k = clamp(c.k * factor, MIN_K, MAX_K);
      const r = k / c.k;
      set({ k, x: px - (px - c.x) * r, y: py - (py - c.y) * r });
    },
    [set],
  );

  /** The opening view: rows roughly fit the screen width, first row near the top. */
  const defaultView = useCallback((): Camera => {
    const w = worldData.current;
    const s = size.current;
    const widths = w.rows.map((r) => r.width).sort((a, b) => a - b);
    const ref = widths[Math.floor(widths.length * 0.8)] ?? w.width;
    const margin = s.w < 700 ? 20 : 48;
    const k = s.w < 700 ? 0.5 : clamp((s.w - margin * 2) / ref, 0.3, 1);
    const top = w.rows[0]?.top ?? 0;
    return { k, x: margin - w.pad * k, y: 96 - top * k };
  }, []);

  const api = useMemo(
    () => ({
      viewportRef,
      worldRef,
      get: () => cam.current,
      size: () => size.current,
      /** True if the last pointer gesture moved – used to swallow the click that follows a drag. */
      wasDrag: () => dragged.current,
      zoomBy(factor: number) {
        stop();
        const s = size.current;
        const c = cam.current;
        const k = clamp(c.k * factor, MIN_K, MAX_K);
        const r = k / c.k;
        const px = s.w / 2;
        const py = s.h / 2;
        animateTo({ k, x: px - (px - c.x) * r, y: py - (py - c.y) * r }, 220);
      },
      reset: () => animateTo(defaultView(), 700),
      fitAll() {
        const w = worldData.current;
        const s = size.current;
        animateTo({ k: Math.min(s.w / w.width, s.h / w.height), x: 0, y: 0 }, 800);
      },
      /** Centre a world-space point on screen. */
      flyTo(wx: number, wy: number, k?: number, ms = 800) {
        const s = size.current;
        const kk = k ?? cam.current.k;
        animateTo({ k: kk, x: s.w / 2 - wx * kk, y: s.h / 2 - wy * kk }, ms);
      },
      /** Bring a world-space point to the top-left of the screen (under the brand mark). */
      flyToCorner(wx: number, wy: number, k?: number, ms = 800) {
        const kk = k ?? cam.current.k;
        animateTo({ k: kk, x: 56 - wx * kk, y: 120 - wy * kk }, ms);
      },
      jumpTo(wx: number, wy: number, k?: number) {
        const s = size.current;
        const kk = k ?? cam.current.k;
        set({ k: kk, x: s.w / 2 - wx * kk, y: s.h / 2 - wy * kk });
      },
      stop,
    }),
    [animateTo, defaultView, set, stop],
  );

  // size + initial view
  useEffect(() => {
    const vp = viewportRef.current;
    if (!vp) return;
    const measure = () => {
      const r = vp.getBoundingClientRect();
      size.current = { w: r.width, h: r.height };
    };
    measure();
    set(defaultView());
    const ro = new ResizeObserver(() => {
      measure();
      set(cam.current);
    });
    ro.observe(vp);
    return () => ro.disconnect();
  }, [defaultView, set, world]);

  // wheel / trackpad
  useEffect(() => {
    const vp = viewportRef.current;
    if (!vp) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      stop();
      const rect = vp.getBoundingClientRect();
      if (e.ctrlKey || e.metaKey) {
        // trackpad pinch arrives as ctrl+wheel with small deltas; a real mouse wheel is ±100
        const speed = Math.abs(e.deltaY) < 40 ? 0.01 : 0.0018;
        zoomAt(Math.exp(-e.deltaY * speed), e.clientX - rect.left, e.clientY - rect.top);
        return;
      }
      let dx = e.deltaX;
      let dy = e.deltaY;
      if (e.deltaMode === 1) {
        dx *= 16;
        dy *= 16;
      }
      if (e.shiftKey && dx === 0) {
        dx = dy;
        dy = 0;
      }
      const c = cam.current;
      set({ ...c, x: c.x - dx, y: c.y - dy });
    };
    vp.addEventListener("wheel", onWheel, { passive: false });
    return () => vp.removeEventListener("wheel", onWheel);
  }, [set, stop, zoomAt]);

  // pointer: drag to pan (with inertia), two fingers to pinch
  useEffect(() => {
    const vp = viewportRef.current;
    if (!vp) return;
    const pts = new Map<number, { x: number; y: number }>();
    let samples: { t: number; x: number; y: number }[] = [];
    let start = { x: 0, y: 0 };
    let pinch: { d: number; cx: number; cy: number } | null = null;
    let active = false;

    const mid = () => {
      const [a, b] = [...pts.values()];
      return { d: Math.hypot(a.x - b.x, a.y - b.y), cx: (a.x + b.x) / 2, cy: (a.y + b.y) / 2 };
    };

    const onDown = (e: PointerEvent) => {
      if (e.pointerType === "mouse" && e.button !== 0) return;
      if ((e.target as HTMLElement).closest("[data-no-pan]")) return;
      stop();
      pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (pts.size === 1) {
        dragged.current = false;
        start = { x: e.clientX, y: e.clientY };
        samples = [{ t: e.timeStamp, x: e.clientX, y: e.clientY }];
      } else if (pts.size === 2) {
        pinch = mid();
        dragged.current = true;
      }
      active = true;
      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp);
      window.addEventListener("pointercancel", onUp);
    };

    const onMove = (e: PointerEvent) => {
      const p = pts.get(e.pointerId);
      if (!p || !active) return;
      const rect = vp.getBoundingClientRect();
      if (pts.size >= 2 && pinch) {
        pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
        const m = mid();
        const c = cam.current;
        const k = clamp(c.k * (m.d / pinch.d), MIN_K, MAX_K);
        const r = k / c.k;
        const px = pinch.cx - rect.left;
        const py = pinch.cy - rect.top;
        set({ k, x: px - (px - c.x) * r + (m.cx - pinch.cx), y: py - (py - c.y) * r + (m.cy - pinch.cy) });
        pinch = m;
        return;
      }
      const dx = e.clientX - p.x;
      const dy = e.clientY - p.y;
      p.x = e.clientX;
      p.y = e.clientY;
      if (!dragged.current) {
        const thr = e.pointerType === "touch" ? 8 : 5;
        if (Math.hypot(e.clientX - start.x, e.clientY - start.y) < thr) return;
        dragged.current = true;
        vp.classList.add("is-dragging");
      }
      const c = cam.current;
      set({ ...c, x: c.x + dx, y: c.y + dy });
      samples.push({ t: e.timeStamp, x: e.clientX, y: e.clientY });
      if (samples.length > 6) samples.shift();
    };

    const onUp = (e: PointerEvent) => {
      pts.delete(e.pointerId);
      if (pts.size === 1) {
        // went from pinch back to a single finger – continue panning from there
        pinch = null;
        const [rest] = [...pts.values()];
        samples = [{ t: e.timeStamp, x: rest.x, y: rest.y }];
        return;
      }
      if (pts.size > 0) return;
      active = false;
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
      vp.classList.remove("is-dragging");
      pinch = null;
      if (!dragged.current || reduceMotion()) return;
      const first = samples[0];
      const last = samples[samples.length - 1];
      const dt = last && first ? last.t - first.t : 0;
      if (!first || !last || dt < 8 || e.timeStamp - last.t > 80) return;
      let vx = (last.x - first.x) / dt;
      let vy = (last.y - first.y) / dt;
      let prev = performance.now();
      const step = (now: number) => {
        const d = Math.min(now - prev, 40);
        prev = now;
        const c = cam.current;
        set({ ...c, x: c.x + vx * d, y: c.y + vy * d });
        const f = Math.exp(-d / 360);
        vx *= f;
        vy *= f;
        anim.current = Math.hypot(vx, vy) > 0.02 ? requestAnimationFrame(step) : 0;
      };
      anim.current = requestAnimationFrame(step);
    };

    vp.addEventListener("pointerdown", onDown);
    return () => {
      vp.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
    };
  }, [set, stop]);

  // keyboard
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!keysRef.current || e.metaKey || e.ctrlKey || e.altKey) return;
      const t = e.target as HTMLElement | null;
      if (t && /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName)) return;
      const step = e.shiftKey ? 520 : 180;
      const c = cam.current;
      switch (e.key) {
        case "ArrowLeft": stop(); set({ ...c, x: c.x + step }); break;
        case "ArrowRight": stop(); set({ ...c, x: c.x - step }); break;
        case "ArrowUp": stop(); set({ ...c, y: c.y + step }); break;
        case "ArrowDown": stop(); set({ ...c, y: c.y - step }); break;
        case "+": case "=": api.zoomBy(1.35); break;
        case "-": case "_": api.zoomBy(1 / 1.35); break;
        case "0": api.reset(); break;
        case "f": case "F": api.fitAll(); break;
        default: return;
      }
      e.preventDefault();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [api, set, stop]);

  useEffect(
    () => () => {
      cancelAnimationFrame(frame.current);
      cancelAnimationFrame(anim.current);
    },
    [],
  );

  return api;
}
