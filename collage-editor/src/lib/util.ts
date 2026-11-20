export const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const round = (v: number, d = 0) => { const p = 10 ** d; return Math.round(v * p) / p; };

let counter = 0;
export function uid(prefix = "id"): string {
  counter = (counter + 1) % 1e6;
  return `${prefix}-${Date.now().toString(36)}${counter.toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

export function debounce<A extends unknown[]>(fn: (...a: A) => void, ms: number) {
  let t: ReturnType<typeof setTimeout> | undefined;
  const d = (...a: A) => { if (t) clearTimeout(t); t = setTimeout(() => fn(...a), ms); };
  d.cancel = () => t && clearTimeout(t);
  d.flush = (...a: A) => { if (t) clearTimeout(t); fn(...a); };
  return d;
}

export function formatTime(s: number): string {
  if (!isFinite(s)) return "0:00";
  const m = Math.floor(s / 60);
  const sec = s - m * 60;
  return `${m}:${sec < 10 ? "0" : ""}${sec.toFixed(1)}`;
}

export function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1048576) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / 1048576).toFixed(1)} MB`;
}

/** Where bundled static files (fonts, sample photos) live. "/" in the Next app, "" (relative) when the editor is embedded as a single page. */
export const assetUrl = (path: string) => `${(globalThis as { __ASSET_BASE__?: string }).__ASSET_BASE__ ?? "/"}${path}`;

interface ClaudeDownloads { save(r: { filename: string; data: Blob }): Promise<{ status: string }> }
export class SaveError extends Error { constructor(message: string, public code: string) { super(message); } }

/**
 * Hand a generated file to the user. In a plain browser this is an <a download>; inside a host that blocks
 * scripted downloads it goes through the host's `downloads` capability, which asks the viewer to confirm.
 */
export async function downloadBlob(blob: Blob, name: string): Promise<void> {
  const claude = (globalThis as { claude?: { use?: (n: string) => Promise<unknown> } }).claude;
  if (claude?.use) {
    const dl = (await claude.use("downloads").catch(() => null)) as ClaudeDownloads | null;
    if (dl) {
      try { await dl.save({ filename: name, data: blob }); }
      catch (e) {
        const err = e as { code?: string; message?: string };
        throw new SaveError(err.code === "declined" ? "Save cancelled." : err.code === "unavailable" ? "Saving files isn't available in this view. Open the editor in its own tab to export." : err.message || "The file couldn't be saved.", err.code ?? "failed");
      }
      return;
    }
  }
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}

export function slug(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "design";
}

export const isTypingTarget = (t: EventTarget | null) => {
  const el = t as HTMLElement | null;
  if (!el) return false;
  return el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.tagName === "SELECT" || el.isContentEditable;
};

/** a theme token ("--c-panel") as a CSS colour, for canvas drawing that can't use Tailwind classes */
export function cssColor(token: string, alpha = 1): string {
  const v = typeof document === "undefined" ? "" : getComputedStyle(document.documentElement).getPropertyValue(token).trim();
  return v ? `rgb(${v.split(/\s+/).join(" ")} / ${alpha})` : `rgba(128,128,128,${alpha})`;
}

/** show a Mac-style shortcut ("⇧⌘Z") the way the user's keyboard writes it ("Shift+Ctrl+Z" off a Mac) */
export const keys = (s: string): string => {
  if (typeof navigator === "undefined" || /Mac|iPhone|iPad/.test(navigator.platform)) return s;
  return s.replace(/⇧/g, "Shift+").replace(/⌥/g, "Alt+").replace(/⌘/g, "Ctrl+").replace(/⌫/g, "Backspace");
};

/** "1080 × 1350 px": the one way a size reads in a sentence or caption */
export const dims = (w: number, h: number): string => `${Math.round(w)} × ${Math.round(h)} px`;
