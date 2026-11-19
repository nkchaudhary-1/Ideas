"use client";
import { useStore, getSlide } from "@/lib/store";
import { makeText } from "@/lib/factory";
import { TEXT_PRESETS, autoInk } from "@/lib/presets";
import { fontStack, loadFont } from "@/lib/fonts";
import { Section } from "@/components/ui/controls";

export default function TextPanel() {
  const st = useStore.getState;
  const add = (size: number, weight: number, text: string, name: string, family = "Inter", extra = {}) => {
    const sl = getSlide(st().project);
    const ink = autoInk(sl.background);
    const el = makeText({ text, fontSize: Math.round(size * (sl.width / 1080)), fontWeight: weight, fontFamily: family, fill: { type: "solid", color: ink }, name, width: sl.width * 0.7, ...extra }, sl.width * 0.15, sl.height * 0.4);
    void loadFont(family, weight, false);
    st().addElement(el);
    st().setUI({ editingTextId: el.id });
  };
  const addPreset = (id: string) => {
    const p = TEXT_PRESETS.find((x) => x.id === id)!;
    const sl = getSlide(st().project);
    const els = p.build(sl.width, sl.height, autoInk(sl.background));
    void loadFont(p.family, p.weight, !!p.italic);
    st().commit((pr) => { pr.slides.find((s) => s.id === pr.activeSlideId)!.elements.push(...(els as never[])); });
    st().select(els.map((e) => e.id));
  };
  return (
    <div className="h-full overflow-y-auto" data-testid="text-panel">
      <Section title="Add text">
        <button type="button" onClick={() => add(120, 700, "Heading", "Heading", "Inter")} data-testid="add-heading" className="block w-full rounded-md bg-panel2 px-3 py-2 text-left text-[22px] font-bold ring-1 ring-line hover:ring-accent/50">Add a heading</button>
        <button type="button" onClick={() => add(64, 600, "Subheading", "Subheading", "Inter")} data-testid="add-subheading" className="block w-full rounded-md bg-panel2 px-3 py-2 text-left text-base font-semibold ring-1 ring-line hover:ring-accent/50">Add a subheading</button>
        <button type="button" onClick={() => add(36, 400, "Body text goes here.", "Body", "Inter", { lineHeight: 1.4 })} data-testid="add-body" className="block w-full rounded-md bg-panel2 px-3 py-2 text-left text-sm ring-1 ring-line hover:ring-accent/50">Add body text</button>
        <button type="button" onClick={() => add(26, 300, "caption", "Caption", "Outfit", { letterSpacing: 2.6 })} data-testid="add-caption" className="block w-full rounded-md bg-panel2 px-3 py-2 text-left text-xs tracking-widest ring-1 ring-line hover:ring-accent/50" style={{ fontFamily: fontStack("Outfit"), fontWeight: 300 }}>Add a caption</button>
      </Section>
      <Section title="Typography presets">
        <div className="space-y-1.5">
          {TEXT_PRESETS.map((p) => (
            <button key={p.id} type="button" data-testid={`text-preset-${p.id}`} onMouseEnter={() => void loadFont(p.family, p.weight, !!p.italic)} onClick={() => addPreset(p.id)} className="flex w-full items-center justify-between gap-3 overflow-hidden rounded-md bg-panel2 px-3 py-2 text-left ring-1 ring-line hover:ring-accent/50">
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
