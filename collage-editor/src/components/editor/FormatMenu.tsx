"use client";
import { useState } from "react";
import { Minus, Plus } from "lucide-react";
import { useStore, getSlide } from "@/lib/store";
import { dims } from "@/lib/util";
import { CUSTOM_FORMAT, FORMATS, PANORAMA_BASES, PANORAMA_MAX, PANORAMA_MIN, panoramaCount, panoramaFormat, ratioLabel } from "@/lib/formats";
import type { Format } from "@/lib/types";
import { Button, IconButton, NumberField, Segmented } from "@/components/ui/controls";
import { PresetActions, RenameLabel, SavePreset } from "@/components/ui/SavePreset";
import { defaultName } from "@/lib/user-presets";

const NOTE: Record<string, string> = { "4-5": "Feed", "9-16": "Story · Reel", "1-1": "Square", "191-1": "Landscape" };

function Tile({ f, active, onClick }: { f: Format; active: boolean; onClick: () => void }) {
  const k = 22 / Math.max(f.width, f.height);
  return (
    <button type="button" onClick={onClick} data-testid={`format-${f.id}`} title={`${f.width} × ${f.height}px`}
      className={`flex h-[72px] flex-col items-center justify-center gap-1 rounded px-1 transition-colors ${active ? "bg-pill text-pillink" : "bg-field text-mute hover:text-ink"}`}>
      <span className="grid h-6 place-items-center"><span className="block rounded-[3px] border-[1.5px] border-current" style={{ width: Math.max(8, f.width * k), height: Math.max(8, f.height * k) }} /></span>
      <span className="text-xs font-bold leading-none">{f.ratio}</span>
      <span className="text-2xs leading-none opacity-70">{NOTE[f.id] ?? `${f.width}×${f.height}`}</span>
    </button>
  );
}

/** Canvas size: posts and stories, panorama carousels (12:5 = three slides side by side), custom. */
export default function FormatMenu({ close }: { close: () => void }) {
  const st = useStore.getState;
  const project = useStore((s) => s.project);
  const slide = useStore((s) => getSlide(s.project));
  const [content, setContent] = useState<"stretch" | "fit" | "none">("stretch");
  const [cw, setCw] = useState(slide.width);
  const [ch, setCh] = useState(slide.height);
  const presets = useStore((s) => s.presets);
  const [renaming, setRenaming] = useState<string | null>(null);
  const sizes = presets.filter((p) => p.kind === "size");
  const n = panoramaCount(slide.width);
  const segH = slide.height;
  const baseId = PANORAMA_BASES.find((b) => b.h === segH)?.id ?? "4-5";
  const same = (f: Format) => project.format.width === f.width && project.format.height === f.height;
  const set = (f: Format) => { st().setFormat(f, { content }); };

  return (
    <div className="space-y-7" data-testid="format-menu">
      <section>
        <h3 className="mb-3 text-xs font-bold text-ink">Post size</h3>
        <div className="grid grid-cols-5 gap-2" data-testid="format-grid">
          {FORMATS.map((f) => <Tile key={f.id} f={f} active={same(f)} onClick={() => set(f)} />)}
        </div>
      </section>

      <section className="rounded bg-panel2 p-5" data-testid="panorama-section">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-xs font-bold text-ink">Panorama carousel</h3>
            <p className="mt-1 text-2xs leading-4 text-mute">One wide canvas, cut into slides when you export. 12:5 is three 4:5 slides.</p>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-5 gap-2">
          {[2, 3, 4, 5, 6].map((c) => {
            const f = panoramaFormat(c, segH);
            const on = n === c;
            return (
              <button key={c} type="button" data-testid={`pano-${c}`} onClick={() => st().setPanoramaSlides(c)} title={`${f.width} × ${f.height}px`}
                className={`h-14 rounded px-1 text-center transition-colors ${on ? "bg-pill text-pillink" : "bg-field text-mute hover:text-ink"}`}>
                <span className="block text-xs font-bold leading-4">{f.ratio}</span>
                <span className="block text-2xs leading-4 opacity-70">{c} slides</span>
              </button>
            );
          })}
        </div>
        <div className="mt-4 flex items-center justify-between gap-3">
          <Segmented value={baseId} onChange={(id) => { const b = PANORAMA_BASES.find((x) => x.id === id)!; st().setFormat(panoramaFormat(Math.max(PANORAMA_MIN, n), b.h), { content: "none" }); }} options={PANORAMA_BASES.map((b) => ({ value: b.id, label: b.id.replace("-", ":") }))} size="sm" />
          <div className="flex items-center gap-1" role="group" aria-label="Extend panorama">
            <IconButton icon={<Minus size={14} />} label="Remove a slide" testId="pano-minus" disabled={n <= PANORAMA_MIN} onClick={() => st().setPanoramaSlides(n - 1)} className="bg-field hover:!bg-raised" />
            <span className="w-16 text-center text-xs font-semibold tabular-nums">{n > 1 ? `${n} slides` : "Off"}</span>
            <IconButton icon={<Plus size={14} />} label="Add a slide" testId="pano-plus" disabled={n >= PANORAMA_MAX} onClick={() => st().setPanoramaSlides(Math.max(PANORAMA_MIN, n + 1))} className="bg-pill !text-pillink hover:!bg-pill hover:opacity-90" />
          </div>
        </div>
      </section>

      {sizes.length > 0 && (
        <section data-testid="my-sizes">
          <h3 className="mb-3 text-xs font-bold text-ink">My sizes</h3>
          <div className="grid grid-cols-2 gap-3">
            {sizes.map((p) => {
              if (p.kind !== "size") return null;
              const f = CUSTOM_FORMAT(p.data.width, p.data.height);
              const on = same(f);
              return (
                <div key={p.id} className="group relative" data-testid="size-tile">
                  <button type="button" title={`${p.data.width} × ${p.data.height}px`} onClick={() => set(f)} className={`flex w-full flex-col items-start rounded px-4 py-3 text-left transition-colors ${on ? "bg-pill text-pillink" : "bg-field text-ink hover:bg-raised"}`}>
                    <RenameLabel id={p.id} name={p.name} editing={renaming === p.id} setEditing={(v) => setRenaming(v ? p.id : null)} className="w-full text-xs font-bold" />
                    <span className="text-2xs opacity-70">{f.ratio} · {p.data.width}×{p.data.height}</span>
                  </button>
                  <PresetActions id={p.id} name={p.name} onRename={() => setRenaming(p.id)} />
                </div>
              );
            })}
          </div>
        </section>
      )}

      <section>
        <h3 className="mb-3 text-xs font-bold text-ink">Custom size</h3>
        <div className="flex items-center gap-2">
          <NumberField width={88} value={cw} min={64} max={12000} onChange={setCw} label="W" />
          <NumberField width={88} value={ch} min={64} max={8000} onChange={setCh} label="H" />
          <Button onClick={() => { set(CUSTOM_FORMAT(cw, ch)); close(); }} testId="apply-custom">Apply</Button>
        </div>
        <div className="mt-4">
          <SavePreset label="Save this size" testId="save-size" placeholder="Size name" defaultName={() => defaultName(presets, "size")}
            onSave={(name) => { st().addPreset({ kind: "size", name, data: { width: Math.round(cw), height: Math.round(ch) } }); st().toast(`Saved size “${name}”`, "ok"); }} />
        </div>
      </section>

      <section className="flex items-center justify-between gap-2">
        <span className="text-xs text-mute">Existing content</span>
        <Segmented size="sm" value={content} options={[{ value: "stretch", label: "Stretch" }, { value: "fit", label: "Fit" }, { value: "none", label: "Keep" }]} onChange={setContent} />
      </section>
      <p className="text-2xs leading-4 text-faint">{dims(slide.width, slide.height)} · {ratioLabel(slide.width, slide.height)}{project.kind === "carousel" && n === 1 ? ". Every slide in a carousel shares one size." : ""}</p>
    </div>
  );
}
