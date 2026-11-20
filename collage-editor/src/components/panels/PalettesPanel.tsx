"use client";
import { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { useStore, useSelectedElements, getSlide } from "@/lib/store";
import { PALETTES, dominantColors } from "@/lib/colors";
import { flatten } from "@/lib/geometry";
import { peekImage, getAsset } from "@/lib/media";
import { Section, Segmented, Button } from "@/components/ui/controls";

type Target = "fill" | "stroke" | "background";
const LS = "collage-studio:palettes";

export default function PalettesPanel() {
  const st = useStore.getState;
  const els = useSelectedElements();
  const slide = useStore((s) => getSlide(s.project));
  const [target, setTarget] = useState<Target>("fill");
  const [saved, setSaved] = useState<{ name: string; colors: string[] }[]>([]);
  const [photo, setPhoto] = useState<string[]>([]);
  const [photoName, setPhotoName] = useState("");

  useEffect(() => { try { setSaved(JSON.parse(localStorage.getItem(LS) || "[]")); } catch { /* ignore */ } }, []);
  const persist = (p: typeof saved) => { setSaved(p); try { localStorage.setItem(LS, JSON.stringify(p)); } catch { /* ignore */ } };

  const apply = (c: string) => {
    st().addRecentColor(c);
    if (target === "background" || els.length === 0) { st().setBackground({ type: "solid", color: c }); return; }
    st().updateElements(els.map((e) => e.id), (e) => {
      if (target === "fill") {
        if (e.type === "text") e.fill = { type: "solid", color: c };
        else if (e.type === "shape") e.fill = { type: "solid", color: c };
        else if (e.type === "image" || e.type === "video") e.bg = c;
        else if (e.type === "grid") e.cellBg = c;
      } else {
        if (e.type === "text" || e.type === "shape" || e.type === "image" || e.type === "video") {
          const cur = (e as { stroke: { color: string; width: number } | null }).stroke;
          (e as { stroke: { color: string; width: number } | null }).stroke = { color: c, width: cur?.width ?? 4 };
        } else if (e.type === "grid") e.cellStroke = { color: c, width: e.cellStroke?.width ?? 4 };
      }
    });
  };

  const extract = () => {
    const med = flatten(slide.elements).flatMap((e) => (e.type === "image" && e.fill?.assetId ? [e.fill.assetId] : []));
    const id = med.find((m) => getAsset(m)?.kind === "image") ?? useStore.getState().assets.find((a) => a.kind === "image")?.id;
    if (!id) { st().toast("Add a photo first", "info"); return; }
    const src = peekImage(id, "preview");
    if (!src) { st().toast("Photo is still loading, try again in a moment", "info"); return; }
    setPhoto(dominantColors(src.img, src.w, src.h, 8));
    setPhotoName(getAsset(id)?.name ?? "photo");
  };

  return (
    <div className="h-full overflow-y-auto" data-testid="palettes-panel">
      <div className="space-y-3 px-6 pb-5">
        <div className="text-xs text-mute">{els.length ? `Apply to ${els.length} selected` : "Nothing selected: colours set the background"}</div>
        <Segmented value={target} options={[{ value: "fill", label: "Fill / text" }, { value: "stroke", label: "Border" }, { value: "background", label: "Background" }]} onChange={setTarget} />
      </div>
      <Section title="From a photo">
        <Button onClick={extract} testId="extract-palette">Extract colours from a photo</Button>
        {photo.length > 0 && (
          <>
            <div className="text-2xs text-faint">{photoName}</div>
            <div className="flex flex-wrap gap-2.5">{photo.map((c) => <button key={c} type="button" title={c} onClick={() => apply(c)} className="h-8 w-8 rounded-md border border-ink/15" style={{ background: c }} />)}</div>
            <Button variant="ghost" onClick={() => persist([{ name: `From ${photoName}`, colors: photo }, ...saved].slice(0, 12))}><Plus size={12} /> Save palette</Button>
          </>
        )}
      </Section>
      {saved.length > 0 && (
        <Section title="Saved palettes">
          {saved.map((p, i) => (
            <div key={i} className="space-y-1">
              <div className="flex items-center justify-between text-2xs text-faint"><span>{p.name}</span><button type="button" aria-label="Delete palette" onClick={() => persist(saved.filter((_, j) => j !== i))} className="hover:text-red-300"><Trash2 size={10} /></button></div>
              <div className="flex flex-wrap gap-2">{p.colors.map((c) => <button key={c} type="button" onClick={() => apply(c)} className="h-6 w-6 rounded border border-ink/15" style={{ background: c }} />)}</div>
            </div>
          ))}
        </Section>
      )}
      {PALETTES.map((p) => (
        <Section key={p.name} title={p.name} defaultOpen={p.name === "From your posts"}>
          <div className="flex flex-wrap gap-2.5">{p.colors.map((c) => <button key={c} type="button" title={c} data-testid={`swatch-${c.slice(1)}`} onClick={() => apply(c)} className="h-8 w-8 rounded-md border border-ink/15" style={{ background: c }} />)}</div>
        </Section>
      ))}
    </div>
  );
}
