"use client";
import { useState } from "react";
import { Check, ClipboardPaste, Copy, Crop, FlipHorizontal2, FlipVertical2, RotateCcw, RotateCw, Scan, Sparkles, X } from "lucide-react";
import { useStore, getSlide } from "@/lib/store";
import { getAsset } from "@/lib/media";
import { Button, Chip, IconButton, Section, Slider, TextButton } from "@/components/ui/controls";
import Popover from "@/components/ui/Popover";
import { COPY_ITEMS, DEFAULT_COPY, captureEdit, clearMatch, matchToReference, mediaOf, pasteToSlides, resetGeometry, rotateBy, setAspect, type CopyId } from "@/lib/edit";
import { DEFAULT_MATCH, type MatchOpts } from "@/lib/match";
import type { EditTarget } from "./fill-target";


// ───────────────────────── crop & transform ─────────────────────────

const RATIOS: { label: string; r: number | null }[] = [
  { label: "Original", r: null }, { label: "1:1", r: 1 }, { label: "4:5", r: 4 / 5 }, { label: "3:4", r: 3 / 4 }, { label: "2:3", r: 2 / 3 },
  { label: "9:16", r: 9 / 16 }, { label: "4:3", r: 4 / 3 }, { label: "3:2", r: 3 / 2 }, { label: "16:9", r: 16 / 9 },
];

export function EditCrop({ target }: { target: EditTarget }) {
  const st = useStore.getState;
  const cropId = useStore((s) => s.ui.cropId);
  const cropping = cropId === target.elementId;
  const f = target.fill;
  const asset = getAsset(f.assetId);
  const rot = f.rotation90 === 90 || f.rotation90 === 270;
  const own = asset ? (rot ? asset.height / asset.width : asset.width / asset.height) : 1;
  const ar = target.slide.width / target.slide.height;
  const active = RATIOS.find((r) => Math.abs(ar - (r.r ?? own)) < 0.012)?.label ?? "";
  const ids = target.slideIds;
  return (
    <Section title="Crop & transform" defaultOpen>
      <div className="flex flex-wrap gap-2" data-testid="aspect-row" role="group" aria-label="Aspect ratio">
        {RATIOS.map((r) => (
          <Chip key={r.label} active={active === r.label} data-testid={`aspect-${r.label}`} onClick={() => setAspect(ids, r.r)}>{r.label}</Chip>
        ))}
      </div>
      <div className="flex flex-wrap gap-0.5">
        <Button variant={cropping ? "primary" : "default"} onClick={() => st().setUI({ cropId: cropping ? null : target.elementId })} testId="crop-toggle" title="Drag the picture inside the frame; scroll to zoom">
          <Crop size={12} /> {cropping ? "Done" : "Crop"}
        </Button>
        <Button variant="ghost" onClick={() => target.update((x) => { x.zoom = 1; x.fx = 0.5; x.fy = 0.5; })} title="Fill the frame, centred"><Scan size={12} /> Fill</Button>
        <Button variant="ghost" onClick={() => resetGeometry(ids)} testId="reset-crop" title="Back to the original crop, rotation and flip"><RotateCcw size={12} /> Reset</Button>
      </div>
      <Slider label="Zoom" testId="edit-zoom" value={Math.round(f.zoom * 100)} min={100} max={800} unit="%" neutral={100} onChange={(v) => target.update((x) => { x.zoom = v / 100; }, "zoom")} onReset={() => target.update((x) => { x.zoom = 1; })} />
      <div className="flex items-center gap-0.5">
        <IconButton icon={<RotateCcw size={15} />} label="Rotate left 90°" onClick={() => rotateBy(ids, -90)} testId="rotate-left" />
        <IconButton icon={<RotateCw size={15} />} label="Rotate right 90°" onClick={() => rotateBy(ids, 90)} testId="rotate-right" />
        <IconButton icon={<FlipHorizontal2 size={15} />} label="Flip horizontally" active={f.flipX} testId="flip-x" onClick={() => { const v = !f.flipX; target.update((x) => { x.flipX = v; }); }} />
        <IconButton icon={<FlipVertical2 size={15} />} label="Flip vertically" active={f.flipY} testId="flip-y" onClick={() => { const v = !f.flipY; target.update((x) => { x.flipY = v; }); }} />
      </div>
    </Section>
  );
}

// ───────────────────────── copy & paste settings ─────────────────────────

function Tick({ on, label, onClick, id }: { on: boolean; label: string; onClick: () => void; id: string }) {
  return (
    <button type="button" role="checkbox" aria-checked={on} data-testid={id} onClick={onClick} className="flex h-8 w-full items-center gap-3 rounded px-2 text-left text-xs hover:bg-field">
      <span className={`grid h-5 w-5 shrink-0 place-items-center rounded-in-20 border ${on ? "border-transparent grad-accent text-white" : "border-faint/60"}`}>{on && <Check size={11} strokeWidth={3} />}</span>
      {label}
    </button>
  );
}

function CopyPicker({ onCopy }: { onCopy: (ids: CopyId[]) => void }) {
  const [ids, setIds] = useState<CopyId[]>(DEFAULT_COPY);
  const toggle = (id: CopyId) => setIds((l) => (l.includes(id) ? l.filter((x) => x !== id) : [...l, id]));
  const groups = [...new Set(COPY_ITEMS.map((i) => i.group))];
  return (
    <div className="space-y-4" data-testid="copy-picker">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold">Copy which settings?</h3>
        <span className="-mr-3 flex items-center">
          <TextButton data-testid="copy-all" onClick={() => setIds(COPY_ITEMS.map((i) => i.id))}>All</TextButton>
          <TextButton data-testid="copy-none" onClick={() => setIds([])}>None</TextButton>
        </span>
      </div>
      {groups.map((g) => (
        <div key={g}>
          <div className="pb-1 text-2xs font-semibold text-faint">{g}</div>
          <div className={g === "Light" || g === "Colour" ? "grid grid-cols-2 gap-x-1" : ""}>
            {COPY_ITEMS.filter((i) => i.group === g).map((i) => <Tick key={i.id} id={`copy-${i.id}`} on={ids.includes(i.id)} label={i.label} onClick={() => toggle(i.id)} />)}
          </div>
        </div>
      ))}
      <Button variant="primary" className="w-full" disabled={!ids.length} testId="copy-confirm" onClick={() => onCopy(ids)}><Copy size={13} /> Copy {ids.length} setting{ids.length === 1 ? "" : "s"}</Button>
    </div>
  );
}

export function CopyPasteSection({ target }: { target: EditTarget }) {
  const st = useStore.getState;
  const clip = useStore((s) => s.editClip);
  const targets = target.slideIds.filter((id) => id !== clip?.sourceSlide);
  const canPaste = !!clip && targets.length > 0;
  const paste = () => {
    if (!clip) return;
    const n = pasteToSlides(target.slideIds, clip);
    if (n) st().toast(`Pasted ${clip.ids.length} setting${clip.ids.length === 1 ? "" : "s"} onto ${n} ${n === 1 ? "item" : "items"}`, "ok");
    else st().toast("Select a different photo or video to paste onto", "info");
  };
  return (
    <Section title="Copy & paste settings" defaultOpen={false}>
      <div className="flex gap-2">
        <Popover align="left" width={340} trigger={(open, toggle) => (
          <Button onClick={toggle} testId="copy-settings" className={open ? "ring-2 ring-ink/30" : ""}><Copy size={13} /> Copy settings…</Button>
        )}>
          {(close) => <CopyPicker onCopy={(ids) => { st().setEditClip(captureEdit(target.fill, getSlide(st().project), ids)); st().toast(`Copied ${ids.length} setting${ids.length === 1 ? "" : "s"} from “${target.slide.name}”`, "ok"); close(); }} />}
        </Popover>
        <Button variant={canPaste ? "primary" : "default"} disabled={!clip} onClick={paste} testId="paste-settings"><ClipboardPaste size={13} /> Paste{targets.length > 1 ? ` to ${targets.length}` : ""}</Button>
      </div>
      <p className="text-2xs leading-4 text-faint" data-testid="clip-note">
        {clip ? <>Copied {clip.ids.length} setting{clip.ids.length === 1 ? "" : "s"} from <b className="text-mute">{clip.name}</b>. Select other photos or videos in the strip, then paste. Pasted values stay editable.</> : "Copy the look of one photo, choose exactly what to copy, then paste it onto any others."}
      </p>
    </Section>
  );
}

// ───────────────────────── match look ─────────────────────────

const MATCH_CHIPS: { key: keyof MatchOpts; label: string; hint: string }[] = [
  { key: "tone", label: "Colour tone", hint: "Warmth and tint" },
  { key: "exposure", label: "Exposure", hint: "Overall brightness" },
  { key: "contrast", label: "Contrast", hint: "Tonal spread" },
  { key: "saturation", label: "Saturation", hint: "Colour strength" },
  { key: "shadowsHighlights", label: "Shadows & highlights", hint: "Dark and bright ends" },
  { key: "grading", label: "Reference grading", hint: "Carry over its colour mix, curves and grading" },
];

export function MatchSection({ target }: { target: EditTarget }) {
  const st = useStore.getState;
  const project = useStore((s) => s.project);
  const refId = useStore((s) => s.ui.refSlideId);
  const opts = useStore((s) => s.ui.matchOpts) ?? DEFAULT_MATCH;
  const [busy, setBusy] = useState(false);
  const refSlide = project.slides.find((s) => s.id === refId);
  const refFill = refSlide && mediaOf(refSlide)?.fill;
  const refAsset = refFill && getAsset(refFill.assetId);
  const isRef = refId === target.slideId;
  const targets = target.slideIds.filter((id) => id !== refId);
  const others = project.slides.filter((s) => s.id !== refId && mediaOf(s)).map((s) => s.id);
  const m = target.fill.match;

  const run = async (ids: string[], what: string) => {
    if (!refId || !ids.length) return;
    setBusy(true);
    try {
      const n = await matchToReference(refId, ids, opts, 100);
      st().toast(n ? `${what} matched to “${refSlide?.name}”` : "Nothing to match", n ? "ok" : "info");
    } finally { setBusy(false); }
  };
  const matchedIds = target.slideIds.filter((id) => { const sl = project.slides.find((s) => s.id === id); return !!(sl && mediaOf(sl)?.fill?.match); });

  return (
    <Section title="Match look" defaultOpen={project.slides.length > 1}>
      {!refSlide ? (
        <>
          <p className="text-2xs leading-4 text-faint">Choose one photo as the reference, edit it the way you like, then match the others to its colour and light.</p>
          <Button onClick={() => st().setUI({ refSlideId: target.slideId })} testId="set-reference"><Sparkles size={13} /> Use this as the reference</Button>
        </>
      ) : (
        <>
          <div className="flex items-center gap-3 rounded bg-field p-3" data-testid="reference-card">
            {refAsset ? <img src={refAsset.thumb} alt="" className="h-10 w-10 rounded object-cover" /> : <span className="h-10 w-10 rounded-in-20 bg-raised" />}
            <div className="min-w-0 flex-1">
              <div className="truncate text-xs font-semibold" title={refSlide.name}>{refSlide.name}</div>
              <div className="text-2xs text-mute">Reference</div>
            </div>
            {!isRef && <TextButton data-testid="change-reference" onClick={() => st().setUI({ refSlideId: target.slideId })}>Use current</TextButton>}
            <IconButton icon={<X size={14} />} label="Clear reference" size={28} testId="clear-reference" onClick={() => st().setUI({ refSlideId: null })} />
          </div>
          {isRef ? (
            <p className="text-2xs leading-4 text-faint">You're editing the reference. Select the photos to match in the strip below, then come back here.</p>
          ) : (
            <>
              <div className="flex flex-wrap gap-2" data-testid="match-options" role="group" aria-label="What to match">
                {MATCH_CHIPS.map((c) => (
                  <Chip key={c.key} soft active={opts[c.key]} title={c.hint} data-testid={`match-opt-${c.key}`} onClick={() => st().setUI({ matchOpts: { ...opts, [c.key]: !opts[c.key] } })}>{opts[c.key] && <Check size={12} strokeWidth={3} />}{c.label}</Chip>
                ))}
              </div>
              <div className="flex flex-wrap gap-2">
                <Button variant="primary" disabled={busy || !targets.length} onClick={() => run(targets, targets.length === 1 ? "Photo" : `${targets.length} items`)} testId="match-selected">
                  <Sparkles size={13} /> {busy ? "Matching…" : `Match ${targets.length > 1 ? `${targets.length} selected` : "this one"}`}
                </Button>
                {others.length > 1 && <Button disabled={busy} onClick={() => run(others, "Everything")} testId="match-all">Match all others</Button>}
              </div>
            </>
          )}
          {m && !isRef && (
            <>
              <Slider testId="match-intensity" label="Match intensity" value={Math.round(m.intensity)} min={0} max={100} unit="%" neutral={100}
                onChange={(v) => target.update((f) => { if (f.match) f.match.intensity = v; }, "match-int")} onReset={() => target.update((f) => { if (f.match) f.match.intensity = 100; })} />
              <div className="flex gap-2">
                <Button disabled={busy} onClick={() => run(matchedIds, "Updated")} testId="rematch" title="Match again against the reference's current edits">Update match</Button>
                <Button onClick={() => clearMatch(target.slideIds)} testId="remove-match">Remove match</Button>
              </div>
              <p className="text-2xs leading-4 text-faint">The match sits on top of this photo's own edits, so you can keep adjusting it by hand.</p>
            </>
          )}
        </>
      )}
    </Section>
  );
}
