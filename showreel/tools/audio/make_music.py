#!/usr/bin/env python3
"""
Synthesises the reel's music bed: original, royalty-free, made from scratch with numpy and scipy.
No samples, no model, no network.

    python3 tools/audio/make_music.py            # writes public/audio/music.mp3 (needs ffmpeg)
    python3 tools/audio/make_music.py --wav x.wav

The bed follows the reel. Section boundaries are read from src/reel.config.ts, so retiming a beat
moves the music with it. The cues inside each section (the award bell, the tile chimes, the ticks
that slow down with the years counter) mirror the choreography in src/beats/*.ts, using the same
fractions of each beat. If you change a fraction there, change it in CUES below.

Everything sits on the config's tempo grid. The last 0.8 s eases to near-silence and the reverb tail
is folded back onto the start, so the file loops without a seam.
"""
from __future__ import annotations

import argparse
import re
import subprocess
import sys
import wave
from pathlib import Path

import numpy as np
from scipy import signal

ROOT = Path(__file__).resolve().parents[2]
SR = 44100
rng = np.random.default_rng(7)  # fixed seed: the same bed every run


# --------------------------------------------------------------------------- reel timing

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
    "tiles": [local("curiosity", 0.44 + 0.16 * i) for i in range(3)],
    "phases": [local("builder", 0.32), local("builder", 0.68)],
    "fill": local("craft", 0.18),
    "shrink": local("craft", 0.40),
    "caption2": local("craft", 0.52),
    "years_from": B["close"][0] + 2 * TICK,
    "years_roll": 3.4,
    "payoff": local("close", 0.50),
    "rings": [B["endcard"][0] + 2 * TICK, local("endcard", 0.45)],
}


# --------------------------------------------------------------------------- tiny synth kit

N = int((DUR + 5) * SR)  # five seconds of room for tails, folded back at the end
STEMS: dict[str, np.ndarray] = {k: np.zeros((N, 2), np.float32) for k in ("drums", "bass", "pluck", "pad", "fx")}


def midi(n: float) -> float:
    return 440.0 * 2 ** ((n - 69) / 12)


def place(stem: str, mono: np.ndarray, at: float, gain: float = 1.0, pan: float = 0.0) -> None:
    i = int(at * SR)
    if i < 0 or i >= N:
        return
    mono = mono[: N - i]
    # equal-power pan, -1 left to +1 right
    l, r = np.cos((pan + 1) * np.pi / 4), np.sin((pan + 1) * np.pi / 4)
    STEMS[stem][i : i + len(mono), 0] += mono * gain * l
    STEMS[stem][i : i + len(mono), 1] += mono * gain * r


def tt(dur: float) -> np.ndarray:
    return np.arange(int(dur * SR)) / SR


def lowpass(x: np.ndarray, hz: float, order: int = 2) -> np.ndarray:
    return signal.sosfilt(signal.butter(order, min(hz, SR / 2 - 100), "low", fs=SR, output="sos"), x)


def highpass(x: np.ndarray, hz: float, order: int = 2) -> np.ndarray:
    return signal.sosfilt(signal.butter(order, hz, "high", fs=SR, output="sos"), x)


def kick(level: float = 1.0) -> np.ndarray:
    t = tt(0.34)
    sweep = 48 + 90 * np.exp(-t * 28)
    body = np.sin(2 * np.pi * np.cumsum(sweep) / SR) * np.exp(-t * 9)
    click = highpass(rng.standard_normal(len(t)), 2500) * np.exp(-t * 220) * 0.25
    return (body + click) * level


def hat(open_: bool = False) -> np.ndarray:
    t = tt(0.16 if open_ else 0.045)
    return highpass(rng.standard_normal(len(t)), 7000) * np.exp(-t * (22 if open_ else 90)) * 0.5


def clap() -> np.ndarray:
    t = tt(0.22)
    bursts = sum(np.exp(-np.clip(t - d, 0, None) * 140) * (t >= d) for d in (0, 0.012, 0.024))
    return signal.sosfilt(signal.butter(2, [900, 3800], "band", fs=SR, output="sos"), rng.standard_normal(len(t))) * bursts * 0.4 * np.exp(-t * 14)


def sub(freq: float, dur: float) -> np.ndarray:
    t = tt(dur)
    env = np.minimum(t / 0.012, 1) * np.exp(-t * (1.6 / max(dur, 0.1)))
    return (np.sin(2 * np.pi * freq * t) + 0.25 * np.sin(4 * np.pi * freq * t)) * env


def pluck(freq: float, dur: float = 0.45) -> np.ndarray:
    t = tt(dur)
    tone = sum(a * np.sin(2 * np.pi * freq * k * t) * np.exp(-t * d) for k, a, d in ((1, 1.0, 7), (2, 0.5, 11), (3, 0.28, 16), (4, 0.12, 22)))
    return tone * np.minimum(t / 0.002, 1)


def bell(freq: float, dur: float = 1.6) -> np.ndarray:
    t = tt(dur)
    mod = 2.4 * np.exp(-t * 3.2) * np.sin(2 * np.pi * freq * 3.5 * t)
    return np.sin(2 * np.pi * freq * t + mod) * np.exp(-t * 2.6) * np.minimum(t / 0.003, 1)


def pad(freqs: list[float], dur: float, bright: float = 2200, attack: float = 0.9, release: float = 1.2) -> np.ndarray:
    t = tt(dur)
    voice = np.zeros_like(t)
    for f in freqs:
        for detune in (-0.07, 0.0, 0.08):
            fq = f * 2 ** (detune / 12)
            voice += sum(np.sin(2 * np.pi * fq * h * t + h) / h for h in range(1, 9))  # soft saw
    env = np.minimum(t / attack, 1) * np.minimum((dur - t) / release, 1).clip(0, 1)
    return lowpass(voice, bright) * env * (0.5 / max(len(freqs), 1))


def impact(dur: float = 0.9, level: float = 1.0) -> np.ndarray:
    t = tt(dur)
    boom = np.sin(2 * np.pi * np.cumsum(38 + 60 * np.exp(-t * 14)) / SR) * np.exp(-t * 4.2)
    air = lowpass(highpass(rng.standard_normal(len(t)), 600), 6000) * np.exp(-t * 6) * 0.35
    return (boom + air) * level


def riser(dur: float, level: float = 1.0, start_hz: float = 300, end_hz: float = 9000) -> np.ndarray:
    n = int(dur * SR)
    noise = rng.standard_normal(n)
    out = np.zeros(n)
    hop = SR // 40
    for a in range(0, n, hop):
        frac = a / n
        centre = start_hz * (end_hz / start_hz) ** frac
        sos = signal.butter(2, [centre * 0.6, min(centre * 1.6, SR / 2 - 200)], "band", fs=SR, output="sos")
        out[a : a + hop] = signal.sosfilt(sos, noise[a : a + hop] * 1.0)
    return out * (np.linspace(0, 1, n) ** 2.2) * level * 6


def reverse_tail(sig: np.ndarray) -> np.ndarray:
    return sig[::-1] * np.linspace(0, 1, len(sig)) ** 1.5


def tick(freq: float = 1800, level: float = 1.0) -> np.ndarray:
    t = tt(0.05)
    return np.sin(2 * np.pi * freq * t) * np.exp(-t * 110) * level * 0.7


# --------------------------------------------------------------------------- harmony

NOTE = {"A": 57, "B": 59, "C": 60, "D": 62, "E": 64, "F": 65, "G": 67}
COOL = [("A", [0, 3, 7, 10]), ("F", [0, 4, 7, 11]), ("C", [0, 4, 7, 11]), ("G", [0, 4, 7, 10])]  # Am7 Fmaj7 Cmaj7 G7: precise, a little cold
WARM = [("F", [0, 4, 7, 14]), ("A", [0, 3, 7, 10]), ("D", [0, 3, 7, 10]), ("C", [0, 4, 7, 14])]  # Fadd9 Am7 Dm7 Cadd9: warm, open


def chord_notes(prog: list, bar: int, octave: int = 0) -> list[int]:
    root, shape = prog[bar % len(prog)]
    base = NOTE[root] + 12 * octave
    return [base + s for s in shape]


def bar_starts(beat: str):
    start, end = B[beat]
    bar = BEAT * 4
    i = 0
    while start + i * bar < end - 1e-6:
        yield i, start + i * bar
        i += 1


# --------------------------------------------------------------------------- arrangement

def cool_groove(beat: str, intensity: float, ticks: bool = False) -> None:
    for i, t0 in bar_starts(beat):
        notes = chord_notes(COOL, i)
        root = notes[0] - 24
        for s in (0, 8):
            place("drums", kick(0.55 * intensity), t0 + s * TICK)
        for s in (2, 6, 10, 14):
            place("drums", hat(), t0 + s * TICK, 0.30 * intensity, pan=0.35)
        if ticks:
            for s in range(16):
                place("drums", hat(), t0 + s * TICK, 0.10 * intensity, pan=-0.3)
        place("bass", sub(midi(root), BEAT * 1.8), t0, 0.5 * intensity)
        place("bass", sub(midi(root), BEAT * 1.4), t0 + BEAT * 2.5, 0.38 * intensity)
        arp = [notes[k % 4] + (12 if k >= 4 else 0) for k in (0, 1, 2, 3, 2, 1, 3, 2)]
        for k, n in enumerate(arp):
            place("pluck", pluck(midi(n + 12), 0.4), t0 + k * BEAT / 2, 0.22 * intensity, pan=-0.4 + 0.8 * (k % 2))
        place("pad", pad([midi(n) for n in notes[:3]], BEAT * 4, bright=1400), t0, 0.5 * intensity)


def warm_bed(beat: str, intensity: float, shaker: bool = True) -> None:
    for i, t0 in bar_starts(beat):
        notes = chord_notes(WARM, i)
        place("pad", pad([midi(n) for n in notes], BEAT * 4.4, bright=2600, attack=1.2, release=1.6), t0, 0.75 * intensity)
        place("bass", sub(midi(notes[0] - 24), BEAT * 3.6), t0, 0.5 * intensity)
        if shaker:
            for s in range(0, 16, 2):
                swing = 0.018 if (s // 2) % 2 else 0
                place("drums", hat(), t0 + s * TICK + swing, 0.16 * intensity, pan=0.3)
        for k, n in ((0, notes[3]), (3, notes[2]), (5, notes[1])):
            place("pluck", pluck(midi(n + 12), 0.5), t0 + k * BEAT / 2, 0.16 * intensity, pan=0.2 * (k - 3) / 3)


def energetic(beat: str) -> None:
    for i, t0 in bar_starts(beat):
        notes = chord_notes(WARM, i)
        root = notes[0] - 24
        for q in range(4):
            place("drums", kick(0.85), t0 + q * BEAT)
        for q in (1, 3):
            place("drums", clap(), t0 + q * BEAT, 0.6)
        for s in range(16):
            place("drums", hat(open_=(s % 4 == 2)), t0 + s * TICK, (0.24 if s % 2 else 0.15) + (0.1 if s % 4 == 2 else 0), pan=0.25)
        for s in (0, 3, 6, 8, 11, 14):
            place("bass", sub(midi(root + (12 if s in (6, 14) else 0)), BEAT * 0.45), t0 + s * TICK, 0.45)
        for k in range(16):
            place("pluck", pluck(midi(notes[(k * 3) % 4] + 12 + (12 if k % 8 > 4 else 0)), 0.22), t0 + k * TICK, 0.14, pan=-0.5 + (k % 4) / 3)
        place("pad", pad([midi(n) for n in notes[:3]], BEAT * 4.2, bright=3200, attack=0.4, release=0.5), t0, 0.55)


def cut_hits() -> None:
    """A small thud and a breath of air on every cut, so the edit rhythm is heard as well as seen."""
    for name, (start, _end) in B.items():
        big = name in ("curiosity", "hook")
        place("fx", impact(1.0 if big else 0.45, 1.0 if big else 0.55), start, 0.6 if big else 0.5)


def hook() -> None:
    start, end = B["hook"]
    flash = REEL["flash_every"]
    notes = [57, 60, 64, 69]  # an A minor arpeggio, one note per flash
    for k, n in enumerate(notes):
        t0 = start + k * flash
        place("pluck", pluck(midi(n + 12), 0.5), t0, 0.5, pan=-0.5 + k / 3)
        place("drums", kick(0.7), t0)
        place("drums", hat(), t0 + flash / 2, 0.3)
    place("pad", pad([midi(45), midi(52), midi(57)], end - start + 1, bright=900, attack=0.3, release=0.5), start, 0.9)
    q = start + len(notes) * flash
    place("fx", riser(end - q, 0.55), q)  # builds under the question, lands on the cut


def companies() -> None:
    cool_groove("companies", 0.9)
    start, _ = B["companies"]
    first = start + snap((B["companies"][1] - start) * 0.18)
    for k in range(5):  # one soft ping per logo chip, a sixteenth-pair apart
        place("pluck", bell(midi(81 + (0, 3, 5, 7, 10)[k]), 0.9), first + k * TICK * 2, 0.16, pan=-0.4 + 0.2 * k)


def numbers() -> None:
    cool_groove("numbers", 1.0, ticks=True)
    a = B["numbers"][0] + TICK * 11  # the metrics land half a second apart
    for k in range(3):
        place("pluck", bell(midi(69 + (0, 7, 12)[k]), 1.2), a + k * BEAT, 0.2, pan=-0.3 + 0.3 * k)
    place("pluck", bell(midi(88), 2.2), CUES["award"], 0.34)  # the award
    place("pluck", bell(midi(93), 2.2), CUES["award"] + TICK, 0.18, pan=0.3)


def curiosity() -> None:
    start, end = B["curiosity"]
    place("fx", reverse_tail(riser(1.0, 0.7, 200, 4000)), start - 1.0)  # the heat gathers, then the cut
    warm_bed("curiosity", 1.0)
    for k, t0 in enumerate(CUES["tiles"]):
        n = (76, 79, 84)[k]
        place("pluck", bell(midi(n), 1.8), t0, 0.28, pan=-0.5 + 0.5 * k)


def builder() -> None:
    start, end = B["builder"]
    energetic("builder")
    for t0 in CUES["phases"]:
        place("fx", riser(0.5, 0.5, 400, 9000), t0 - 0.5)  # a quick lift into each new phase
        place("fx", impact(0.5, 0.5), t0)


def craft() -> None:
    cool_groove("craft", 0.8)
    f = CUES["fill"]
    for k in range(9):  # the pixel pattern fills outward, one note a step
        place("pluck", pluck(midi(69 + (0, 2, 4, 7, 9, 12, 14, 16, 19)[k]), 0.35), f + k * TICK * 1.1, 0.2, pan=-0.5 + k / 8)
    place("fx", riser(CUES["shrink"] - 0.9 - f, 0.4, 300, 7000), f + 0.9)
    place("fx", impact(1.1, 0.8), CUES["shrink"])
    place("pad", pad([midi(57), midi(64), midi(69)], 3.2, bright=3000, attack=0.2), CUES["shrink"], 0.5)
    place("pluck", bell(midi(81), 1.8), CUES["caption2"], 0.22)


def close() -> None:
    start, end = B["close"]
    # The years roll. Each tick lands where the digits pass, so the ticks slow down with the speed ramp.
    n_ticks = 17
    for k in range(1, n_ticks + 1):
        when = CUES["years_from"] + CUES["years_roll"] * (1 - (1 - k / n_ticks) ** 0.25)
        place("drums", tick(2200 - 70 * k), when, 0.6, pan=0.3)
    cool_groove("close", 0.7)
    # The groove thins as the pace drops: take the kicks and hats out from the middle of the beat on.
    place("pad", pad([midi(53), midi(60), midi(64), midi(72)], end - CUES["payoff"] + 1, bright=3400, attack=1.6, release=1.4), CUES["payoff"] - 0.4, 0.9)
    place("pluck", bell(midi(84), 2.6), CUES["payoff"] + 0.6, 0.26)
    place("pluck", bell(midi(79), 2.6), CUES["payoff"] + 1.7, 0.24, pan=0.3)


def endcard() -> None:
    start, end = B["endcard"]
    bar = BEAT * 4
    notes = [(57, [0, 7, 12, 16, 23]), (53, [0, 7, 12, 16, 21]), (60, [0, 7, 12, 16, 23]), (55, [0, 7, 12, 16, 19])]
    t = start
    i = 0
    while t < end - 1e-6:
        root, shape = notes[i % 4]
        place("pad", pad([midi(root + s) for s in shape[:4]], bar + 1.0, bright=2400, attack=0.7, release=1.0), t, 0.6)
        place("bass", sub(midi(root - 24), bar - 0.2), t, 0.45)
        for k, s in enumerate(shape):
            place("pluck", bell(midi(root + 24 + s), 1.3), t + k * BEAT * 0.5, 0.08, pan=-0.4 + 0.2 * k)
        t += bar
        i += 1
    for r in CUES["rings"]:
        place("pluck", bell(midi(93), 2.4), r, 0.18)


# --------------------------------------------------------------------------- reverb, mix, master

def reverb(x: np.ndarray, seconds: float = 2.6, wet: float = 0.3) -> np.ndarray:
    n = int(seconds * SR)
    t = np.arange(n) / SR
    ir = np.stack([rng.standard_normal(n) * np.exp(-t * 2.6), rng.standard_normal(n) * np.exp(-t * 2.6)], axis=1)
    ir = lowpass(ir.T, 5500).T
    ir[: int(0.02 * SR)] *= np.linspace(0, 1, int(0.02 * SR))[:, None]
    ir /= np.sqrt((ir**2).sum() / 2)
    wet_sig = np.stack([signal.fftconvolve(x[:, c], ir[:, c])[: len(x)] for c in (0, 1)], axis=1)
    return x + wet * 0.12 * wet_sig


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--wav", help="write a WAV here instead of the mp3")
    args = parser.parse_args()

    hook()
    companies()
    numbers()
    curiosity()
    builder()
    craft()
    close()
    endcard()
    cut_hits()

    sends = {"pad": 1.0, "pluck": 1.0, "fx": 0.6, "drums": 0.0, "bass": 0.0}
    mix = np.zeros((N, 2), np.float32)
    levels = {"drums": 0.9, "bass": 0.9, "pluck": 0.8, "pad": 0.75, "fx": 0.7}
    for name, stem in STEMS.items():
        dry = stem * levels[name]
        mix += reverb(dry, 3.0, sends[name]) if sends[name] else dry

    # Loop seam: ease out, then fold the reverb tail that spilled past the end back onto the start.
    end = int(DUR * SR)
    tail = mix[end:].copy()
    mix = mix[:end]
    mix[: len(tail)] += tail[: len(mix)]
    fade = int(REEL["loop_blend"] * SR)
    mix[-fade:] *= np.linspace(1, 0.18, fade)[:, None] ** 1.5

    # Master: remove rumble, tame the top, glue with a soft clip, then settle at -1 dBFS.
    mix = signal.sosfilt(signal.butter(2, 28, "high", fs=SR, output="sos"), mix, axis=0)
    mix = signal.sosfilt(signal.butter(2, 15500, "low", fs=SR, output="sos"), mix, axis=0)
    mix = np.tanh(mix * 1.15) / np.tanh(1.15)
    mix *= 10 ** (-1 / 20) / np.abs(mix).max()

    pcm = (mix * 32767).astype("<i2")
    out = Path(args.wav) if args.wav else Path(ROOT / "public/audio/music.wav")
    out.parent.mkdir(parents=True, exist_ok=True)
    with wave.open(str(out), "wb") as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(pcm.tobytes())
    if not args.wav:
        mp3 = out.with_suffix(".mp3")
        subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", str(out), "-c:a", "libmp3lame", "-b:a", "160k", str(mp3)], check=True)
        out.unlink()
        out = mp3
    rms = 20 * np.log10(np.sqrt((mix**2).mean()))
    print(f"{out}  {DUR:.1f}s  rms {rms:.1f} dBFS  peak {20 * np.log10(np.abs(mix).max()):.1f} dBFS", file=sys.stderr)


if __name__ == "__main__":
    main()
