import type { Asset, MediaFill } from "./types";
import { dbAll, dbDelete, dbGet, dbPut } from "./db";
import { fillEffective, isNeutral, adjustmentsKey, renderAdjusted } from "./filters";
import { uid, clamp } from "./util";

/**
 * Media manager: import, decode, cache.
 * - Originals are stored untouched in IndexedDB. Images also get a 2048 px preview for fast editing.
 * - Videos stay videos: the original Blob is kept, an <video> element plays it, nothing is flattened.
 */

export const IMAGE_EXT = ["jpg", "jpeg", "png", "webp"];
export const VIDEO_EXT = ["mp4", "mov", "webm", "m4v"];
export const ACCEPT = ".jpg,.jpeg,.png,.webp,.mp4,.mov,.webm,.m4v,image/jpeg,image/png,image/webp,video/mp4,video/quicktime,video/webm";

export type MediaKind = "image" | "video";

export function classify(file: File): MediaKind | null {
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  if (file.type.startsWith("image/") && ["image/jpeg", "image/png", "image/webp"].includes(file.type)) return "image";
  if (file.type.startsWith("video/")) return "video";
  if (IMAGE_EXT.includes(ext)) return "image";
  if (VIDEO_EXT.includes(ext)) return "video";
  return null;
}

export interface ImportResult { assets: Asset[]; rejected: { name: string; reason: string }[] }

// ───────────────────────── change notification ─────────────────────────

const subs = new Set<() => void>();
let version = 0;
export const mediaVersion = () => version;
export const subscribeMedia = (fn: () => void) => { subs.add(fn); return () => { subs.delete(fn); }; };
const bump = () => { version++; subs.forEach((f) => f()); };

// ───────────────────────── asset registry ─────────────────────────

const assets = new Map<string, Asset>();
export const getAsset = (id: string | null | undefined) => (id ? assets.get(id) : undefined);
export const allAssets = () => [...assets.values()].sort((a, b) => b.createdAt - a.createdAt);

export async function loadAssets(): Promise<Asset[]> {
  const list = await dbAll<Asset>("assets");
  for (const a of list) assets.set(a.id, a);
  bump();
  return allAssets();
}

export async function removeAsset(id: string) {
  assets.delete(id);
  imageCache.delete(`${id}|preview`);
  imageCache.delete(`${id}|original`);
  const u = videoUrls.get(id);
  if (u) URL.revokeObjectURL(u);
  videoUrls.delete(id);
  await Promise.all([dbDelete("assets", id), dbDelete("blobs", `${id}:original`), dbDelete("blobs", `${id}:preview`)]);
  bump();
}

// ───────────────────────── import ─────────────────────────

function canvasBlob(cv: HTMLCanvasElement, type: string, q?: number): Promise<Blob> {
  return new Promise((res, rej) => cv.toBlob((b) => (b ? res(b) : rej(new Error("encode failed"))), type, q));
}

async function decodeImage(blob: Blob): Promise<ImageBitmap> {
  try {
    return await createImageBitmap(blob, { imageOrientation: "from-image" });
  } catch {
    return await createImageBitmap(blob);
  }
}

function drawThumb(src: CanvasImageSource, w: number, h: number, max = 240): string {
  const k = Math.min(1, max / Math.max(w, h));
  const cv = document.createElement("canvas");
  cv.width = Math.max(1, Math.round(w * k));
  cv.height = Math.max(1, Math.round(h * k));
  cv.getContext("2d")!.drawImage(src, 0, 0, cv.width, cv.height);
  return cv.toDataURL("image/jpeg", 0.72);
}

async function importImage(file: File): Promise<Asset> {
  const bmp = await decodeImage(file);
  const w = bmp.width, h = bmp.height;
  const k = Math.min(1, 2048 / Math.max(w, h));
  const cv = document.createElement("canvas");
  cv.width = Math.round(w * k);
  cv.height = Math.round(h * k);
  const ctx = cv.getContext("2d")!;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(bmp, 0, 0, cv.width, cv.height);
  const keepAlpha = file.type === "image/png" || file.type === "image/webp";
  const preview = await canvasBlob(cv, keepAlpha ? "image/png" : "image/jpeg", 0.9);
  const asset: Asset = {
    id: uid("img"),
    kind: "image",
    name: file.name,
    mime: file.type || "image/jpeg",
    size: file.size,
    width: w,
    height: h,
    createdAt: Date.now(),
    thumb: drawThumb(bmp, w, h),
    status: "ready",
  };
  bmp.close?.();
  await Promise.all([dbPut("blobs", `${asset.id}:original`, file), dbPut("blobs", `${asset.id}:preview`, preview)]);
  originalBlobs.set(asset.id, file);
  previewBlobs.set(asset.id, preview);
  return asset;
}

function unsupportedVideoNote(file: File): string {
  const ext = file.name.split(".").pop()?.toLowerCase();
  const hevc = ext === "mov" || ext === "mp4" || ext === "m4v";
  return (
    (hevc
      ? "This browser can't decode the video track (often HEVC/H.265 from an iPhone). "
      : "This video format isn't supported by your browser. ") +
    "Convert it to H.264 MP4 and import again, e.g. ffmpeg -i input.mov -c:v libx264 -c:a aac output.mp4" +
    (hevc ? " (Safari can play HEVC; Chrome/Edge usually cannot)." : ".")
  );
}

async function importVideo(file: File): Promise<Asset> {
  const url = URL.createObjectURL(file);
  try {
    const v = document.createElement("video");
    v.preload = "auto";
    v.muted = true;
    v.playsInline = true;
    v.src = url;
    await new Promise<void>((res, rej) => {
      const t = setTimeout(() => rej(new Error("timeout")), 20000);
      v.onloadeddata = () => { clearTimeout(t); res(); };
      v.onerror = () => { clearTimeout(t); rej(new Error("decode")); };
    });
    if (!v.videoWidth || !v.videoHeight) throw new Error("decode");
    const duration = v.duration;
    // poster: a frame slightly in, so black fade-ins don't become the thumbnail
    const t0 = isFinite(duration) ? Math.min(0.2, duration / 2) : 0;
    if (t0 > 0) {
      v.currentTime = t0;
      await new Promise<void>((res) => { v.onseeked = () => res(); setTimeout(res, 2500); });
    }
    const asset: Asset = {
      id: uid("vid"),
      kind: "video",
      name: file.name,
      mime: file.type || "video/mp4",
      size: file.size,
      width: v.videoWidth,
      height: v.videoHeight,
      duration,
      createdAt: Date.now(),
      thumb: drawThumb(v, v.videoWidth, v.videoHeight),
      status: "ready",
      hasAudio: audioHint(v),
    };
    await dbPut("blobs", `${asset.id}:original`, file);
    originalBlobs.set(asset.id, file);
    return asset;
  } finally {
    URL.revokeObjectURL(url);
  }
}

function audioHint(v: HTMLVideoElement): boolean | undefined {
  const anyv = v as unknown as { mozHasAudio?: boolean; audioTracks?: { length: number } };
  if (typeof anyv.mozHasAudio === "boolean") return anyv.mozHasAudio;
  if (anyv.audioTracks) return anyv.audioTracks.length > 0;
  return undefined;
}

export async function importFiles(files: File[]): Promise<ImportResult> {
  const out: ImportResult = { assets: [], rejected: [] };
  for (const file of files) {
    const kind = classify(file);
    if (!kind) {
      const ext = file.name.split(".").pop()?.toLowerCase();
      out.rejected.push({
        name: file.name,
        reason: ext === "heic" || ext === "heif"
          ? "HEIC isn't supported by browsers. Export the photo as JPG from Photos, or convert it, then import again."
          : "Unsupported file type. Use JPG, PNG, WebP, MP4, MOV or WebM.",
      });
      continue;
    }
    try {
      const asset = kind === "image" ? await importImage(file) : await importVideo(file);
      assets.set(asset.id, asset);
      await dbPut("assets", asset.id, asset);
      out.assets.push(asset);
    } catch (e) {
      out.rejected.push({
        name: file.name,
        reason: kind === "video" ? unsupportedVideoNote(file) : "This image couldn't be decoded. It may be corrupt or use an unsupported encoding.",
      });
    }
  }
  bump();
  return out;
}

export async function importUrls(urls: { url: string; name: string }[]): Promise<ImportResult> {
  const files: File[] = [];
  for (const u of urls) {
    const res = await fetch(u.url);
    const blob = await res.blob();
    files.push(new File([blob], u.name, { type: blob.type }));
  }
  return importFiles(files);
}

// ───────────────────────── blobs + decoded sources ─────────────────────────

const originalBlobs = new Map<string, Blob>();
const previewBlobs = new Map<string, Blob>();

async function blobFor(id: string, tier: "original" | "preview"): Promise<Blob | undefined> {
  const cache = tier === "original" ? originalBlobs : previewBlobs;
  const hit = cache.get(id);
  if (hit) return hit;
  const b = await dbGet<Blob>("blobs", `${id}:${tier}`);
  if (b) cache.set(id, b);
  return b ?? (tier === "preview" ? blobFor(id, "original") : undefined);
}

export interface ImgSrc { img: ImageBitmap; w: number; h: number }
const imageCache = new Map<string, ImgSrc>();
const pending = new Map<string, Promise<void>>();

/** sync read; kicks off the async load the first time and notifies subscribers when it lands */
export function peekImage(assetId: string | null | undefined, tier: "original" | "preview"): ImgSrc | null {
  if (!assetId) return null;
  const key = `${assetId}|${tier}`;
  const hit = imageCache.get(key);
  if (hit) return hit;
  if (!pending.has(key)) {
    const p = (async () => {
      const blob = await blobFor(assetId, tier);
      if (!blob) return;
      const bmp = await decodeImage(blob);
      const a = assets.get(assetId);
      // preview dims are scaled; report the *original* dims so frame maths stay in one coordinate system
      imageCache.set(key, { img: bmp, w: bmp.width, h: bmp.height });
      if (a && (a.width !== bmp.width || a.height !== bmp.height) && tier === "original") { /* orientation-corrected already */ }
    })().finally(() => { pending.delete(key); bump(); });
    pending.set(key, p);
  }
  return null;
}

export async function loadImage(assetId: string, tier: "original" | "preview"): Promise<ImgSrc | null> {
  const hit = peekImage(assetId, tier);
  if (hit) return hit;
  await pending.get(`${assetId}|${tier}`);
  return imageCache.get(`${assetId}|${tier}`) ?? null;
}

// ───────────────────────── processed (adjusted) bitmaps ─────────────────────────

const processed = new Map<string, HTMLCanvasElement>();
const LRU = 24;

export function processedImage(assetId: string, tier: "original" | "preview", fill: MediaFill, maxDim: number): { source: CanvasImageSource; w: number; h: number } | null {
  const src = peekImage(assetId, tier);
  if (!src) return null;
  const eff = fillEffective(fill);
  if (isNeutral(eff)) return { source: src.img, w: src.w, h: src.h };
  const md = Math.round(clamp(maxDim, 200, tier === "original" ? 4096 : 2048));
  const key = `${assetId}|${tier}|${md}|${adjustmentsKey(eff)}`;
  let cv = processed.get(key);
  if (!cv) {
    cv = renderAdjusted(src.img, src.w, src.h, eff, md);
    processed.set(key, cv);
    if (processed.size > LRU) processed.delete(processed.keys().next().value as string);
  } else {
    processed.delete(key);
    processed.set(key, cv);
  }
  return { source: cv, w: cv.width, h: cv.height };
}

// ───────────────────────── video ─────────────────────────

const videoUrls = new Map<string, string>();
const videoPending = new Map<string, Promise<void>>();

export function peekVideoUrl(assetId: string | null | undefined): string | null {
  if (!assetId) return null;
  const hit = videoUrls.get(assetId);
  if (hit) return hit;
  if (!videoPending.has(assetId)) {
    const p = (async () => {
      const blob = await blobFor(assetId, "original");
      if (blob) videoUrls.set(assetId, URL.createObjectURL(blob));
    })().finally(() => { videoPending.delete(assetId); bump(); });
    videoPending.set(assetId, p);
  }
  return null;
}

export async function videoBlob(assetId: string) { return blobFor(assetId, "original"); }

export async function loadVideoUrl(assetId: string): Promise<string | null> {
  const u = peekVideoUrl(assetId);
  if (u) return u;
  await videoPending.get(assetId);
  return videoUrls.get(assetId) ?? null;
}

/** One <video> per element so clips with different trims play independently. */
const players = new Map<string, HTMLVideoElement>();
if (typeof window !== "undefined") (window as unknown as { __players?: typeof players }).__players = players; // read-only handle for debugging / tests

export function getPlayer(key: string, assetId: string): HTMLVideoElement | null {
  const url = peekVideoUrl(assetId);
  if (!url) return null;
  let v = players.get(key);
  if (!v || v.dataset.asset !== assetId) {
    v?.pause();
    v = document.createElement("video");
    v.dataset.asset = assetId;
    v.preload = "auto";
    v.playsInline = true;
    v.muted = true;
    v.loop = false;
    v.src = url;
    v.addEventListener("loadeddata", bump, { once: true });
    players.set(key, v);
  }
  return v;
}

export function releasePlayer(key: string) {
  const v = players.get(key);
  if (v) { v.pause(); v.removeAttribute("src"); v.load(); }
  players.delete(key);
}

/** release every player created under a scope prefix (thumbnail strip, preview dialog) */
export function releaseScope(scope: string) {
  for (const k of [...players.keys()]) if (k.startsWith(scope + ":")) releasePlayer(k);
}

export function pauseAllPlayers() { players.forEach((v) => v.pause()); }

export function seekVideo(v: HTMLVideoElement, t: number, timeoutMs = 3000): Promise<void> {
  return new Promise((resolve) => {
    if (Math.abs(v.currentTime - t) < 0.001 && v.readyState >= 2) return resolve();
    let done = false;
    const fin = () => { if (!done) { done = true; v.removeEventListener("seeked", fin); resolve(); } };
    v.addEventListener("seeked", fin);
    setTimeout(fin, timeoutMs);
    v.currentTime = t;
  });
}

export const effectiveTrim = (f: MediaFill, duration: number) => {
  const v = f.video;
  const start = clamp(v?.trimStart ?? 0, 0, Math.max(0, duration - 0.05));
  const end = clamp(v?.trimEnd ?? duration, start + 0.05, duration);
  return { start, end, length: end - start };
};
