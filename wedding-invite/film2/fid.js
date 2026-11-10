/* fidelity: render each screen at its settled time with camera moves off, diff against the Figma renders in ref/ */
const { chromium } = require("playwright"); const fs = require("fs");
const T = [4.4, 9.9, 15.6, 21.2, 26.9, 33.0, 38.0];    // settled times, before any exit animation
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1081, height: 1920 } });
  p.on("pageerror", e => console.log("PAGEERR", e.message));
  await p.goto("http://127.0.0.1:8777/film.html?still=1"); await p.waitForFunction(() => window.RENDER_READY);
  await p.addStyleTag({ content: "#fx,#grain,#vig{display:none!important}" });
  for (let i = 0; i < 7; i++) { await p.evaluate(t => window.renderAt(t), T[i]); await p.waitForTimeout(100);
    await p.screenshot({ path: `fid/s${i + 1}.png`, clip: { x: 0, y: 0, width: 1081, height: 1920 } }); }
  await b.close();
})();
