# Wedding invitation website

A responsive website built from the six screens on the Figma page "Final" (node 17:856). Static HTML, CSS and a little JavaScript. No framework, no build dependencies.

## How it matches the design
`styles.src.css` is written in design pixels from the 1081 x 1920 artboard (390d means 390px on the artboard). `build.js` converts them to `calc(390 * var(--u))`, where `--u` is one design pixel at the current width, so each screen scales exactly on every device. Fonts are the ones in the file: Fraunces, Cormorant Garamond, Inter and Noto Sans Devanagari.

## What was added
- Reveal animations and light parallax. Off for visitors who prefer reduced motion, and the page is fully visible without JavaScript.
- A soft glow on the lamps, sun, halo and hands, and a gentle sway on the lotus and float on Ganesha.
- A details strip after screen 6 (not in Figma): countdown, Add to calendar, Apple/Outlook file and Open in Maps. Delete the `<footer>` in `index.src.html` to remove it.
- `noindex` so search engines skip the page.

## Build
    node build.js                                  # writes styles.css and index.html
    SITE_URL=https://your-domain.example/ node build.js   # makes the share image URL absolute

## Artwork
`assets/` and `og.jpg` hold the couple's photos and Figma layers, so they are not committed (the repo is public). Recreate them with
`python3 prep_assets.py <folder of layers exported from Figma>` (this repo: `../film/assets`). Serve with `python3 -m http.server`; browsers will not load the arch mask from file://.

## Deploy (Vercel)
Deploy from this folder with the Vercel CLI (`npx vercel --prod`), which uploads `assets/` from disk. Importing the GitHub repo will not include the artwork because it is gitignored. If you want git-based deploys, make the repo private first and remove `assets/` and `og.jpg` from `.gitignore`.
