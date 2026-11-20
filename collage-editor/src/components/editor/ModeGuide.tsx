"use client";
import { useEffect, useState } from "react";
import { Check, ChevronDown, CircleHelp } from "lucide-react";
import { useStore, type PanelId } from "@/lib/store";
import { MODES, modeOf, type ModeKey } from "@/lib/modes";
import { slideFills } from "@/lib/timeline";
import { flatten } from "@/lib/geometry";
import { cellsOf } from "@/lib/grid-engine";
import { fillIsNeutral } from "@/lib/filters";
import { Button, TextButton } from "@/components/ui/controls";
import Popover from "@/components/ui/Popover";

const isCompactNow = () => typeof window !== "undefined" && window.matchMedia("(max-width: 899px)").matches;
const openTool = (id: PanelId) => {
  const st = useStore.getState();
  st.setUI(isCompactNow() ? { leftPanel: id, sheet: "tools", sheetSize: "half" } : { leftPanel: id });
};
const openProps = () => { const st = useStore.getState(); st.setUI(isCompactNow() ? { sheet: "props", sheetSize: "half" } : { rightOpen: true }); };

export interface Step { id: string; label: string; hint: string; done: boolean; action?: { label: string; run: () => void } }

/** what this project needs next, read from what is in it: nothing to set up, nothing to remember */
export function useGuide(): { mode: ModeKey; steps: Step[]; next: number } {
  const project = useStore((s) => s.project);
  const exported = useStore((s) => s.ui.exportedProject === s.project.id);
  const refId = useStore((s) => s.ui.refSlideId);
  const mode = modeOf(project);
  const st = useStore.getState;

  const slides = project.slides;
  const fills = slides.flatMap(slideFills);
  const media = fills.filter((f) => f.assetId).length;
  const texts = slides.reduce((n, s) => n + flatten(s.elements).filter((e) => e.type === "text").length, 0);
  const edited = fills.some((f) => !fillIsNeutral(f) || !!f.match);
  const cells = slides.flatMap((s) => s.elements.filter((e) => e.type === "grid")).flatMap((g) => (g.type === "grid" ? cellsOf(g.tree) : []));
  const filled = cells.filter((c) => c.fill).length;
  const hasGrid = cells.length > 0;

  const photos: Step = { id: "photos", label: "Add photos", hint: "Upload from your device, or start from a ready-made template.", done: media > 0, action: { label: "Add photos", run: () => openTool("uploads") } };
  const style: Step = { id: "style", label: "Style it", hint: "Add text, shapes or filters. Everything stays editable.", done: texts > 0 || edited, action: { label: "Add text", run: () => openTool("text") } };
  const exportStep = (hint: string): Step => ({ id: "export", label: "Export", hint, done: exported, action: { label: "Export", run: () => st().setUI({ exportOpen: true, playing: false, sheet: null }) } });

  let steps: Step[];
  switch (mode) {
    case "carousel":
      steps = [
        photos,
        { id: "slides", label: "Add more slides", hint: "Use + in the slide strip below. Tap a slide there to edit it.", done: slides.length >= 2, action: { label: "Add a slide", run: () => { st().addSlide({ afterId: st().project.activeSlideId }); } } },
        { ...style, label: "Style your slides" },
        exportStep("Download every slide as an image, numbered in the order to post them."),
      ];
      break;
    case "collage":
      steps = [
        { id: "layout", label: "Pick a layout", hint: "Choose how many photos you want and how they sit together.", done: hasGrid, action: { label: "Choose a layout", run: () => openTool("layouts") } },
        { id: "photos", label: "Fill the tiles", hint: "Tap a tile to add a photo, or drag photos in from Media.", done: hasGrid && filled === cells.length, action: { label: "Add photos", run: () => openTool("uploads") } },
        style,
        exportStep("Download your collage as one image."),
      ];
      break;
    case "panorama":
      steps = [
        { ...photos, label: "Add your wide photo", hint: "Dotted lines show where it will be cut into slides. Keep faces away from them." },
        style,
        exportStep("Your panorama is cut along the dotted lines into slides, numbered in order."),
      ];
      break;
    case "edit":
      steps = [
        { id: "photos", label: "Add photos or videos", hint: "Bring in one or many. Each is edited on its own, or together.", done: media > 0, action: { label: "Add media", run: () => openTool("uploads") } },
        { id: "adjust", label: "Adjust one", hint: "Filters, light and colour are in the panel. Use Compare to see the original.", done: edited, action: { label: "Open adjustments", run: openProps } },
        { id: "match", label: "Apply the look to the rest", hint: "Use Match look, or copy and paste settings, so every photo agrees.", done: refId !== null || fills.filter((f) => !fillIsNeutral(f)).length > 1, action: { label: "Open adjustments", run: openProps } },
        exportStep("Download your edited photos and videos, keeping their own names."),
      ];
      break;
    default: // single, story
      steps = [
        photos,
        { id: "edit", label: "Adjust the photo", hint: "Tap the photo, then use the wheel to zoom, crop, or open filters.", done: edited, action: { label: "Open adjustments", run: openProps } },
        { ...style, label: "Add text" },
        exportStep("Download your design as one image."),
      ];
  }
  // strictly in order: a later step only ticks once every earlier one has, so the list never shows step 3 done while you are on step 1
  // (a template's own placeholder text, say, must not count as you having styled anything)
  steps = steps.map((s, i) => ({ ...s, done: s.done && steps.slice(0, i).every((p) => p.done) }));
  const next = steps.findIndex((s) => !s.done);
  return { mode, steps, next };
}

const MIN = "collage.guide.min";
const read = (k: string) => { try { return JSON.parse(localStorage.getItem(k) || "null"); } catch { return null; } };
const write = (k: string, v: unknown) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* private mode */ } };

/** under the top bar: which kind of project this is, which step you are on, and a list of all the steps */
export function GuideChip({ compact, lowered }: { compact: boolean; /** the top bar has wrapped onto a second row: sit below it */ lowered?: boolean }) {
  const { mode, steps, next } = useGuide();
  const info = MODES[mode];
  const [min, setMin] = useState(false);
  useEffect(() => { setMin(read(MIN) === true); }, []);
  const doneAll = next === -1;
  const here = doneAll ? "Ready to export" : `Step ${next + 1} of ${steps.length} · ${steps[next].label}`;
  const short = doneAll ? "Ready" : `${next + 1}/${steps.length}`;

  return (
    <div className="pointer-events-none absolute inset-x-0 z-20 flex justify-center px-3" style={{ top: lowered ? 148 : 84 }}>
      <Popover placement="bottom" align="center" width={360} trigger={(open, toggle) => {
        return min && !open ? (
          <button type="button" onClick={toggle} aria-label={`${info.label}: what to do next`} title="What to do next" data-testid="guide-chip"
            className="pointer-events-auto grid h-9 w-9 place-items-center rounded-full bg-panel text-mute shadow-float hover:text-ink coarse:h-11 coarse:w-11"><CircleHelp size={16} /></button>
        ) : (
          <button type="button" onClick={toggle} aria-expanded={open} data-testid="guide-chip" title="What to do next"
            className={`pointer-events-auto flex h-9 max-w-full items-center gap-2 whitespace-nowrap rounded-full bg-panel pl-1 pr-3 text-xs shadow-float coarse:h-11 ${open ? "ring-2 ring-ink/30" : ""}`}>
            <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-pill text-pillink coarse:h-9 coarse:w-9"><info.Icon size={14} /></span>
            <span className="font-bold">{info.label}</span>
            <span className="text-faint">·</span>
            <span className="min-w-0 truncate text-mute">{compact ? short : here}</span>
            {!doneAll && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />}
            <ChevronDown size={13} className="shrink-0 text-mute" />
          </button>
        );
      }}>
        {(close) => (
          <div className="-m-2 pb-2" data-testid="guide-panel">
            <div className="flex items-start gap-3 px-5 pb-3 pt-5">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-pill text-pillink"><info.Icon size={18} /></span>
              <div className="min-w-0">
                <div className="text-sm font-extrabold tracking-tight">You’re making a {info.noun === "edit" ? "photo and video edit" : info.noun}</div>
                <p className="mt-1 text-xs leading-5 text-mute">{info.blurb}</p>
              </div>
            </div>
            <ol className="space-y-1 px-3">
              {steps.map((s, i) => {
                const current = i === next;
                return (
                  <li key={s.id} className={`flex items-start gap-3 rounded px-2 py-3 ${current ? "bg-field" : ""}`} data-testid={`guide-step-${s.id}`} data-done={s.done} aria-current={current ? "step" : undefined}>
                    <span className={`mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full text-2xs font-bold ${s.done ? "bg-accent text-white" : current ? "bg-pill text-pillink" : "bg-field text-mute"}`}>{s.done ? <Check size={12} strokeWidth={3} /> : i + 1}</span>
                    <div className="min-w-0 flex-1">
                      <div className={`text-sm font-semibold ${s.done ? "text-mute line-through decoration-faint" : ""}`}>{s.label}</div>
                      {(current || !s.done) && <p className="mt-0.5 text-xs leading-5 text-mute">{s.hint}</p>}
                      {current && s.action && <Button variant="primary" className="mt-3" onClick={() => { close(); s.action!.run(); }} testId={`guide-do-${s.id}`}>{s.action.label}</Button>}
                    </div>
                  </li>
                );
              })}
            </ol>
            <div className="mt-2 flex items-center justify-between gap-2 px-4">
              <TextButton onClick={() => { close(); useStore.getState().setUI({ newProjectOpen: true }); }}>Start something different</TextButton>
              <TextButton onClick={() => { close(); setMin(true); write(MIN, true); }} data-testid="guide-hide">Hide steps</TextButton>
            </div>
          </div>
        )}
      </Popover>
    </div>
  );
}
