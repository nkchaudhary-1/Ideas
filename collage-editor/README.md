# Collage Studio

A browser-based editor for Instagram posts, collages, editorial typography and **mixed photo + video carousels**.
Figma-style canvas, lightweight photo editing, Canva-style collage maker, real video export. Everything runs
in the browser; nothing is uploaded anywhere.

Built from an audit of the "Photo Edits" Figma file (see *Design language* below): rounded photo cards with
32/48/64 px radii and 30–48 px gutters, soft-serif titles over full-bleed photos, small handle/location tags,
spaced uppercase labels and a music-player glass panel. Those patterns ship as grid presets, text presets and
elements, so the editor starts where your own posts do.

## Interface

Minimal, floating, light or dark. The canvas fills the middle; everything else is a rounded card around it.

* **Left:** an icon-only rail (Media, Layouts, Templates · Text, Elements, Frames, Backgrounds, Colours · Layers). Click one and its panel opens beside it; click again to close.
* **Top of the canvas:** project name and menu (new / open / shortcuts), the **size chip** (ratio and panorama controls), undo / redo, theme switch, Preview, Export.
* **Bottom of the canvas:** select and hand tools, zoom, fit, and a **View** menu with layout grid, safe areas and snapping.
* **Right:** one properties card that only shows what the current selection needs, in collapsible groups.
* **Below:** the slide strip (compact for single designs, with seam marks on panoramas).
* **Palette:** black, white and one orange. Greys are neutral; orange marks only the active tool, slider fills, toggles and canvas selection, with a soft gradient on the primary button and the page ground. Light and dark themes; the choice is remembered and the first visit follows your system setting.
* **Controls:** sliders are soft pills with a big white knob on a thin track (fill runs outward from the neutral point); colour adjustments (temperature, tint, hue, saturation) use a gradient pill with a ring knob; rotation uses a tick-mark ruler (drag, arrow keys, double-click to reset); segmented controls and aspect-ratio glyphs sit in the same pill style.

## Run it

```bash
cd collage-editor
npm install
npm run dev        # http://localhost:3000
npm run build && npm start
npm run typecheck
```

Node 18.18+ (Next.js 14). Use a current **Chrome, Edge or Safari 16.4+** for video export (WebCodecs).
Photo editing and image export work in any modern browser.

## What it does

| Area | Details |
| --- | --- |
| Canvas | Zoom (wheel, ⌘/Ctrl-wheel, +/−), pan (space-drag, hand tool, middle mouse), fit, zoom to selection, layout grids (columns, modular, baseline), safe areas, snapping to canvas / objects / guides / grid lines |
| Formats | 1:1, 4:5, 3:4, 2:3, 5:4, 4:3, 3:2, 16:9, 1.91:1, 9:16 Story/Reel and custom sizes, chosen from the size chip at the top of the canvas. Changing the ratio keeps content (stretch / fit / keep). A carousel has one ratio for every slide |
| **Panorama (12:5)** | One wide canvas that is cut into slides on export. **12:5 = three 4:5 slides side by side** (3240×1350). Extend it any time with the **+** on the canvas edge (16:5, 20:5, … up to 10 slides) or shorten it with **−**; content stays where it is. Slide numbers and dashed seams show the cuts. Slide shape can be 4:5, 1:1 or 3:4. Preview pages through the slices exactly as they will be published; export writes one image per slice (`name-01.png`, `name-02.png`, …) |
| Media library | JPG, PNG, WebP, MP4, MOV, WebM; drag & drop, paste, multi-file. Search, sort, filter photos/videos, reuse, replace, delete. Library is stored per device and shared across projects |
| Photo editing (non-destructive) | Exposure, brightness, contrast, highlights, shadows, saturation, temperature, tint, hue, grayscale, sepia, fade, sharpness, blur, vignette, grain, opacity. 16 filter presets with intensity. Per-slider and global reset. The original file is never modified |
| Crop & position | Free or ratio crop, zoom, pan, rotate 90°, flip, fit / fill / reset, replace media, side-handle crop that keeps pixel scale |
| Grid collages | Click an empty tile to add a photo or video right there (upload or pick from the library; extra files fill the next empty tiles), then drag to reposition and scroll to zoom. On a panorama each layout you add goes into the next empty slide; pick a slide with its number (in the Layouts panel or on the canvas) or drag a layout onto any slide. *Add new / Replace selected* chooses whether a click adds a layout or re-shapes the selected one. ~30 layouts (basic, asymmetric, dense, editorial, "from your posts"), drag gaps to resize cells, drag a cell onto another to swap, split / remove cells, gutter, margin, radius, cell colour and border, per-cell crop and filters. Convert to free frames at any time |
| Freeform collages | Frames you can drag, resize, rotate, overlap, mask (rect, circle, rounded, portrait, landscape), border, shadow, reorder |
| Typography | Edit directly on the canvas. 45 OFL fonts in 8 categories (sans, serif, display, handwritten, script, mono, condensed, experimental), size, weight, italic, case, alignment, line height, letter spacing, padding, fill / gradient, outline, shadow, highlight, 16 editable text presets |
| Elements | Shapes, lines, arrows, stars, polygons, badges, tags, stickers, a music-player card, all editable |
| Backgrounds | Solid, gradient, patterns (dots, grid, lines, checker, noise, paper), photo |
| Layers | Select, rename, reorder (drag), hide, lock, duplicate, group / ungroup, delete, nested groups, multi-select; align and distribute; numeric X / Y / W / H / rotation |
| Carousel | Slide strip with thumbnails, add / duplicate / delete / reorder (drag) / rename; copy-paste elements across slides; new slide from template; real preview |
| Video | Videos are first-class: place them full-bleed, in frames or in grid cells; trim start / end, cover frame, volume, mute, loop, crop / pan, filters and adjustments, text and shapes on top. Trim data is metadata; the original file is untouched |
| Preview | Real playback of the whole carousel (videos play with sound), keyboard navigation, autoplay, fullscreen, and a cover / profile-grid preview |
| Saved presets | Make your own and reuse them everywhere. **Looks**: save a photo/video's filter and adjustments (Photo/Video properties → My looks → *Save current look*), apply to any photo, video or grid cell. **Text styles**: font, size, weight, colour, effects (text properties → *Save as text style*); click one in Text → My styles to restyle the selected text or add new text in that style. **Sizes**: custom canvas sizes (size chip → *Save this size*). **Collage layouts**: cell structure and spacing of a grid (grid properties → *Save layout*), re-applied to any collage with its photos kept. Rename (double-click or the pencil) and delete on hover. Presets live beside your media library, not in a project, so they are available in every project |
| Templates | 18 editable templates: photo cards, collages, carousels (including a 7-slide mixed-media one), editorial, typography, magazine, travel, poster, story, panorama. Save your own slide or carousel as a template |
| Colour | Picker with hex / RGB / HSL, eyedropper (where supported), recent colours, palettes (including colours from your Figma file), dominant colours extracted from the selected photo |
| History | Real undo / redo of document states (150 steps), slider drags coalesce into one step |
| Export | See below |
| Projects | Autosave to IndexedDB after every change, project manager (open / duplicate / delete) with thumbnails, restores media library on reload |

### Keyboard shortcuts

Press `?` in the editor for the full list. Highlights: `⌘/Ctrl Z` / `⇧⌘Z` undo/redo, `⌘D` duplicate, `⌘G` group,
`Delete`, arrows (⇧ = 10 px), `⌘] / ⌘[` order, `T` add text, `Enter` edit text / crop, `Space` pan, `⇧1` fit,
`⇧2` zoom to selection, `Alt` while dragging disables snapping.

## Export

The Export dialog lets you pick slides (all / current / any subset) and shows exactly which files will be made.

* **Images:** PNG, JPEG or WebP at ½×, 1×, 1.5× or 2×, quality slider (JPEG / WebP), transparent background (PNG / WebP).
  Panorama canvases can be sliced into 1080 px slides. Editor chrome (selection, grids, safe areas) is never rendered.
* **Video slides:** exported as **real video files**, not stills. Each frame is rendered through the same scene the editor
  shows (trims, filters, text and shapes included), encoded with WebCodecs and muxed to **MP4 (H.264)** or **WebM (VP9)**,
  at 24 / 30 / 60 fps. Audio from unmuted clips is mixed (trim, volume, loop respected). Slide length is the longest
  trimmed clip, or the duration you set on the slide. You can also export video slides as stills (cover frame).
* **Delivery:** one ZIP, or separate files. Files are numbered in slide order (`name-01.png`, `name-02.mp4`, …) so they upload to
  Instagram in the right order.
* One failing slide never sinks the rest; the report lists what was made and what failed and why.

### Video export, honestly

* Needs WebCodecs (`VideoEncoder`): Chrome / Edge 94+, Safari 16.4+, Firefox 130+. The dialog probes what your browser can
  really encode and says so.
* **AAC audio:** some Chromium builds (including headless ones) expose no AAC encoder. The exporter then writes Opus audio
  inside the MP4 and tells you. It plays in Chrome, Firefox and VLC, but Instagram may want AAC. Convert without
  re-encoding the picture:
  ```bash
  ffmpeg -i in.mp4 -c:v copy -c:a aac out.mp4
  ```
* **Importing video:** the browser must be able to decode it. H.264/AAC MP4 and VP9/Opus WebM work everywhere; HEVC `.mov`
  works in Safari. If a clip is refused the app says why and how to convert:
  ```bash
  ffmpeg -i in.mov -c:v libx264 -pix_fmt yuv420p -c:a aac out.mp4
  ```
* HEIC/HEIF photos are not decodable by browsers. Export from Photos as JPG first.
* Rendering is frame-accurate and runs on your device: a 4 s 1080×1350 clip takes a few seconds. Very long clips at high
  resolution are limited by browser memory (the muxer buffers the file in memory).

## Architecture

```
src/
  app/                    Next.js shell (client-only editor, ssr disabled)
  lib/
    types.ts              document model
    store.ts              zustand + immer store: project, history, selection, UI, autosave
    media.ts              library, import (probing, codec checks), decoded-image cache, <video> players
    filters.ts            adjustment pipeline + 16 presets
    media-math.ts         crop model (cover + zoom + focal point), drawing
    grid-engine.ts        split-tree layout, dividers, presets
    snap.ts / transform.ts / view-math.ts / geometry.ts
    fonts.ts / colors.ts / presets.ts / templates.ts / workflows.ts / timeline.ts
    db.ts                 IndexedDB (projects, assets, blobs, kv)
    export/               render.tsx (offscreen scene), image.ts, video.ts, zip.ts, run.ts, thumb.ts
  components/
    canvas/               Konva scene (ElementNode, MediaShape, overlays, selection, workspace)
    panels/               left rail: templates, layouts, uploads, text, elements, backgrounds, frames, layers, colours
    props/                right panel: canvas, text, shape, media, grid
    editor/               top bar, slide strip, shortcuts, shell
    dialogs/              import, new project, projects, export, preview, shortcuts
```

* **Document model.** `Project → Slide[] → Element[]` where an element is an image/video frame, text, shape, grid or group.
  Photos and videos share one `MediaFill` (asset id, zoom, focal point, flips, rotation, adjustments, filter, optional
  video settings), so frames, grid cells and backgrounds all use the same editing UI. The project is plain JSON.
* **One renderer.** A single declarative Konva scene draws the editor, the slide thumbnails, the preview and the exporter
  (`RenderContext` mode = edit / preview / export). What you see is what you export, and editor chrome lives in a
  separate layer that the exporter never mounts.
* **Non-destructive media.** Originals stay in IndexedDB as Blobs; adjustments are parameters. A processed bitmap is
  cached per (asset, adjustments, resolution). Videos are processed per frame on a downscaled copy and skipped when neutral.
* **History.** Snapshots of the immutable project (structural sharing makes them cheap), coalesced by key so a slider drag is one step.
* **Storage portability.** `lib/db.ts` is a four-function interface (get / put / delete / list over named stores). A
  Supabase implementation can replace it without touching the editor.
  If you add cloud saving, keep media blobs private (signed URLs / row-level security per user).
* **Performance.** Preview-tier images (≤2048 px) while editing, originals only at export; memoised nodes; per-key LRU cache;
  fonts load lazily with unicode ranges.

## Deploying to Vercel

The repo contains other material, so point Vercel at this folder:

1. Push the repo to GitHub (already done if you are reading this there).
2. Vercel → *Add New… → Project* → import the repository.
3. **Root Directory:** `collage-editor`. Framework preset: Next.js (auto-detected). Build / output settings: defaults.
4. Deploy. No environment variables are needed.

Or from the CLI: `cd collage-editor && npx vercel --prod`.

`vercel.json` adds long-lived caching for the self-hosted font files.

## AI features

None are included, on purpose: nothing in the editor pretends to be AI. If you want to add one (background removal,
captions, palette suggestions), do it behind a server route (`app/api/...`) that reads the provider key from an
environment variable such as `AI_API_KEY` set in Vercel. Never ship the key to the browser.

## Not included (yet)

Direct posting to Instagram, cloud accounts and sync, HEIC import, AI features, collaborative editing, per-word text styling,
animated text / transitions, in-browser audio tracks beyond the clips' own sound.

## Design language (from the Figma audit)

* Floating rounded cards with generous spacing (16 px page gutter, 20 px card padding), pill-shaped fields and segmented
  controls, bold small headings, black / white / orange only. Corners are concentric: a card is 24 px (32 px on very large
  screens), big surfaces (the canvas card, dialogs) are 32 px, and anything nested uses outer radius − the gap between the
  two edges (12 px inside a 12 px inset, 20 px on very large screens), with an 8 px floor. See `--r*` in `globals.css`. Light and dark themes are CSS-variable tokens in
  `src/app/globals.css`, so every control follows the theme. UI type is Manrope.
* Photo cards with large radii, equal gutters and a consistent outer margin; titles in a light soft serif over photos;
  tiny `@handle` / location tags; wide-tracked uppercase labels.

## Fonts

45 open-licence (OFL) families from Google Fonts via Fontsource, stored in `public/fonts` (≈5 MB, loaded on demand).
`npm run fonts` re-downloads them.
