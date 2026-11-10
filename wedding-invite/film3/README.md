# Wedding film, bride side (46 s, 1080x1920, 30 fps)

Built from the Figma page "Bride Side" (node 28:1274, seven screens). Same pipeline as `../film2` (groom side); scenes, motion and a few effects differ.

Soundtrack: "Phullaan Naal Sajjeya" (supplied), played from its start for 46 s. It runs at 100 bpm; every cut is on its beat grid (beat = 0.46 s + 0.6 s x n) and the section entries at beats 8, 24, 40 and 64 (5.26, 14.86, 24.46, 38.86 s) are the film's anchor moments.

| Scene | Time (s) | Screen | Transition in |
|---|---|---|---|
| 1 | 0-5.26 | Ganesh blessing | fade up from deep maroon |
| 2 | 5.26-10.66 | Wedding invitation (Pranati with Neelesh) | portrait arch grows out of the blessing (verse entry) |
| 3 | 10.66-17.26 | Couple and families, hands touch at 14.86 s (hook entry) | the arch opens again and carries the white panel |
| 4 | 17.26-24.46 | Haldi, turmeric burst at 19.66 s | golden light bloom |
| 5 | 24.46-31.66 | Mehndi and music | whip pan on the next section entry |
| 6 | 31.66-38.86 | The wedding and baraat welcome | match cut: the white arch stays, the contents change |
| 7 | 38.86-46 | Closing blessing | the white arch zooms through into the temple arch (big lift) |

## Pipeline
`assets/` and `ref/` are not committed (personal photos, Figma exports). Serve this folder (`python3 -m http.server 8778`), then:
1. `node render.js <framesDir> 4` renders 1380 JPEGs at 2x (~5 min)
2. `./compose.sh <framesDir> <song.mp3> <out.mp4>` downsamples to 1080x1920 and encodes H.264 + AAC
3. `node shot.js <dir> t1 t2 ...` renders single frames; `node fid.js` diffs each screen against the Figma render (`?still=1` turns the camera moves off; its settled times need updating for the 46 s timeline)
