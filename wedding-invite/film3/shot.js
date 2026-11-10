/* usage: node shot.js <outDir> t1 t2 ...   renders single frames for inspection */
const { chromium } = require("playwright"); const path = require("path"), fs = require("fs");
(async () => {
  const [,, out, ...ts] = process.argv; fs.mkdirSync(out, { recursive: true });
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1081, height: 1920 }, deviceScaleFactor: 1 });
  p.on("pageerror", e => console.log("PAGEERR", e.message)); p.on("console", m => { if (m.type() === "error") console.log("CONSOLE", m.text()); });
  await p.goto("http://127.0.0.1:8778/film.html"); await p.waitForFunction(() => window.RENDER_READY, null, { timeout: 60000 });
  for (const t of ts) { const t0 = Date.now(); await p.evaluate(t => window.renderAt(t), +t);
    await p.screenshot({ path: path.join(out, `t${(+t).toFixed(2)}.png`), clip: { x: 0, y: 0, width: 1080, height: 1920 } }); console.log("t", t, Date.now() - t0, "ms"); }
  await b.close();
})();
