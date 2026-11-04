# Wedding invite site

Three invitation templates, each with a groom's-side and a bride's-side version. Static, no backend. RSVP sends a prefilled WhatsApp message.

| Template | Look |
|---|---|
| `raat` | Night sky, marigold, drifting petals |
| `subah` | Morning paper, Jaipur pink and peacock green, jaali lattice |
| `kesar` | Poster: vermilion band, huge type, running strip |

## Edit the content
`config.js` is the only file to edit. Names, parents, functions (each tagged `groom`, `bride` or `both`), venues, travel notes and the two WhatsApp numbers all live there. Set `sample: false` once the details are real; that hides the preview bar.

`side` sets whose invitation a page is. `#groom` or `#bride` on the URL overrides it, so one deployment serves both families: `/raat/#bride`.

## Build
    node build.js

Writes `dist/<template>/index.html` for hosting and `artifacts/<template>.html` for claude.ai previews. Commit `dist/` so Vercel needs no build step.

## Host on Vercel
Import the GitHub repo in Vercel, set **Root Directory** to `wedding-invite`, framework **Other**. `vercel.json` points it at `dist/`. Or from this folder: `npx vercel --prod`.
