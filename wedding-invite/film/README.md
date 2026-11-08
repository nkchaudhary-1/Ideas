# Wedding invitation film (40 s, 1080x1920, 30 fps)

Animates the six screens on the Figma page "Final" (node 17:856) into one film. Nothing is redesigned: every layer comes from that file.

| Scene | Seconds | Figma screen |
|---|---|---|
| 1 | 0-5 | Opening Blessing (Ganesha) |
| 2 | 5-11 | Couple Portrait |
| 3 | 11-16 | Families |
| 4 | 16-21 | Journey & Blessings |
| 5 | 21-30 | Baraat Schedule |
| 6 | 30-40 | Venue & Closing |

## Pipeline
1. `assets/` holds the layers exported from Figma (not committed: it contains personal photos). `hands` is split into `f4-hand-L.png` and `f4-hand-R.png` so the two hands can move separately.
2. `scene.html` lays out each screen from the Figma specs. `static_check.js` diffs it against Figma renders in `ref/`.
3. `film.js` animates one scene as a pure function of time. `render.js <scene> <outDir>` renders its frames in parallel.
4. `trans.html` + `render_trans.js` render the five transitions (arch, petals, light, doors, lamp).
5. `audio_film.py` synthesises the soundtrack. `compose.py` joins scenes, transitions and audio into the MP4.

Serve this folder with `python3 -m http.server 8765` while rendering (browsers block mask images on file://).

The soundtrack is a synthesised stand-in. For a recorded or licensed track, pass its wav as the audio argument to `compose.py`.
