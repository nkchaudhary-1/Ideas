# Wedding invitation website

A responsive website built from the six screens on the Figma page "Final" (node 17:856). Static HTML, CSS and a little JavaScript. No framework, no build dependencies.

## How it matches the design
`styles.src.css` is written in design pixels from the 1081 x 1920 artboard (390d means 390px on the artboard). `build.js` converts them to `calc(390 * var(--u))`, where `--u` is one design pixel at the current width, so each screen scales exactly on every device. Fonts are the ones in the file: Fraunces, Cormorant Garamond, Inter and Noto Sans Devanagari.

## What was added
- **Scroll transitions, one per screen, the same five as the film.** Each is scrubbed by scroll, so it plays forwards and backwards with the finger: the portrait arch opens (with a gold keyline), the families panel fills upward as the lotus rises, the carved arches of screen 4 pull back, the baraat arch opens from the centre like doors between two gold lines, and the venue scene opens as a circle of light from the lamp.
- **Seam effects on one light canvas:** falling petals, rising gold dust, a bloom of light with rays, a gold seam with sparks, and a lamp flare with rising marigold petals.
- **Ambient effects:** twinkling sparkles around Ganesha and the lotus, gold dust and a red petal lifting from the hand, sky lanterns on the baraat screen, birds, aarti smoke and glints on the water, flickering lamp flames.
- **Text effects:** labels track in from wide spacing, and the names carry a slow glint.
- **Interaction:** pointer parallax on desktop, and a tap or click anywhere for a small shower of petals.
- A details strip after screen 6 (not in Figma): countdown, Add to calendar, Apple/Outlook file and Open in Maps. Delete the `<footer>` in `index.src.html` to remove it.
- `noindex` so search engines skip the page.

Everything animated is optional. With reduced motion, or without JavaScript, every screen shows in its finished state and the canvas is off. Add `?force=1` to the URL to see that resting state. The transitions are driven by a `--pe` value that `main.js` sets on each screen; without it, the styles fall back to finished.

Screen 4's source image has sample text baked in behind the peach panel. The panel is deliberately never faded or animated, so the text cannot show.

## Music and the opening gate
The page opens on a gate with a lotus button, "Begin the journey". Browsers will not start sound by themselves, so the tap is what starts the song, and it also opens the invitation. A small sound toggle (top right of the column) lets guests mute or resume.

- **YouTube (default):** the song is `kwjp52YYlwQ` (Roshni Hi Roshni Hai), played through YouTube's own embedded player. Change `VIDEO` at the top of the gate section in `main.js` to use another one. If the owner has switched off embedding, or the player cannot load, the toggle is simply hidden and the invitation still opens.
- **Your own file (most reliable):** put an audio file you have the rights to at `assets/song.mp3`. When it exists the site plays it and does not load YouTube at all.
- Music fades in over 3 seconds, loops, and pauses when the tab is hidden.

## Build
    node build.js                                  # writes styles.css and index.html
    SITE_URL=https://your-domain.example/ node build.js   # makes the share image URL absolute

## Artwork
`assets/` and `og.jpg` hold the couple's photos and Figma layers, so they are not committed (the repo is public). Recreate them with
`python3 prep_assets.py <folder of layers exported from Figma>` (this repo: `../film/assets`). Serve with `python3 -m http.server`; browsers will not load the arch mask from file://.

## Deploy (Vercel)
Deploy from this folder with the Vercel CLI (`npx vercel --prod`), which uploads `assets/` from disk. Importing the GitHub repo will not include the artwork because it is gitignored. If you want git-based deploys, make the repo private first and remove `assets/` and `og.jpg` from `.gitignore`.
