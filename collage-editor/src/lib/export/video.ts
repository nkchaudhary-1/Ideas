import { Muxer as Mp4Muxer, ArrayBufferTarget as Mp4Target } from "mp4-muxer";
import { Muxer as WebmMuxer, ArrayBufferTarget as WebmTarget } from "webm-muxer";
import type { Slide } from "../types";
import { effectiveTrim, getAsset, videoBlob } from "../media";
import { slideDuration, slideVideoFills } from "../timeline";
import { createRenderer } from "./render";

export type VideoContainer = "mp4" | "webm";
export interface VideoOptions {
  container: VideoContainer;
  fps: 24 | 30 | 60;
  quality: "standard" | "high";
  /** output pixels per document unit */
  scale: number;
  audio: boolean;
  signal?: AbortSignal;
  onProgress?: (fraction: number, label: string) => void;
}
export interface VideoResult { blob: Blob; ext: "mp4" | "webm"; notes: string[]; width: number; height: number; duration: number; codec: string }

export class ExportError extends Error {
  constructor(message: string, public code: "unsupported" | "aborted" | "failed" = "failed") { super(message); }
}

const even = (n: number) => Math.max(2, Math.round(n / 2) * 2);
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export interface VideoSupport { webcodecs: boolean; h264: boolean; vp9: boolean; aac: boolean; opus: boolean }

/** what this browser can actually encode (probed, not assumed) */
export async function probeVideoSupport(w = 1080, h = 1350, fps = 30): Promise<VideoSupport> {
  const none = { webcodecs: false, h264: false, vp9: false, aac: false, opus: false };
  if (typeof VideoEncoder === "undefined" || typeof VideoFrame === "undefined") return none;
  const ok = async (cfg: VideoEncoderConfig) => { try { return !!(await VideoEncoder.isConfigSupported(cfg)).supported; } catch { return false; } };
  const aok = async (codec: string) => {
    if (typeof AudioEncoder === "undefined") return false;
    try { return !!(await AudioEncoder.isConfigSupported({ codec, sampleRate: 48000, numberOfChannels: 2, bitrate: 128000 })).supported; } catch { return false; }
  };
  const W = even(w), H = even(h);
  return {
    webcodecs: true,
    h264: (await Promise.all(H264.map((c) => ok({ codec: c, width: W, height: H, bitrate: 4e6, framerate: fps, avc: { format: "avc" } } as VideoEncoderConfig)))).some(Boolean),
    vp9: (await Promise.all(VP9.map((c) => ok({ codec: c, width: W, height: H, bitrate: 4e6, framerate: fps })))).some(Boolean),
    aac: await aok("mp4a.40.2"),
    opus: await aok("opus"),
  };
}

// high-profile levels 5.1 → 4.0, then main, then baseline
const H264 = ["avc1.640033", "avc1.64002a", "avc1.640028", "avc1.4d0033", "avc1.4d0028", "avc1.42003e", "avc1.42001f"];
const VP9 = ["vp09.00.40.08", "vp09.00.50.08", "vp09.00.10.08"];

async function pickVideoCodec(container: VideoContainer, w: number, h: number, fps: number, bitrate: number): Promise<string | null> {
  const list = container === "mp4" ? H264 : [...VP9, "vp8"];
  for (const codec of list) {
    const cfg = { codec, width: w, height: h, bitrate, framerate: fps, ...(container === "mp4" ? { avc: { format: "avc" } } : {}) } as VideoEncoderConfig;
    try { if ((await VideoEncoder.isConfigSupported(cfg)).supported) return codec; } catch { /* next */ }
  }
  return null;
}

/** mix every audible clip on the slide (trim, volume, loop respected) into one stereo buffer */
async function mixAudio(slide: Slide, duration: number, notes: string[], sampleRate = 48000): Promise<AudioBuffer | null> {
  const fills = slideVideoFills(slide);
  const audible = fills.filter((f) => {
    const a = getAsset(f.assetId);
    return a && a.hasAudio !== false && !f.video?.muted && (f.video?.volume ?? 1) > 0;
  });
  if (!audible.length) return null;
  const ctx = new OfflineAudioContext(2, Math.ceil(duration * sampleRate), sampleRate);
  const decoded = new Map<string, AudioBuffer | null>();
  let used = 0;
  for (const f of audible) {
    const a = getAsset(f.assetId)!;
    if (!decoded.has(a.id)) {
      try {
        const blob = await videoBlob(a.id);
        decoded.set(a.id, blob ? await ctx.decodeAudioData(await blob.arrayBuffer()) : null);
      } catch {
        decoded.set(a.id, null);
        notes.push(`“${a.name}” has no audio track this browser can decode, so it exports silent.`);
      }
    }
    const buf = decoded.get(a.id);
    if (!buf) continue;
    const trim = effectiveTrim(f, a.duration ?? buf.duration);
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const gain = ctx.createGain();
    gain.gain.value = Math.max(0, Math.min(1, f.video?.volume ?? 1));
    src.connect(gain).connect(ctx.destination);
    if (f.video?.loop) { src.loop = true; src.loopStart = trim.start; src.loopEnd = trim.end; src.start(0, trim.start); }
    else src.start(0, trim.start, Math.min(trim.length, duration));
    used++;
  }
  return used ? ctx.startRendering() : null;
}

async function encodeAudio(buf: AudioBuffer, codec: "aac" | "opus", onChunk: (c: EncodedAudioChunk, m?: EncodedAudioChunkMetadata) => void, signal?: AbortSignal) {
  let failure: Error | null = null;
  const enc = new AudioEncoder({ output: onChunk, error: (e) => { failure = e as Error; } });
  enc.configure({ codec: codec === "aac" ? "mp4a.40.2" : "opus", sampleRate: buf.sampleRate, numberOfChannels: 2, bitrate: 128000 });
  const chunk = 4800;
  const L = buf.getChannelData(0);
  const R = buf.numberOfChannels > 1 ? buf.getChannelData(1) : L;
  for (let i = 0; i < buf.length; i += chunk) {
    if (signal?.aborted) throw new ExportError("Export cancelled", "aborted");
    const n = Math.min(chunk, buf.length - i);
    const data = new Float32Array(n * 2);
    data.set(L.subarray(i, i + n), 0);
    data.set(R.subarray(i, i + n), n);
    const ad = new AudioData({ format: "f32-planar", sampleRate: buf.sampleRate, numberOfFrames: n, numberOfChannels: 2, timestamp: Math.round((i / buf.sampleRate) * 1e6), data });
    enc.encode(ad);
    ad.close();
  }
  await enc.flush();
  enc.close();
  if (failure) throw failure;
}

/** Render one slide to a real video file: every frame comes from the same scene as the editor, videos seek frame-accurately. */
export async function exportSlideVideo(slide: Slide, o: VideoOptions): Promise<VideoResult> {
  const notes: string[] = [];
  if (typeof VideoEncoder === "undefined" || typeof VideoFrame === "undefined") {
    throw new ExportError("This browser can't encode video (WebCodecs is missing). Use a current Chrome, Edge or Safari 16.4+ to export video slides. Photo slides export normally anywhere.", "unsupported");
  }
  const fps = o.fps;
  const duration = slideDuration(slide);
  const W = even(slide.width * o.scale), H = even(slide.height * o.scale);
  const bpp = o.quality === "high" ? 0.13 : 0.075;
  const bitrate = Math.round(Math.max(1.5e6, Math.min(25e6, W * H * fps * bpp)));
  const codec = await pickVideoCodec(o.container, W, H, fps, bitrate);
  if (!codec) {
    throw new ExportError(
      o.container === "mp4"
        ? `This browser can't encode H.264 at ${W}×${H}. Try WebM, a smaller size, or a different browser (Chrome / Edge / Safari).`
        : `This browser can't encode WebM (VP9/VP8) at ${W}×${H}. Try MP4 or a smaller size.`,
      "unsupported",
    );
  }

  // audio plan
  let audioBuf: AudioBuffer | null = null;
  let audioCodec: "aac" | "opus" | null = null;
  if (o.audio) {
    o.onProgress?.(0, "Mixing audio…");
    audioBuf = await mixAudio(slide, duration, notes).catch(() => null);
    if (audioBuf) {
      const sup = await probeVideoSupport(W, H, fps);
      if (o.container === "webm") audioCodec = sup.opus ? "opus" : null;
      else audioCodec = sup.aac ? "aac" : sup.opus ? "opus" : null;
      if (!audioCodec) { notes.push("This browser has no audio encoder, so the video was exported without sound."); audioBuf = null; }
      else if (o.container === "mp4" && audioCodec === "opus") notes.push("This browser can't encode AAC, so audio is Opus inside the MP4. It plays in Chrome, Firefox and VLC, but Instagram may want AAC: run  ffmpeg -i in.mp4 -c:v copy -c:a aac out.mp4  to convert.");
    }
  }

  const renderer = await createRenderer(slide, { scale: W / slide.width });
  let videoEnc: VideoEncoder | null = null;
  try {
    await renderer.ready();
    const total = Math.max(1, Math.round(duration * fps));

    let failure: Error | null = null;
    let finalize: () => Blob;
    let addVideo: (c: EncodedVideoChunk, m?: EncodedVideoChunkMetadata) => void;
    let addAudio: ((c: EncodedAudioChunk, m?: EncodedAudioChunkMetadata) => void) | null = null;
    if (o.container === "mp4") {
      const target = new Mp4Target();
      const muxer = new Mp4Muxer({
        target,
        video: { codec: "avc", width: W, height: H, frameRate: fps },
        audio: audioBuf && audioCodec ? { codec: audioCodec, numberOfChannels: 2, sampleRate: audioBuf.sampleRate } : undefined,
        fastStart: "in-memory",
      });
      addVideo = (c, m) => muxer.addVideoChunk(c, m);
      addAudio = (c, m) => muxer.addAudioChunk(c, m);
      finalize = () => { muxer.finalize(); return new Blob([target.buffer], { type: "video/mp4" }); };
    } else {
      const target = new WebmTarget();
      const muxer = new WebmMuxer({
        target,
        video: { codec: codec.startsWith("vp8") ? "V_VP8" : "V_VP9", width: W, height: H, frameRate: fps },
        audio: audioBuf && audioCodec ? { codec: "A_OPUS", numberOfChannels: 2, sampleRate: audioBuf.sampleRate } : undefined,
      });
      addVideo = (c, m) => muxer.addVideoChunk(c, m);
      addAudio = (c, m) => muxer.addAudioChunk(c, m);
      finalize = () => { muxer.finalize(); return new Blob([target.buffer], { type: "video/webm" }); };
    }

    videoEnc = new VideoEncoder({ output: (c, m) => addVideo(c, m), error: (e) => { failure = e as Error; } });
    videoEnc.configure({ codec, width: W, height: H, bitrate, framerate: fps, latencyMode: "quality", ...(o.container === "mp4" ? { avc: { format: "avc" } } : {}) } as VideoEncoderConfig);

    for (let i = 0; i < total; i++) {
      if (o.signal?.aborted) throw new ExportError("Export cancelled", "aborted");
      if (failure) throw failure;
      await renderer.seekAll(i / fps);
      const canvas = renderer.frame();
      const frame = new VideoFrame(canvas, { timestamp: Math.round((i * 1e6) / fps), duration: Math.round(1e6 / fps) });
      videoEnc.encode(frame, { keyFrame: i % (fps * 2) === 0 });
      frame.close();
      canvas.width = 0;
      while (videoEnc.encodeQueueSize > 6) await sleep(4);
      if (i % 3 === 0) o.onProgress?.((i / total) * (audioBuf ? 0.92 : 0.98), `Rendering frame ${i + 1} of ${total}`);
    }
    await videoEnc.flush();
    videoEnc.close();
    videoEnc = null;
    if (failure) throw failure;

    if (audioBuf && audioCodec && addAudio) {
      o.onProgress?.(0.94, "Encoding audio…");
      await encodeAudio(audioBuf, audioCodec, addAudio, o.signal);
    }
    o.onProgress?.(0.99, "Finishing file…");
    const blob = finalize();
    return { blob, ext: o.container, notes, width: W, height: H, duration, codec };
  } catch (e) {
    if (e instanceof ExportError) throw e;
    if (o.signal?.aborted) throw new ExportError("Export cancelled", "aborted");
    throw new ExportError(`Video encoding failed: ${(e as Error).message}`, "failed");
  } finally {
    try { videoEnc?.close(); } catch { /* closed */ }
    renderer.destroy();
  }
}
