"""Builds assets/ from the layers exported from the Figma page "Final" (node 17:856).
usage: python3 prep_assets.py <folder with the exported layers>   (film/assets in this repo)
Images become WebP (alpha kept), duplicate SVGs are merged. assets/ is gitignored because it holds the couple's photos."""
import sys, os, shutil
from PIL import Image
src = sys.argv[1]; out = os.path.join(os.path.dirname(__file__), "assets"); os.makedirs(out, exist_ok=True)
def webp(name, to, q=92):
    im = Image.open(os.path.join(src, name)).convert("RGBA"); im.save(os.path.join(out, to), "WEBP", quality=q, method=6, alpha_quality=100)
    print(f"{to:22s} {im.size} {os.path.getsize(os.path.join(out, to))//1024} KB")
def cp(name, to): shutil.copy(os.path.join(src, name), os.path.join(out, to)); print(f"{to:22s} svg")
webp("f1-ganesha.png", "ganesha.webp"); cp("f1-arch.svg", "s1-arch.svg"); cp("f1-calligraphy.svg", "calligraphy.svg")
webp("f2-photo.png", "couple.webp", 90); cp("f2-mask2.svg", "arch-mask.svg"); cp("f2-grad1.svg", "arch-gradient.svg"); cp("f2-grad2.svg", "arch-gradient-2.svg")
webp("f3-lotus.png", "lotus.webp")
webp("f4-arch-bg.png", "s4-arches.webp", 90); webp("f4-hand-L.png", "hand-left.webp"); webp("f4-hand-R.png", "hand-right.webp"); cp("f4-bloom.svg", "s4-bloom.svg")
webp("f5-chhatri.png", "chhatri.webp")
webp("f6-riverside.png", "ghat.webp", 90)
