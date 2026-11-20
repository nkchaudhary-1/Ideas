import type { Project } from "../types";
import { slug } from "../util";
import { slideHasVideo, slideDuration } from "../timeline";
import { EXT, exportSlideImages, isPanorama, type ImageOptions } from "./image";
import { exportSlideVideo, ExportError, type VideoOptions } from "./video";

export interface ExportSettings {
  slideIds: string[];
  image: ImageOptions;
  video: { mode: "video" | "still"; container: VideoOptions["container"]; fps: VideoOptions["fps"]; quality: VideoOptions["quality"]; audio: boolean };
  packaging: "zip" | "files";
}
export interface OutputFile { name: string; blob: Blob; kind: "image" | "video"; slideIndex: number }
export interface ExportReport { files: OutputFile[]; notes: string[]; errors: { slide: string; message: string }[] }
export interface PlanItem { slideId: string; slideIndex: number; slideName: string; kind: "image" | "video"; files: number; width: number; height: number; seconds?: number }

/** what an export will produce, so the dialog can show it before anything runs */
export function planExport(project: Project, s: ExportSettings): PlanItem[] {
  const items: PlanItem[] = [];
  project.slides.forEach((slide, slideIndex) => {
    if (!s.slideIds.includes(slide.id)) return;
    const video = slideHasVideo(slide) && s.video.mode === "video";
    if (video) {
      items.push({ slideId: slide.id, slideIndex, slideName: slide.name, kind: "video", files: 1, width: Math.round(slide.width * s.image.scale), height: Math.round(slide.height * s.image.scale), seconds: slideDuration(slide) });
    } else {
      const pieces = s.image.slicePanorama && isPanorama(slide) ? slide.width / 1080 : 1;
      items.push({ slideId: slide.id, slideIndex, slideName: slide.name, kind: "image", files: pieces, width: Math.round((pieces > 1 ? 1080 : slide.width) * s.image.scale), height: Math.round(slide.height * s.image.scale) });
    }
  });
  return items;
}

/** edit projects keep each file's own name: "beach-edit.png", and "beach-edit-2.png" if two share a name */
function uniqueName(files: OutputFile[], stem: string, ext: string): string {
  let name = `${stem}.${ext}`;
  for (let i = 2; files.some((f) => f.name === name); i++) name = `${stem}-${i}.${ext}`;
  return name;
}

/** render everything that was asked for, in slide order. One failing slide doesn't sink the rest. */
export async function runExport(
  project: Project,
  s: ExportSettings,
  hooks: { signal?: AbortSignal; onProgress?: (p: { done: number; total: number; label: string; fraction: number }) => void },
): Promise<ExportReport> {
  const plan = planExport(project, s);
  const base = slug(project.name);
  const report: ExportReport = { files: [], notes: [], errors: [] };
  const pad = (n: number) => String(n).padStart(2, "0");
  let n = 0;

  for (let k = 0; k < plan.length; k++) {
    const item = plan[k];
    const slide = project.slides[item.slideIndex];
    const label = `${slide.name} (${item.kind})`;
    const prog = (fraction: number, what = label) => hooks.onProgress?.({ done: k, total: plan.length, label: what, fraction: (k + fraction) / plan.length });
    if (hooks.signal?.aborted) throw new ExportError("Export cancelled", "aborted");
    prog(0);
    try {
      if (item.kind === "video") {
        const r = await exportSlideVideo(slide, {
          container: s.video.container, fps: s.video.fps, quality: s.video.quality, audio: s.video.audio, scale: s.image.scale,
          signal: hooks.signal, onProgress: (f, l) => prog(f, `${slide.name}: ${l}`),
        });
        n++;
        report.files.push({ name: project.kind === "edit" ? uniqueName(report.files, `${slug(slide.name)}-edit`, r.ext) : `${base}-${pad(n)}.${r.ext}`, blob: r.blob, kind: "video", slideIndex: item.slideIndex });
        report.notes.push(...r.notes.map((m) => `${slide.name}: ${m}`));
      } else {
        const blobs = await exportSlideImages(slide, s.image);
        for (const b of blobs) {
          n++;
          report.files.push({ name: project.kind === "edit" ? uniqueName(report.files, `${slug(slide.name)}-edit`, EXT[s.image.format]) : `${base}-${pad(n)}.${EXT[s.image.format]}`, blob: b, kind: "image", slideIndex: item.slideIndex });
        }
      }
    } catch (e) {
      if (e instanceof ExportError && e.code === "aborted") throw e;
      report.errors.push({ slide: slide.name, message: (e as Error).message });
    }
    prog(1);
  }
  return report;
}
