#!/usr/bin/env python3
"""Download exported Figma frames and turn them into the three web image tiers.

Usage:  python3 scripts/process_exports.py MAPFILE
MAPFILE has one line per frame:  <figma node id> <asset uuid or full url>

Tiers (height-based so portrait 4:5 and wide 1.6:1 frames scale alike)
  public/artworks/<id>.webp          full size (1350 px tall, the Figma frame at 1x)
  public/thumbnails/md/<id>.webp     675 px tall   (wall at normal zoom)
  public/thumbnails/xs/<id>.webp     225 px tall   (wall zoomed far out, and blur-up placeholder)

Also records real pixel size, an average photo colour and a pixel hash (to spot duplicate frames) per frame
in data/source/assets.json.
"""
import hashlib
import io
import json
import sys
import subprocess
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
ART = json.loads((ROOT / "src/data/artworks.json").read_text(encoding="utf-8"))
BY_FIGMA = {a["figmaId"]: a for a in ART}
ASSETS = ROOT / "data/source/assets.json"
BASE = "https://www.figma.com/api/mcp/asset/"


def fetch(url):
    """curl, not urllib: the sandbox proxy answers urllib with an empty 202."""
    last = None
    for _ in range(4):
        r = subprocess.run(["curl", "-sfL", "--max-time", "90", url], capture_output=True)
        if r.returncode == 0 and r.stdout[:4] == b"\x89PNG":
            return r.stdout
        last = f"curl exit {r.returncode}, {len(r.stdout)} bytes"
    raise RuntimeError(f"download failed: {url}: {last}")


def avg_color(im):
    w, h = im.size
    box = (int(w * .2), int(h * .2), int(w * .8), int(h * .8))
    px = im.convert("RGB").crop(box).resize((1, 1), Image.BOX).getpixel((0, 0))
    return "#%02x%02x%02x" % px


def tier(im, h, q):
    w = round(im.width * h / im.height)
    out = im.resize((w, h), Image.LANCZOS) if im.height != h else im
    buf = io.BytesIO()
    out.save(buf, "WEBP", quality=q, method=5)
    return buf.getvalue()


def handle(line):
    fid, ref = line.split()
    art = BY_FIGMA[fid]
    url = ref if ref.startswith("http") else f"{BASE}{ref}.png"
    im = Image.open(io.BytesIO(fetch(url)))
    im.load()
    if im.mode in ("RGBA", "LA", "P"):
        bg = Image.new("RGB", im.size, (255, 255, 255))
        bg.paste(im.convert("RGBA"), mask=im.convert("RGBA").split()[-1])
        im = bg
    else:
        im = im.convert("RGB")
    aid = art["id"]
    full = tier(im, 1350, 78) if im.height == 1350 else tier(im, im.height, 78)
    (ROOT / "public/artworks" / f"{aid}.webp").write_bytes(full)
    md = tier(im, 675, 72)
    (ROOT / "public/thumbnails/md" / f"{aid}.webp").write_bytes(md)
    xs_b = tier(im, 225, 60)
    (ROOT / "public/thumbnails/xs" / f"{aid}.webp").write_bytes(xs_b)
    xs = Image.open(io.BytesIO(xs_b))
    digest = hashlib.md5(Image.open(io.BytesIO(md)).convert("RGB").tobytes()).hexdigest()
    return fid, {"w": im.width, "h": im.height, "color": avg_color(xs), "bytes": len(full), "hash": digest}


def main():
    lines = [l.strip() for l in Path(sys.argv[1]).read_text().splitlines() if l.strip()]
    assets = json.loads(ASSETS.read_text()) if ASSETS.exists() else {}
    with ThreadPoolExecutor(8) as ex:
        for fid, rec in ex.map(handle, lines):
            assets[fid] = rec
    ASSETS.write_text(json.dumps(assets, indent=0, sort_keys=True))
    print(f"processed {len(lines)} | total exported {len(assets)}")


if __name__ == "__main__":
    main()
