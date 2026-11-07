# Wedding invite site

Three invitation templates, each with a groom's-side and a bride's-side version. Static, no backend. RSVP sends a prefilled WhatsApp message.

| Template | Look | Motion |
|---|---|---|
| `raat` | Aubergine night, gold only | A gold mandala draws itself, names rise in, embers drift up like diya sparks |
| `subah` | Blush paper, one emerald cusped arch | The arch rises and outlines itself in gold, a few rose petals drift past |
| `kesar` | Saffron hero, scalloped edge, maroon on ivory | A marigold garland drops in and sways, names reveal line by line, one shower of petals |

Shared layout lives in `base.css` (open flow, one centred column, entrance sequence, scroll reveals). Each template only sets its colour tokens, its hero and its motion. Ornament and motion helpers are in `ornaments.js`, all drawn in code, so there are no image assets. Everything respects `prefers-reduced-motion`.

## Edit the content
`config.js` is the only file to edit. Blessing, names, lineage, family names, events (each tagged `groom`, `bride` or `both`), venues, travel notes and the two WhatsApp numbers all live there. Set `preview: false` before sending; that hides the groom/bride switch at the top. An empty WhatsApp number hides the RSVP card, an empty `travel` list hides the travel card.

`side` sets whose invitation a page is. `#groom` or `#bride` on the URL overrides it, so one deployment serves both families: `/raat/#bride`.

## Build
    node build.js

Writes `dist/<template>/index.html` for hosting and `artifacts/<template>.html` for claude.ai previews. Commit `dist/` so Vercel needs no build step.

## Host on Vercel
Import the GitHub repo in Vercel, set **Root Directory** to `wedding-invite`, framework **Other**. `vercel.json` points it at `dist/`. Or from this folder: `npx vercel --prod`.
