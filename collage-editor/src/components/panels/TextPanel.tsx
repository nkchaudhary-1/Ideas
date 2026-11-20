"use client";
import { useStore, getSlide } from "@/lib/store";
import { makeText } from "@/lib/factory";
import { TEXT_PRESETS, inkFor } from "@/lib/presets";
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
  const add = (size: number, weight: number, text: string, name: string, family = "Inter", extra = {}) => {
    const sl = getSlide(st().project);
    const ink = inkFor(sl);
    const el = makeText({ text, fontSize: Math.round(size * (sl.width / 1080)), fontWeight: weight, fontFamily: family, fill: { type: "solid", color: ink }, name, width: sl.width * 0.7, ...extra }, sl.width * 0.15, sl.height * 0.4);
    void loadFont(family, weight, false);
    st().addElement(el);
    st().setUI({ editingTextId: el.id });
  };
  const addPreset = (id: string) => {
    const p = TEXT_PRESETS.find((x) => x.id === id)!;
    const sl = getSlide(st().project);
    const els = p.build(sl.width, sl.height, inkFor(sl));
    void loadFont(p.family, p.weight, !!p.italic);
    st().commit((pr) => { pr.slides.find((s) => s.id === pr.activeSlideId)!.elements.push(...(els as never[])); });
    st().select(els.map((e) => e.id));
  };
  return (
    <div className="h-full overflow-y-auto" data-testid="text-panel">
      <Section title="Add text">
        <button type="button" onClick={() => add(120, 700, "Heading", "Heading", "Inter")} data-testid="add-heading" className="block w-full rounded-2xl bg-field px-4 py-3.5 text-left text-[22px] font-bold ring-1 ring-line hover:ring-ink/25">Add a heading</button>
        <button type="button" onClick={() => add(64, 600, "Subheading", "Subheading", "Inter")} data-testid="add-subheading" className="block w-full rounded-2xl bg-field px-4 py-3.5 text-left text-base font-semibold ring-1 ring-line hover:ring-ink/25">Add a subheading</button>
        <button type="button" onClick={() => add(36, 400, "Body text goes here.", "Body", "Inter", { lineHeight: 1.4 })} data-testid="add-body" className="block w-full rounded-2xl bg-field px-4 py-3.5 text-left text-sm ring-1 ring-line hover:ring-ink/25">Add body text</button>
        <button type="button" onClick={() => add(26, 300, "caption", "Caption", "Outfit", { letterSpacing: 2.6 })} data-testid="add-caption" className="block w-full rounded-2xl bg-field px-4 py-3.5 text-left text-xs tracking-widest ring-1 ring-line hover:ring-ink/25" style={{ fontFamily: fontStack("Outfit"), fontWeight: 300 }}>Add a caption</button>
      </Section>
      <Section title="My styles">
        {styles.length > 0 ? (
          <div className="space-y-2.5" data-testid="my-styles">
            {styles.map((p) => {
              if (p.kind !== "text") return null;
              const d = p.data;
              const ink = d.fill.type === "solid" ? d.fill.color : "#ffffff";
              return (
                <div key={p.id} className="group relative" data-testid="style-tile">
                  <button type="button" title="Click to apply to the selected text, or add new text in this style" onMouseEnter={() => void loadFont(d.fontFamily, d.fontWeight, d.italic)} onClick={() => st().applyTextStyle(p.id)}
                    className="flex w-full items-center gap-3.5 overflow-hidden rounded-2xl bg-field p-2 pr-4 text-left hover:ring-2 hover:ring-ink/25">
                    <span className="grid h-11 w-14 shrink-0 place-items-center overflow-hidden rounded-lg text-[22px] leading-none" style={{ background: previewBg(ink), color: ink, fontFamily: fontStack(d.fontFamily), fontWeight: d.fontWeight, fontStyle: d.italic ? "italic" : "normal", textTransform: d.textTransform }}>Aa</span>
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
        <div className="space-y-2.5">
          {TEXT_PRESETS.map((p) => (
            <button key={p.id} type="button" data-testid={`text-preset-${p.id}`} onMouseEnter={() => void loadFont(p.family, p.weight, !!p.italic)} onClick={() => addPreset(p.id)} className="flex w-full items-center justify-between gap-3 overflow-hidden rounded-2xl bg-field px-4 py-3 text-left hover:ring-2 hover:ring-ink/25">
              <span className="min-w-0 truncate text-[20px] leading-tight" style={{ fontFamily: fontStack(p.family), fontWeight: p.weight, fontStyle: p.italic ? "italic" : "normal" }}>{p.sample.split("\n")[0]}</span>
              <span className="shrink-0 text-2xs text-mute">{p.name}</span>
            </button>
          ))}
        </div>
        <p className="text-2xs leading-4 text-faint">Presets create live text you can restyle. The last six come straight from your Figma posts.</p>
      </Section>
    </div>
  );
}
