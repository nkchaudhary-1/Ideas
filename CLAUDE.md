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
- **Control sizes.** Buttons, fields, selects, chips, colour fields and icon buttons are **36px** tall; slider pills are
  44px; floating toolbar pills are 52px with 8px inside. Inline label column is 80px.
- **Vertical rhythm inside a section.** 20px section padding, 20px from title to content, 16px between controls, 8px from a
  label to its control, 12px between tiles.
- **Text never wraps or clips inside a button, chip or label.** Use `whitespace-nowrap`, shorten the copy, or make room.
  Truncated text gets a `title` with the full text.
- One pattern per kind of row: stacked slider (label + value above a pill), inline row (80px label + control), toggle row
  (switch, then label), button row. Don't mix them in one card for the same kind of control.

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
