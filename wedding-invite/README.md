# Wedding invite site

Three scroll-driven invitation experiences, each with a groom's-side and a bride's-side version. Static, no backend. RSVP sends a prefilled WhatsApp message once a number is set.

| Template | Scene | Signature |
|---|---|---|
| `raat` | A night in the palace: moon over layered skylines, stars, diyas | Fireworks, rising embers, drifting sky lanterns |
| `subah` | Dawn over a lotus lake: skyline across the water, rangoli sun, peacock plumes | Dawn brightens as you scroll and a lotus opens petal by petal |
| `kesar` | Saffron festival: marigold garland, rangoli sun, kalash and diyas on a maroon floor | Garland drops in and sways, a rangoli sun turns, petals shower |

## The experience (shared by all three)
1. **Gate.** Jali doors, a self-drawing emblem and a counter. The doors open onto the hero.
2. **Hero.** A layered illustrated scene with scroll and pointer parallax and a character-by-character title.
3. **Blessings.** One pinned stage. The invitation plays beat by beat as you scroll: intro, each name with lineage, "with", the invitation and the families' sign-off.
4. **Celebration.** The date fills like liquid, the event reveals, five diyas can be lit by tapping, a live countdown ticks, and lighting all five sets off the template's celebration effect.
5. **Marquee.** Two rows that speed up and skew with scroll velocity.
6. **Finale.** "Shower blessings" button with a running count.

Plus a chapter HUD with progress bar, a custom cursor and magnetic buttons on desktop, and film grain. Without the animation library, or with reduced motion, the page falls back to a plain readable layout with everything visible.

## Edit the content
`config.js` is the only file to edit. Blessing, names, lineage, family names, events (each tagged `groom`, `bride` or `both`), venues, travel notes and the two WhatsApp numbers all live there. Set `preview: false` before sending to hide the groom/bride switch. An empty WhatsApp number hides the RSVP card, an empty `travel` list hides the travel card.

`side` sets whose invitation a page is. `#groom` or `#bride` on the URL overrides it, so one deployment serves both families: `/raat/#bride`.

## Files
- `markup.html`, `render.js`: the page structure and the code that fills it from `config.js`.
- `base.css`: layout and the shared motion language. Templates supply colour tokens only.
- `illustrations.js`: the art, drawn in code and themed with CSS variables (skyline, moon, lotus, diya, kalash, plume, rangoli sun, jali, garland).
- `fx.js`: stars, embers, fireworks and petals on one canvas.
- `experience.js`: the choreography (GSAP and ScrollTrigger from cdnjs).
- `templates/*.html`: tokens, scene composition and a few hooks per template.

## Build
    node build.js

Writes `dist/<template>/index.html` for hosting and `artifacts/<template>.html` for claude.ai previews. Commit `dist/` so Vercel needs no build step.

## Host on Vercel
Import the GitHub repo in Vercel, set **Root Directory** to `wedding-invite`, framework **Other**. `vercel.json` points it at `dist/`. Or from this folder: `npx vercel --prod`.

## Video invite
`video/` renders any template to a vertical 1080x1920 mp4 (about 57 seconds) by recording the real page while a script scrolls through every chapter, lights the diyas and sets off the celebration effect.

    ./video/make.sh raat groom ./video/out     # or subah, kesar; groom or bride

It needs Node with Playwright, ffmpeg and Python with numpy. The soundtrack is synthesised (a tanpura-style drone, a soft pad and chimes) and is a placeholder: swap in a real track by passing your own audio file to `video/encode.py`. Timings live at the top of `video/record.js`.
