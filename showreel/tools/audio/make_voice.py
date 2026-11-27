#!/usr/bin/env python3
"""
Renders the reel's voiceover with Kokoro-82M, an open text-to-speech model (Apache-2.0, runs on a CPU,
no account, no credits). Each line is placed on the visual it describes, then the lot is mixed into one
file as long as the reel.

    pip install kokoro-onnx scipy numpy        # plus ffmpeg on the PATH
    python3 tools/audio/make_voice.py          # writes public/audio/vo.mp3
    python3 tools/audio/make_voice.py --voice bm_george
    python3 tools/audio/make_voice.py --verify # also transcribes the result and checks it hit its cues

The first run downloads the model (326 MB) and the chosen voice into tools/audio/.cache/, which is not
committed. Voices: af_heart (the model's highest-rated), af_bella, am_michael, am_adam, bm_george, bf_emma,
and more in the model's voices folder. `b` voices speak British English.

THE SCRIPT BELOW IS THE VOICEOVER. Every line has a time (a beat start plus an offset, or one of the cues
in reel_timing.py) and the words to say. Retime a beat and the lines move with it; reword a line and re-run.
A line that would run into the next one, or past the end of its beat, is sped up a little until it fits, and
the run stops with a clear message if it can't.
"""
from __future__ import annotations

import argparse
import subprocess
import sys
import urllib.request
import wave
from dataclasses import dataclass
from pathlib import Path

import numpy as np
from scipy import ndimage, signal

from reel_timing import B, CUES, DUR, ROOT

CACHE = Path(__file__).parent / ".cache"
HUGGING_FACE = "https://huggingface.co/onnx-community/Kokoro-82M-v1.0-ONNX/resolve/main"
SR = 24000  # the model's own sample rate

# How hard a line may be sped up to fit its window, and how much room to leave around it.
MAX_SPEED = 1.35
GAP_AFTER = 0.10  # seconds of air before the next line
BEAT_MARGIN = 0.12  # seconds before the cut at the end of a beat
SPEECH_RMS_DB = -19.0  # level of the speech itself, before the master
# A gentle compressor evens out loud and quiet words, so the voice stays above the music at a lower peak.
COMP_THRESHOLD_DB = -26.0
COMP_RATIO = 3.0


@dataclass
class Line:
    at: float  # when the first word starts, in seconds from the top of the reel
    text: str
    speed: float = 1.0
    phonemes: str | None = None  # say this instead of `text`, to fix a pronunciation (IPA, as the model spells it)


def at(beat: str, offset: float) -> float:
    """`offset` seconds after a beat starts."""
    return B[beat][0] + offset


# fmt: off
LINES = [
    # 1. Hook: the question lands as it is written on screen (2.0 s in).
    Line(at("hook", 0.25), "People always ask — you're a designer?", 1.05),
    Line(at("hook", 2.45), "So what do you actually do?", 1.05),

    # 2. Companies: the logo chips snap in from 1.5 s.
    Line(at("companies", 0.50), "Simple."),
    Line(at("companies", 1.50), "I build products that millions of people use, every single day."),

    # 3. Numbers: three counters roll from 1.4 s; the award chip pops at its cue, on the word "Game".
    Line(at("numbers", 1.10), "I've moved orders, lifted conversions, improved retention."),
    # A comma, not a dash: spoken after a dash the model clips "yeah" into "yes".
    Line(CUES["award"] - 0.95, "And yeah, a Game Changer Award along the way."),

    # 4. The real fuel: the viewfinder lands on each of the three tiles in turn.
    Line(at("curiosity", 0.30), "But honestly — I love this work because I'm endlessly curious.", 1.06),
    Line(at("curiosity", 3.95), "I see design everywhere:"),
    Line(CUES["tiles"][0] - 0.05, "a signboard,"),
    Line(CUES["tiles"][1] - 0.10, "a sunset,"),
    Line(CUES["tiles"][2] - 0.05, "some random little app."),

    # 5. Builder: the three phases change at their cues.
    Line(at("builder", 0.10), "So I never really stop."),
    Line(at("builder", 1.75), "New trend? I try it."),
    Line(CUES["phases"][0] + 0.15, "Boring repetitive task? I build a plugin for it."),
    Line(CUES["phases"][1] + 0.10, "AI? We're friends."),

    # 6. Craft: "to a whole system." is written on screen at its cue.
    Line(at("craft", 0.40), "One small screen or an entire design system — I'm in love with structure."),
    Line(CUES["caption2"] + 0.05, "The pixel, and the pattern."),

    # 7. Close: the years roll, then the payoff is written line by line.
    Line(CUES["years_from"] + 0.70, "Seven years in, and the excitement's exactly the same."),
    Line(CUES["payoff_lines"][0] + 0.05, "Because this isn't my job…"),
    Line(CUES["payoff_lines"][1] + 0.10, "it's my thing."),

    # 8. End card: the name slams in, then the line.
    # The name is said "NEE-lesh". If you say it "NEE-laysh", add phonemes="nˈiːleɪʃ" to this line.
    Line(at("endcard", 0.25), "Neelesh."),
    Line(at("endcard", 1.30), "Let's build something."),
]

# Words that must land on a visual. `--verify` reports how far each one is from its cue, in seconds.
ANCHORS = [
    ("Game", CUES["award"], "the award chip pops"),
    ("sign", CUES["tiles"][0], "the viewfinder lands on tile 1"),
    ("sunset", CUES["tiles"][1], "tile 2"),
    ("some", CUES["tiles"][2], "tile 3"),
    ("Neel", at("endcard", 0.125), "the name slams in"),
]
# fmt: on


# --------------------------------------------------------------------------- the model

def fetch(url: str, dest: Path) -> None:
    dest.parent.mkdir(parents=True, exist_ok=True)
    print(f"downloading {url.split('/')[-1]} …", file=sys.stderr)
    tmp = dest.with_suffix(dest.suffix + ".part")
    urllib.request.urlretrieve(url, tmp)
    tmp.rename(dest)


def load_model(voice: str):
    """Downloads the model and the voice on first use, and returns a ready Kokoro."""
    from kokoro_onnx import Kokoro

    model = CACHE / "model.onnx"
    if not model.exists():
        fetch(f"{HUGGING_FACE}/onnx/model.onnx", model)
    voices = CACHE / f"{voice}.npz"
    if not voices.exists():
        raw = CACHE / f"{voice}.bin"
        fetch(f"{HUGGING_FACE}/voices/{voice}.bin", raw)
        np.savez(voices, **{voice: np.fromfile(raw, dtype=np.float32).reshape(-1, 1, 256)})
        raw.unlink()
    return Kokoro(str(model), str(voices))


def speak(kokoro, line: Line, voice: str, speed: float) -> np.ndarray:
    samples, rate = kokoro.create(
        line.phonemes or line.text, voice=voice, speed=speed, lang="en-gb" if voice.startswith("b") else "en-us", is_phonemes=bool(line.phonemes)
    )
    assert rate == SR, f"expected {SR} Hz, got {rate}"
    return samples.astype(np.float32)


# --------------------------------------------------------------------------- shaping one line

def trim(x: np.ndarray) -> np.ndarray:
    """Cuts the silence the model leaves at each end, so a line's first word starts exactly when it is cued."""
    loud = np.abs(x) > 0.004
    if not loud.any():
        return x
    pad = int(0.012 * SR)
    first, last = np.argmax(loud), len(loud) - np.argmax(loud[::-1])
    y = x[max(first - pad, 0) : last + pad].copy()
    fade = int(0.008 * SR)
    y[:fade] *= np.linspace(0, 1, fade)
    y[-fade:] *= np.linspace(1, 0, fade)
    return y


def level(x: np.ndarray, target_db: float) -> np.ndarray:
    """Sets the RMS of the speech (ignoring the pauses) so every line sits at the same loudness."""
    active = x[np.abs(x) > 0.02]
    rms = np.sqrt((active**2).mean()) if len(active) else 1.0
    return x * (10 ** (target_db / 20) / rms)


# --------------------------------------------------------------------------- the whole voiceover

def render(voice: str):
    kokoro = load_model(voice)
    order = sorted(LINES, key=lambda l: l.at)
    placed: list[tuple[Line, np.ndarray, float]] = []

    for i, line in enumerate(order):
        beat_end = next(end for start, end in B.values() if start <= line.at < end)
        room = beat_end - BEAT_MARGIN
        if i + 1 < len(order) and order[i + 1].at < beat_end:
            room = min(room, order[i + 1].at - GAP_AFTER)

        speed = line.speed
        while True:
            clip = trim(speak(kokoro, line, voice, speed))
            if line.at + len(clip) / SR <= room:
                break
            speed *= 1.05
            if speed > MAX_SPEED:
                over = line.at + len(clip) / SR - room
                sys.exit(f'"{line.text}" runs {over:.2f}s past its window even at {MAX_SPEED}x. Shorten the line or give the beat more time.')
        if speed != line.speed:
            print(f"  sped up to {speed:.2f}x to fit: {line.text}", file=sys.stderr)
        placed.append((line, clip, speed))

    mix = np.zeros(int(DUR * SR), np.float32)
    for line, clip, _ in placed:
        i = int(round(line.at * SR))
        mix[i : i + len(clip)] += level(clip, SPEECH_RMS_DB)

    mix = signal.sosfilt(signal.butter(2, 70, "high", fs=SR, output="sos"), mix)  # no rumble
    mix = soften_peaks(compress(mix))
    mix *= 10 ** (-2 / 20) / max(np.abs(mix).max(), 1e-6)  # peak at -2 dBFS
    return mix, placed


def compress(x: np.ndarray) -> np.ndarray:
    """A feed-forward compressor: smooth the level, and turn down whatever is over the threshold."""
    level = 20 * np.log10(ndimage.uniform_filter1d(np.abs(x), int(0.02 * SR)) + 1e-6)
    gain_db = -np.clip(level - COMP_THRESHOLD_DB, 0, None) * (1 - 1 / COMP_RATIO)
    return x * 10 ** (ndimage.uniform_filter1d(gain_db, int(0.01 * SR)) / 20)


def soften_peaks(x: np.ndarray, drive: float = 3.0) -> np.ndarray:
    """A soft limiter. A few short peaks (the hard consonants) set how loud a voice can get, so squash them
    and the rest comes up by several dB at the same ceiling."""
    x = x / max(np.abs(x).max(), 1e-6)
    return np.tanh(drive * x) / np.tanh(drive)


def write(mix: np.ndarray, path: Path) -> None:
    pcm = (np.clip(mix, -1, 1) * 32767).astype("<i2")
    with wave.open(str(path), "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(pcm.tobytes())


def verify(placed) -> None:
    """Transcribes every line, checks the words, and reports how far each anchor word is from its cue."""
    from faster_whisper import WhisperModel
    from scipy.signal import resample_poly

    model = WhisperModel("small.en", device="cpu", compute_type="int8")
    wrong = 0
    heard: list[tuple[str, float]] = []
    for line, clip, _ in placed:
        segments, _ = model.transcribe(
            resample_poly(clip, 2, 3).astype(np.float32), word_timestamps=True, language="en", beam_size=5, initial_prompt="Neelesh, a product designer."
        )
        words = [w for s in segments for w in s.words]
        clean = lambda t: t.strip(" ,.?!:—…").lower()
        said = "".join(clean(w.word) for w in words).replace(" ", "")
        want = "".join(clean(w) for w in line.text.split()).replace(" ", "")
        if said != want:  # compared without spaces, so "sign board" and "signboard" agree
            wrong += 1
            print(f"  MISHEARD  wanted: {line.text}\n            heard:  {' '.join(clean(w.word) for w in words)}")
        heard += [(clean(w.word), line.at + w.start) for w in words]
    print(f"{len(placed) - wrong}/{len(placed)} lines transcribed word for word")
    for prefix, cue, why in ANCHORS:
        near = [(abs(t - cue), t) for w, t in heard if w.startswith(prefix.lower())]
        if near:
            t = min(near)[1]
            print(f"  {prefix:7s} lands at {t:6.2f}s, cue {cue:6.2f}s ({t - cue:+.2f}s)  {why}")
        else:
            print(f"  {prefix:7s} was not heard")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--voice", default="af_heart")
    parser.add_argument("--wav", help="write a WAV here instead of public/audio/vo.mp3")
    parser.add_argument("--verify", action="store_true", help="transcribe the result and report the timing of the anchor words")
    args = parser.parse_args()

    mix, placed = render(args.voice)
    out = Path(args.wav) if args.wav else ROOT / "public/audio/vo.wav"
    out.parent.mkdir(parents=True, exist_ok=True)
    write(mix, out)
    if not args.wav:
        mp3 = out.with_suffix(".mp3")
        subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", str(out), "-ar", "44100", "-c:a", "libmp3lame", "-b:a", "96k", str(mp3)], check=True)
        out.unlink()
        out = mp3
    speech = mix[np.abs(mix) > 0.02]
    print(f"{out}  {DUR:.1f}s  {len(placed)} lines  voice {args.voice}  speech rms {20 * np.log10(np.sqrt((speech**2).mean())):.1f} dBFS  peak {20 * np.log10(np.abs(mix).max()):.1f} dBFS", file=sys.stderr)
    if args.verify:
        verify(placed)


if __name__ == "__main__":
    main()
