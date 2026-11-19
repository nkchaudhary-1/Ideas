# Collage Wall

An editorial, horizontally flowing wall of Instagram post designs. The artwork is exported straight from the
Figma file (`Photo Edits` → page `Edited`) and laid out in rows, the way it sits on the Figma canvas.

```
npm install
npm run dev        # http://localhost:5173
npm run build      # type-check + production build into dist/
```

Deploys as a static site (see `vercel.json`: immutable caching for images and assets).

## What you get

| | |
|---|---|
| **Wall** | 58 rows, 473 artworks. Each row flows left to right; carousels sit tighter than neighbouring posts; the gap opens up between collections. |
| **Navigate** | Drag (with inertia), trackpad/mouse scroll, `Shift`+scroll sideways, arrow keys, touch drag. |
| **Zoom** | Pinch, `Ctrl/⌘`+scroll, `+` / `−`, on-screen buttons, live percentage, **Fit** (whole wall, `F`), **Reset** (`0`). |
| **Hover** | Slight scale + outline, label brightens and reveals its collection. |
| **Focused view** | Click a post: it grows out of its tile. `←` `→` step through the wall in order (carousel slides are adjacent), `Esc` closes, swipe on touch. Every post has a deep link (`#artwork-123`). |
| **Index** | A small panel that flies the camera to any collection. |

The artwork is shown exactly as designed: whole Figma frames, never cropped or re-created. Each 2160×1350
spread (two slides carrying one photo) is one wide artwork.

## How the data works

Nothing about the layout is hard-coded in components.

```
data/source/frames.json      snapshot of every top-level frame on the Figma page (id, name, x/y, size, layer stats)
data/source/overrides.json   YOUR edits: labels, row titles, collection titles, categories, tags, hidden frames, layout numbers
data/source/assets.json      written by the export step: real pixel size + average colour per exported frame
        │
        ▼  python3 scripts/build_manifest.py   (npm run manifest)
src/data/artworks.json       one record per artwork
src/data/rows.json           rows in order, each listing artwork ids
src/data/collections.json    clusters of rows
src/data/layout.json         row height, gaps
```

### Rules the generator follows (all taken from the Figma canvas)

* **Artwork** = a frame in the 10-column post grid that is 1080×1350 or 2160×1350. Everything else (scratch frames
  `DS1–4`, `PUC1–2`, `Frame 1–9`, `A`, `Post`, the Dharamshala photo board and caption doc) is listed in
  `data/source/excluded.json` and left out.
* **Reading order** = canvas line (y), then x. **Each canvas line is a row.**
* **Collection** = a run of lines; a vertical gap larger than the normal line pitch starts a new one (21 found).
* **Carousel** = consecutive artworks with the same frame name. This is a heuristic (Figma names a frame after
  its text, so a shared location tag also produces the same name); it only controls spacing and label repeats.
* **Duplicates** = a frame that renders pixel-for-pixel like the previous frame of the same name (7 found so far,
  all `Anupama…` slides). They stay in `artworks.json` (`hidden`, `duplicateOf`) but are not drawn.
  Keep one with `"keepDuplicates": ["<figma id>"]` in `overrides.json`.
* **Panoramas** = two slides carrying one photo across the seam (27 found so far). `detect_panoramas.py` matches
  the right edge of one frame to the left edge of another, wherever they sit on the canvas. Each pair is joined into
  one 2160×1350 artwork at the left half's position; the right half is hidden (`joinedInto`). Turn off with
  `"joinPanoramas": false`; correct with `"panoramas": {"add": [[left, right]], "exclude": [[left, right]]}`.
* **Label** = the frame name, tidied. It is drawn once per carousel and again at the start of each row.
  Generic names (`Frame 12`) become empty.
* A row whose first carousel is `Location : X` (3+ slides) gets `Location: X` as a row heading.

### Reviewing labels

`data/source/label-review.csv` lists every public label with flags (`code` such as `Anu12`, `fragment`,
`sentence-fragment` such as `and...`). Frame names are often the first words of a caption, so they make odd labels;
fix them in `overrides.json` → `labels`.

### Editing

Edit `data/source/overrides.json` (keys are Figma node ids, visible in `data/source/frames.json`), then run
`npm run manifest`:

```jsonc
{
  "labels":            { "721:3773": "Today's weather" },     // override a public label ("" hides it)
  "hidden":            [ "721:4301" ],                         // drop a frame from the wall
  "rowTitles":         { "721:3773": "Home" },                 // heading above the row that starts with this frame
  "collectionTitles":  { "721:3773": "Everyday" },             // name a collection (key = its first frame)
  "categories":        { "721:3773": "Food" },
  "tags":              { "721:3773": ["food", "typography"] },
  "layout":            { "rowHeight": 420, "gap": 18 }         // world-space numbers
}
```

Rows, order and row membership come from the Figma canvas; to reorder, move frames in Figma (or hide them) and
refresh `frames.json`.

## Images

Three tiers per artwork, all WebP, chosen by on-screen size so far-out views stay light:

| tier | size | folder |
|---|---|---|
| `xs` | 225 px tall | `public/thumbnails/xs/` (also the placeholder) |
| `md` | 675 px tall | `public/thumbnails/md/` (default wall view) |
| `full` | 1350 px tall (the Figma frame at 1×) | `public/artworks/` (zoomed in + focused view) |

Only artworks near the viewport mount an `<img>`; everything else is an empty slot.

### Exporting from Figma

`scripts/export_missing.py` exports every artwork that has no image yet through the Figma REST API
(needs a personal access token with `file_content:read`):

```
FIGMA_TOKEN=figd_xxx python3 scripts/export_missing.py
```

It renders at 1×, converts to the three tiers, records size + colour + a pixel hash in `assets.json`, then runs
duplicate detection, panorama detection + joining and rebuilds the manifest. To redo only the derived steps:

```
python3 scripts/build_manifest.py && python3 scripts/detect_panoramas.py && python3 scripts/build_panoramas.py && python3 scripts/build_manifest.py
```
Unexported frames render as quiet outlines, so the composition is intact while images are still arriving.

## Layout of the code

```
src/lib/layout.ts       data → world geometry (pure), image tier choice
src/lib/useCamera.ts    pan / zoom / inertia / fly-to; writes the transform straight to the DOM
src/components/Wall.tsx visibility culling, tiles, controls
src/components/Viewer.tsx focused view
```

### Decisions and trade-offs

* **One shared camera instead of per-row scrolling.** All rows move together, like the Figma canvas, which keeps the
  composition intact and makes zoom coherent. Independent per-row offsets are a later-phase option.
* **Labels counter-scale** so they stay readable at any zoom; they hide below ~17% where they would only be noise.
* **Whole-frame exports** over re-building artwork from layers: the Figma frame is the source of truth.
* The **manifest is bundled** (≈75 KB gzipped). Move it to `public/` and `fetch` it if you want to edit data
  without rebuilding.

## Later phases

* In-browser editor (rename labels, drag posts between rows) that exports `overrides.json`.
* Per-row horizontal scrolling, search / tag filter, colour-based filtering (`color` is already in the data).
