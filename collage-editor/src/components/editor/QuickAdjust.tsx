"use client";
import { useEffect, useState } from "react";
import { Check, SlidersHorizontal } from "lucide-react";
import { useStore } from "@/lib/store";
import { useEditTarget, useFillTarget } from "@/components/props/fill-target";
import { FilterThumb } from "@/components/props/MediaProps";
import { ADJUSTMENT_META, FILTER_PRESETS } from "@/lib/filters";
import { getAsset } from "@/lib/media";
import { Slider } from "@/components/ui/controls";

/**
 * The quick way to edit a photo, in the manner of Snapseed, Lensa and Instagram Edits: one row of tools along the bottom,
 * one slider for the tool you picked, a tick to finish. The full list of sliders stays in the edit panel ("More").
 */
export default function QuickAdjust({ compact }: { compact: boolean }) {
  const st = useStore.getState;
  const quick = useStore((s) => s.ui.quick);
  const sheet = useStore((s) => s.ui.sheet);
  const edit = useStore((s) => s.project.kind === "edit");
  const ft = useFillTarget();
  const et = useEditTarget();
  const target = edit ? et : ft;
  const [key, setKey] = useState<string>("brightness");
  // nothing to adjust any more (the photo was deselected): put the bar away
  useEffect(() => { if (quick && !target) st().setUI({ quick: null }); }, [quick, target, st]);
  if (!quick || !target || (compact && sheet)) return null;
  const asset = getAsset(target.fill.assetId);
  const adj = target.fill.adjustments as unknown as Record<string, number | undefined>;
  const meta = ADJUSTMENT_META.find((m) => m.key === key) ?? ADJUSTMENT_META[0];
  const more = () => { st().setUI({ quick: null, ...(compact ? { sheet: "props", sheetSize: "half" as const } : { rightOpen: true }) }); };

  return (
    // on a phone it is a panel in the layout, like a sheet: the canvas gets smaller and refits above it, so it never covers the picture
    <div className={compact ? "shrink-0" : "pointer-events-none absolute inset-x-0 z-20 flex justify-center px-3"} style={compact ? undefined : { bottom: 92 }}>
      <div className={`pop flex w-full flex-col gap-3 rounded-card bg-panel ring-1 ring-line/70 ${compact ? "p-3" : "pointer-events-auto max-w-[560px] p-4 shadow-float"}`} data-testid="quick-adjust" role="group" aria-label="Quick edit">
        <div className="flex items-center gap-2">
          <div className="flex gap-1 rounded-full bg-field p-1" role="tablist">
            {([["adjust", "Adjust"], ["filters", "Filters"]] as const).map(([id, label]) => (
              <button key={id} type="button" role="tab" aria-selected={quick === id} data-testid={`quick-tab-${id}`} onClick={() => st().setUI({ quick: id })}
                className={`h-7 rounded-full px-4 text-xs font-semibold transition coarse:h-9 ${quick === id ? "bg-seg text-ink shadow-sm" : "text-mute hover:text-ink"}`}>{label}</button>
            ))}
          </div>
          <span className="flex-1" />
          <button type="button" onClick={more} data-testid="quick-more" aria-label="More" className="h-9 shrink-0 rounded-full px-3 text-xs font-semibold text-mute transition hover:bg-field hover:text-ink coarse:h-11 max-[359px]:w-9 max-[359px]:px-0 max-[359px]:coarse:w-11"><SlidersHorizontal size={13} className="mr-1 inline max-[359px]:mr-0" /><span className="max-[359px]:hidden">More</span></button>
          <button type="button" onClick={() => st().setUI({ quick: null })} aria-label="Done" title="Done" data-testid="quick-done" className="grid h-9 w-9 shrink-0 place-items-center rounded-full grad-pill text-pillink transition hover:opacity-90 active:scale-90 coarse:h-11 coarse:w-11"><Check size={16} strokeWidth={2.6} /></button>
        </div>

        {quick === "adjust" ? (
          <>
            <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 [mask-image:linear-gradient(to_right,transparent,#000_16px,#000_calc(100%-24px),transparent)]" role="tablist" aria-label="Adjustment"
              onWheel={(e) => { if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) e.currentTarget.scrollLeft += e.deltaY; }}>
              {ADJUSTMENT_META.map((m) => {
                const v = Math.round(adj[m.key] ?? 0);
                const on = m.key === meta.key;
                return (
                  <button key={m.key} type="button" role="tab" aria-selected={on} data-testid={`quick-${m.key}`} onClick={() => setKey(m.key)}
                    className={`flex h-9 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-3 text-xs font-semibold transition active:scale-95 coarse:h-11 ${on ? "bg-pill text-pillink" : "bg-field text-mute hover:text-ink"}`}>
                    {m.label}{v !== 0 && <span className={on ? "opacity-70" : "text-accent"}>{v > 0 ? "+" : ""}{v}</span>}
                  </button>
                );
              })}
            </div>
            <Slider key={meta.key} label="" value={Math.round(adj[meta.key] ?? 0)} min={meta.min} max={meta.max} neutral={0}
              onChange={(v) => target.update((f) => { (f.adjustments as unknown as Record<string, number>)[meta.key] = v; }, "adj-" + meta.key)}
              onReset={() => target.update((f) => { (f.adjustments as unknown as Record<string, number>)[meta.key] = 0; })} />
          </>
        ) : (
          <>
            <div className="no-scrollbar -mx-4 flex gap-1 overflow-x-auto px-4 [mask-image:linear-gradient(to_right,transparent,#000_16px,#000_calc(100%-24px),transparent)]" aria-label="Filters"
              onWheel={(e) => { if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) e.currentTarget.scrollLeft += e.deltaY; }}>
              {asset && FILTER_PRESETS.map((p) => (
                <div key={p.id} className="w-16 shrink-0">
                  <FilterThumb asset={asset} presetId={p.id} name={p.name.replace("Black & White", "B&W").replace("High Contrast", "Contrast")} active={target.fill.filter.id === p.id}
                    onClick={() => target.update((f) => { f.filter = { id: p.id, intensity: f.filter.id === p.id ? f.filter.intensity : 100 }; })} />
                </div>
              ))}
            </div>
            <Slider key="intensity" label="" value={target.fill.filter.intensity} min={0} max={100} neutral={100}
              onChange={(v) => target.update((f) => { f.filter.intensity = v; }, "intensity")} onReset={() => target.update((f) => { f.filter.intensity = 100; })} />
          </>
        )}
      </div>
    </div>
  );
}
