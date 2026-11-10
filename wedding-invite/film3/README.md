# Wedding film, bride side (40 s, 1080x1920, 30 fps)

Built from the Figma page "Bride Side" (node 28:1274, seven screens). Same pipeline and timeline as `../film2` (groom side); only the scenes, motion and a few effects differ.

| Scene | Time (s) | Screen | Transition in |
|---|---|---|---|
| 1 | 0-5.2 | Ganesh blessing | fade up from deep maroon |
| 2 | 5.2-10.9 | Wedding invitation (Pranati with Neelesh) | portrait arch grows out of the blessing |
| 3 | 10.9-16.3 | Couple and families (hands touch on a beat at 14.49 s) | the arch opens again and carries the white panel |
| 4 | 16.3-22.3 | Haldi (turmeric burst on the drop at 19.9 s) | golden light bloom |
| 5 | 22.3-28.0 | Mehndi and music | whip pan |
| 6 | 28.0-33.8 | The wedding and baraat welcome | match cut: the white arch stays, the contents change |
| 7 | 33.8-40 | Closing blessing | the white arch zooms through into the temple arch |

Soundtrack: the supplied song, cut from 5.86 s (hits at 10.9, 19.9 and 33.8 s).

## Pipeline
`assets/` and `ref/` are not committed (personal photos, Figma exports). Serve this folder (`python3 -m http.server 8778`), then:
1. `node render.js <framesDir> 4` renders 1200 JPEGs at 2x (~4 min)
2. `./compose.sh <framesDir> <song.mp3> <out.mp4>` downsamples to 1080x1920 and encodes H.264 + AAC
3. `node shot.js <dir> t1 t2 ...` renders single frames; `node fid.js` diffs each screen against the Figma render (`?still=1` turns the camera moves off)
