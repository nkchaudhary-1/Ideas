"""Joins the six rendered scenes into one 40 s, 30 fps, 1080x1920 film through five custom transitions.
usage: python3 compose.py <frames_dir> <trans_dir> <out_dir> [audio.wav] [--preview]
Scene frames are named s<scene>/f<global frame>.jpg and overlap their neighbours by 18 frames each side, so every
transition mixes two live scenes (nothing is frozen)."""
import sys, os, subprocess
import numpy as np
from PIL import Image

FPS, TR = 30, 18
START = [0, 0, 5, 11, 16, 21, 30]          # global start second of scene 1..6
DUR = [0, 5, 6, 5, 5, 9, 10]
TYPES = {2: "arch", 3: "petals", 4: "light", 5: "doors", 6: "lamp"}   # transition INTO scene k
TOTAL = 40 * FPS

frames, trans, out = sys.argv[1], sys.argv[2], sys.argv[3]
audio = sys.argv[4] if len(sys.argv) > 4 and not sys.argv[4].startswith("--") else None
preview = "--preview" in sys.argv
os.makedirs(out, exist_ok=True)

def load(p): return np.asarray(Image.open(p).convert("RGB"), dtype=np.float32)
def scene_of(n):
    s = 1
    for k in range(2, 7):
        if n >= START[k] * FPS - TR: s = k
    return s
def in_trans(n):
    for k in range(2, 7):
        b = START[k] * FPS
        if b - TR <= n < b + TR: return k, n - (b - TR)
    return None, 0

def frame(n):
    k, i = in_trans(n)
    if k is None:
        s = scene_of(n)
        if s > 1 and n < START[s] * FPS + TR: s = s            # inside the incoming scene's own window
        return load(f"{frames}/s{s}/f{n:04d}.jpg")
    a = load(f"{frames}/s{k-1}/f{n:04d}.jpg"); b = load(f"{frames}/s{k}/f{n:04d}.jpg")
    t = TYPES[k]
    m = np.asarray(Image.open(f"{trans}/{t}/m{i:04d}.png").convert("L"), dtype=np.float32)[..., None] / 255.0
    o = np.asarray(Image.open(f"{trans}/{t}/o{i:04d}.png").convert("RGBA"), dtype=np.float32) / 255.0
    base = a * (1 - m) + b * m
    # overlays are authored additive-ish (glows) on transparent; composite them with normal alpha, which keeps petals and lines true
    al = o[..., 3:4]
    return base * (1 - al) + o[..., :3] * 255.0 * al

if preview:
    # one still from the middle of every transition, side by side with the frames either side of it
    rows = []
    for k in range(2, 7):
        b = START[k] * FPS
        tiles = [frame(b - TR - 1 if False else b - TR + 1), frame(b - TR + 9), frame(b), frame(b + 9), frame(b + TR - 1)]
        rows.append(np.concatenate([np.asarray(Image.fromarray(t.astype(np.uint8)).resize((216, 384))) for t in tiles], axis=1))
    Image.fromarray(np.concatenate(rows, axis=0)).save(os.path.join(out, "transitions-preview.png"))
    print("preview written"); sys.exit()

# encode by piping raw frames into ffmpeg: no intermediate files
cmd = ["ffmpeg", "-y", "-loglevel", "error", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", "1080x1920", "-r", str(FPS), "-i", "-"]
if audio: cmd += ["-i", audio]
cmd += ["-c:v", "libx264", "-preset", "slow", "-crf", "17", "-pix_fmt", "yuv420p", "-profile:v", "high", "-level", "4.1", "-movflags", "+faststart", "-r", str(FPS)]
if audio: cmd += ["-c:a", "aac", "-b:a", "192k", "-t", "40"]
cmd += [os.path.join(out, "wedding-film.mp4")]
p = subprocess.Popen(cmd, stdin=subprocess.PIPE)
for n in range(TOTAL):
    p.stdin.write(np.clip(frame(n), 0, 255).astype(np.uint8).tobytes())
    if n % 150 == 0: print("frame", n, flush=True)
p.stdin.close(); p.wait(); print("encoded", os.path.join(out, "wedding-film.mp4"))
