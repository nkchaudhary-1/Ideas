"use client";
import { useEffect, useRef, useState } from "react";
import { Crop, FlipHorizontal2, FlipVertical2, ImageOff, Pause, Play, RefreshCw, RotateCcw, RotateCw, Volume2, VolumeX } from "lucide-react";
import type { Adjustments, Asset, MediaEl } from "@/lib/types";
import { useStore, getSlide } from "@/lib/store";
import { getAsset, effectiveTrim } from "@/lib/media";
import { ADJUSTMENT_META, FILTER_PRESETS, NEUTRAL, applyAdjustments, effectiveAdjustments } from "@/lib/filters";
import { DEFAULT_FILTER, newFill } from "@/lib/media-math";
import { Button, Chip, IconButton, Section, Slider, TextButton, Toggle, type SliderTrack } from "@/components/ui/controls";
import { formatTime } from "@/lib/util";
import { PresetActions, RenameLabel, SavePreset } from "@/components/ui/SavePreset";
import { captureLook, defaultName, sameLook } from "@/lib/user-presets";
import AssetPicker from "./AssetPicker";
import type { EditTarget, FillTarget } from "./fill-target";
import { CurvesSection, GradeSection, HslSection } from "./ColorTools";
import { EditCrop } from "./EditSections";

const RATIOS: { label: string; r: number | null }[] = [
  { label: "Free", r: null }, { label: "1:1", r: 1 }, { label: "4:5", r: 4 / 5 }, { label: "3:4", r: 3 / 4 }, { label: "2:3", r: 2 / 3 },
  { label: "9:16", r: 9 / 16 }, { label: "4:3", r: 4 / 3 }, { label: "3:2", r: 3 / 2 }, { label: "16:9", r: 16 / 9 },
];

/** one shared, decoded copy of an asset's small preview picture: every filter thumbnail waits on the same promise, so none is left blank */
const thumbImgs = new Map<string, Promise<HTMLImageElement>>();
const thumbImage = (asset: Asset): Promise<HTMLImageElement> => {
  let p = thumbImgs.get(asset.id);
  if (!p) {
    p = new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => { thumbImgs.delete(asset.id); reject(new Error("thumbnail failed to load")); };
      img.src = asset.thumb;
    });
    thumbImgs.set(asset.id, p);
  }
  return p;
};
/** a small preview of `asset` with `adj` applied */
function ThumbCanvas({ asset, adj, className }: { asset: Asset; adj: Adjustments; className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const key = JSON.stringify(adj);
  useEffect(() => {
    let dead = false;
    void thumbImage(asset).then((img) => {
      const cv = ref.current;
      if (!cv || dead) return;
      const w = 64, h = 80;
      cv.width = w; cv.height = h;
      const ctx = cv.getContext("2d", { willReadFrequently: true })!;
      const s = Math.max(w / img.width, h / img.height);
      ctx.drawImage(img, (w - img.width * s) / 2, (h - img.height * s) / 2, img.width * s, img.height * s);
      applyAdjustments(ctx, w, h, adj, 3);
    }).catch(() => { /* a preview is a nicety */ });
    return () => { dead = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [asset, key]);
  return <canvas ref={ref} className={className} />;
}

export function FilterThumb({ asset, presetId, active, onClick, name }: { asset: Asset; presetId: string; active: boolean; onClick: () => void; name: string }) {
  return (
    <button type="button" onClick={onClick} title={name} data-testid={`filter-${presetId}`} className={`group flex h-[88px] flex-col items-center justify-center gap-1 rounded p-0.5 ${active ? "bg-ink/10 ring-1 ring-ink/60" : "hover:bg-ink/5"}`}>
      <ThumbCanvas asset={asset} adj={effectiveAdjustments({ ...NEUTRAL }, { id: presetId, intensity: 100 })} className="h-[60px] w-[48px] rounded-sm bg-panel2" />
      <span className={`max-w-full truncate text-2xs ${active ? "text-ink" : "text-mute"}`} title={name}>{name}</span>
    </button>
  );
}

/** the user's own saved looks: a filter plus every adjustment, reusable on any photo or video */
function MyLooks({ target, asset }: { target: FillTarget; asset: Asset | undefined }) {
  const st = useStore.getState;
  const presets = useStore((s) => s.presets);
  const [renaming, setRenaming] = useState<string | null>(null);
  const looks = presets.filter((p) => p.kind === "look");
  return (
    <Section title="My looks" defaultOpen>
      {looks.length > 0 ? (
        <div className="grid grid-cols-4 gap-1" data-testid="my-looks">
          {looks.map((p) => {
            if (p.kind !== "look") return null;
            const active = sameLook(target.fill, p.data);
            return (
              <div key={p.id} className="group relative" data-testid="look-tile">
                <button type="button" title={`Apply “${p.name}”`} onClick={() => target.update((f) => { f.filter = { ...p.data.filter }; f.adjustments = structuredClone(p.data.adjustments) as Adjustments; })}
                  className={`flex w-full flex-col items-center gap-1 rounded p-0.5 ${active ? "bg-ink/10 ring-1 ring-ink/60" : "hover:bg-ink/5"}`}>
                  {asset ? <ThumbCanvas asset={asset} adj={effectiveAdjustments(p.data.adjustments, p.data.filter)} className="h-[60px] w-[48px] rounded bg-panel2" /> : <span className="block h-[60px] w-[48px] rounded-sm bg-panel2" />}
                  <RenameLabel id={p.id} name={p.name} editing={renaming === p.id} setEditing={(v) => setRenaming(v ? p.id : null)} className={`w-full text-center text-2xs ${active ? "text-ink" : "text-mute"}`} />
                </button>
                <PresetActions id={p.id} name={p.name} onRename={() => setRenaming(p.id)} />
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-2xs leading-4 text-faint">Adjust a photo or video, then save the result as a look to reuse it anywhere.</p>
      )}
      <SavePreset label="Save current look" testId="save-look" placeholder="Look name" defaultName={() => defaultName(presets, "look")}
        onSave={(name) => { st().addPreset({ kind: "look", name, data: captureLook(target.fill) }); st().toast(`Saved look “${name}”`, "ok"); }} />
    </Section>
  );
}

export default function MediaProps({ target, edit }: { target: FillTarget; edit?: EditTarget }) {
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
      {edit ? <EditCrop target={edit} /> : <>
      <Section title={fill.kind === "video" ? "Video" : "Photo"} defaultOpen>
        <div className="flex items-center gap-3">
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
        <div className="relative flex gap-2">
          <Button onClick={() => setPicker((p) => !p)} testId="replace-media"><RefreshCw size={12} /> Replace</Button>
          <Button variant="ghost" onClick={() => target.clear()}>Remove</Button>
          {picker && <AssetPicker onClose={() => setPicker(false)} onPick={(a) => { const t = target; if (t.kind === "element") st().setElementMedia(t.elementId, a); else st().setCellMedia(t.elementId, t.cellId!, a); setPicker(false); }} />}
        </div>
      </Section>

      <Section title="Crop & position">
        <div className="flex gap-2">
          <Button className="px-3" variant={cropping ? "primary" : "default"} onClick={() => st().setUI({ cropId: cropping ? null : target.elementId })} testId="crop-toggle" title="Drag the picture inside its frame; scroll to zoom">
            <Crop size={12} /> {cropping ? "Done" : "Crop"}
          </Button>
          <Button className="px-3" variant="ghost" onClick={() => target.update((f) => { f.zoom = 1; f.fx = 0.5; f.fy = 0.5; })} title="Fill the frame, centred">Fill</Button>
          {isEl && <Button className="px-3" variant="ghost" onClick={fitToMedia} title="Resize the frame to show the whole picture">Fit</Button>}
          <Button className="px-3" variant="ghost" onClick={() => target.update((f) => { f.zoom = 1; f.fx = 0.5; f.fy = 0.5; f.flipX = false; f.flipY = false; f.rotation90 = 0; })} testId="reset-crop">Reset</Button>
        </div>
        <Slider label="Zoom" value={Math.round(fill.zoom * 100)} min={100} max={800} unit="%" neutral={100} onChange={(v) => target.update((f) => { f.zoom = v / 100; }, "zoom")} onReset={() => target.update((f) => { f.zoom = 1; })} />
        {isEl && (
          <div className="space-y-2" data-testid="aspect-row">
            <div className="text-xs font-semibold text-ink/80">Aspect</div>
            <div className="flex flex-wrap gap-2" role="group" aria-label="Aspect ratio">
              {RATIOS.filter((r) => r.r !== null).map((r) => (
                <Chip key={r.label} title={`Resize the frame to ${r.label}`} aria-label={`Aspect ${r.label}`} onClick={() => setRatio(r.r)} className="pl-3">
                  <span className="block rounded-[3px] border-[1.5px] border-current" style={{ width: Math.max(8, r.r! >= 1 ? 16 : 16 * r.r!), height: Math.max(8, r.r! >= 1 ? 16 / r.r! : 16) }} />
                  {r.label}
                </Chip>
              ))}
            </div>
          </div>
        )}
        <div className="flex items-center gap-1">
          <IconButton icon={<RotateCcw size={15} />} label="Rotate left 90°" onClick={() => target.update((f) => { f.rotation90 = ((f.rotation90 + 270) % 360) as 0 | 90 | 180 | 270; })} />
          <IconButton icon={<RotateCw size={15} />} label="Rotate right 90°" onClick={() => target.update((f) => { f.rotation90 = ((f.rotation90 + 90) % 360) as 0 | 90 | 180 | 270; })} testId="rotate-right" />
          <IconButton icon={<FlipHorizontal2 size={15} />} label="Flip horizontally" active={fill.flipX} onClick={() => target.update((f) => { f.flipX = !f.flipX; })} />
          <IconButton icon={<FlipVertical2 size={15} />} label="Flip vertically" active={fill.flipY} onClick={() => target.update((f) => { f.flipY = !f.flipY; })} />
        </div>
      </Section>
      </>}

      {fill.kind === "video" && asset && <VideoSection target={edit ? { ...target, update: edit.solo } : target} duration={asset.duration ?? 0} playing={playing} />}

      <MyLooks target={target} asset={asset} />

      {asset && (
        <Section title="Filters" action={<TextButton onClick={() => target.update((f) => { f.filter = { ...DEFAULT_FILTER }; })}>Reset</TextButton>}>
          <div className="grid grid-cols-4 gap-0.5">
            {FILTER_PRESETS.map((p) => (
              <FilterThumb key={p.id} asset={asset} presetId={p.id} name={p.name.replace("Black & White", "B&W").replace("High Contrast", "Contrast")} active={fill.filter.id === p.id} onClick={() => target.update((f) => { f.filter = { id: p.id, intensity: f.filter.id === p.id ? f.filter.intensity : 100 }; })} />
            ))}
          </div>
          <Slider label="Intensity" value={fill.filter.intensity} min={0} max={100} neutral={100} unit="%" onChange={(v) => target.update((f) => { f.filter.intensity = v; }, "intensity")} onReset={() => target.update((f) => { f.filter.intensity = 100; })} />
        </Section>
      )}

      <Section title="Adjustments" action={<TextButton data-testid="reset-adjustments" onClick={() => target.update((f) => { f.adjustments = { ...NEUTRAL }; })}>Reset all</TextButton>}>
        {(["light", "color", "detail", "effect"] as const).map((g) => (
          <div key={g} className="space-y-2">
            <div className="pt-1 text-2xs font-semibold text-faint">{{ light: "Light", color: "Colour", detail: "Detail", effect: "Effects" }[g]}</div>
            {ADJUSTMENT_META.filter((m) => m.group === g).map((m) => (
              <Slider
                key={m.key}
                testId={`adj-${m.key}`}
                label={m.label}
                value={Math.round(fill.adjustments[m.key] ?? 0)}
                min={m.min}
                max={m.max}
                onChange={(v) => target.update((f) => { f.adjustments[m.key] = v; }, "adj-" + m.key)}
                onReset={() => target.update((f) => { f.adjustments[m.key] = 0; })}
                track={({ temperature: "temp", tint: "tint", hue: "hue", saturation: "sat" } as Record<string, SliderTrack | undefined>)[m.key]}
              />
            ))}
          </div>
        ))}
        {fill.kind === "video" && <p className="text-2xs leading-4 text-faint">Colour is applied to every frame of the video on canvas and in the exported file.</p>}
      </Section>

      <HslSection target={target} />
      <CurvesSection target={target} />
      <GradeSection target={target} />
    </>
  );
}

function VideoSection({ target, duration, playing }: { target: FillTarget; duration: number; playing: boolean }) {
  const st = useStore.getState;
  const v = target.fill.video!;
  const t = effectiveTrim(target.fill, duration);
  return (
    <Section title="Clip" defaultOpen>
      <div className="flex items-center gap-2">
        <Button onClick={() => st().setUI({ playing: !playing })} testId="clip-play">{playing ? <Pause size={12} /> : <Play size={12} />} {playing ? "Stop" : "Play"}</Button>
        <span className="text-xs tabular-nums text-mute">{formatTime(t.length)} of {formatTime(duration)}</span>
      </div>
      <Slider label="Start" value={+t.start.toFixed(2)} min={0} max={Math.max(0.1, duration - 0.1)} step={0.05} unit="s" neutral={0} onChange={(x) => target.update((f) => { const vv = f.video!; vv.trimStart = Math.min(x, t.end - 0.1); if (vv.coverTime < vv.trimStart) vv.coverTime = vv.trimStart; }, "trim")} onReset={() => target.update((f) => { f.video!.trimStart = 0; })} testId="trim-start" />
      <Slider label="End" value={+t.end.toFixed(2)} min={0.1} max={duration} step={0.05} unit="s" neutral={duration} onChange={(x) => target.update((f) => { const vv = f.video!; vv.trimEnd = Math.max(x, t.start + 0.1); if (vv.coverTime > vv.trimEnd) vv.coverTime = vv.trimEnd; }, "trim")} onReset={() => target.update((f) => { f.video!.trimEnd = null; })} testId="trim-end" />
      <Slider label="Cover frame" value={+Math.min(Math.max(v.coverTime, t.start), t.end).toFixed(2)} min={t.start} max={t.end} step={0.05} unit="s" neutral={t.start} onChange={(x) => target.update((f) => { f.video!.coverTime = x; }, "cover")} onReset={() => target.update((f) => { f.video!.coverTime = t.start; })} testId="cover-time" />
      <Slider label="Volume" value={Math.round(v.volume * 100)} min={0} max={100} unit="%" neutral={100} onChange={(x) => target.update((f) => { f.video!.volume = x / 100; if (x > 0) f.video!.muted = false; }, "volume")} onReset={() => target.update((f) => { f.video!.volume = 1; })} />
      <div className="flex items-center gap-3">
        <Chip soft active={v.muted} onClick={() => target.update((f) => { f.video!.muted = !f.video!.muted; })} data-testid="mute">
          {v.muted ? <VolumeX size={14} /> : <Volume2 size={14} />} {v.muted ? "Muted" : "Sound on"}
        </Chip>
        <Toggle label="Loop" value={v.loop} onChange={(x) => target.update((f) => { f.video!.loop = x; })} />
      </div>
      <p className="text-2xs leading-4 text-faint">The original file is never changed. Trim, cover and volume are saved with the project and applied on export.</p>
    </Section>
  );
}
export { newFill };
