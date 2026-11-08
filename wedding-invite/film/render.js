/* Renders every frame a scene needs. Frames are 1080x1920 JPEGs named by global frame number: <outDir>/s<scene>/f<n>.jpg
   usage: node render.js <scene> <outDir> [workers=4]  */
const { chromium } = require("playwright");
const { spawn } = require("child_process");
const fs = require("fs"), path = require("path");
const DUR = [0, 5, 6, 5, 5, 9, 10], START = [0, 0, 5, 11, 16, 21, 30], FPS = 30, TR = 18;   // transitions run +-0.6 s = 18 frames
const [,, sceneArg, outArg, workersArg = "4", from, to] = process.argv;
const scene = +sceneArg, outDir = path.resolve(outArg, "s" + scene);
const n0 = scene === 1 ? 0 : START[scene] * FPS - TR;
const n1 = scene === 6 ? 40 * FPS - 1 : (START[scene] + DUR[scene]) * FPS + TR - 1;
if (from === undefined) {
  fs.mkdirSync(outDir, { recursive: true });
  const nw = +workersArg, total = n1 - n0 + 1, per = Math.ceil(total / nw); let done = 0; const t0 = Date.now();
  for (let w = 0; w < nw; w++) {
    const a = n0 + w * per, b = Math.min(n1, a + per - 1); if (a > n1) break;
    const ch = spawn("node", [__filename, sceneArg, outArg, workersArg, String(a), String(b)], { stdio: "inherit" });
    ch.on("exit", code => { if (++done === Math.min(nw, Math.ceil(total / per))) console.log(`scene ${scene}: frames ${n0}..${n1} in ${((Date.now() - t0) / 1000).toFixed(0)}s`); });
  }
} else {
  (async () => {
    const b = await chromium.launch();
    const p = await b.newPage({ viewport: { width: 1081, height: 1920 }, deviceScaleFactor: 1 });
    p.on("pageerror", e => console.log("PAGEERR", e.message));
    await p.goto(`http://127.0.0.1:8765/scene.html?scene=${scene}&anim=1`);
    await p.waitForFunction(() => window.RENDER_READY, null, { timeout: 60000 }); await p.evaluate(() => window.RENDER_READY);
    for (let n = +from; n <= +to; n++) {
      const tau = n / FPS - START[scene];
      await p.evaluate(t => window.renderAt(t), tau);
      await p.screenshot({ path: path.join(outDir, `f${String(n).padStart(4, "0")}.jpg`), type: "jpeg", quality: 95, clip: { x: 0, y: 0, width: 1080, height: 1920 } });
    }
    await b.close();
  })();
}
