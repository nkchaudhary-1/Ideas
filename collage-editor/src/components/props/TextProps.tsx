"use client";
import { AlignCenter, AlignJustify, AlignLeft, AlignRight, Bold, Italic, Strikethrough, Underline } from "lucide-react";
import type { TextEl } from "@/lib/types";
import { useStore, getSlide } from "@/lib/store";
import { SavePreset } from "@/components/ui/SavePreset";
import { captureTextStyle, defaultName } from "@/lib/user-presets";
import { fontByFamily, loadFont } from "@/lib/fonts";
import { ColorField } from "@/components/ui/ColorPicker";
import { Field, IconButton, Section, Segmented, Select, Slider, Toggle } from "@/components/ui/controls";
import { FontPicker, PaintField, ShadowField, StrokeField } from "./StyleControls";

export default function TextProps({ el }: { el: TextEl }) {
  const st = useStore.getState;
  const set = (fn: (e: TextEl) => void, key?: string) => st().updateElement(el.id, (e) => fn(e as TextEl), { key });
  const f = fontByFamily(el.fontFamily);
  const weights = f?.weights ?? [400, 700];
  const canItalic = !!f?.italic.length;
  const bold = el.fontWeight >= 600;
  const toggleBold = () => {
    const target = bold ? 400 : 700;
    const nw = weights.reduce((b, w) => (Math.abs(w - target) < Math.abs(b - target) ? w : b), weights[0]);
    set((e) => { e.fontWeight = nw; });
    void loadFont(el.fontFamily, nw, el.italic);
  };

  return (
    <>
      <Section title="Text">
        <textarea
          value={el.text}
          rows={3}
          data-testid="text-content"
          onChange={(e) => set((t) => { t.text = e.target.value; }, "text-" + el.id)}
          onKeyDown={(e) => e.stopPropagation()}
          className="w-full resize-none rounded-md bg-panel2 p-2 text-xs text-ink outline-none ring-1 ring-line focus:ring-accent/70"
        />
        <FontPicker family={el.fontFamily} onChange={(fam) => { const ff = fontByFamily(fam); const w = ff?.weights.reduce((b, x) => (Math.abs(x - el.fontWeight) < Math.abs(b - el.fontWeight) ? x : b), ff.weights[0]) ?? el.fontWeight; void loadFont(fam, w, false); set((e) => { e.fontFamily = fam; e.fontWeight = w; if (!ff?.italic.length) e.italic = false; }); }} />
        <Field label="Size">
          <Slider label="" value={Math.round(el.fontSize)} min={8} max={400} unit="px" onChange={(v) => set((e) => { e.fontSize = v; }, "fs")} />
        </Field>
        <Field label="Weight">
          <Select width={96} value={String(el.fontWeight)} options={weights.map((w) => ({ value: String(w), label: weightName(w) }))} onChange={(v) => { set((e) => { e.fontWeight = +v; }); void loadFont(el.fontFamily, +v, el.italic); }} />
        </Field>
        <div className="flex items-center gap-0.5">
          <IconButton icon={<Bold size={15} />} label="Bold" active={bold} onClick={toggleBold} />
          <IconButton icon={<Italic size={15} />} label={canItalic ? "Italic" : "Italic (not available for this font)"} active={el.italic} disabled={!canItalic} onClick={() => { set((e) => { e.italic = !el.italic; }); void loadFont(el.fontFamily, el.fontWeight, !el.italic); }} />
          <IconButton icon={<Underline size={15} />} label="Underline" active={el.underline} onClick={() => set((e) => { e.underline = !el.underline; })} />
          <IconButton icon={<Strikethrough size={15} />} label="Strikethrough" active={el.strike} onClick={() => set((e) => { e.strike = !el.strike; })} />
          <span className="mx-1 h-4 w-px bg-line" />
          <IconButton icon={<AlignLeft size={15} />} label="Align left" active={el.align === "left"} onClick={() => set((e) => { e.align = "left"; })} />
          <IconButton icon={<AlignCenter size={15} />} label="Align centre" active={el.align === "center"} onClick={() => set((e) => { e.align = "center"; })} />
          <IconButton icon={<AlignRight size={15} />} label="Align right" active={el.align === "right"} onClick={() => set((e) => { e.align = "right"; })} />
          <IconButton icon={<AlignJustify size={15} />} label="Justify" active={el.align === "justify"} onClick={() => set((e) => { e.align = "justify"; })} />
        </div>
        <Field label="Case">
          <Segmented size="sm" value={el.textTransform} options={[{ value: "none", label: "Aa" }, { value: "uppercase", label: "AA" }, { value: "lowercase", label: "aa" }, { value: "capitalize", label: "Ab" }]} onChange={(v) => set((e) => { e.textTransform = v; })} />
        </Field>
              <SavePreset label="Save as text style" testId="save-text-style" placeholder="Style name" defaultName={() => defaultName(useStore.getState().presets, "text")}
          onSave={(name) => { const sl = getSlide(st().project); st().addPreset({ kind: "text", name, data: captureTextStyle(el, sl) }); st().toast(`Saved style “${name}”`, "ok"); }} />
      </Section>

      <Section title="Spacing">
        <Slider label="Line height" value={+el.lineHeight.toFixed(2)} min={0.6} max={3} step={0.01} neutral={1.15} onChange={(v) => set((e) => { e.lineHeight = v; }, "lh")} onReset={() => set((e) => { e.lineHeight = 1.15; })} />
        <Slider label="Letter" value={+el.letterSpacing.toFixed(1)} min={-10} max={80} step={0.1} unit="px" onChange={(v) => set((e) => { e.letterSpacing = v; }, "ls")} onReset={() => set((e) => { e.letterSpacing = 0; })} />
        <Slider label="Padding" value={Math.round(el.padding)} min={0} max={120} unit="px" onChange={(v) => set((e) => { e.padding = v; }, "pad")} onReset={() => set((e) => { e.padding = 0; })} />
        <Toggle label="Auto height" value={el.autoHeight} onChange={(v) => set((e) => { e.autoHeight = v; })} />
        {!el.autoHeight && <Field label="Vertical"><Segmented size="sm" value={el.vAlign} options={[{ value: "top", label: "Top" }, { value: "middle", label: "Middle" }, { value: "bottom", label: "Bottom" }]} onChange={(v) => set((e) => { e.vAlign = v; })} /></Field>}
        <p className="text-2xs leading-4 text-faint">Word spacing is not supported yet; use letter spacing and text boxes for rhythm.</p>
      </Section>

      <Section title="Colour & effects">
        <PaintField label="Colour" paint={el.fill} onChange={(p) => p && set((e) => { e.fill = p; }, "fill")} />
        <StrokeField label="Outline" stroke={el.stroke} onChange={(s) => set((e) => { e.stroke = s; })} max={24} />
        <ShadowField shadow={el.shadow} onChange={(s) => set((e) => { e.shadow = s; })} />
        <Field label="Highlight"><Toggle label={el.background ? "On" : "Off"} value={!!el.background} onChange={(v) => set((e) => { e.background = v ? { color: "#e5ff65", radius: 8 } : null; if (v && e.padding < 8) e.padding = 12; })} /></Field>
        {el.background && (
          <>
            <Field label=""><span className="w-[72px]" /><ColorField value={el.background.color} alpha onChange={(c) => set((e) => { if (e.background) e.background.color = c; }, "bgc")} /></Field>
            <Slider label="Corner" value={el.background.radius} min={0} max={80} onChange={(v) => set((e) => { if (e.background) e.background.radius = v; }, "bgr")} />
          </>
        )}
      </Section>
    </>
  );
}

function weightName(w: number) {
  return ({ 100: "Thin", 200: "Extra light", 300: "Light", 400: "Regular", 500: "Medium", 600: "Semibold", 700: "Bold", 800: "Extra bold", 900: "Black" } as Record<number, string>)[w] ?? String(w);
}
