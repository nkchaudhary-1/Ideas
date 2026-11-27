# Showreel: "This isn't my job, it's my thing"

A 75-second, text-only cinematic reel for a product-design portfolio. No footage: it is kinetic type, colour and
motion, built as one GSAP master timeline from a single config file. It plays as a muted, looping picture-in-picture on
a homepage, and as a full player with a scrubber for review.

Vite, vanilla TypeScript, GSAP core. No framework, no CDN, no audio, no images: the bundle is about 110 kB of JavaScript
(42 kB gzipped), 26 kB of CSS and one 48 kB font file.

```bash
npm install
npm run dev        # http://localhost:5173/
npm run build      # static bundle in dist/
npm run preview    # serve dist/ on http://localhost:4173/
```

## Contents

- [Two modes](#two-modes)
- [Aspect ratios and safe areas](#aspect-ratios-and-safe-areas)
- [Editing the reel](#editing-the-reel)
- [Timeline structure](#timeline-structure)
- [The two worlds and the motion system](#the-two-worlds-and-the-motion-system)
- [Reduced motion](#reduced-motion)
- [Voiceover and music](#voiceover-and-music)
- [Exporting](#exporting)
- [Checks](#checks)
- [Decisions and limits](#decisions-and-limits)

## Two modes

Switch with a URL parameter, or by passing the same names as props to `mountReel`.

| Mode | URL | What you get |
| --- | --- | --- |
| `pip` (default) | `/` | Autoplays muted, loops seamlessly, no controls. Captions are baked in, so it reads with the sound off. The page background is transparent, so the rounded stage sits cleanly on whatever embeds it. |
| `full` | `/?mode=full` | Play and pause, restart, a scrubber whose segments are the beats (coloured by world), a voiceover subtitle toggle, and a sound button when audio is loaded. Starts paused on a poster frame. |

Keys in `full` mode: `Space` or `K` play and pause, `R` restart, `←` `→` seek one second, `Shift` with either (or `[` `]`)
jump a beat, `Home` `End`, `C` subtitles, `M` mute.

All the parameters:

| Parameter | Values | Default | Notes |
| --- | --- | --- | --- |
| `mode` | `pip`, `full` | `pip` | |
| `aspect` | `16:9`, `9:16`, `1:1` | `16:9` | `9x16` and `9-16` also work. |
| `subs` | flag | off | `full` mode: start with the voiceover subtitles on. |
| `t` | seconds or `m:ss` | `0` | Start from here, for example `?mode=full&t=0:22` to review the temperature flip. |
| `motion` | `reduced`, `full` | follows the system | Forces reduced motion on or off. |
| `radius` | `0` to `32` | `32` | Stage corner radius in px. Use `0` when the page around it already rounds the corners. |
| `debug` | flag | off | Beat, timecode, grade, frame rate and safe-area guides. Also exposes `window.__reel`. |
| `capture` | flag | off | Exposes `window.__reel` and changes nothing on screen. See [Exporting](#exporting). |

Embedding as a picture-in-picture:

```html
<iframe src="/showreel/?radius=0" title="Neelesh showreel" loading="lazy"
        style="width: 480px; aspect-ratio: 16 / 9; border: 0; border-radius: 24px"></iframe>
```

Or from your own code, with the same names as props:

```ts
import { mountReel } from './mount';

const handle = await mountReel(document.getElementById('reel')!, { mode: 'pip', aspect: '16:9', radius: 0 });
handle.player.pause(); // play(), seek(seconds), restart(), stepBeat(1), destroy() are on handle too
```

`dist/` is static and uses a relative base, so it works from any folder or CDN path. Serve it over HTTP: browsers block
module scripts opened straight from `file://`.

## Aspect ratios and safe areas

Everything is laid out in units of 1/1080th of the stage's short side, so a given aspect looks identical at any size.
The content column is the same 936 units wide in every aspect (1080 less a 72 margin each side), centred.

- **16:9 to 1:1.** A centred 1:1 crop of a 16:9 render keeps all of the content with its margins. Turn on `?debug` to see
  the crop guides drawn over the stage.
- **9:16.** A centred 9:16 crop of a 16:9 frame is only 608 units wide, which cannot hold display type this size, so it is
  not a crop: render `?aspect=9:16` and the layout reflows natively. Every beat has been checked there. Its top and
  bottom margins are larger (200 and 280 units) to clear the interface that sits over vertical video.
- Captions are measured, not hand-broken, so lines wrap to the column in every aspect.

## Editing the reel

Everything lives in [`src/reel.config.ts`](src/reel.config.ts): copy, timings, worlds, the numbers. The animation code
never needs touching to retime or reword it.

**Retiming.** Each beat has an `in`. It ends where the next one starts, and the last ends at `duration`, so moving a
boundary is one edit. Times are seconds (`75`) or clocks (`"1:15"`, `"0:22.5"`). Choreography inside a beat is laid out
as fractions of its length, so it stretches with it. A beat needs at least 3 seconds. A bad retime fails loudly, with the
beat named, rather than playing wrong.

**Tempo.** `bpm: 120` sets a grid of sixteenth notes (0.125 s). Entrances, counters and logo snaps land on it, and every
beat boundary sits on it, so a music bed at 120 bpm lines up. Change `bpm` and the choreography follows.

**Captions.** `_text_` is dimmer, `\n` is a line break, and an array of strings means the beat reveals them one after
another (the builder beat has three, the craft beat two).

**Worlds.** `world: 'cool' | 'warm' | 'neutral'`, or `{ from, to }` to blend across the beat. `dim` darkens the grade.
`feel` overrides the motion style (default: `loose` for warm, `precise` for the rest).

| # | Beat | In | World | Feel | Signature |
| --- | --- | --- | --- | --- | --- |
| 1 | Hook | 0:00 | cool, dim | precise | Four concept flashes (sketch, shutter, Figma, unlock), then the question |
| 2 | Companies | 0:04 | cool | precise | Logo chips snap in a sixteenth apart, then a sheen passes along them |
| 3 | Numbers | 0:12 | cool | precise | Rolling-digit counters with a filling rule each, then the award chip |
| 4 | The real fuel | 0:22 | **warm** | loose | The temperature flip. A viewfinder hops across three things that make you curious |
| 5 | Builder | 0:34 | warm | loose | Three phases: a deck being dealt, a task list ticking itself off, two circles becoming friends |
| 6 | Craft | 0:46 | cool | precise | One pixel fills into a sprite, shrinks into one tile, and a whole system fills in around it |
| 7 | Close | 0:56 | cool to warm | precise, then loose | Years roll up on a speed ramp, then the payoff |
| 8 | End card | 1:08 | neutral | precise | Same marks and slam as the hook, then it grades back into the hook's world |

## Timeline structure

```
master (paused, repeat -1 in pip, length pinned to reel.duration)
├─ world track     grade cuts and blends: cool, warm, neutral layers plus a dim layer.
│                  A cool/warm change also fires a heat bloom. The tail grades back into beat 1.
├─ cut flashes     60 ms white flash at every beat start, the loop point included
├─ presence        each beat's section shown from its start to its end: a hard cut
│                  (a short fade under reduced motion), gap-free on the boundary frame
└─ beats ×8        one sub-timeline each, added at beat.start, built by src/beats/<kind>.ts
                   ├─ camera      slow push-in; warm beats also drift a little off axis
                   └─ choreography, from beat-local time 0 to beat.dur
```

| File | Job |
| --- | --- |
| `src/reel.config.ts` | All content and timing |
| `src/core/resolve.ts` | Turns the config into seconds, validates it |
| `src/core/timeline.ts` | Builds the master |
| `src/core/world.ts` | Grade track, heat bloom, cut flashes |
| `src/core/motion.ts` | The two feels, and `presence()` |
| `src/core/split.ts` | The line and word splitter (own code, not the paid plugin) |
| `src/core/odometer.ts` | Rolling-digit counter |
| `src/beats/*.ts` | One builder per beat |
| `src/ui/*.ts` | Stage, controls, subtitles, audio, debug overlay |

## The two worlds and the motion system

- **Cool** (`#15202f` to `#0a111b`, accent `#6ea0ff`) is the designer: a precision grid, locked `expo` eases, no overshoot,
  tight staggers.
- **Warm** (`#2f2010` to `#1c1307`, accent `#ffb46a`) is the human: soft light leaks, `back.out` overshoot, a little rotation,
  looser staggers, a slow drift.
- **The flip at 0:22** is a hard cut with a bloom of the new colour, and the motion style changes with it.
- **Type stays monochrome.** Colour comes from the grade and from small accents.
- **Counters** are rolling digits moved with `transform`. Columns further right spin more times, like an odometer, so the
  number reads as counting up and settles from the left.
- **Only `transform`, `opacity` and `visibility` are animated.** The end-to-end check scans every inline style across the
  whole run to prove it, and counts layout passes during playback (about one per second).
- **Film grain** is an SVG turbulence tile at 5% opacity, stepped about 12 times a second on the compositor. A faint
  vignette sits above it.

## Reduced motion

With `prefers-reduced-motion: reduce` (or `?motion=reduced`): nothing slides, scales or rotates (every entrance becomes
a fade), the camera stays still, there is no white flash, the grade crossfades instead of cutting, counters fade in at
their final value, the viewfinder fades onto each tile instead of hopping, and the grain and light drift stop. The
end-to-end check asserts the main points from the timeline itself: no tween moves, scales or rotates anything, there is
no flash, and a cut becomes a crossfade.

The standard version stays under the three-flashes-a-second limit. The busiest second has two white flashes (the cut at the
loop point, then the shutter pop in the hook half a second later), and the hook's word changes are 0.5 s apart on a
dark ground, so they are not luminance flashes.

## Voiceover and music

**Music** is included: `public/audio/music.mp3`, an original bed made by [`tools/audio/make_music.py`](tools/audio/make_music.py).
It is synthesised from scratch (no samples, no model, no network), so there is no licensing question. It follows the reel:

- Section boundaries are read from `src/reel.config.ts`, so retiming a beat moves the music with it. Re-run it after a retime:
  `pip install numpy scipy`, then `npm run audio:music` (needs `ffmpeg`).
- Cool beats are a precise, cold-sounding Am7 / Fmaj7 / Cmaj7 / G7 groove; warm beats open into a pad in F with no kick until
  the builder, which is four on the floor.
- Cues land on the visuals: an impact on every cut, a riser under the hook's question, a reverse riser into the 0:22 flip, a
  bell on the award chip, a chime on each of the three tiles, a lift into each builder phase, ticks that slow down with the years
  counter, and a swell under the payoff.
- The last 0.8 s eases to near-silence and the reverb tail is folded back onto the start, so it loops without a seam.
- Peak -1 dBFS, no clipping. With `musicGain: 0.35` it sits about 9 dB below its own level, which leaves room for a voice.

**Voiceover** is not included yet. Drop your file in `public/audio/` and name it in the config (a recording of your own voice
will always sound more like you than a synthetic one):

```ts
audio: { vo: 'audio/vo.mp3', music: 'audio/music.mp3', musicGain: 0.35 },
```

- Both are `<audio>` slots in `index.html`. They are only loaded in `full` mode, never in `pip`.
- A sound button appears whenever a file is configured. In `full` mode the music plays with the timeline.
- The timeline is the clock. Audio follows it, is corrected only when it drifts by more than 0.3 s, and is never corrected
  more than once every 0.6 s, so it can't fight its own seeks. Scrubbing moves it too.
- The music bed loops. A file that fails to load is skipped quietly.
- **Audio-reactive captions.** With a voiceover playing, the camera of each beat swells by up to 3.5% with its loudness.
- The subtitle track is estimated: each beat's voiceover is split into sentences and spread across the beat by length.
  It is for review, not a forced alignment. Serve audio from a host that supports HTTP range requests, or seeking won't work.

## Exporting

**Screen recording.** Open `/?radius=0` (or `/?aspect=9:16&radius=0`), size the window to the frame you want, and record
it with QuickTime, OBS or the browser's own recorder. It loops, so record one pass from the hook's first flash.

**Frame-accurate capture.** Every frame is a function of time, so a script can render them one at a time. `?capture`
exposes the player without changing anything on screen:

```js
// capture.mjs: node capture.mjs, with `npm run preview` running
import { chromium } from 'playwright';

const fps = 30;
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
await page.goto('http://127.0.0.1:4173/?capture&radius=0'); // add &aspect=9:16 and a 1080 x 1920 viewport for vertical
await page.waitForFunction(() => window.__reel);

const { duration } = await page.evaluate(() => window.__reel.reel);
for (let frame = 0; frame < Math.round(duration * fps); frame++) {
  await page.evaluate((t) => {
    const timeline = window.__reel.player.timeline;
    timeline.pause();
    timeline.time(t, false);
  }, frame / fps);
  await page.screenshot({ path: `frames/${String(frame).padStart(5, '0')}.png` });
}
await browser.close();
```

```bash
ffmpeg -framerate 30 -i frames/%05d.png -c:v libx264 -pix_fmt yuv420p reel.mp4
```

The grain and the slow light drift are CSS animations on the compositor, so a frame-by-frame capture shows them at
whatever phase the page happens to be in. That is invisible in motion. Everything else is exact.

## Checks

```bash
npm run typecheck   # tsc --noEmit
npm run test:unit   # timecodes, config resolution and its errors, URL params, caption markup, subtitle cues
npm run build && npm run test:e2e
```

`test:e2e` needs Playwright with Chromium available to Node. It serves `dist/` and checks the acceptance list: pip loop and
no controls, the 0:22 flip, flash timing, the loop seam, every beat sitting where the config says, transform-and-opacity
only, layout passes, reduced motion, all three aspects (no clipped captions, no sideways scroll), and the full-mode
controls. It also checks that **rewinding is clean**: any moment looks the same whether you jump to it or reach it after
two full passes and a loop wrap. That is the check that matters most for a looping, scrubbable timeline.

## Decisions and limits

**Added to the brief**, each one line to delete in `reel.config.ts`:

- The hook question ("You're a designer? So what do you actually do?"), so the hook reads with the sound off.
- A third builder phase ("AI? We're friends."), which is in the voiceover but not the caption column.
- The payoff ("This isn't my job… it's my thing."), the line the reel is named after, on the close.

**Changed from the brief.**

- The award chip uses a drawn trophy, not the 🏆 emoji. Emoji render in colour (breaking the monochrome rule), differently on
  every platform, and as a blank box on some.
- Inter is bundled from `@fontsource-variable/inter` (Latin only), so there is no font CDN and the bundle stays self-contained.
- The company chips are typographic wordmarks, not logos.

**Not built.** The WebGL displacement on the world transition. The cut plus bloom already makes the flip unmistakable, and
a shader would add weight and a GPU-only code path to something that has to run in a small corner of a homepage. The
`debug` overlay and the audio-reactive captions are built.

**Not verified.** Sixty frames a second can't be certified in CI: headless Chromium renders in software. What is checked
instead is the thing that causes dropped frames, namely layout and non-compositor properties during playback. The music bed was
checked by measurement (levels, clipping, the loop seam, and a spectrogram showing the risers and cues land on the cuts), not by
ear, so judge the taste yourself. Audio sync was verified with a generated tone and with the music file, not with a voiceover. The player has not been run on iOS Safari; only Chromium touch
emulation was available.
