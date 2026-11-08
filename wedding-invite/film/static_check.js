/* Renders each screen's static layout and writes it next to the Figma reference so they can be diffed.
   usage: node static_check.js <outDir> */
const { chromium } = require("playwright");
const path = require("path");
const out = path.resolve(process.argv[2] || "./ref_out");
require("fs").mkdirSync(out, { recursive: true });
(async () => {
  const b = await chromium.launch();
  for (let s = 1; s <= 6; s++) {
    const p = await b.newPage({ viewport: { width: 1081, height: 1920 }, deviceScaleFactor: 1 });
    p.on("pageerror", e => console.log("s" + s, "PAGEERR", e.message));
    await p.goto("http://127.0.0.1:8765/scene.html?scene=" + s);
    await p.evaluate(() => window.READY); await p.waitForTimeout(400);
    await p.screenshot({ path: path.join(out, `s${s}.png`) });
    await p.close();
  }
  await b.close(); console.log("done");
})();
