#!/usr/bin/env python3
"""Join each detected panorama pair into one wide artwork (2160x1350) and write its three image tiers.

Reads  data/source/panoramas.json  (scripts/detect_panoramas.py)
Writes public/artworks/<left id>-pano.webp, public/thumbnails/{md,xs}/<left id>-pano.webp
and an entry "pano:<left figma id>" in data/source/assets.json.
"""
import hashlib
import io
import json
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent


def avg_color(im):
    w, h = im.size
    px = im.convert("RGB").crop((int(w * .2), int(h * .2), int(w * .8), int(h * .8))).resize((1, 1), Image.BOX).getpixel((0, 0))
    return "#%02x%02x%02x" % px


def save(im, path, h, q):
    w = round(im.width * h / im.height)
    out = im if im.height == h else im.resize((w, h), Image.LANCZOS)
    buf = io.BytesIO()
    out.save(buf, "WEBP", quality=q, method=5)
    path.write_bytes(buf.getvalue())
    return buf.getvalue()


def main():
    art = json.loads((ROOT / "src/data/artworks.json").read_text(encoding="utf-8"))
    aid = {a["figmaId"]: a["id"] for a in art}
    pairs = json.loads((ROOT / "data/source/panoramas.json").read_text())
    assets_p = ROOT / "data/source/assets.json"
    assets = json.loads(assets_p.read_text())
    n = 0
    for p in pairs:
        l, r = aid.get(p["left"]), aid.get(p["right"])
        if not l or not r or p["left"] not in assets or p["right"] not in assets:
            continue
        A = Image.open(ROOT / f"public/artworks/{l}.webp").convert("RGB")
        B = Image.open(ROOT / f"public/artworks/{r}.webp").convert("RGB")
        joined = Image.new("RGB", (A.width + B.width, A.height), (255, 255, 255))
        joined.paste(A, (0, 0))
        joined.paste(B, (A.width, 0))
        full = save(joined, ROOT / f"public/artworks/{l}-pano.webp", joined.height, 80)
        md = save(joined, ROOT / f"public/thumbnails/md/{l}-pano.webp", 675, 72)
        xs = save(joined, ROOT / f"public/thumbnails/xs/{l}-pano.webp", 225, 60)
        assets[f"pano:{p['left']}"] = {
            "w": joined.width, "h": joined.height,
            "color": avg_color(Image.open(io.BytesIO(xs))),
            "bytes": len(full),
            "hash": hashlib.md5(Image.open(io.BytesIO(md)).convert("RGB").tobytes()).hexdigest(),
        }
        n += 1
    assets_p.write_text(json.dumps(assets, indent=0, sort_keys=True))
    print(f"joined {n} panoramas")


if __name__ == "__main__":
    main()
