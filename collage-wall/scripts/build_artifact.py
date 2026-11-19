#!/usr/bin/env python3
"""Build one self-contained HTML page of the wall (images embedded), for hosts that take a single file.

  python3 scripts/build_artifact.py   ->   artifact/page.html

Each visible, exported artwork is re-encoded to a 600 px tall WebP (viewer + wall) and a 150 px tall one
(far-out view) and embedded as data: URIs. The normal site keeps the full-resolution tiers.
"""
import base64
import io
import json
import re
import subprocess
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "artifact"


def uri(im, h, q):
    w = round(im.width * h / im.height)
    buf = io.BytesIO()
    im.resize((w, h), Image.LANCZOS).save(buf, "WEBP", quality=q, method=5)
    return "data:image/webp;base64," + base64.b64encode(buf.getvalue()).decode()


def main():
    OUT.mkdir(exist_ok=True)
    art = json.loads((ROOT / "src/data/artworks.json").read_text(encoding="utf-8"))
    out = []
    for a in art:
        if a["hidden"]:
            continue
        b = dict(a)
        if a["available"]:
            stem = a["image"].rsplit("/", 1)[1]
            im = Image.open(ROOT / "public/artworks" / stem).convert("RGB")
            b["thumbnail"] = uri(im, 600, 52)
            b["placeholder"] = uri(im, 150, 40)
        else:
            b["thumbnail"] = b["placeholder"] = ""
        b["image"] = ""
        out.append(b)
    (OUT / "artworks.json").write_text(json.dumps(out, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")

    subprocess.run(["npx", "vite", "build"], cwd=ROOT, check=True, env={**__import__("os").environ, "ARTIFACT": "1"})
    dist = ROOT / "dist-artifact"
    html = (dist / "index.html").read_text(encoding="utf-8")
    js_src = re.search(r'<script[^>]*src="\./(assets/[^"]+\.js)"', html).group(1)
    css_src = re.search(r'<link[^>]*href="\./(assets/[^"]+\.css)"', html).group(1)
    js = (dist / js_src).read_text(encoding="utf-8").replace("</script", "<\\/script")
    css = (dist / css_src).read_text(encoding="utf-8")
    page = f"""<title>Collage Wall</title>
<style>{css}</style>
<div id="root"></div>
<script type="module">{js}</script>
"""
    (OUT / "page.html").write_text(page, encoding="utf-8")
    print(f"{len(out)} artworks embedded | page.html {len(page) / 1e6:.1f} MB")


if __name__ == "__main__":
    main()
