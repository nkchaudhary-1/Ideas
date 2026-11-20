"use client";
import { useEffect, useRef, useState } from "react";
import { Crop, FlipHorizontal2, FlipVertical2, ImageOff, Pause, Play, RefreshCw, RotateCcw, RotateCw, Scan, Volume2, VolumeX } from "lucide-react";
import type { Asset, MediaEl } from "@/lib/types";
import { useStore, getSlide } from "@/lib/store";
import { getAsset, effectiveTrim } from "@/lib/media";
import { ADJUSTMENT_META, FILTER_PRESETS, NEUTRAL, applyAdjustments, effectiveAdjustments } from "@/lib/filters";
import { DEFAULT_FILTER, newFill } from "@/lib/media-math";
import { Button, Field, IconButton, Section, Slider, Toggle } from "@/components/ui/controls";
import { formatTime } from "@/lib/util";
import AssetPicker from "./AssetPicker";
import type { FillTarget } from "./fill-target";

const RATIOS: { label: string; r: number | null }[] = [
  { label: "Free", r: null }, { label: "1:1", r: 1 }, { label: "4:5", r: 4 / 5 }, { label: "3:4", r: 3 / 4 }, { label: "2:3", r: 2 / 3 },
  { label: "9:16", r: 9 / 16 }, { label: "4:3", r: 4 / 3 }, { label: "3:2", r: 3 / 2 }, { label: "16:9", r: 16 / 9 },
];

const thumbImgs = new Map<string, HTMLImageElement>();
function FilterThumb({ asset, presetId, active, onClick, name }: { asset: Asset; presetId: string; active: boolean; onClick: () => void; name: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    let dead = false;
    const draw = (img: HTMLImageElement) => {
      const cv = ref.current;
      if (!cv || dead) return;
      const w = 64, h = 80;
      cv.width = w; cv.height = h;
      const ctx = cv.getContext("2d", { willReadFrequently: true })!;
      const s = Math.max(w / img.width, h / img.height);
      ctx.drawImage(img, (w - img.width * s) / 2, (h - img.height * s) / 2, img.width * s, img.height * s);
      applyAdjustments(ctx, w, h, effectiveAdjustments({ ...NEUTRAL }, { id: presetId, intensity: 100 }), 3);
    };
    let img = thumbImgs.get(asset.id);
    if (img?.complete) draw(img);
    else {
      img = img ?? new Image();
      thumbImgs.set(asset.id, img);
      img.onload = () => draw(img!);
      if (!img.src) img.src = asset.thumb;
    }
    return () => { dead = true; };
  }, [asset, presetId]);
  return (
    <button type="button" onClick={onClick} title={name} data-testid={`filter-${presetId}`} className={`group flex flex-col items-center gap-1 rounded-md p-0.5 ${active ? "bg-accent/20 ring-1 ring-accent" : "hover:bg-ink/5"}`}>
      <canvas ref={ref} className="h-[60px] w-[48px] rounded-sm bg-panel2" />
      <span className={`text-2xs ${active ? "text-accent" : "text-mute"}`}>{name}</span>
    </button>
  );
}

export default function MediaProps({ target }: { target: FillTarget }) {
  const st = useStore.getState;
  const { fill } = target;
  const asset = getAsset(fill.assetId);
  const cropId = useStore((s) => s.ui.cropId);
  const playing = useStore((s) => s.ui.playing);
  const [picker, setPicker] = useState(false);
  const cropping = cropId === target.elementId;
  const isEl = target.kind === "element";
  const elNow = useStore((s) => (isEl ? (getSlide(s.project).elements.find((e) => e.id === target.elementId) as MediaEl | undefined) : undefined));

  const setRatio = (r: number | null) => {
    if (!isEl || r === null || !elNow) return;
    const sl = getSlide(st().project);
    let w = elNow.width, h = w / r;
    if (h > sl.height) { h = sl.height; w = h * r; }
    if (w > sl.width) { w = sl.width; h = w / r; }
    const cx = elNow.x + elNow.width / 2, cy = elNow.y + elNow.height / 2;
    st().updateElement(elNow.id, (e) => { e.width = w; e.height = h; e.x = cx - w / 2; e.y = cy - h / 2; });
  };
  const fitToMedia = () => {
    if (!isEl || !elNow || !asset) return;
    const rotated = fill.rotation90 === 90 || fill.rotation90 === 270;
    const ar = rotated ? asset.height / asset.width : asset.width / asset.height;
    setRatio(ar);
    target.update((f) => { f.zoom = 1; f.fx = 0.5; f.fy = 0.5; });
  };

  return (
    <>
      <Section title={fill.kind === "video" ? "Video" : "Photo"} defaultOpen>
        <div className="flex items-center gap-2">
          {asset ? (
            <img src={asset.thumb} alt="" className="h-10 w-10 rounded object-cover" />
          ) : (
            <div className="grid h-10 w-10 place-items-center rounded bg-panel2 text-faint"><ImageOff size={16} /></div>
          )}
          <div className="min-w-0 flex-1">
            <div className="truncate text-xs text-ink">{asset?.name ?? "Missing media"}</div>
            <div className="text-2xs text-mute">{asset ? `${asset.width}×${asset.height}${asset.duration ? ` · ${formatTime(asset.duration)}` : ""}` : "Re-import this file"}</div>
          </div>
        </div>
        <div className="relative flex gap-1.5">
          <Button onClick={() => setPicker((p) => !p)} testId="replace-media"><RefreshCw size={12} /> Replace</Button>
          <Button variant="ghost" onClick={() => target.clear()}>Remove</Button>
          {picker && <AssetPicker onClose={() => setPicker(false)} onPick={(a) => { const t = target; if (t.kind === "element") st().setElementMedia(t.elementId, a); else st().setCellMedia(t.elementId, t.cellId!, a); setPicker(false); }} />}
        </div>
      </Section>

      <Section title="Crop & position">
        <div className="flex flex-wrap gap-0.5">
          <Button variant={cropping ? "primary" : "default"} onClick={() => st().setUI({ cropId: cropping ? null : target.elementId })} testId="crop-toggle" title="Drag the picture inside its frame; scroll to zoom">
            <Crop size={12} /> {cropping ? "Done" : "Crop"}
          </Button>
          <Button variant="ghost" onClick={() => target.update((f) => { f.zoom = 1; f.fx = 0.5; f.fy = 0.5; })} title="Fill the frame, centred"><Scan size={12} /> Fill</Button>
          {isEl && <Button variant="ghost" onClick={fitToMedia} title="Resize the frame to show the whole picture">Fit</Button>}
          <Button variant="ghost" onClick={() => target.update((f) => { f.zoom = 1; f.fx = 0.5; f.fy = 0.5; f.flipX = false; f.flipY = false; f.rotation90 = 0; })} testId="reset-crop"><RotateCcw size={12} /> Reset</Button>
        </div>
        <Slider label="Zoom" value={Math.round(fill.zoom * 100)} min={100} max={800} unit="%" neutral={100} onChange={(v) => target.update((f) => { f.zoom = v / 100; }, "zoom")} onReset={() => target.update((f) => { f.zoom = 1; })} />
        {isEl && (
          <Field label="Aspect">
            <div className="flex flex-wrap gap-0.5">
              {RATIOS.map((r) => (
                <button key={r.label} type="button" disabled={r.r === null} onClick={() => setRatio(r.r)} className="h-5 rounded bg-panel2 px-1.5 text-2xs text-mute ring-1 ring-line hover:text-ink disabled:opacity-40">{r.label}</button>
              ))}
            </div>
          </Field>
        )}
        <div className="flex items-center gap-0.5">
          <IconButton icon={<RotateCcw size={15} />} label="Rotate left 90°" onClick={() => target.update((f) => { f.rotation90 = ((f.rotation90 + 270) % 360) as 0 | 90 | 180 | 270; })} />
          <IconButton icon={<RotateCw size={15} />} label="Rotate right 90°" onClick={() => target.update((f) => { f.rotation90 = ((f.rotation90 + 90) % 360) as 0 | 90 | 180 | 270; })} testId="rotate-right" />
          <IconButton icon={<FlipHorizontal2 size={15} />} label="Flip horizontally" active={fill.flipX} onClick={() => target.update((f) => { f.flipX = !f.flipX; })} />
          <IconButton icon={<FlipVertical2 size={15} />} label="Flip vertically" active={fill.flipY} onClick={() => target.update((f) => { f.flipY = !f.flipY; })} />
        </div>
      </Section>

      {fill.kind === "video" && asset && <VideoSection target={target} duration={asset.duration ?? 0} playing={playing} />}

      {asset && (
        <Section title="Filters" action={<button type="button" className="text-2xs text-mute hover:text-ink" onClick={() => target.update((f) => { f.filter = { ...DEFAULT_FILTER }; })}>Reset</button>}>
          <div className="grid grid-cols-4 gap-0.5">
            {FILTER_PRESETS.map((p) => (
              <FilterThumb key={p.id} asset={asset} presetId={p.id} name={p.name.replace("Black & White", "B&W").replace("High Contrast", "Contrast")} active={fill.filter.id === p.id} onClick={() => target.update((f) => { f.filter = { id: p.id, intensity: f.filter.id === p.id ? f.filter.intensity : 100 }; })} />
            ))}
          </div>
          <Slider label="Intensity" value={fill.filter.intensity} min={0} max={100} neutral={100} unit="%" onChange={(v) => target.update((f) => { f.filter.intensity = v; }, "intensity")} onReset={() => target.update((f) => { f.filter.intensity = 100; })} />
        </Section>
      )}

      <Section title="Adjustments" action={<button type="button" className="text-2xs text-mute hover:text-ink" data-testid="reset-adjustments" onClick={() => target.update((f) => { f.adjustments = { ...NEUTRAL }; })}>Reset all</button>}>
        {(["light", "color", "detail", "effect"] as const).map((g) => (
          <div key={g} className="space-y-1.5">
            <div className="pt-1 text-2xs font-semibold text-faint">{{ light: "Light", color: "Colour", detail: "Detail", effect: "Effects" }[g]}</div>
            {ADJUSTMENT_META.filter((m) => m.group === g).map((m) => (
              <Slider
                key={m.key}
                testId={`adj-${m.key}`}
                label={m.label}
                value={Math.round(fill.adjustments[m.key])}
                min={m.min}
                max={m.max}
                onChange={(v) => target.update((f) => { f.adjustments[m.key] = v; }, "adj-" + m.key)}
                onReset={() => target.update((f) => { f.adjustments[m.key] = 0; })}
              />
            ))}
          </div>
        ))}
        {fill.kind === "video" && <p className="text-2xs leading-4 text-faint">Colour is applied to every frame of the video on canvas and in the exported file.</p>}
      </Section>
    </>
  );
}

function VideoSection({ target, duration, playing }: { target: FillTarget; duration: number; playing: boolean }) {
  const st = useStore.getState;
  const v = target.fill.video!;
  const t = effectiveTrim(target.fill, duration);
  return (
    <Section title="Clip" defaultOpen>
      <div className="flex items-center gap-1.5">
        <Button onClick={() => st().setUI({ playing: !playing })} testId="clip-play">{playing ? <Pause size={12} /> : <Play size={12} />} {playing ? "Stop" : "Play"}</Button>
        <span className="text-xs tabular-nums text-mute">{formatTime(t.length)} of {formatTime(duration)}</span>
      </div>
      <Slider label="Start" value={+t.start.toFixed(2)} min={0} max={Math.max(0.1, duration - 0.1)} step={0.05} unit="s" neutral={0} onChange={(x) => target.update((f) => { const vv = f.video!; vv.trimStart = Math.min(x, t.end - 0.1); if (vv.coverTime < vv.trimStart) vv.coverTime = vv.trimStart; }, "trim")} onReset={() => target.update((f) => { f.video!.trimStart = 0; })} testId="trim-start" />
      <Slider label="End" value={+t.end.toFixed(2)} min={0.1} max={duration} step={0.05} unit="s" neutral={duration} onChange={(x) => target.update((f) => { const vv = f.video!; vv.trimEnd = Math.max(x, t.start + 0.1); if (vv.coverTime > vv.trimEnd) vv.coverTime = vv.trimEnd; }, "trim")} onReset={() => target.update((f) => { f.video!.trimEnd = null; })} testId="trim-end" />
      <Slider label="Cover frame" value={+Math.min(Math.max(v.coverTime, t.start), t.end).toFixed(2)} min={t.start} max={t.end} step={0.05} unit="s" neutral={t.start} onChange={(x) => target.update((f) => { f.video!.coverTime = x; }, "cover")} onReset={() => target.update((f) => { f.video!.coverTime = t.start; })} testId="cover-time" />
      <Slider label="Volume" value={Math.round(v.volume * 100)} min={0} max={100} unit="%" neutral={100} onChange={(x) => target.update((f) => { f.video!.volume = x / 100; if (x > 0) f.video!.muted = false; }, "volume")} onReset={() => target.update((f) => { f.video!.volume = 1; })} />
      <div className="flex items-center gap-3">
        <button type="button" onClick={() => target.update((f) => { f.video!.muted = !f.video!.muted; })} className={`flex items-center gap-1 rounded-md px-2 py-1 text-xs ring-1 ring-line ${v.muted ? "bg-accent/20 text-accent" : "bg-panel2 text-ink/90"}`} data-testid="mute">
          {v.muted ? <VolumeX size={12} /> : <Volume2 size={12} />} {v.muted ? "Muted" : "Sound on"}
        </button>
        <Toggle label="Loop" value={v.loop} onChange={(x) => target.update((f) => { f.video!.loop = x; })} />
      </div>
      <p className="text-2xs leading-4 text-faint">The original file is never changed. Trim, cover and volume are saved with the project and applied on export.</p>
    </Section>
  );
}
export { newFill };
