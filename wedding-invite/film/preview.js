/* usage: node preview.js <scene> <tau,tau,...> <outDir>   renders single moments of one scene for inspection */
const { chromium } = require("playwright");
const path = require("path");
const [,, scene = "1", taus = "0", out = "./prev"] = process.argv;
require("fs").mkdirSync(out, { recursive: true });
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1081, height: 1920 }, deviceScaleFactor: 1 });
  p.on("pageerror", e => console.log("PAGEERR", e.message)); p.on("console", m => { if (m.type() === "error" || m.type() === "warning") console.log("CONSOLE", m.text()); });
  await p.goto(`http://127.0.0.1:8765/scene.html?scene=${scene}&anim=1`);
  await p.waitForFunction(() => window.RENDER_READY, null, { timeout: 30000 }); await p.evaluate(() => window.RENDER_READY);
  for (const t of taus.split(",")) {
    await p.evaluate(t => window.renderAt(+t), t); await p.waitForTimeout(60);
    await p.screenshot({ path: path.join(out, `s${scene}_t${t}.png`), clip: { x: 0, y: 0, width: 1080, height: 1920 } });
  }
  await b.close();
})();
