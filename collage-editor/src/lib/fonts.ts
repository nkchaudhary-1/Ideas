import data from "./font-data.json";
import { assetUrl } from "./util";

export interface FontDef { id: string; family: string; category: string; weights: number[]; italic: number[]; subsets: string[] }
export const FONTS: FontDef[] = data as FontDef[];
export const FONT_CATEGORIES = ["Sans Serif", "Serif", "Display", "Editorial", "Condensed", "Monospace", "Handwritten", "Script", "Experimental", "Devanagari"] as const;

const RANGES: Record<string, string> = {
  latin: "U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD",
  "latin-ext": "U+0100-02AF,U+0304,U+0308,U+0329,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20CF,U+2113,U+2C60-2C7F,U+A720-A7FF",
  devanagari: "U+0900-097F,U+1CD0-1CF9,U+200C-200D,U+20A8,U+20B9,U+25CC,U+A830-A839,U+A8E0-A8FF",
};

const byFamily = new Map(FONTS.map((f) => [f.family, f]));
export const fontByFamily = (family: string) => byFamily.get(family);

const loaded = new Map<string, Promise<void>>();
const listeners = new Set<() => void>();
export const onFontsLoaded = (fn: () => void) => { listeners.add(fn); return () => { listeners.delete(fn); }; };

/** nearest available weight for a font (so "bold" on a one-weight font still renders) */
export function nearestWeight(f: FontDef | undefined, w: number, italic: boolean): { weight: number; italic: boolean } {
  if (!f) return { weight: w, italic };
  const useItalic = italic && f.italic.length > 0;
  const pool = useItalic ? f.italic : f.weights;
  const weight = pool.reduce((best, x) => (Math.abs(x - w) < Math.abs(best - w) ? x : best), pool[0]);
  return { weight, italic: useItalic };
}

export function loadFont(family: string, weight = 400, italic = false): Promise<void> {
  const f = fontByFamily(family);
  if (!f || typeof document === "undefined") return Promise.resolve();
  const { weight: w, italic: it } = nearestWeight(f, weight, italic);
  const key = `${f.id}|${w}|${it}`;
  const hit = loaded.get(key);
  if (hit) return hit;
  const style = it ? "italic" : "normal";
  const p = Promise.all(
    f.subsets.map(async (sub) => {
      const file = `fonts/${f.id}-${sub}-${w}-${style}.woff2`;
      const desc = { weight: String(w), style, unicodeRange: RANGES[sub], display: "swap" } as FontFaceDescriptors;
      try {
        // fetch the bytes ourselves: a FontFace built from data isn't subject to the page's font-src policy
        const res = await fetch(assetUrl(file));
        if (!res.ok) return; // a missing subset just falls back
        const face = new FontFace(f.family, await res.arrayBuffer(), desc);
        await face.load();
        document.fonts.add(face);
      } catch {
        try {
          const face = new FontFace(f.family, `url(${assetUrl(file)}) format("woff2")`, desc);
          await face.load();
          document.fonts.add(face);
        } catch { /* falls back */ }
      }
    }),
  ).then(() => { listeners.forEach((l) => l()); });
  loaded.set(key, p);
  return p;
}

export function fontStack(family: string): string {
  const f = fontByFamily(family);
  const generic = f && ["Serif", "Editorial"].includes(f.category) ? "serif" : f?.category === "Monospace" ? "monospace" : f && ["Handwritten", "Script"].includes(f.category) ? "cursive" : "sans-serif";
  return `"${family}", "Noto Sans Devanagari", "Nirmala UI", ${generic}`;
}

export function preloadFonts(list: { family: string; weight?: number; italic?: boolean }[]) {
  return Promise.all(list.map((x) => loadFont(x.family, x.weight ?? 400, x.italic ?? false)));
}
