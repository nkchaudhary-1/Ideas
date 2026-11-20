#!/usr/bin/env python3
"""Generates the nine sample photos in public/samples/ (900x1600, JPEG).

They are synthetic: a graded sky, a sun or moon, and layered hills, with film grain. They contain no real photographs.
Each one has a different palette, brightness and contrast so Match look, filters and batch edits have something to work on.
Run: python3 scripts/make-samples.py   (needs numpy and Pillow)
"""
import os
import numpy as np
from PIL import Image

W, H = 900, 1600
OUT = os.path.join(os.path.dirname(__file__), "..", "public", "samples")

# name, sky top, sky bottom, sun colour, sun (x, y, radius) as fractions, hill colours far to near, grain, haze, seed
SCENES = [
    ("sunrise",  "#ff9a6a", "#ffd8a8", "#fff3c9", (0.62, 0.40, 0.09), ["#9a5b6b", "#6d3f55", "#3b2336"], 7, 0.30, 11),
    ("forest",   "#7db7e0", "#dcefe6", "#ffffff", (0.28, 0.22, 0.07), ["#6b9a76", "#3f7355", "#1f4a38"], 6, 0.35, 12),
    ("dusk",     "#3b2a6b", "#e58aa0", "#ffd2a8", (0.70, 0.52, 0.08), ["#58396f", "#3a2653", "#1d1433"], 8, 0.25, 13),
    ("desert",   "#f2c66b", "#fbe9c2", "#fffaf0", (0.36, 0.30, 0.10), ["#d49a52", "#b3733a", "#8a4d2a"], 7, 0.20, 14),
    ("ocean",    "#4ea3b8", "#c9eef0", "#ffffff", (0.50, 0.34, 0.06), ["#5fb0b8", "#2f8a9a", "#17586b"], 5, 0.40, 15),
    ("fog",      "#9aa0a6", "#dfe2e4", "#f6f6f6", (0.55, 0.28, 0.05), ["#a9aeb2", "#7c8288", "#4f545a"], 6, 0.55, 16),
    ("neon",     "#14052e", "#ff3d9a", "#27e8ff", (0.45, 0.50, 0.12), ["#4a1a7a", "#27104d", "#0b0420"], 9, 0.12, 17),
    ("pastel",   "#cfe4ff", "#fff0f5", "#fff8d6", (0.72, 0.26, 0.08), ["#e8c9e6", "#c9d8f5", "#a9c4ea"], 4, 0.45, 18),
    ("night",    "#050b1f", "#1b3366", "#e9eefc", (0.30, 0.18, 0.05), ["#16264d", "#0d1832", "#060b18"], 9, 0.18, 19),
]


def rgb(hex_):
    h = hex_.lstrip("#")
    return np.array([int(h[i:i + 2], 16) for i in (0, 2, 4)], dtype=np.float32)


def render(scene):
    _, top, bottom, sun_c, (sx, sy, sr), hills, grain, haze, seed = scene
    rng = np.random.default_rng(seed)
    y = np.linspace(0, 1, H, dtype=np.float32)[:, None, None]
    x = np.linspace(0, 1, W, dtype=np.float32)[None, :, None]
    img = rgb(top) * (1 - y) + rgb(bottom) * y
    img = np.broadcast_to(img, (H, W, 3)).copy()

    # sun or moon with a soft glow
    d = np.sqrt(((x - sx) * W) ** 2 + ((y - sy) * H) ** 2)
    r = sr * W
    glow = np.clip(1 - d / (r * 5), 0, 1) ** 2.2 * 0.55
    disc = np.clip((r - d) / 3 + 0.5, 0, 1)
    img = img * (1 - glow) + rgb(sun_c) * glow
    img = img * (1 - disc) + rgb(sun_c) * disc

    # layered hills, far to near, each lower and darker, with haze between layers
    for i, col in enumerate(hills):
        base = 0.52 + i * 0.13
        amp = 0.05 + i * 0.012
        phase = rng.uniform(0, 6.28, 3)
        ridge = base + amp * (np.sin(x[0, :, 0] * 3.1 + phase[0]) + 0.5 * np.sin(x[0, :, 0] * 7.3 + phase[1]) + 0.25 * np.sin(x[0, :, 0] * 15.7 + phase[2]))
        mask = (y[:, :, 0] > ridge[None, :]).astype(np.float32)[:, :, None]
        edge = np.clip((y[:, :, 0] - ridge[None, :]) * H / 2 + 0.5, 0, 1)[:, :, None]
        mask = np.minimum(mask, edge) if i else edge * mask
        shade = rgb(col) * (1 - 0.18 * (y - base)) 
        fog = haze * (1 - i / max(1, len(hills))) * np.clip(1 - (y - base) * 4, 0, 1)
        shade = shade * (1 - fog) + rgb(bottom) * fog
        img = img * (1 - mask) + shade * mask

    # vignette and grain
    vig = 1 - 0.22 * (((x - 0.5) * 1.6) ** 2 + ((y - 0.5) * 1.1) ** 2)
    img = img * vig + rng.normal(0, grain, (H, W, 1)).astype(np.float32) * 1.0
    return Image.fromarray(np.clip(img, 0, 255).astype(np.uint8), "RGB")


if __name__ == "__main__":
    os.makedirs(OUT, exist_ok=True)
    for i, scene in enumerate(SCENES, 1):
        path = os.path.join(OUT, f"sample-{i}.jpg")
        render(scene).save(path, quality=84, optimize=True, subsampling=1)
        print(path, os.path.getsize(path) // 1024, "KB", scene[0])
