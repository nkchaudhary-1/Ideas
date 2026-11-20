"use client";
import { useEffect, useRef } from "react";
import { Shape } from "react-konva";
import type Konva from "konva";
import type { FrameShape, MediaFill, Shadow, Stroke } from "@/lib/types";
import { getAsset, getPlayer, peekImage, processedImage, seekVideo, effectiveTrim, peekVideoUrl } from "@/lib/media";
import { drawMedia, viewOf } from "@/lib/media-math";
import { NEUTRAL, adjustmentsKey, applyAdjustments, fillEffective, isNeutral } from "@/lib/filters";
import { DEFAULT_FILTER } from "@/lib/media-math";
import { useStore } from "@/lib/store";
import { clamp } from "@/lib/util";
import { framePath } from "./frame-path";
import { useRender } from "./render-context";

export interface MediaShapeProps {
  elKey: string;
  width: number;
  height: number;
  shape?: FrameShape;
  radius?: number;
  bg: string;
  fill: MediaFill | null;
  stroke?: Stroke | null;
  shadow?: Shadow | null;
  /** draw the whole picture (un-clipped, faded) for crop mode */
  ghost?: boolean;
  listening?: boolean;
  x?: number;
  y?: number;
}

/** Reusable per-frame video processing (colour pipeline runs on a down-scaled copy of each frame). */
class VideoSurface {
  canvas: HTMLCanvasElement | null = null;
  key = "";
  frame(v: HTMLVideoElement, fill: MediaFill, maxDim: number): { source: CanvasImageSource; w: number; h: number } {
    const eff = fillEffective(fill);
    const vw = v.videoWidth, vh = v.videoHeight;
    if (isNeutral(eff)) return { source: v, w: vw, h: vh };
    const k = Math.min(1, maxDim / Math.max(vw, vh));
    const w = Math.max(2, Math.round(vw * k)), h = Math.max(2, Math.round(vh * k));
    const key = `${v.currentTime.toFixed(3)}|${w}|${adjustmentsKey(eff)}`;
    if (!this.canvas) this.canvas = document.createElement("canvas");
    if (key === this.key && this.canvas.width === w) return { source: this.canvas, w, h };
    this.canvas.width = w; this.canvas.height = h;
    const ctx = this.canvas.getContext("2d", { willReadFrequently: true })!;
    ctx.drawImage(v, 0, 0, w, h);
    applyAdjustments(ctx, w, h, eff, Math.floor(v.currentTime * 30));
    this.key = key;
    return { source: this.canvas, w, h };
  }
}

export default function MediaShape(p: MediaShapeProps) {
  const rc = useRender();
  const nodeRef = useRef<Konva.Shape>(null);
  const surface = useRef(new VideoSurface());
  const { fill } = p;
  // hold-to-compare: the main canvas (not thumbnails or exports) shows the picture without any edits
  const comparing = useStore((s) => s.ui.compare) && rc.mode === "edit" && !rc.scope;
  const look: MediaFill | null = comparing && fill ? { ...fill, adjustments: { ...NEUTRAL }, filter: DEFAULT_FILTER, match: undefined } : fill;
  const asset = fill?.assetId ? getAsset(fill.assetId) : undefined;
  const isVideo = fill?.kind === "video" && !!asset;
  const playerKey = rc.scope ? `${rc.scope}:${p.elKey}` : p.elKey;
  const player = isVideo && asset ? getPlayer(playerKey, asset.id) : null;
  const trim = isVideo && fill && asset ? effectiveTrim(fill, asset.duration ?? 0) : null;
  const trimKey = trim ? `${trim.start}|${trim.end}` : "";
  const cover = fill?.video?.coverTime ?? 0;
  const redraw = () => nodeRef.current?.getLayer()?.batchDraw();

  // ── export: tell the exporter when this frame is ready, and expose frame-accurate seeking
  useEffect(() => {
    if (rc.mode !== "export" || !fill?.assetId) return;
    const probe = () => {
      if (fill.kind === "image") return !!peekImage(fill.assetId, "original");
      return !!player && player.readyState >= 2;
    };
    const off = rc.registerReady?.(probe);
    return () => off?.();
  }, [rc, fill?.assetId, fill?.kind, player]);

  useEffect(() => {
    if (rc.mode !== "export" || !player || !trim) return;
    const off = rc.registerVideo?.(p.elKey, async (t) => {
      player.pause();
      if (t < 0) {
        // t < 0 asks for the poster frame (still-image exports of a video slide)
        await seekVideo(player, clamp(cover, trim.start, Math.max(trim.start, trim.end - 0.04)));
      } else {
        const loop = fill?.video?.loop && trim.length > 0;
        const local = loop ? t % trim.length : Math.min(t, trim.length - 0.04);
        await seekVideo(player, trim.start + Math.max(0, local));
      }
      nodeRef.current?.getLayer()?.draw();
    });
    return () => off?.();
  }, [rc, player, trimKey, p.elKey, fill?.video?.loop, cover]);

  // ── editor/preview: still frame while paused, live playback while playing
  useEffect(() => {
    if (rc.mode === "export" || !player || !trim || !fill) return;
    let raf = 0;
    let cancelled = false;
    if (!rc.playing) {
      player.pause();
      const t = clamp(cover, trim.start, trim.end - 0.04);
      seekVideo(player, t).then(() => !cancelled && redraw());
      return () => { cancelled = true; };
    }
    player.muted = !!fill.video?.muted;
    player.volume = clamp(fill.video?.volume ?? 1, 0, 1);
    player.currentTime = trim.start;
    player.play().catch(() => { player.muted = true; player.play().catch(() => {}); });
    const loop = () => {
      if (player.currentTime >= trim.end - 0.03 || player.ended) {
        if (fill.video?.loop) player.currentTime = trim.start;
        else player.pause();
      }
      redraw();
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => { cancelled = true; cancelAnimationFrame(raf); player.pause(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rc.playing, rc.mode, player, trimKey, cover, fill?.video?.muted, fill?.video?.volume, fill?.video?.loop]);

  // keep the poster in sync when the cover frame / trim changes while paused
  useEffect(() => { redraw(); });

  const sceneFunc = (ctx: Konva.Context, node: Konva.Shape) => {
    const c = (ctx as unknown as { _context: CanvasRenderingContext2D })._context;
    const w = p.width, h = p.height;
    const shape = p.shape ?? "rect";
    const radius = p.radius ?? 0;
    const ratio = (ctx.canvas as unknown as { pixelRatio: number }).pixelRatio || 1;
    const absScale = node.getAbsoluteScale().x * ratio;

    if (p.ghost) {
      drawContent(c, w, h, true);
      return;
    }
    c.save();
    c.beginPath();
    framePath(c, w, h, shape, radius);
    if (p.shadow) {
      c.shadowColor = p.shadow.color;
      c.shadowBlur = p.shadow.blur * absScale;
      c.shadowOffsetX = p.shadow.x * absScale;
      c.shadowOffsetY = p.shadow.y * absScale;
    }
    c.fillStyle = p.bg;
    c.fill();
    c.shadowColor = "transparent";
    c.shadowBlur = 0; c.shadowOffsetX = 0; c.shadowOffsetY = 0;
    c.clip();
    drawContent(c, w, h, false);
    c.restore();
    if (p.stroke && p.stroke.width > 0) {
      c.save();
      c.beginPath();
      framePath(c, w, h, shape, radius);
      c.lineWidth = p.stroke.width;
      c.strokeStyle = p.stroke.color;
      c.stroke();
      c.restore();
    }
  };

  function drawContent(c: CanvasRenderingContext2D, w: number, h: number, ghost: boolean) {
    if (ghost) c.globalAlpha = 0.35;
    if (!fill || !fill.assetId) {
      if (rc.mode !== "export" && rc.showPlaceholders) drawPlaceholder(c, w, h, "Click to add photo or video");
      return;
    }
    if (!asset) { if (rc.mode !== "export") drawPlaceholder(c, w, h, "Media missing"); return; }
    const src = { w: asset.width, h: asset.height };
    if (fill.kind === "video") {
      if (!player || player.readyState < 2) { if (!peekVideoUrl(asset.id) && rc.mode !== "export") drawPlaceholder(c, w, h, "Loading video…"); return; }
      const v = viewOf({ w, h }, { w: player.videoWidth, h: player.videoHeight }, fill);
      const maxDim = clamp(Math.max(player.videoWidth, player.videoHeight) * v.k * rc.pixelScale * 1.1, 360, rc.mode === "export" ? 2160 : 960);
      const f = surface.current.frame(player, look ?? fill, maxDim);
      drawMedia(c, f.source, { w: player.videoWidth, h: player.videoHeight }, { w: f.w, h: f.h }, { w, h }, fill);
      return;
    }
    const v = viewOf({ w, h }, src, fill);
    const needed = Math.max(src.w, src.h) * v.k * rc.pixelScale;
    const tier = rc.mode === "export" ? "original" : needed > 1700 ? "original" : "preview";
    const q = Math.pow(1.5, Math.round(Math.log(Math.max(needed, 200)) / Math.log(1.5)));
    let pr = processedImage(asset.id, tier, look ?? fill, q * 1.1);
    if (!pr && tier === "original") pr = processedImage(asset.id, "preview", look ?? fill, q * 1.1);
    if (!pr) { if (rc.mode !== "export") drawPlaceholder(c, w, h, "Loading…"); return; }
    drawMedia(c, pr.source, src, { w: pr.w, h: pr.h }, { w, h }, fill);
  }

  return (
    <Shape
      ref={nodeRef}
      x={p.x}
      y={p.y}
      width={p.width}
      height={p.height}
      sceneFunc={sceneFunc}
      hitFunc={(ctx, node) => {
        const c = (ctx as unknown as { _context: CanvasRenderingContext2D })._context;
        c.beginPath();
        framePath(c, p.width, p.height, p.shape ?? "rect", p.radius ?? 0);
        ctx.fillShape(node);
      }}
      listening={p.listening ?? true}
      perfectDrawEnabled={false}
    />
  );
}

function drawPlaceholder(c: CanvasRenderingContext2D, w: number, h: number, label: string) {
  c.save();
  c.fillStyle = "rgba(255,255,255,0.045)";
  c.fillRect(0, 0, w, h);
  const s = Math.min(w, h);
  const fs = clamp(s * 0.06, 12, 34);
  // a dotted outline: zero-length dashes with round caps are dots
  const dot = Math.max(4, s * 0.011);
  c.strokeStyle = "rgba(255,255,255,0.36)";
  c.lineWidth = dot;
  c.lineCap = "round";
  c.setLineDash([0, dot * 2.6]);
  const m = s * 0.06;
  c.strokeRect(m, m, w - m * 2, h - m * 2);
  c.setLineDash([]);
  c.lineCap = "butt";
  const cx = w / 2, cy = h / 2 - fs * 0.6, r = Math.max(8, s * 0.05);
  c.beginPath();
  c.moveTo(cx - r, cy); c.lineTo(cx + r, cy); c.moveTo(cx, cy - r); c.lineTo(cx, cy + r);
  c.lineWidth = Math.max(2, s * 0.008);
  c.strokeStyle = "rgba(255,255,255,0.5)";
  c.stroke();
  c.fillStyle = "rgba(255,255,255,0.55)";
  c.font = `500 ${fs}px Inter, system-ui, sans-serif`;
  c.textAlign = "center";
  c.textBaseline = "top";
  c.fillText(label, cx, cy + r + fs * 0.7);
  c.restore();
}
