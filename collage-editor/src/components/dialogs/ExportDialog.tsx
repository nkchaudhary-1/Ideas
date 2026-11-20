"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, CheckCircle2, Download, Film, ImageIcon, Loader2, Package } from "lucide-react";
import { useStore } from "@/lib/store";
import { Button, Segmented, Slider, Toggle } from "@/components/ui/controls";
import Modal from "@/components/ui/Modal";
import SlideView from "@/components/canvas/SlideView";
import { slideDuration, slideHasVideo } from "@/lib/timeline";
import { downloadBlob, formatBytes, slug } from "@/lib/util";
import { planExport, runExport, type ExportReport, type ExportSettings } from "@/lib/export/run";
import { clampScale, isPanorama, type ImageFormat } from "@/lib/export/image";
import { probeVideoSupport, ExportError, type VideoSupport } from "@/lib/export/video";
import { makeZip } from "@/lib/export/zip";

const LS = "collage-studio:export";
const DEFAULTS: Omit<ExportSettings, "slideIds"> = {
  image: { format: "png", scale: 1, quality: 0.92, transparent: false, slicePanorama: true },
  video: { mode: "video", container: "mp4", fps: 30, quality: "standard", audio: true },
  packaging: "zip",
};

export default function ExportDialog() {
  const set = useStore((s) => s.setUI);
  const project = useStore.getState().project;
  const [slideIds, setSlideIds] = useState<string[]>(project.slides.map((s) => s.id));
  const [cfg, setCfg] = useState<Omit<ExportSettings, "slideIds">>(() => {
    try { const v = JSON.parse(localStorage.getItem(LS) || "null"); return v ? { ...DEFAULTS, ...v, image: { ...DEFAULTS.image, ...v.image }, video: { ...DEFAULTS.video, ...v.video } } : DEFAULTS; } catch { return DEFAULTS; }
  });
  const [support, setSupport] = useState<VideoSupport | null>(null);
  const [state, setState] = useState<"idle" | "running" | "done">("idle");
  const [progress, setProgress] = useState({ fraction: 0, label: "" });
  const [report, setReport] = useState<ExportReport | null>(null);
  const [fatal, setFatal] = useState<string | null>(null);
  const abort = useRef<AbortController | null>(null);

  useEffect(() => { void probeVideoSupport(project.format.width, project.format.height).then(setSupport); }, [project.format.width, project.format.height]);
  useEffect(() => { try { localStorage.setItem(LS, JSON.stringify(cfg)); } catch { /* ignore */ } }, [cfg]);

  const settings: ExportSettings = { ...cfg, slideIds };
  const plan = useMemo(() => planExport(project, settings), [project, cfg, slideIds]); // eslint-disable-line react-hooks/exhaustive-deps
  const anyVideo = project.slides.some((s) => slideIds.includes(s.id) && slideHasVideo(s));
  const anyPano = project.slides.some((s) => slideIds.includes(s.id) && isPanorama(s));
  const fileCount = plan.reduce((n, p) => n + p.files, 0);
  const img = cfg.image;
  const setImg = (p: Partial<ExportSettings["image"]>) => setCfg((c) => ({ ...c, image: { ...c.image, ...p } }));
  const setVid = (p: Partial<ExportSettings["video"]>) => setCfg((c) => ({ ...c, video: { ...c.video, ...p } }));
  const toggle = (id: string) => setSlideIds((l) => (l.includes(id) ? l.filter((x) => x !== id) : project.slides.map((s) => s.id).filter((x) => x === id || l.includes(x))));
  const first = project.slides.find((s) => slideIds.includes(s.id)) ?? project.slides[0];
  const sliced = img.slicePanorama && isPanorama(first);
  const unitW = sliced ? 1080 : first.width;
  const outW = Math.round(unitW * clampScale({ width: unitW, height: first.height }, img.scale)), outH = Math.round(first.height * clampScale({ width: unitW, height: first.height }, img.scale));
  const wantsVideoButCant = anyVideo && cfg.video.mode === "video" && support && !support.webcodecs;
  const lossy = img.format !== "png";
  const useZip = cfg.packaging === "zip" && fileCount > 1;

  const start = async () => {
    setFatal(null); setReport(null); setState("running"); setProgress({ fraction: 0, label: "Preparing…" });
    const ac = new AbortController(); abort.current = ac;
    try {
      const r = await runExport(useStore.getState().project, settings, { signal: ac.signal, onProgress: (p) => setProgress({ fraction: p.fraction, label: p.label }) });
      setReport(r);
      if (r.files.length) {
        const base = slug(useStore.getState().project.name);
        try {
          if (r.files.length > 1 && cfg.packaging === "zip") await downloadBlob(await makeZip(r.files.map((f) => ({ name: f.name, blob: f.blob }))), `${base}.zip`);
          else for (const f of r.files) { await downloadBlob(f.blob, f.name); await new Promise((res) => setTimeout(res, 350)); }
        } catch (e) { setFatal((e as Error).message); }
      }
      setState("done");
    } catch (e) {
      if (e instanceof ExportError && e.code === "aborted") { setState("idle"); return; }
      setFatal((e as Error).message); setState("idle");
    }
  };

  return (
    <Modal title="Export" onClose={() => { abort.current?.abort(); set({ exportOpen: false }); }} width={760} testId="export-dialog"
      footer={
        state === "running" ? (
          <><span className="mr-auto flex items-center gap-2 text-xs text-mute"><Loader2 size={13} className="animate-spin" />{progress.label}</span><Button onClick={() => abort.current?.abort()} testId="export-cancel">Cancel</Button></>
        ) : (
          <>
            <span className="mr-auto text-xs text-mute">{fileCount} file{fileCount === 1 ? "" : "s"}{useZip ? " in one ZIP" : ""} · {outW}×{outH}px</span>
            <Button onClick={() => set({ exportOpen: false })}>{state === "done" ? "Close" : "Cancel"}</Button>
            <Button variant="primary" disabled={!slideIds.length || !!wantsVideoButCant && plan.every((p) => p.kind === "video")} onClick={start} testId="export-run"><Download size={14} /> {state === "done" ? "Export again" : useZip ? "Export ZIP" : fileCount > 1 ? "Export files" : "Export"}</Button>
          </>
        )
      }
    >
      <div className="grid grid-cols-[1fr_300px]">
        <div className="space-y-5 border-r border-line p-4">
          <section>
            <div className="mb-2 flex items-center justify-between text-xs font-bold text-ink">
              <span>Slides</span>
              <span className="space-x-3 normal-case tracking-normal"><button type="button" className="hover:text-ink" onClick={() => setSlideIds(project.slides.map((s) => s.id))}>All</button><button type="button" className="hover:text-ink" onClick={() => setSlideIds([project.activeSlideId])}>Current</button></span>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1" data-testid="export-slides">
              {project.slides.map((s, i) => {
                const on = slideIds.includes(s.id);
                const w = Math.round(64 * Math.min(1.6, s.width / s.height));
                return (
                  <button key={s.id} type="button" onClick={() => toggle(s.id)} aria-pressed={on} className={`relative shrink-0 overflow-hidden rounded-md ring-2 ${on ? "ring-accent" : "opacity-45 ring-transparent hover:opacity-80"}`}>
                    <SlideView slide={s} width={w} scope="export-pick" />
                    <span className="absolute left-1 top-1 rounded bg-black/70 px-1 text-[10px] text-white">{i + 1}</span>
                    {slideHasVideo(s) && <span className="absolute bottom-1 right-1 grid h-4 w-4 place-items-center rounded-full bg-black/70 text-white"><Film size={9} /></span>}
                  </button>
                );
              })}
            </div>
          </section>

          <section className="space-y-3">
            <h3 className="text-xs font-bold text-ink">Images</h3>
            <div className="flex items-center gap-3"><span className="w-16 text-xs text-mute">Format</span>
              <Segmented<ImageFormat> value={img.format} onChange={(v) => setImg({ format: v, transparent: v === "jpeg" ? false : img.transparent })} options={[{ value: "png", label: "PNG" }, { value: "jpeg", label: "JPEG" }, { value: "webp", label: "WebP" }]} />
            </div>
            <div className="flex items-center gap-3"><span className="w-16 text-xs text-mute">Size</span>
              <Segmented<number> value={img.scale} onChange={(v) => setImg({ scale: v })} options={[{ value: 0.5, label: "½×" }, { value: 1, label: "1×" }, { value: 1.5, label: "1.5×" }, { value: 2, label: "2×" }]} />
              <span className="text-xs text-faint">{first.width}×{first.height} → {sliced ? `${first.width / 1080} × ` : ""}{outW}×{outH}</span>
            </div>
            {lossy && <Slider label="Quality" value={Math.round(img.quality * 100)} min={40} max={100} unit="%" onChange={(v) => setImg({ quality: v / 100 })} neutral={92} />}
            <div className="flex items-center gap-3"><span className="w-16 text-xs text-mute">Background</span>
              <Toggle label="Transparent background" value={img.transparent && img.format !== "jpeg"} onChange={(v) => setImg({ transparent: v })} />
              <span className="text-xs text-faint">{img.format === "jpeg" ? "JPEG can't be transparent" : img.transparent ? "Only empty areas are transparent" : "Slide background included"}</span>
            </div>
            {anyPano && <Toggle label="Slice panorama into 1080px slides" value={img.slicePanorama} onChange={(v) => setImg({ slicePanorama: v })} />}
          </section>

          {anyVideo && (
            <section className="space-y-3" data-testid="export-video-section">
              <h3 className="flex items-center gap-1.5 text-xs font-bold text-ink"><Film size={12} /> Video slides</h3>
              <div className="flex items-center gap-3"><span className="w-16 text-xs text-mute">Export as</span>
                <Segmented value={cfg.video.mode} onChange={(v) => setVid({ mode: v })} options={[{ value: "video", label: "Video file" }, { value: "still", label: "Still image" }]} />
              </div>
              {cfg.video.mode === "video" && (
                <>
                  <div className="flex items-center gap-3"><span className="w-16 text-xs text-mute">Container</span>
                    <Segmented value={cfg.video.container} onChange={(v) => setVid({ container: v })} options={[{ value: "mp4", label: "MP4 · H.264" }, { value: "webm", label: "WebM · VP9" }]} />
                  </div>
                  <div className="flex items-center gap-3"><span className="w-16 text-xs text-mute">Frame rate</span>
                    <Segmented<number> value={cfg.video.fps} onChange={(v) => setVid({ fps: v as 24 | 30 | 60 })} options={[{ value: 24, label: "24" }, { value: 30, label: "30" }, { value: 60, label: "60" }]} />
                    <span className="ml-2 text-xs text-mute">Quality</span>
                    <Segmented value={cfg.video.quality} onChange={(v) => setVid({ quality: v })} options={[{ value: "standard", label: "Standard" }, { value: "high", label: "High" }]} />
                  </div>
                  <Toggle label="Include audio" value={cfg.video.audio} onChange={(v) => setVid({ audio: v })} />
                  <p className="text-xs leading-relaxed text-faint">Videos are rendered frame by frame in your browser, including trims, filters, text and shapes on top. Original clips are never touched. A 4 s clip takes a few seconds to render.</p>
                </>
              )}
              {support && cfg.video.mode === "video" && (
                <div className={`rounded-md border px-3 py-2 text-xs leading-relaxed ${support.webcodecs && (cfg.video.container === "mp4" ? support.h264 : support.vp9) ? "border-line bg-panel2 text-mute" : "border-red-500/40 bg-red-500/10 text-red-200"}`} data-testid="export-support">
                  {!support.webcodecs ? "This browser can't encode video (WebCodecs missing). Use current Chrome, Edge or Safari 16.4+. Video slides can still be exported as stills." :
                    <>This browser can encode: H.264 {support.h264 ? "✓" : "✕"} · VP9 {support.vp9 ? "✓" : "✕"} · AAC {support.aac ? "✓" : "✕"} · Opus {support.opus ? "✓" : "✕"}.{cfg.video.container === "mp4" && !support.aac && support.opus ? " AAC isn't available here, so MP4 audio will be Opus; convert with ffmpeg if Instagram rejects it." : ""}</>}
                </div>
              )}
            </section>
          )}
        </div>

        <aside className="space-y-4 p-4">
          <section>
            <h3 className="mb-2 text-xs font-bold text-ink">Output</h3>
            <ul className="space-y-1.5" data-testid="export-plan">
              {plan.map((p, i) => (
                <li key={p.slideId} className="flex items-center gap-2 rounded-md bg-panel2 px-2.5 py-1.5 text-xs">
                  {p.kind === "video" ? <Film size={13} className="text-accent" /> : <ImageIcon size={13} className="text-mute" />}
                  <span className="min-w-0 flex-1 truncate">{i + 1}. {p.slideName}</span>
                  <span className="shrink-0 text-faint">{p.kind === "video" ? `${cfg.video.container.toUpperCase()} · ${(p.seconds ?? 0).toFixed(1)}s` : `${img.format.toUpperCase()}${p.files > 1 ? ` ×${p.files}` : ""}`}</span>
                </li>
              ))}
              {plan.length === 0 && <li className="text-xs text-faint">Select at least one slide.</li>}
            </ul>
          </section>
          {plan.length > 1 && (
            <section>
              <h3 className="mb-2 text-xs font-bold text-ink">Delivery</h3>
              <Segmented value={cfg.packaging} onChange={(v) => setCfg((c) => ({ ...c, packaging: v }))} options={[{ value: "zip", label: <span className="flex items-center gap-1"><Package size={12} /> ZIP</span> }, { value: "files", label: "Separate files" }]} />
              <p className="mt-1.5 text-xs text-faint">Files are numbered in slide order so they upload to Instagram in the right sequence.</p>
            </section>
          )}
          {state === "running" && (
            <div><div className="h-1.5 overflow-hidden rounded-full bg-panel2"><div className="h-full bg-accent transition-[width]" style={{ width: `${Math.round(progress.fraction * 100)}%` }} /></div><p className="mt-1.5 text-xs text-mute" data-testid="export-progress">{Math.round(progress.fraction * 100)}% · {progress.label}</p></div>
          )}
          {fatal && <p className="flex gap-1.5 rounded-md border border-red-500/40 bg-red-500/10 p-2.5 text-xs text-red-200" role="alert"><AlertTriangle size={14} className="shrink-0" />{fatal}</p>}
          {report && (
            <div className="space-y-2 text-xs" data-testid="export-report">
              {report.files.length > 0 && <p className="flex gap-1.5 text-accent"><CheckCircle2 size={14} className="shrink-0" />Exported {report.files.length} file{report.files.length > 1 ? "s" : ""} ({formatBytes(report.files.reduce((n, f) => n + f.blob.size, 0))}).</p>}
              {report.errors.map((e) => <p key={e.slide} className="flex gap-1.5 rounded-md border border-red-500/40 bg-red-500/10 p-2 text-red-200"><AlertTriangle size={14} className="mt-0.5 shrink-0" /><span><b>{e.slide}:</b> {e.message}</span></p>)}
              {report.notes.map((n, i) => <p key={i} className="rounded-md border border-line bg-panel2 p-2 text-mute">{n}</p>)}
            </div>
          )}
        </aside>
      </div>
    </Modal>
  );
}
