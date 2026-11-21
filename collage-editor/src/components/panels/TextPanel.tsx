"use client";
import { useStore } from "@/lib/store";
import { placeElements, startDrag, endDrag, type ElementsItem } from "@/lib/drop";
import { makeText } from "@/lib/factory";
import { TEXT_PRESETS } from "@/lib/presets";
import { fontStack, loadFont } from "@/lib/fonts";
import { useState } from "react";
import { Section } from "@/components/ui/controls";
import { PresetActions, RenameLabel } from "@/components/ui/SavePreset";
import { previewBg } from "@/lib/user-presets";

export default function TextPanel() {
  const st = useStore.getState;
  const presets = useStore((s) => s.presets);
  const [renaming, setRenaming] = useState<string | null>(null);
  const styles = presets.filter((p) => p.kind === "text");
  const plain = (size: number, weight: number, text: string, name: string, family = "Inter", extra = {}): ElementsItem => ({
    kind: "elements",
    // sized for the slide it lands on: a panorama slide is 1080 wide, so the text matches the slide, not the whole strip
    build: (w, h, ink) => [makeText({ text, fontSize: Math.round(size * (w / 1080)), fontWeight: weight, fontFamily: family, fill: { type: "solid", color: ink }, name, width: w * 0.7, ...extra }, w * 0.15, h * 0.4)],
    after: (els) => { void loadFont(family, weight, false); st().setUI({ editingTextId: els[0].id }); },
  });
  const preset = (id: string): ElementsItem => {
    const p = TEXT_PRESETS.find((x) => x.id === id)!;
    return { kind: "elements", build: (w, h, ink) => p.build(w, h, ink), after: () => { void loadFont(p.family, p.weight, !!p.italic); } };
  };
  const drag = (it: ElementsItem) => ({ draggable: true, onDragStart: (e: React.DragEvent) => startDrag(e, it), onDragEnd: endDrag, onClick: () => placeElements(it) });
  return (
    <div className="h-full overflow-y-auto" data-testid="text-panel">
      <Section title="Add text">
        <button type="button" {...drag(plain(120, 700, "Heading", "Heading", "Inter"))} data-testid="add-heading" className="flex h-16 w-full items-center rounded bg-field px-4 text-left text-[22px] font-bold ring-1 ring-line hover:ring-ink/25">Add a heading</button>
        <button type="button" {...drag(plain(64, 600, "Subheading", "Subheading", "Inter"))} data-testid="add-subheading" className="flex h-14 w-full items-center rounded bg-field px-4 text-left text-base font-semibold ring-1 ring-line hover:ring-ink/25">Add a subheading</button>
        <button type="button" {...drag(plain(36, 400, "Body text goes here.", "Body", "Inter", { lineHeight: 1.4 }))} data-testid="add-body" className="flex h-12 w-full items-center rounded bg-field px-4 text-left text-sm ring-1 ring-line hover:ring-ink/25">Add body text</button>
        <button type="button" {...drag(plain(26, 300, "caption", "Caption", "Outfit", { letterSpacing: 2.6 }))} data-testid="add-caption" className="flex h-12 w-full items-center rounded bg-field px-4 text-left text-xs tracking-widest ring-1 ring-line hover:ring-ink/25" style={{ fontFamily: fontStack("Outfit"), fontWeight: 300 }}>Add a caption</button>
      </Section>
      <Section title="My styles">
        {styles.length > 0 ? (
          <div className="space-y-3" data-testid="my-styles">
            {styles.map((p) => {
              if (p.kind !== "text") return null;
              const d = p.data;
              const ink = d.fill.type === "solid" ? d.fill.color : "#ffffff";
              return (
                <div key={p.id} className="group relative" data-testid="style-tile">
                  <button type="button" title="Click to apply to the selected text, or add new text in this style" onMouseEnter={() => void loadFont(d.fontFamily, d.fontWeight, d.italic)} onClick={() => st().applyTextStyle(p.id)}
                    className="flex w-full items-center gap-4 overflow-hidden rounded-in-12 bg-field p-2 pr-4 text-left hover:ring-2 hover:ring-ink/25">
                    <span className="grid h-11 w-14 shrink-0 place-items-center overflow-hidden rounded-in-20 text-[22px] leading-none" style={{ background: previewBg(ink), color: ink, fontFamily: fontStack(d.fontFamily), fontWeight: d.fontWeight, fontStyle: d.italic ? "italic" : "normal", textTransform: d.textTransform }}>Aa</span>
                    <span className="min-w-0 flex-1">
                      <RenameLabel id={p.id} name={p.name} editing={renaming === p.id} setEditing={(v) => setRenaming(v ? p.id : null)} className="block text-xs font-bold text-ink" />
                      <span className="block truncate text-2xs text-mute">{d.fontFamily} · {d.fontWeight}</span>
                    </span>
                  </button>
                  <PresetActions id={p.id} name={p.name} onRename={() => setRenaming(p.id)} />
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-2xs leading-4 text-faint">Style a text layer, then choose “Save as text style” in its properties. Your styles appear here.</p>
        )}
      </Section>
      <Section title="Typography presets">
        <div className="space-y-3">
          {TEXT_PRESETS.map((p) => (
            <button key={p.id} type="button" data-testid={`text-preset-${p.id}`} onMouseEnter={() => void loadFont(p.family, p.weight, !!p.italic)} {...drag(preset(p.id))} className="flex h-12 w-full items-center justify-between gap-3 overflow-hidden rounded bg-field px-4 text-left hover:ring-2 hover:ring-ink/25">
              <span title={p.sample.split("\n")[0]} className="min-w-0 truncate text-[20px] leading-tight" style={{ fontFamily: fontStack(p.family), fontWeight: p.weight, fontStyle: p.italic ? "italic" : "normal" }}>{p.sample.split("\n")[0]}</span>
              <span className="shrink-0 text-2xs text-mute">{p.name}</span>
            </button>
          ))}
        </div>
        <p className="text-2xs leading-4 text-faint">Presets add live text you can restyle at any time.</p>
      </Section>
    </div>
  );
}
