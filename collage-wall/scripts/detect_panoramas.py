#!/usr/bin/env python3
"""Find posts that were designed as one wide photo split across two slides.

A "left half" bleeds off its right edge and its "right half" bleeds off its left edge; if the seam pixels match,
the two frames are one panorama (exactly like the 2160x1350 frames such as "Design Samwaad 3.0", which
Figma already holds as two joined slides). The halves can sit anywhere on the canvas.

Writes data/source/panoramas.json:  [{"left": "<figma id>", "right": "<figma id>", "score": 3.4}, ...]

Overrides (data/source/overrides.json):
  "panoramas": {"add": [["<left id>", "<right id>"]], "exclude": [["<left id>", "<right id>"]]}

Run after exporting images:  python3 scripts/detect_panoramas.py
"""
import json
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
MAX_SEAM = 20.0          # mean abs pixel difference across the seam (true pairs are mostly < 10)
TOP, BOT = 120, 1230     # stay clear of the rounded corners


def main():
    art = json.loads((ROOT / "src/data/artworks.json").read_text(encoding="utf-8"))
    over = json.loads((ROOT / "data/source/overrides.json").read_text()).get("panoramas", {})
    exclude = {tuple(p) for p in over.get("exclude", [])}
    cand = [a for a in art if a["available"] and not a.get("duplicateOf") and a["type"] == "portrait"]

    right_col, left_col, open_r, open_l = {}, {}, [], []
    for a in cand:
        im = np.asarray(Image.open(ROOT / f"public/artworks/{a['id']}.webp").convert("RGB")).astype(int)
        right_col[a["id"]], left_col[a["id"]] = im[TOP:BOT, -1], im[TOP:BOT, 0]
        # "bleeds" = the photo reaches the edge instead of the white canvas margin
        if not (im[TOP:BOT, -6:] > 245).all(axis=2).all(axis=1).mean() >= 0.3:
            open_r.append(a["id"])
        if not (im[TOP:BOT, :6] > 245).all(axis=2).all(axis=1).mean() >= 0.3:
            open_l.append(a["id"])

    fid = {a["id"]: a["figmaId"] for a in art}
    score = np.full((len(open_r), len(open_l)), 1e9)
    for i, a in enumerate(open_r):
        for j, b in enumerate(open_l):
            if a != b:
                score[i, j] = np.abs(right_col[a] - left_col[b]).mean()

    pairs = []
    for i, a in enumerate(open_r):
        j = int(score[i].argmin())
        b = open_l[j]
        # mutual best match only, so a frame can never belong to two panoramas
        if int(score[:, j].argmin()) == i and score[i, j] <= MAX_SEAM and (fid[a], fid[b]) not in exclude:
            pairs.append({"left": fid[a], "right": fid[b], "score": round(float(score[i, j]), 1)})
    have = {(p["left"], p["right"]) for p in pairs}
    for l, r in over.get("add", []):
        if (l, r) not in have:
            pairs.append({"left": l, "right": r, "score": 0})
    pairs.sort(key=lambda p: p["score"])
    (ROOT / "data/source/panoramas.json").write_text(json.dumps(pairs, indent=1))
    print(f"{len(pairs)} panorama pairs")


if __name__ == "__main__":
    main()
