# Wedding film v2 (40 s, 1080x1920, 30 fps)

Built from the Figma page "Groom Side" (node 17:856, seven screens). Nothing is redesigned: every layer comes from that file.

| Scene | Time (s) | Screen | Transition in |
|---|---|---|---|
| 1 | 0-5.2 | Ganesh invocation | fade up from deep maroon |
| 2 | 5.2-10.9 | Couple introduction | portrait arch grows out of the blessing |
| 3 | 10.9-16.3 | Families | the arch opens again and carries the white panel |
| 4 | 16.3-22.3 | A beautiful journey begins (hands touch at 19.9) | golden light bloom |
| 5 | 22.3-28.0 | Baraat departure | whip pan to the right |
| 6 | 28.0-33.8 | Wedding venue (aarti) | match cut: the white arch stays, the contents change |
| 7 | 33.8-40 | Reception | walk through the arch |

Soundtrack: the supplied song (`invitation-site/assets/song.mp3`), cut from 5.86 s so its three hits land on the S3 reveal (10.9 s), the hands touching (19.9 s) and the reception arrival (33.8 s). 84 bpm; beat grid phase 0.202 s.

## Pipeline
1. `assets/` and `ref/` are not committed (personal photos). Layers come from Figma `get_design_context`; `ref/s1..s7.png` are the Figma renders used by `fid.js`.
2. `film.html` + `film.js`: all seven screens in one page; `renderAt(t)` draws any frame from a time value (pure function, so frames render in parallel).
3. `node render.js <framesDir> 4` renders 1200 JPEGs at 2x (2160x3840, ~4 min) (serve this folder first: `python3 -m http.server 8777`).
4. `./compose.sh <framesDir> <song.mp3> <out.mp4>` downsamples to 1080x1920 and encodes H.264 + AAC.
5. `shot.js` renders single frames for inspection; `fid.js` diffs each screen against the Figma render (`?still=1` switches camera moves off).

Film grain exists (`?grain=1`) but is off: per-frame noise multiplied the file size by 15.

Type stays steady because the camera push is cancelled on the text groups (`g1..g7`) and frames are supersampled 2x; measured wobble in the final MP4 is under 0.02 px.
