/* Renders a template to a vertical 1080x1920 video by recording the real page.
   usage: node record.js <template> [side] [outDir]
   Writes numbered JPEG frames plus frames.json into <outDir>/<template>-<side>-<run>/ ; encode.sh turns them into an mp4. */
const { chromium } = require("playwright");
const fs = require("fs"), path = require("path");
const [,, tpl = "raat", side = "groom", outDir = "./out"] = process.argv;
const root = path.resolve(__dirname, ".."), W = 412, H = 732, DSF = 1080 / 412;

(async () => {
  const dir = path.resolve(outDir, `${tpl}-${side}-${Date.now()}`); fs.mkdirSync(dir, { recursive: true });
  /* the preview pill is for the editor, not the film */
  const html = fs.readFileSync(path.join(root, "dist", tpl, "index.html"), "utf8").replace("preview: true", "preview: false");
  const page0 = path.join(dir, "page.html"); fs.writeFileSync(page0, html);

  const browser = await chromium.launch({ args: ["--hide-scrollbars"] });
  const ctx = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: DSF, isMobile: true, hasTouch: true });
  const page = await ctx.newPage(); page.on("pageerror", e => console.log("PAGEERR", e.message));
  const cdp = await ctx.newCDPSession(page);
  const frames = []; let n = 0; const writing = [];
  cdp.on("Page.screencastFrame", ({ data, metadata, sessionId }) => {
    const f = path.join(dir, `f${String(n++).padStart(5, "0")}.jpg`); frames.push({ f: path.basename(f), t: metadata.timestamp });
    writing.push(fs.promises.writeFile(f, Buffer.from(data, "base64"))); cdp.send("Page.screencastFrameAck", { sessionId }).catch(() => {});
  });
  await cdp.send("Page.startScreencast", { format: "jpeg", quality: 90, maxWidth: 1080, maxHeight: 1920, everyNthFrame: 1 });
  const t0 = Date.now();
  await page.goto("file://" + page0 + "#" + side);

  /* wait for the gate to finish and the hero intro to settle */
  await page.waitForFunction(() => !document.getElementById("loader"), null, { timeout: 30000 });
  await page.waitForTimeout(1800);

  /* the plan: scroll keyframes by element, plus timed actions, all driven inside the page for exact timing */
  const planStart = (Date.now() - t0) / 1000;
  await page.evaluate(() => new Promise(done => {
    const H = innerHeight, $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
    const at = el => el.getBoundingClientRect().top + scrollY;
    const center = el => at(el) + el.offsetHeight / 2 - H / 2;
    const vows = ScrollTrigger.getAll().find(s => s.pin), vs = vows.start, ve = vows.end, unit = (ve - vs) / ($("#vows").querySelectorAll(".beat").length + .35);
    const U = u => vs + unit * u, max = document.documentElement.scrollHeight - H;
    const fn = $(".fn");
    const K = [   /* [seconds, scrollY] */
      [0, 0], [2.2, 0],
      [3.4, U(0)],
      [4.5, U(.55)], [7.6, U(.66)],
      [8.7, U(1.56)], [11.0, U(1.66)],
      [11.8, U(2.56)], [12.8, U(2.62)],
      [13.8, U(3.56)], [16.1, U(3.66)],
      [17.2, U(4.6)], [21.2, U(4.78)],
      [22.6, ve + 40],
      [24.4, Math.min(max, at($("#bigNum")) - H * .12)], [26.2, Math.min(max, at($("#bigNum")) - H * .08)],
      [28.0, Math.min(max, at(fn) - H * .1)], [31.0, Math.min(max, at(fn) + fn.offsetHeight - H * .85)],
      [32.6, Math.min(max, center($("#diyas")))], [36.6, Math.min(max, center($("#diyas")) + 20)],
      [38.2, Math.min(max, center($("#countdown")))], [40.0, Math.min(max, center($("#countdown")) + 10)],
      [41.4, Math.min(max, at($("#marquee")) - H * .2)], [42.6, Math.min(max, at($("#finale")))],
      [46.0, max], [50.0, max]
    ];
    const E = [   /* timed actions */
      [33.2, () => $$(".dy")[1].click()], [33.9, () => $$(".dy")[3].click()], [34.6, () => $$(".dy")[0].click()], [35.3, () => $$(".dy")[4].click()],
      [44.6, () => $("#shower").click()],
      [46.1, () => hit(.24, .2)], [47.1, () => hit(.78, .27)], [48.1, () => hit(.5, .13)], [49.0, () => hit(.3, .34)]
    ];
    /* a tap on the finale background sets off the template's celebration effect at that spot */
    const hit = (fx, fy) => $("#finale").dispatchEvent(new MouseEvent("click", { bubbles: true, clientX: innerWidth * fx, clientY: innerHeight * fy }));
    const ease = x => x < .5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2, t0 = performance.now(), fired = new Set();
    (function step() {
      const t = (performance.now() - t0) / 1000;
      let i = K.findIndex(k => k[0] > t); if (i < 0) i = K.length - 1; if (i === 0) i = 1;
      const a = K[i - 1], b = K[i], p = Math.min(1, Math.max(0, (t - a[0]) / (b[0] - a[0]))), mix = Math.abs(b[1] - a[1]) < H * .6 ? p : ease(p);
      window.scrollTo(0, a[1] + (b[1] - a[1]) * mix);
      E.forEach((e, k) => { if (t >= e[0] && !fired.has(k)) { fired.add(k); try { e[1](); } catch (x) {} } });
      if (t < K[K.length - 1][0]) requestAnimationFrame(step); else done();
    })();
  }));
  await page.waitForTimeout(600);
  await cdp.send("Page.stopScreencast"); await Promise.all(writing);
  fs.writeFileSync(path.join(dir, "frames.json"), JSON.stringify(frames));
  fs.writeFileSync(path.join(dir, "meta.json"), JSON.stringify({ planStart, loaderGone: planStart - 1.8, span: frames[frames.length - 1].t - frames[0].t }));
  const span = frames[frames.length - 1].t - frames[0].t;
  console.log(`DIR ${dir}`);
  console.log(`${tpl}-${side}: ${frames.length} frames over ${span.toFixed(1)}s (${(frames.length / span).toFixed(1)} fps captured), wall ${((Date.now() - t0) / 1000).toFixed(0)}s`);
  await browser.close();
})();
