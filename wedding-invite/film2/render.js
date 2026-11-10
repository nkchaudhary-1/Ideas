/* Renders frames 0..1199 (40 s @ 30 fps) of film.html at 2x (2160x3840 JPEGs; compose.sh downsamples to 1080x1920 for sub-pixel-smooth type).
   usage: node render.js <outDir> [workers=4]   (serve this folder first:  python3 -m http.server 8777)  */
const { chromium } = require("playwright"); const { spawn } = require("child_process"); const fs = require("fs"), path = require("path");
const FPS = 30, N = 40 * FPS, [,, outArg, wArg = "4", from, to] = process.argv, out = path.resolve(outArg);
if (from === undefined) {
  fs.mkdirSync(out, { recursive: true }); const nw = +wArg, per = Math.ceil(N / nw); let done = 0; const t0 = Date.now();
  for (let w = 0; w < nw; w++) { const a = w * per, b = Math.min(N - 1, a + per - 1); if (a >= N) break;
    spawn("node", [__filename, outArg, wArg, String(a), String(b)], { stdio: "inherit" }).on("exit", () => { if (++done === nw) console.log(`rendered ${N} frames in ${((Date.now() - t0) / 1000).toFixed(0)} s`); }); }
} else (async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1081, height: 1920 }, deviceScaleFactor: 2 });
  p.on("pageerror", e => console.log("PAGEERR", e.message));
  await p.goto("http://127.0.0.1:8777/film.html?dpr=2"); await p.waitForFunction(() => window.RENDER_READY, null, { timeout: 60000 });
  for (let n = +from; n <= +to; n++) {
    await p.evaluate(([t, n]) => { window.renderAt(t, n); return new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))); }, [n / FPS, n]);   // let the compositor finish painting before capturing (a torn frame was seen once)
    await p.screenshot({ path: path.join(out, `f${String(n).padStart(4, "0")}.jpg`), type: "jpeg", quality: 96, clip: { x: 0, y: 0, width: 1080, height: 1920 } });
    if ((n - +from) % 50 === 0) console.log("frame", n);
  }
  await b.close();
})();
