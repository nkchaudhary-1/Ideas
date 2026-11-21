# Design rules (every project in this repo, current and future)

These are standing rules from the owner. Follow them in any UI you build or touch, whether it's a new project or an
old one. When you edit a project that breaks them, fix the breakage you find on the way.

## 1. Corner radius: one concentric system

- **Cards, panels, popovers, menus, toasts: 24px.** On very large screens (viewport ≥ 1920px wide) they are **32px**.
- **The stage (canvas surface) and dialogs/sheets: always 32px.**
- **Nothing in the UI is rounder than 32px.** Capsules (`rounded-full`) are the only exception: buttons, inputs, chips,
  selects, sliders, segmented controls and icon buttons are capsules or circles.
- **Nested corners are concentric:** inner radius = outer radius − the gap between the two edges, never below 8px.
  Add gaps up through every level. A tile 16px inside a section that sits 12px inside a card is 24 − 28 → the 8px floor.
- A rounded thing inside a capsule is a capsule (an icon button inside a 52px toolbar pill is a circle).
- **Glyphs** (anything under 24px: tick boxes, ratio icons) use 2–8px.
- **Artwork is not UI.** Radii of things the user draws on the canvas (frames, grid cells, shapes) and previews that depict
  them are content and stay user-editable; mark such previews `data-radius-free`.

In this repo (Tailwind): `rounded-card` (24/32), `rounded-big` (32), `rounded-in-N` (card radius minus N px, floor 8),
`rounded-bin-N` (the same from a 32px surface), `rounded` (the 8px floor), `rounded-full`. Never use raw px radii or the
default Tailwind sizes (`rounded-md`, `rounded-xl`…); they are removed on purpose.
Check with `node tests/audit/run.js` at `--w=1600` and `--w=2200`; it must report no radius findings.

## 2. Spacing and alignment

- **4px grid.** Padding, margins, gaps and control sizes are multiples of 4px (hairlines of 1–2px aside). No `.5` steps
  except `0.5`; the Tailwind steps 1.5, 2.5, 3.5 (6/10/14px) are not allowed.
- **Card gutter is 32px.** The title, intro text and any control that sits directly in a card start 32px from its edge.
  Sections sit 12px in from the card and pad 20px, so their content lands on the same 32px line. Every left edge in a card
  lands on that line; a 2–6px near-miss is a bug.
- **Control sizes.** Buttons, fields, selects, chips, colour fields and icon buttons are **36px** tall; slider capsules are
  44px; floating toolbar pills are 52px with 8px inside. Inline label column is 80px. On touch screens
  (`coarse:` variant) these grow to **44px** (small chips 40, toolbar pills 60 with 8px inside).
- **Vertical rhythm inside a section.** 20px section padding, 20px from title to content, 16px between controls, 8px from a
  label to its control, 12px between tiles.
- **Text never wraps or clips inside a button, chip or label.** Use `whitespace-nowrap`, shorten the copy, or make room.
  Truncated text gets a `title` with the full text.
- One pattern per kind of row: stacked slider (label + value above a capsule), inline row (80px label + control), toggle
  row (switch, then label), button row. Don't mix them in one card for the same kind of control.
- **Sliders are capsules.** A light track whose fill is a gradient (ink warming to the orange accent at the knob); the knob is a thin
  white bar on a 44px black circle that also rounds off the end of the fill (white bar on a light circle in dark mode). The track is
  44px tall on every pointer, the same as the knob, and the fill stops at the knob's centre, so no corner of it shows beside the knob. A slider with a neutral point
  inside its range fills outward from that point. The value sits beside the label and can be typed; double-click the track,
  or press Delete, to reset. Colour sliders (`track`) keep the thick gradient pill with a ring knob.
- **A layout's border and corners are locked.** The outer margin, gutter and corner radius come with the layout and stay as designed; an
  "Unlock" button in the layout's properties reveals the sliders, and "Lock" (or choosing another layout) puts them back.
- **Drag or click, same result.** Templates, elements, frames and text can be dragged onto the canvas or clicked. On a panorama both land on one
  slide: the one under the drop point, or for a click the one you picked (numbered badge), else the next empty one. A template fills that
  slide only, never the whole strip.

## 3. Copy

- **Sentence case** everywhere: headings, buttons, labels ("Match look", "Copy & paste settings", "Add photos").
- **British spelling** (colour, centre, grey), consistent across the product.
- Buttons and labels have no trailing full stop; helper text and empty states are full sentences with one.
- A trailing "…" only on an action that opens further UI ("Copy settings…").
- Say what it does, in the user's words: photo, video, item, slide. Don't mix "item/asset/media/file" for the same thing.
- Errors say what happened and what to do next. Toasts are short and past tense ("Pasted onto 3 items").
- Use "&" in short labels and headings, "and" in sentences.

## 4. Quality bar

- Every icon-only control has an accessible name; every input has a label or `aria-label`.
- Touch/click targets are at least 28px.
- Light and dark themes are both checked. Nothing is merged with console errors.
- Run `npm run typecheck`, `npm run test:unit`, and the audits before shipping UI changes.

## 5. Phones and touch

Everything above holds on a phone. These are the additions for screens under 900px wide (`useCompact()`) and for touch
(`coarse:` = `pointer: coarse`, `touch:` = `hover: none`).

- **App layout: one bar on top, the work in the middle, one bar below.** A slim top bar above the canvas (back to projects, the name with the
  kind of project and next step under it, undo, redo, export, and a "⋯" menu for size, fit, preview, view options and slide actions), the canvas,
  a flat strip of slides or photos, and one bottom bar. The bottom bar is the tool dock when nothing is selected and becomes the selection's
  tools when something is (a photo: replace, crop, filters, light, turn, flip, reset; anything else: edit, duplicate, delete; typing: done).
  **Nothing floats over the picture** but the selection handles: no pills, chips, wheel, toasts or quick bar on the canvas. Anything that
  opens (a tool sheet, the properties sheet, the quick adjust bar) is a panel in the layout, so the canvas gets smaller and refits above it.
  The strip of slides or photos steps aside while one is open on a short screen. Test at 390×650, which is what a phone leaves once its browser
  bars are in: the canvas keeps at least 38% of the screen with a tool sheet or the quick bar open (the default sheet is 32% of the screen, never
  under 232px; drag its handle for a taller one).
  Dialogs dock to the bottom edge with an 8px margin, 32px corners and a slide-up entrance. Respect safe areas (`env(safe-area-inset-*)`,
  `viewport-fit=cover`) and use `dvh`, not `vh`.
- **Dialog gutter is 24px on phones** (32 − 24 = the 8px radius floor, so inner radii stay `rounded`), 32px from 640px up.
- **Hover is not available.** Anything revealed on hover (row actions, tick boxes) is always visible on touch, or moves
  into a sheet. Use pointer events, not mouse events, for outside-tap and drag handling (a touch gesture that calls
  `preventDefault` produces no mouse events).
- **Inputs are 16px on coarse pointers** or iOS zooms the page. Text stays selectable inside fields only.
- **No sideways page scroll, ever.** Every dialog, menu and sheet fits at 320×568; rows wrap (`flex-wrap`) before they clip.
- **Gestures.** Pinch zooms the canvas (or the picture, in crop mode), two fingers pan, one finger pans empty canvas, a
  quick tap on empty canvas deselects, a second finger cancels a drag in progress.
- **Installable.** `manifest.webmanifest`, `apple-touch-icon` and the theme colour (kept in step with the theme) are set.
- **Check.** `node tests/audit/run.js --phone` at the defaults (390×844), `--w=360 --h=740`, `--w=320 --h=740` and
  `--theme=dark`; `node tests/e2e/phone-dialogs.js`; `node tests/e2e/phone-canvas.js`. All must report no findings.

## 6. Say where you are

A new user must never have to guess what they are making or what to do next.

- **Name the mode** wherever the project is shown: the line under the project name (on a phone) or the chip under the top bar (on a desktop), project lists and the size chip all use the same words
  (single post, collage, carousel, panorama, story, photo & video edit). A panorama is described by its slides ("4:5 · 7 slides"), never by the ratio of the whole strip.
- **Show the next step.** Every mode has a short list of steps that tick themselves off from what is in the project, each with a button that opens the right tool.
  Add steps to `useGuide` in `ModeGuide.tsx` when a mode gains a stage; never add a mode without them.
- **Nothing floats over the canvas but the top row.** No zoom or tool bar sits at the bottom: zoom and pan are gestures and keys, and Fit and View options live in the menu.
- **An empty canvas stays clear.** No card or prompt sits over it; the mode line and its next-step button are the guide, and the rail
  has Media, Layouts and Templates. (The owner removed the "Start your …" card because it covered the work.)
- **The tools and the open tool are one card.** On a desktop the rail and the panel it opens share a single card, split by a hairline, never two cards side by side. (Edit mode's single round button is the one exception.)
- **Every tool is labelled.** An icon alone is never the only name of a tool: the rail and the phone dock show a short name under each icon, and groups carry a title.
- **The properties card opens when needed.** It is closed by default and on a desktop opens when something is selected and closes when nothing is, never leaving a half-empty card beside the canvas. A card you open or close yourself stays as you left it, and a chip or the top-bar toggle brings it back. Opening or closing it keeps the zoom and pan. (Edit mode's card is the editor, so it stays open.)
- **Controls that matter are visible without selecting anything.** Editing a photo is never behind a closed panel: Edit mode opens its card, and a photo
  has its own wheel on a desktop and its own bar on a phone. If a panel can be shut, a chip or button brings it back.

## 7. The front page

The app opens on a projects page, never straight into the editor: **Create**, **Edit photos & videos**, and your saved projects (open, duplicate,
delete). A reload lands there again. The editor is somewhere you go to and can leave ("All projects" in the menu, the back arrow on a phone).
Keyboard shortcuts and paste do nothing while the front page is showing. Project cards describe a project the same way everywhere
("Carousel · 4:5 · 5 slides", "Panorama · 4:5 · 3 slides", "Photo & video edit · 6 items").
