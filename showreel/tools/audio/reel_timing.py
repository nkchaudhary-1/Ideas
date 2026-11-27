"""
Timing shared by the audio tools: the beat boundaries read from src/reel.config.ts, and the cue times
inside each beat that the music and the voiceover are placed on.

The cues mirror the choreography in src/beats/*.ts, using the same fractions of each beat and the same
snap to the tempo grid. If you change a fraction in a beat builder, change it in CUES below.
"""
from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]


def clock(text: str) -> float:
    m, s = text.split(":")
    return int(m) * 60 + float(s)


def read_reel() -> dict:
    src = (ROOT / "src/reel.config.ts").read_text()
    starts = [clock(t) for t in re.findall(r"\bin:\s*'(\d+:\d+(?:\.\d+)?)'", src)]
    ids = re.findall(r"\bid:\s*'([a-z]+)'", src)
    duration = clock(re.search(r"duration:\s*'(\d+:\d+(?:\.\d+)?)'", src).group(1))
    bpm = float(re.search(r"bpm:\s*(\d+)", src).group(1))
    every = float(re.search(r"flashEvery:\s*([\d.]+)", src).group(1))
    loop_blend = float(re.search(r"loopBlend:\s*([\d.]+)", src).group(1))
    ends = starts[1:] + [duration]
    beats = {i: (s, e) for i, s, e in zip(ids, starts, ends)}
    return dict(beats=beats, duration=duration, bpm=bpm, flash_every=every, loop_blend=loop_blend)


REEL = read_reel()
BEAT = 60 / REEL["bpm"]
TICK = BEAT / 4  # a sixteenth note, the same grid the choreography snaps to
DUR = REEL["duration"]
B = REEL["beats"]


def snap(seconds: float) -> float:
    return round(seconds / TICK) * TICK


def local(beat: str, fraction: float) -> float:
    """Absolute time of `fraction` of the way through a beat, snapped like the visuals are."""
    start, end = B[beat]
    return start + snap(fraction * (end - start))


# --------------------------------------------------------------------------- the cues that mirror the visuals

CUES = {
    "award": local("numbers", 0.62),
    "tiles": [local("curiosity", 0.48 + 0.15 * i) for i in range(3)],
    "phases": [local("builder", 0.32), local("builder", 0.68)],
    "fill": local("craft", 0.18),
    "shrink": local("craft", 0.40),
    "caption2": local("craft", 0.52),
    "years_from": B["close"][0] + 2 * TICK,
    "years_roll": 3.4,
    "payoff": local("close", 0.50),
    "payoff_lines": [local("close", 0.50) + 0.5, local("close", 0.50) + 2.4],
    "rings": [B["endcard"][0] + 2 * TICK, local("endcard", 0.45)],
}
