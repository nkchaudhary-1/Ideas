"""Encode a recorded frame folder into a 1080x1920 mp4 at 30 fps, optionally with an audio file.
usage: python3 encode.py <frames_dir> <out.mp4> [audio.wav]"""
import json, subprocess, sys, os

d, out = sys.argv[1], sys.argv[2]
audio = sys.argv[3] if len(sys.argv) > 3 else None
fr = json.load(open(os.path.join(d, "frames.json")))
lst = os.path.join(d, "list.txt")
with open(lst, "w") as f:
    for i, a in enumerate(fr):
        dur = (fr[i + 1]["t"] - a["t"]) if i + 1 < len(fr) else 0.6
        f.write(f"file '{a['f']}'\nduration {max(dur, 0.001):.5f}\n")
    f.write(f"file '{fr[-1]['f']}'\n")
cmd = ["ffmpeg", "-y", "-loglevel", "error", "-f", "concat", "-safe", "0", "-i", lst]
if audio: cmd += ["-i", audio]
cmd += ["-vf", "fps=30,scale=1080:1920:flags=lanczos,format=yuv420p", "-c:v", "libx264", "-crf", "21", "-maxrate", "7M", "-bufsize", "14M", "-preset", "slow", "-movflags", "+faststart"]
if audio: cmd += ["-c:a", "aac", "-b:a", "192k", "-shortest"]
cmd += [out]
subprocess.run(cmd, check=True)
print("wrote", out, round(os.path.getsize(out) / 1e6, 1), "MB")
