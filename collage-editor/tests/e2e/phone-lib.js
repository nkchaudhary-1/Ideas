// Helpers for the phone suites: an emulated iPhone (touch, 390×844, DPR 3) plus raw touch gestures over CDP.
// Run the app first (`npm run dev -- -p 3100`); set BASE_URL to test another port or the built artifact.
const { chromium, devices } = require('playwright');
const path = require('path');
exports.S = path.resolve(__dirname, '../../public/samples') + '/';
exports.T = path.resolve(__dirname, '../fixtures') + '/';
exports.settle = (page, ms = 450) => page.waitForTimeout(ms);
exports.open = async (device = 'iPhone 13') => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ ...devices[device], acceptDownloads: true });
  const page = await ctx.newPage();
  const logs = [];
  page.on('console', (m) => { if (m.type() === 'error') logs.push(`[error] ${m.text().slice(0, 180)}`); });
  page.on('pageerror', (e) => logs.push(`[pageerror] ${e.message}`));
  await page.goto(process.env.BASE_URL || 'http://localhost:3100', { waitUntil: 'networkidle' });
  const cdp = await ctx.newCDPSession(page);
  const touch = (type, pts) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: pts.map((p, i) => ({ x: p[0], y: p[1], id: i })) });
  /** one finger down at a, move through steps to b, up */
  const drag = async (a, b, steps = 8) => {
    await touch('touchStart', [a]);
    for (let i = 1; i <= steps; i++) await touch('touchMove', [[a[0] + ((b[0] - a[0]) * i) / steps, a[1] + ((b[1] - a[1]) * i) / steps]]);
    await touch('touchEnd', []);
  };
  /** two fingers: a1→a2 and b1→b2 together */
  const pinch = async (a1, b1, a2, b2, steps = 8) => {
    await touch('touchStart', [a1, b1]);
    for (let i = 1; i <= steps; i++) {
      const k = i / steps;
      await touch('touchMove', [[a1[0] + (a2[0] - a1[0]) * k, a1[1] + (a2[1] - a1[1]) * k], [b1[0] + (b2[0] - b1[0]) * k, b1[1] + (b2[1] - b1[1]) * k]]);
    }
    await touch('touchEnd', []);
  };
  return { browser, ctx, page, logs, touch, drag, pinch };
};
exports.newProject = async (page, { intent = 'collage', mode = 'collage', files = [] } = {}) => {
  // first load lands on the front page; later calls come with the dialog already open over the editor
  await page.waitForSelector('[data-testid=home], [data-testid=new-project-dialog]');
  if (await page.locator('[data-testid=home]').count()) await page.tap(intent === 'edit' ? '[data-testid=home-edit]' : '[data-testid=home-create]');
  await page.waitForSelector('[data-testid=new-project-dialog]');
  if (intent === 'edit') await page.tap('[data-testid=intent-edit]'); else await page.tap(`[data-testid=mode-${mode}]`);
  if (files.length) await page.setInputFiles('[data-testid=new-project-input]', files);
  await page.tap('[data-testid=create-project]');
  await page.waitForTimeout(files.length ? 3500 : 800);
};
exports.state = (page) => page.evaluate(() => { const s = window.__store.getState(); const p = s.project; const sl = p.slides.find((x) => x.id === p.activeSlideId); return { view: s.ui.view, sel: s.selection, sheet: s.ui.sheet, els: sl.elements.map((e) => ({ id: e.id, type: e.type, x: Math.round(e.x), y: Math.round(e.y), w: Math.round(e.width), h: Math.round(e.height) })), slides: p.slides.length, kind: p.kind }; });
