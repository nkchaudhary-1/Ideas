// Templates: the panel lists 50–60 of them, every one applies cleanly onto a fresh project at its own size, and the category tabs filter.
// Run the app first (`npm run dev -- -p 3100`). Optional: SHOTS=/some/dir saves each template's first slide as a PNG.
const { chromium } = require('playwright');
const fs = require('fs');
let pass = 0, fail = 0;
const ok = (c, m, extra) => { c ? pass++ : fail++; if (!c || process.env.VERBOSE) console.log((c ? 'PASS ' : 'FAIL ') + m + (c || extra === undefined ? '' : '  → ' + JSON.stringify(extra))); };

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1600, height: 1000 } });
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', (e) => errs.push('pageerror ' + e.message));
  page.on('console', (m) => { if (m.type() === 'error') errs.push(m.text().slice(0, 160)); });
  await page.goto(process.env.BASE_URL || 'http://localhost:3100', { waitUntil: 'networkidle' });
  const fresh = async () => {
    await page.evaluate(() => window.__store.getState().setUI({ newProjectOpen: true }));
    await page.waitForSelector('[data-testid=new-project-dialog]');
    await page.click('[data-testid=mode-blank]'); await page.click('[data-testid=create-project]'); await page.waitForTimeout(450);
    await page.evaluate(() => window.__store.getState().setUI({ leftPanel: 'templates' })); await page.waitForTimeout(250);
  };
  await page.waitForSelector('[data-testid=new-project-dialog]');
  await fresh();

  const cards = () => page.evaluate(() => [...document.querySelectorAll('[data-testid=template-card]')].map((c) => ({ id: c.querySelector('[data-testid^="apply-"]').getAttribute('data-testid').slice(6), name: c.textContent.trim().slice(0, 40) })));
  const all = await cards();
  ok(all.length >= 50 && all.length <= 60, `the Templates panel lists 50 to 60 templates (${all.length})`);
  ok(new Set(all.map((c) => c.id)).size === all.length, 'every card is unique');

  // category tabs filter the list
  const chip = (name) => page.locator('[data-testid=template-tabs]').getByRole('tab', { name, exact: true });
  for (const cat of ['Story', 'Quote', 'Fashion', 'Food', 'Sale', 'Carousel', 'Event']) {
    await chip(cat).click(); await page.waitForTimeout(200);
    const n = (await cards()).length;
    ok(n >= 4 && n < all.length, `the "${cat}" tab shows its own templates (${n})`);
  }
  await chip('All').click(); await page.waitForTimeout(200);

  // every template applies onto an empty project, at its own size, without errors
  const errBefore = errs.length;
  for (const { id } of all) {
    await fresh();
    await page.evaluate((i) => document.querySelector(`[data-testid="apply-${i}"]`).click(), id);
    await page.waitForTimeout(500);
    const r = await page.evaluate(() => { const s = window.__store.getState(); const p = s.project; return { slides: p.slides.length, els: p.slides.reduce((n, sl) => n + sl.elements.length, 0), w: p.slides[0].width, h: p.slides[0].height, fw: p.format.width, fh: p.format.height }; });
    ok(r.slides >= 1 && r.els >= 1, `${id}: applies with ${r.slides} slide(s) and ${r.els} elements`, r);
    ok(r.w === r.fw && r.h === r.fh, `${id}: the canvas takes the template's size`, r);
    if (process.env.SHOTS) {
      fs.mkdirSync(process.env.SHOTS, { recursive: true });
      await page.evaluate(() => { const s = window.__store.getState(); s.clearSelection(); s.setUI({ leftPanel: null, rightOpen: false }); s.requestFit(); });
      await page.waitForTimeout(900);
      const b = await page.evaluate(() => { const s = window.__store.getState(); const sl = s.project.slides[0]; const w = document.querySelector('[data-testid=workspace]').getBoundingClientRect(); const v = s.ui.view; return { x: w.x + v.x, y: w.y + v.y, w: sl.width * v.scale, h: sl.height * v.scale }; });
      await page.screenshot({ path: `${process.env.SHOTS}/${id}.png`, clip: { x: Math.max(0, b.x), y: Math.max(0, b.y), width: Math.min(b.w, 1600 - b.x), height: Math.min(b.h, 1000 - b.y) } });
    }
  }
  ok(errs.length === errBefore, 'no console errors while applying every template', errs.slice(errBefore, errBefore + 3));

  console.log(`\n${pass} passed, ${fail} failed`);
  await browser.close();
  process.exit(fail ? 1 : 0);
})();
