#!/usr/bin/env python3
"""Export every artwork that has no image yet, straight from Figma's REST API.

This is the fast path: a few requests instead of one tool call per frame.

  FIGMA_TOKEN=figd_xxx python3 scripts/export_missing.py          # on your own machine
  python3 scripts/export_missing.py                                # in a session where the token is injected by a proxy

The token needs the "file_content:read" scope (Figma > Settings > Security > Personal access tokens).
Frames are rendered at 1x (1080x1350, or 2160x1350 for spreads), then converted to the three web
tiers by process_exports.py and the manifest is rebuilt.
"""
import json
import os
import subprocess
import sys
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
FILE_KEY = json.loads((ROOT / "data/source/frames.json").read_text())["file"]
CHUNK = 40


def api(url: str) -> dict:
    cmd = ["curl", "-sS", "--max-time", "180", "-w", "\n%{http_code}"]
    token = os.environ.get("FIGMA_TOKEN")
    if token:
        cmd += ["-H", f"X-Figma-Token: {token}"]
    out = subprocess.run(cmd + [url], capture_output=True, text=True).stdout
    body, _, code = out.rpartition("\n")
    if code != "200":
        sys.exit(f"Figma API answered HTTP {code}: {body[:200]}\n"
                 "Check that the token is valid and has the file_content:read scope.")
    return json.loads(body)


def main():
    art = json.loads((ROOT / "src/data/artworks.json").read_text(encoding="utf-8"))
    todo = [a["figmaId"] for a in art if not a["available"]]
    if not todo:
        print("Nothing to export - every artwork already has an image.")
        return
    print(f"{len(todo)} frames to export")
    lines = []
    for i in range(0, len(todo), CHUNK):
        ids = todo[i:i + CHUNK]
        res = api(f"https://api.figma.com/v1/images/{FILE_KEY}?ids={','.join(ids)}&format=png&scale=1")
        if res.get("err"):
            sys.exit(f"Figma error: {res['err']}")
        for fid, url in res["images"].items():
            if url:
                lines.append(f"{fid} {url}")
            else:
                print(f"  no render returned for {fid}")
        print(f"  requested {min(i + CHUNK, len(todo))}/{len(todo)}")
    with tempfile.NamedTemporaryFile("w", suffix=".txt", delete=False) as f:
        f.write("\n".join(lines))
    # process in slices so one bad download does not lose the rest
    sub = ["python3", str(ROOT / "scripts/process_exports.py")]
    for i in range(0, len(lines), 60):
        part = Path(f.name + f".{i}")
        part.write_text("\n".join(lines[i:i + 60]))
        subprocess.run(sub + [str(part)], check=True)
        part.unlink()
    os.unlink(f.name)
    subprocess.run(["python3", str(ROOT / "scripts/build_manifest.py")], check=True)


if __name__ == "__main__":
    main()
