# GRID — currency for the creative world

A fictional five-note currency built as one design system. Each note states one design value as a geometric rule, and every note ships with a blueprint that shows how it was made.

| Note | Value | Principle | Symbol | The rule |
|---|---|---|---|---|
| **1000** | Creativity | Imagine beyond the existing | **UNFOLD** | Every square turns 45° and grows by √2 from one shared corner. Each diagonal is the next side, so area doubles every quarter turn and the far corners land on a logarithmic spiral. |
| **500** | Clarity | Make the complex simple | **RESOLVE** | Eight stripes of constant thickness close their gaps in stages: 8, 4, 2, 1. The final bar is exactly as tall as the numerals. Hatching halves in density at each stage. |
| **200** | Empathy | Design for people | **COMMON GROUND** | The GRID inverted in a circle. Grid lines become two pencils of circles through one point, radii C0 / k, crossing at 90°. Two perspectives, one contact. |
| **100** | Craft | Care about every detail | **DEPTH** | A carpet divided by three, three times: circle, square, circle holes. 1 + 8 + 64 = 73 holes, 512 solid cells, a stitch in each. |
| **50** | Impact | Create meaningful change | **RIPPLE** | A dot lattice reshaped by a decaying radial wave. The epicentre is the counter of the zero in "50". |

## Files

```
dist/GRID-<value>-<name>.svg             the banknote, 1600 × 750
dist/GRID-<value>-<name>-blueprint.svg   the design blueprint, 2400 × 1600
index.html                               viewer (open it in a browser)
assets/                                  Anton font (SIL OFL) used only as a fallback for Impact
```

Open `index.html` to browse all ten files. In the viewer, the blueprint opens full width, and the chips above it zoom into each of the nine sections at a readable size. Or open any SVG directly.

## What is in each banknote

- **160 × 75 mm**, `viewBox="0 0 1600 750"`, 10 units per mm.
- **Grid:** 20 × 8 modules of 75 px. 50 px side margins, 75 px rails, a 26 px frame band.
- **Eight named layers**, always in this order, as top-level groups:
  `L01_BASE_PAPER` · `L02_BORDER_FRAME` · `L03_GEOMETRIC_CONSTRUCTION` · `L04_ENGRAVING_GUILLOCHE` · `L05_PRIMARY_SYMBOL` · `L06_SECONDARY_SYMBOL_WATERMARK` · `L07_TYPOGRAPHY` · `L08_SECURITY_ACCENTS`
- **Printed, not illustrated.** Tone is made of line weight and line density, never gradients, opacity or filters: ruled moiré grounds, iris-blended colour (colours interleaved line by line), weight-ramped engraving on the forms, outlined numerals filled with fine ruling. Every note also carries what a real note carries: an ornate lathe-work border with corner rosettes, issuer and legal text, two signatures, serial numbers that grow in size, microprint in the frame, paper fibres, a watermark window, a foil stripe and a security thread.
- **Seven colour roles** per note, flat inks only: C01 primary, C02 secondary, C03 accent, C04 pattern, C05 paper, C06 ink, C07 highlight. The validator fails any note that uses a colour outside its own palette, leaves a role unused, or uses a gradient, filter, mask, opacity or raster.
- **Type:** Impact for numerals and titles, Inter Display for everything else. Live `<text>`, no outlines.
- **Patterns** P01 guilloché · P02 contour · P03 micro-grid · P04 hatching · P05 dots · P06 symbol repeat · P07 tessellation · P08 waves. Each note uses its own combination. Micro-textures and numeral ruling are reusable `<pattern>` definitions; guilloché, ruling, hatching, contour and waves are explicit path geometry.
- **Security-inspired details:** thread with microtext, tactile bars (5 for 1000 down to 1 for 50), registration marks, microtext lines, repeated symbol strips.

## What is in each blueprint

Header and frame index, then nine panels: **01** final note · **02** theme · **03** key visual elements · **04** wireframe (grid, margins, zones) · **05** symbol construction, step by step · **06** palette with HEX, roles, true colour-separation plates and measured ink coverage per plate · **07** pattern system (P01–P08, in-use highlighted) · **08** exploded layer stack · **09** specifications and type hierarchy. Technical colours are shared by all five frames; the banknotes keep their own palettes.

## Build

Needs Node 18+ and, for validation and previews, Playwright with Chromium.

```
node build.js          # notes, blueprints, index.html  →  dist/
node build.js 500      # one denomination
node tests/validate.js # structure, palette, fonts, ids, XML parse
node tests/render.js dist/GRID-1000-creativity.svg out.png 2
```

`lib/` holds the SVG toolkit, pattern generators, the engraving toolkit (`engrave.js`), the shared real-note kit (`realism.js`), banknote architecture and the blueprint builder. `symbols/` holds the geometry of each symbol, used by both the note and its blueprint. `notes/` holds the composition of each note. Every symbol constant (grid vertex, unit, radii) lives in one place, so the blueprint always shows what the note really does.

## Know before you use it

- **Fonts.** Every `<text>` names exactly one family, `Impact` or `Inter Display`, with tracking in px, so Figma and Illustrator ask for the real fonts. Browsers also read a small embedded stylesheet: Impact first, then an embedded Anton (SIL OFL, `assets/Anton-OFL.txt`, cap height matched to Impact) when Impact is missing; Inter Display, then Inter, Helvetica Neue and Arial. Anton is narrower than Impact, so type has a little more air. The stylesheet is about 25 KB at the end of each file's `<defs>`. The text stays live.
- **Checked in Chromium only.** Parsing, layers, palette and rendering were verified in Chromium. Import into Figma and Illustrator was not tested. `<pattern>` fills (micro-grid, dots, tessellation, symbol-repeat strips) are the most likely place for those tools to differ; everything else is plain paths, groups and clip paths.
- **Previews here use Anton** in place of Impact, stretched to estimated Impact widths, so exact text widths in previews are approximate. The width table in `lib/note.js` is an estimate for layout maths, not measured from Impact.
- Large squares in the 1000 note are deliberately unclipped so they break the frame. Anything that embeds the note needs the note's viewport (the blueprints add a clip for this).
