# Collage Studio

A browser-based editor for Instagram posts, collages, editorial typography and **mixed photo + video carousels**, plus a
standalone **Edit photos & videos** mode for colour, light and look work with no collage involved.
Figma-style canvas, lightweight photo editing, Canva-style collage maker, real video export. Everything runs
in the browser; nothing is uploaded anywhere.

Built from an audit of the "Photo Edits" Figma file (see *Design language* below): rounded photo cards with
32/48/64 px radii and 30–48 px gutters, soft-serif titles over full-bleed photos, small handle/location tags,
spaced uppercase labels and a music-player glass panel. Those patterns ship as grid presets, text presets and
elements, so the editor starts where your own posts do.

## Interface

Minimal, floating, light or dark. The canvas fills the middle; everything else is a rounded card around it.

* **Left:** one card holding a labelled rail, in three titled groups: **Add** (Media, Layouts, Templates), **Design** (Text, Elements, Backdrop, Colours) and **Manage** (Layers). Click a tool and its panel opens inside the same card, beside the rail, behind a hairline; click again to close. Elements & frames is one searchable grid with tabs (Shapes, Frames, Graphics, Labels, Icons, Interface).
* **Top of the canvas:** the Collage Studio mark, which opens the menu (new project, all projects, shortcuts and your five most recent projects), the project name (click to rename) with its save status, the **size chip** ("Size 4:5 · 1080×1350"; a panorama reads "4:5 · 7 slides"; ratio and panorama controls), undo / redo, theme switch, Preview, Export. Under it, the **mode chip**: which kind of project this is and which step you are on (see below).
* **Nothing floats at the bottom of the canvas.** Zoom with the wheel, pinch or the + and − keys (0 for 100%, ⇧1 to fit); pan with Space, H or the middle mouse. **Fit to screen** and **View options** (layout grid, safe areas, snapping) are in the menu next to the logo, and Edit mode's **Compare** sits with undo and redo.
* **Right:** one properties card that only shows what the current selection needs, in collapsible groups. It is closed until you need it: it opens when you select something and closes when you select nothing. The panel button in the top bar opens it on its own for the canvas settings (background, layout grid), and a card you open or close yourself stays as you left it. Zoom and pan are kept when it opens or closes. Edit mode keeps its card open, since it is the editor.
* **Below:** the slide strip (compact for single designs, with seam marks on panoramas).
* **Palette:** black, white and one orange. Greys are neutral; orange marks only the active tool, slider fills, toggles and canvas selection, with a soft gradient on the primary button and the page ground. Light and dark themes; the choice is remembered and the first visit follows your system setting.
* **Controls:** sliders are capsules: a gradient fill (ink to the orange accent) ending in a thin white-bar knob (the fill runs outward from the neutral point; double-click to reset); colour adjustments (temperature, tint, hue, saturation) use a gradient pill with a ring knob; rotation uses a tick-mark ruler (drag, arrow keys, double-click to reset); segmented controls and aspect-ratio glyphs sit in the same pill style.

## Start from your projects

The app opens on a front page, not in the editor: **Create**, **Edit photos & videos**, and a grid of your saved projects, each with its kind and size ("Carousel · 4:5 · 5 slides"), when it was last edited, and Duplicate and Delete. A reload lands there again; "All projects" in the menu (or the back arrow on a phone) brings you back from the editor.

## Always know where you are

New projects can be a single post, collage, carousel, panorama, story or a photo and video edit. The editor says which, all the time:

* **Mode chip** under the top bar (on a phone, the line under the project name): `Carousel · Step 1 of 4 · Add photos`. Tap it for the guide: what this kind of project is, and four steps that tick themselves off as you work (add photos, add slides, style, export), each with a button that opens the right tool. The first time you make each kind it opens by itself; "Hide steps" folds it into a help button.
* **Empty slides stay clear.** Nothing covers a blank canvas; the mode chip says what comes next and its button opens the right tool (Media, Layouts, Templates are always on the rail).
* **Photo wheel** (desktop; phones get a bottom bar with the same tools). Select a photo and a radial wheel appears: zoom, move and crop, turn, flip, replace, filters, light and reset, with the tool's name in the middle. Drag its middle to put it anywhere on the canvas. In Edit mode the adjustments card opens by itself on any window size.
* **Quick bar** (the Snapseed / Lensa / Instagram way). Pick Filters or Light on the wheel and a bar rises from the bottom (on a phone it is a panel in the layout, so the canvas refits above it and the photo stays fully in view): a row of live-preview filters, or a row of adjustments with one slider for the one you chose, and a tick to finish. "More" opens the full card.
* **Quiet top bar.** Menu (logo, new project, all projects, theme, shortcuts), project name, history pill (undo, redo, preview) and Export. Icon-only buttons show their name on hover, and menus open towards the side with more room, so they are never cut off.

## On a phone

Under 900px wide (a phone, or a tablet held upright) the editor switches to an app layout. Nothing is removed; it is rearranged.

* **One bar on top, one below, nothing over the picture.** The top bar sits above the canvas: back to your projects, the name with the kind of project and the next step under it, undo, redo, export, and a "⋯" menu (new project, all projects, preview, fit, canvas size, view options, duplicate and delete slide, theme).
* **One bottom bar that follows your selection.** With nothing selected it is the **tool dock**: tap a tool and its panel rises as a **bottom sheet** that pushes the canvas up so you still see it; drag the handle for a taller sheet, down to close. Select a photo and it becomes that photo's tools (Replace, Crop, Filters, Light, Turn, Flip, Reset, More); select anything else and it offers Edit, Duplicate and Delete; while you type it offers Done. In Edit mode the photo's tools are there from the start, with Compare (hold to see the original).
* **Dialogs** (new project, import, export) dock to the bottom edge and slide up.
* **Gestures:** pinch to zoom (the picture itself, in crop mode), two fingers or one finger on empty canvas to pan, tap empty canvas to deselect, tap an empty tile to add a photo or video. A second finger cancels a drag in progress.
* **Finger-sized:** controls grow to 44px on touch screens, hover-only actions are always visible, text fields are 16px so iOS does not zoom, and the layout respects notches and the home indicator.
* **Installable:** add it to the home screen for a full-screen, app-like window (manifest, icons and theme colour are set).

Check it with `node tests/audit/run.js --phone`, `node tests/e2e/phone-dialogs.js` and `node tests/e2e/phone-canvas.js`. Only Chromium touch emulation is available in CI, so iOS Safari itself has not been tested.

## Design rules

The rules every screen follows live in [`/CLAUDE.md`](../CLAUDE.md) so they apply to every project in this repo:
one concentric corner system (cards 24px, 32px on very large screens; stage and dialogs 32px; anything nested is the
parent's radius minus the gap, never below 8px), a 4px spacing grid with a 32px card gutter, 36px controls, and
sentence-case British copy. They are enforced by an audit that drives the editor through every panel, dialog and popover
and measures it:

```bash
npm run dev -- -p 3100                 # in one terminal
node tests/audit/run.js                # 1600×950; also try --w=2200 --h=1250, --w=1280 --h=800, --theme=dark, --shots
```

It reports corner radii that break the concentric rule, off-grid spacing, clipped text, hit targets under 24px, controls
without an accessible name and controls whose height is off the grid. The target is zero findings at every size and in
both themes.

## Run it

```bash
cd collage-editor
npm install
npm run dev        # http://localhost:3000
npm run build && npm start
npm run typecheck
npm run test:unit  # colour pipeline + Match look maths, no browser needed
npm run test:e2e   # browser suites for Edit mode (needs `npm run dev -- -p 3100` and Playwright)
npm run audit      # UI audit: radii, spacing, clipping, hit targets, names (same prerequisites)
```

Node 18.18+ (Next.js 14). Use a current **Chrome, Edge or Safari 16.4+** for video export (WebCodecs).
Photo editing and image export work in any modern browser.

## What it does

| Area | Details |
| --- | --- |
| Canvas | Zoom (wheel, ⌘/Ctrl-wheel, +/−), pan (space-drag, H, middle mouse), fit, zoom to selection, layout grids (columns, modular, baseline), safe areas, snapping to canvas / objects / guides / grid lines |
| Formats | 1:1, 4:5, 3:4, 2:3, 5:4, 4:3, 3:2, 16:9, 1.91:1, 9:16 Story/Reel and custom sizes, chosen from the size chip at the top of the canvas. Changing the ratio keeps content (stretch / fit / keep). A carousel has one ratio for every slide |
| **Panorama (12:5)** | One wide canvas that is cut into slides on export. **12:5 = three 4:5 slides side by side** (3240×1350). Extend it any time with the **+** on the canvas edge (16:5, 20:5, … up to 10 slides) or shorten it with **−**; content stays where it is. Slide numbers and dotted seams show the cuts. Slide shape can be 4:5, 1:1 or 3:4. Preview pages through the slices exactly as they will be published; export writes one image per slice (`name-01.png`, `name-02.png`, …) |
| Media library | JPG, PNG, WebP, MP4, MOV, WebM; drag & drop, paste, multi-file. Search, sort, filter photos/videos, reuse, replace, delete. Library is stored per device and shared across projects |
| Photo editing (non-destructive) | Exposure, brightness, contrast, highlights, shadows, **whites, blacks**, saturation, **vibrance**, temperature, tint, hue, grayscale, sepia, fade, sharpness, blur, vignette, grain, opacity; **HSL colour mix** (8 bands), **RGB curves** (RGB / R / G / B), **colour grading** wheels for shadows / midtones / highlights. 20 filter presets with intensity. Per-slider and global reset. The original file is never modified |
| Crop & position | Free or ratio crop, zoom, pan, rotate 90°, flip, fit / fill / reset, replace media, side-handle crop that keeps pixel scale |
| Grid collages | Click an empty tile to add a photo or video right there (upload or pick from the library; extra files fill the next empty tiles), then drag to reposition and scroll to zoom. On a panorama each layout you add goes into the next empty slide; pick a slide with its number (in the Layouts panel or on the canvas) or drag a layout onto any slide. *Add new / Replace selected* chooses whether a click adds a layout or re-shapes the selected one. ~30 layouts (basic, asymmetric, dense, editorial, "from your posts"), drag gaps to resize cells, drag a cell onto another to swap, split / remove cells, cell colour and border, per-cell crop and filters. A layout's margin, gutter and corners come with it and are locked until you press Unlock in its properties (applying another layout locks them again). Convert to free frames at any time |
| Freeform collages | Frames you can drag, resize, rotate, overlap, mask (rect, circle, rounded, portrait, landscape), border, shadow, reorder |
| Typography | Edit directly on the canvas. 45 OFL fonts in 8 categories (sans, serif, display, handwritten, script, mono, condensed, experimental), size, weight, italic, case, alignment, line height, letter spacing, padding, fill / gradient, outline, shadow, highlight, 16 editable text presets |
| Elements | Shapes, lines, arrows, stars, polygons, badges, tags, stickers, a music-player card, all editable |
| Backgrounds | Solid, gradient, patterns (dots, grid, lines, checker, noise, paper), photo |
| Layers | Select, rename, reorder (drag), hide, lock, duplicate, group / ungroup, delete, nested groups, multi-select; align and distribute; numeric X / Y / W / H / rotation |
| Carousel | Slide strip with thumbnails, add / duplicate / delete / reorder (drag) / rename; copy-paste elements across slides; new slide from template; real preview |
| Video | Videos are first-class: place them full-bleed, in frames or in grid cells; trim start / end, cover frame, volume, mute, loop, crop / pan, filters and adjustments, text and shapes on top. Trim data is metadata; the original file is untouched |
| Preview | Real playback of the whole carousel (videos play with sound), keyboard navigation, autoplay, fullscreen, and a cover / profile-grid preview |
| Saved presets | Make your own and reuse them everywhere. **Looks**: save a photo/video's filter and adjustments (Photo/Video properties → My looks → *Save current look*), apply to any photo, video or grid cell. **Text styles**: font, size, weight, colour, effects (text properties → *Save as text style*); click one in Text → My styles to restyle the selected text or add new text in that style. **Sizes**: custom canvas sizes (size chip → *Save this size*). **Collage layouts**: cell structure and spacing of a grid (grid properties → *Save layout*), re-applied to any collage with its photos kept. Rename (double-click or the pencil) and delete on hover. Presets live beside your media library, not in a project, so they are available in every project |
| Templates | 60 editable templates in 18 tabs: Instagram portrait and square, **Story** (1080×1920), Carousel (tutorial, listicle, photo dump, story arc, 3-slide panorama, a 7-slide mixed-media one), Photo collage, Editorial, Typography, Magazine, Travel, Event, Minimal, Storytelling, Poster, **Quote**, **Fashion**, **Food** and **Sale**. Photo spots are tinted frames (tap one to add yours); every piece of type, colour and layout stays editable. Apply to the current slide or add as new slides, and save your own slide or carousel as a template Each card shows the real design: the editor's own renderer draws it with the three bundled sample photos (a penguin, a sandpiper, a leaf) in the empty frames. Only the layouts follow a reference design; every word, colour and picture is our own Drag a template (or an element, frame or text) onto the canvas, or click it. On a panorama a template fills one slide only: the one you dropped it on or picked, else the next empty one. |
| Colour | Picker with hex / RGB / HSL, eyedropper (where supported), recent colours, palettes (including a Studio palette), dominant colours extracted from the selected photo |
| History | Real undo / redo of document states (150 steps), slider drags coalesce into one step |
| Export | See below |
| Projects | Autosave to IndexedDB after every change, project manager (open / duplicate / delete) with thumbnails, restores media library on reload |

## Edit photos & videos

Pick **Edit photos & videos** instead of **Create collage** in *New project* (or *Edit* in the import dialog). Every photo or
video opens as its own item in a filmstrip, shown at its own proportions, with nothing combined into a layout. Photos and
videos can be mixed; the canvas, undo and export behave exactly as in the collage editor.

| | |
| --- | --- |
| **Single or many** | Click an item to edit it alone. Everything is non-destructive: the original is untouched and each item keeps its own settings. |
| **Light** | Exposure, brightness, contrast, highlights, shadows, whites, blacks |
| **Colour** | Temperature, tint, saturation, vibrance, hue, **HSL** (hue / saturation / luminance for red, orange, yellow, green, aqua, blue, purple, magenta), **curves** (click the line to add a point, drag to bend it, double-click a point to remove it), **colour grading** (hue and strength wheel + luminance per shadows / midtones / highlights, plus balance) |
| **Detail & effects** | Sharpness, blur, grain, vignette, fade, grayscale, sepia; 20 filters with an intensity slider; your saved looks |
| **Crop & transform** | Original, 1:1, 4:5, 3:4, 2:3, 9:16, 4:3, 3:2, 16:9 (each re-cuts the frame at native pixels), move & zoom on the canvas, rotate ±90°, flip, reset |
| **Batch editing** | **All / Photos / Videos / None** above the filmstrip, plus Shift-click for a range and ⌘/Ctrl-click or the corner tick to add one. With several selected, every slider, filter, look, crop, rotate or flip applies to all of them in one undo step; each item keeps the settings you did not touch. *Reset* clears just the selection. Click one item to go back to editing it alone. Trim and cover-frame edits always stay on the active video |
| **Copy & paste settings** | *Copy settings…* opens a checklist (exposure, brightness, contrast, highlights, shadows, whites, blacks, temperature, tint, saturation, vibrance, HSL, curves, colour grading, filter, effects, sharpness, grain, vignette; crop, rotation and flip are optional and off by default). Paste onto the active item or the whole selection. `⌘/Ctrl C` and `⌘/Ctrl V` copy and paste everything. Pasted values are ordinary settings and stay editable |
| **Match look** | Mark one item as the **reference** and edit it the way you like. Select others and press **Match**. It measures the reference's brightness, tonal spread, colour cast and saturation, then solves a small set of adjustments (exposure, highlights, shadows, contrast, saturation, temperature, tint) for each target through the real pixel pipeline, plus optionally the reference's own HSL, curves and grading. Choose what to match with the chips (colour tone, exposure, contrast, saturation, shadows & highlights, reference grading). The result is a separate layer on top of the item's own edits, so **Match intensity** is a slider (0 to 100 %) and manual fine-tuning still works. *Update match* re-solves after you change the reference; *Remove match* clears it |
| **Compare** | Hold **Compare** (bottom bar) or the `\` key to see the unedited picture |
| **Export** | The normal export dialog: one file per item named `<name>-edit.png` (or `.mp4`), at the item's own size (photos up to 2048 px on the long edge, videos up to 1920), in one ZIP or as separate files. *Selected* exports just the selection |

Match look is statistical (global tone, colour cast and saturation), not a content-aware transfer: two very different scenes
will move toward each other's overall feel, not become identical. The solver deliberately aims for most of the way and
penalises extreme slider moves; the intensity slider handles the rest.

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
    filters.ts            adjustment pipeline (tone, HSL, curves, grading) + 20 presets
    match.ts              Match look: measure a reference, solve adjustments through the real pipeline
    edit.ts               Edit mode: one slide per photo/video, batch ops, copy/paste settings, match runner
    media-math.ts         crop model (cover + zoom + focal point), drawing
    grid-engine.ts        split-tree layout, dividers, presets
    snap.ts / transform.ts / view-math.ts / geometry.ts
    fonts.ts / colors.ts / presets.ts / workflows.ts / timeline.ts
    templates.ts          the first templates, the Template type, fitSlide; templates-more.ts holds the rest
    db.ts                 IndexedDB (projects, assets, blobs, kv)
    export/               render.tsx (offscreen scene), image.ts, video.ts, zip.ts, run.ts, thumb.ts
  components/
    canvas/               Konva scene (ElementNode, MediaShape, overlays, selection, workspace)
    panels/               left rail: templates, layouts, uploads, text, elements, backgrounds, frames, layers, colours
    props/                right panel: canvas, text, shape, media, grid; EditPanel, EditSections, ColorTools for Edit mode
    editor/               top bar, slide strip, EditStrip (filmstrip + multi-select), shortcuts, shell
    ui/                   shared controls (Button, Chip, TextButton, Slider, Segmented…), Modal, Popover, ErrorBoundary
    dialogs/              import, new project, projects, export, preview, shortcuts
```

* **Document model.** `Project → Slide[] → Element[]` where an element is an image/video frame, text, shape, grid or group.
  Photos and videos share one `MediaFill` (asset id, zoom, focal point, flips, rotation, adjustments, filter, optional
  video settings), so frames, grid cells and backgrounds all use the same editing UI. The project is plain JSON.
* **One renderer.** A single declarative Konva scene draws the editor, the slide thumbnails, the preview and the exporter
  (`RenderContext` mode = edit / preview / export). What you see is what you export, and editor chrome lives in a
  separate layer that the exporter never mounts.
* **Edit mode reuses the editor.** An Edit project is `kind: "edit"`: one slide per item, sized to the picture, holding one
  locked full-bleed frame. The edit card targets the active slide, or every selected slide for batch edits (one history step).
  Adjustments layer additively: the item's own edits, then the filter preset × intensity, then the match layer × its own
  intensity (`fillEffective`), so each layer stays separately editable.
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
