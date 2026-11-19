#!/usr/bin/env python3
"""Build the website manifest from the Figma frame snapshot.

Inputs
  data/source/frames.json     every top-level frame on the Figma "Edited" page (id, name, x, y, size, layer stats)
  data/source/overrides.json  hand-edited labels, row titles, collection titles, exclusions, layout numbers
  data/source/assets.json     written by process_exports.py (real pixel size + average colour per exported frame)

Outputs (imported by the app)
  src/data/artworks.json   one record per artwork (a slide, or a 2160-wide spread)
  src/data/rows.json       rows in display order; each row lists artwork ids
  src/data/collections.json  clusters of rows (derived from the larger vertical gaps on the Figma canvas)
  src/data/layout.json     global layout numbers (row height, gaps)

Rules (all derived from the Figma canvas, nothing is invented)
  * A frame is an artwork when it sits in the 10-column post grid and is 1080x1350 or 2160x1350.
  * Reading order is canvas line (y) then x. Each canvas line becomes a row.
  * A canvas gap larger than one normal line gap starts a new collection.
  * Consecutive artworks with the same frame name form a carousel.
  * Labels come from frame names; overrides.json wins.

Run:  python3 scripts/build_manifest.py
"""
import collections
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "data" / "source"
OUT = ROOT / "src" / "data"

HANDLE = "nkchaudhary01"
GRID_X_MIN, GRID_X_MAX = -25000, -14000
LINE_PITCH = 1500  # 1350 frame + 150 gap on the Figma canvas


def load(name, default=None):
    p = SRC / name
    if p.exists():
        return json.loads(p.read_text(encoding="utf-8"))
    return default


def clean_label(name: str) -> str:
    s = re.sub(r"\s+", " ", (name or "").strip())
    if re.fullmatch(r"Frame \d+", s):
        return ""
    s = re.sub(r"^(Location)\s*:\s*", r"\1: ", s)
    return s


def main():
    frames_doc = load("frames.json")
    overrides = load("overrides.json", {})
    assets = load("assets.json", {})
    label_over = overrides.get("labels", {})
    hidden = set(overrides.get("hidden", []))
    row_titles = overrides.get("rowTitles", {})          # keyed by first figmaId in the row
    coll_titles = overrides.get("collectionTitles", {})  # keyed by first figmaId in the collection
    cat_over = overrides.get("categories", {})
    tag_over = overrides.get("tags", {})
    layout = {
        "rowHeight": 360,
        "gap": 14,
        "carouselGap": 6,
        "rowGap": 88,
        "collectionGap": 240,
        "labelHeight": 26,
        **overrides.get("layout", {}),
    }

    frames = frames_doc["frames"]
    posts, excluded = [], []
    for f in frames:
        on_grid = GRID_X_MIN <= f["x"] <= GRID_X_MAX
        sized = f["h"] == 1350 and f["w"] in (1080, 2160)
        if f["id"] in hidden:
            excluded.append({"figmaId": f["id"], "name": f["name"], "reason": "hidden in overrides"})
        elif not on_grid:
            excluded.append({"figmaId": f["id"], "name": f["name"], "reason": "outside the 10-column post grid (scratch / board)"})
        elif not sized:
            excluded.append({"figmaId": f["id"], "name": f["name"], "reason": "not a post-sized frame"})
        else:
            posts.append(f)

    # reading order: canvas line, then x
    lines = collections.defaultdict(list)
    for f in posts:
        lines[f["y"]].append(f)
    ys = sorted(lines)
    for y in ys:
        lines[y].sort(key=lambda f: f["x"])
    ordered = [f for y in ys for f in lines[y]]

    # exact duplicates: a frame that renders pixel-for-pixel like the previous kept frame of the same name
    # (Figma "duplicate" left in place). They stay in artworks.json but are hidden from the wall.
    keep_dups = set(overrides.get("keepDuplicates", []))
    dup_of, kept_prev = {}, None
    for f in ordered:
        h = assets.get(f["id"], {}).get("hash")
        if kept_prev and h and f["name"] == kept_prev["name"] and h == assets.get(kept_prev["id"], {}).get("hash") \
                and f["id"] not in keep_dups:
            dup_of[f["id"]] = kept_prev["id"]
        else:
            kept_prev = f
    aid_of = {f["id"]: f"artwork-{i:03d}" for i, f in enumerate(ordered, start=1)}

    # panoramas: two slides that carry one photo across the seam become one wide artwork (placed where the
    # left half sits); the right half stays in the data but is hidden from the wall
    pano_right, joined_into = {}, {}
    if overrides.get("joinPanoramas", True):
        for p in load("panoramas.json", []):
            l, r = p["left"], p["right"]
            if l in aid_of and r in aid_of and l not in dup_of and r not in dup_of \
                    and f"pano:{l}" in assets and l not in joined_into and r not in pano_right \
                    and l not in pano_right.values() and r not in joined_into:
                pano_right[l] = r
                joined_into[r] = l
    visible = [f for f in ordered if f["id"] not in dup_of and f["id"] not in joined_into]
    vis_order = {f["id"]: n for n, f in enumerate(visible, start=1)}

    # collections from vertical gaps
    coll_of_line, c = {}, 0
    for i, y in enumerate(ys):
        if i and y - ys[i - 1] > LINE_PITCH:
            c += 1
        coll_of_line[y] = c
    n_coll = c + 1

    row_id_of_line = {y: f"row-{i + 1:02d}" for i, y in enumerate(ys)}
    coll_id = lambda i: f"collection-{i + 1:02d}"

    # carousels: consecutive same name in reading order
    runs, cur = [], [visible[0]]
    for f in visible[1:]:
        if f["name"] == cur[-1]["name"]:
            cur.append(f)
        else:
            runs.append(cur)
            cur = [f]
    runs.append(cur)
    carousel_of, slide_of, count_of = {}, {}, {}
    ci = 0
    for r in runs:
        if len(r) > 1:
            ci += 1
            for k, f in enumerate(r):
                carousel_of[f["id"]] = f"carousel-{ci:03d}"
                slide_of[f["id"]] = k + 1
                count_of[f["id"]] = len(r)

    # Location per collection (most common "Location : X")
    loc_re = re.compile(r"^Location\s*:\s*(.+)$", re.I)
    coll_frames = collections.defaultdict(list)
    for y in ys:
        coll_frames[coll_of_line[y]].extend(lines[y])

    def coll_title(i):
        first = coll_frames[i][0]["id"]
        if first in coll_titles:
            return coll_titles[first]
        locs = collections.Counter(m.group(1).strip() for f in coll_frames[i] if (m := loc_re.match(f["name"] or "")))
        top = locs.most_common(1)[0] if locs else None
        if top and top[1] >= 4 and top[1] / len(coll_frames[i]) >= 0.4:
            return top[0]
        return f"Collection {i + 1:02d}"

    coll_names = {i: coll_title(i) for i in range(n_coll)}

    artworks, rows = [], []
    prev_row = None
    first_in_row = set()
    for y in ys:
        first_in_row.add(next(f for f in lines[y] if f["id"] not in dup_of)["id"])

    for idx, f in enumerate(ordered, start=1):
        aid = f"artwork-{idx:03d}"
        y = f["y"]
        is_pano = f["id"] in pano_right
        wide = f["w"] == 2160 or is_pano
        a = assets.get(f"pano:{f['id']}" if is_pano else f["id"], {})
        ow, oh = a.get("w", f["w"]), a.get("h", f["h"])
        label = label_over.get(f["id"], clean_label(f["name"]))
        is_run_start = f["id"] not in slide_of or slide_of[f["id"]] == 1
        show = bool(label) and (is_run_start or f["id"] in first_in_row)
        extra_texts = [t for t in f["texts"] if t != HANDLE and not loc_re.match(t or "")]
        if wide:
            composition = "spread"
        elif f["photos"] >= 2:
            composition = "collage"
        elif extra_texts:
            composition = "photo-type"
        else:
            composition = "photo"
        tags = [("wide" if wide else "portrait"), composition]
        if is_pano:
            tags.append("panorama")
        if f["id"] in carousel_of:
            tags.append("carousel")
        if extra_texts:
            tags.append("typography")
        tags = tag_over.get(f["id"], tags)
        h = layout["rowHeight"]
        w = round(h * ow / oh)
        artworks.append({
            "id": aid,
            "figmaId": f["id"],
            "name": f["name"],
            "label": label,
            "showLabel": show,
            "image": f"/artworks/{aid}{'-pano' if is_pano else ''}.webp",
            "thumbnail": f"/thumbnails/md/{aid}{'-pano' if is_pano else ''}.webp",
            "placeholder": f"/thumbnails/xs/{aid}{'-pano' if is_pano else ''}.webp",
            "originalWidth": ow,
            "originalHeight": oh,
            "aspectRatio": round(ow / oh, 4),
            "displayWidth": w,
            "displayHeight": h,
            "type": "wide" if wide else "portrait",
            "composition": composition,
            "category": cat_over.get(f["id"], coll_names[coll_of_line[y]]),
            "tags": tags,
            "collection": coll_id(coll_of_line[y]),
            "carouselId": carousel_of.get(f["id"]),
            "slideIndex": slide_of.get(f["id"], 1),
            "slideCount": count_of.get(f["id"], 1),
            "color": a.get("color", "#2a2a2a"),
            "available": f["id"] in assets,
            "hidden": f["id"] in dup_of or f["id"] in joined_into,
            "duplicateOf": dup_of.get(f["id"]),
            "panorama": {"left": aid, "right": aid_of[pano_right[f["id"]]]} if is_pano else None,
            "joinedInto": aid_of[joined_into[f["id"]]] if f["id"] in joined_into else None,
            "rowId": row_id_of_line[y],
            "order": vis_order.get(f["id"], 0),
        })

    by_row = collections.defaultdict(list)
    for a in artworks:
        if not a["hidden"]:
            by_row[a["rowId"]].append(a)
    for i, y in enumerate(ys):
        rid = row_id_of_line[y]
        items = by_row[rid]
        if not items:   # every frame on this canvas line was a hidden duplicate / joined half
            continue
        first = items[0]
        title = row_titles.get(first["figmaId"], "")
        if not title and first["carouselId"] and first["slideIndex"] == 1 and first["slideCount"] >= 3 \
                and loc_re.match(first["name"] or ""):
            title = first["label"]
            first["showLabel"] = False  # the row heading already says it
        rows.append({
            "id": rid,
            "title": title,
            "order": len(rows) + 1,
            "collectionId": coll_id(coll_of_line[y]),
            "artworks": [a["id"] for a in items],
        })

    colls = []
    for i in range(n_coll):
        rids = [row_id_of_line[y] for y in ys if coll_of_line[y] == i and by_row[row_id_of_line[y]]]
        colls.append({
            "id": coll_id(i),
            "title": coll_names[i],
            "order": i + 1,
            "rowIds": rids,
            "count": sum(len(by_row[r]) for r in rids),
        })

    OUT.mkdir(parents=True, exist_ok=True)
    for name, data in (("artworks", artworks), ("rows", rows), ("collections", colls), ("layout", layout)):
        (OUT / f"{name}.json").write_text(json.dumps(data, ensure_ascii=False, indent=1), encoding="utf-8")
    (SRC / "excluded.json").write_text(json.dumps(excluded, ensure_ascii=False, indent=1), encoding="utf-8")

    # label review sheet: every public label with a flag where the frame name is probably not a good public label
    def flags(a):
        l, out = a["label"], []
        if not l:
            out.append("empty")
        if re.fullmatch(r"[A-Za-z]{1,6}\d+", l):
            out.append("code")
        if l.endswith("...") or len(l) <= 3:
            out.append("fragment")
        if re.match(r"^(and|or|the|of|to|a|in|on|at|for|with|but|so|if|my|our|your)\b", l) and len(l.split()) <= 3:
            out.append("sentence-fragment")
        return out
    lines_out = ["artwork,figmaId,row,label,flags"]
    for a in artworks:
        if not a["hidden"]:
            lines_out.append(",".join(['"%s"' % x.replace('"', '""') for x in (a["id"], a["figmaId"], a["rowId"], a["label"], " ".join(flags(a)))]))
    (SRC / "label-review.csv").write_text("\n".join(lines_out), encoding="utf-8")

    missing = [a["figmaId"] for a in artworks if a["figmaId"] not in assets]
    print(f"artworks {len(artworks)} ({len(dup_of)} duplicates hidden, {len(pano_right)} panoramas joined) | rows {len(rows)} | collections {len(colls)} | carousels {ci}")
    print(f"excluded {len(excluded)} | exported assets missing for {len(missing)}")


if __name__ == "__main__":
    main()
