/* writes mask + overlay frames for the five transitions: <out>/<type>/m####.png (mask) and o####.png (RGBA overlay), 36 frames each */
const { chromium } = require("playwright"); const path = require("path"), fs = require("fs");
const out = path.resolve(process.argv[2] || "./trans_out"), TYPES = (process.argv[3] || "arch,petals,light,doors,lamp").split(","), N = 36;
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1080, height: 1920 } });
  p.on("pageerror", e => console.log("PAGEERR", e.message));
  await p.goto("http://127.0.0.1:8765/trans.html"); await p.waitForFunction(() => window.TREADY);
  for (const t of TYPES) {
    fs.mkdirSync(path.join(out, t), { recursive: true });
    for (let i = 0; i < N; i++) {
      const pr = (i + .5) / N;
      await p.evaluate(([t, pr]) => renderTrans(t, pr, "mask"), [t, pr]);
      await p.screenshot({ path: path.join(out, t, `m${String(i).padStart(4, "0")}.png`), clip: { x: 0, y: 0, width: 1080, height: 1920 } });
      await p.evaluate(([t, pr]) => renderTrans(t, pr, "over"), [t, pr]);
      await p.screenshot({ path: path.join(out, t, `o${String(i).padStart(4, "0")}.png`), clip: { x: 0, y: 0, width: 1080, height: 1920 }, omitBackground: true });
    }
    console.log("done", t);
  }
  await b.close();
})();
