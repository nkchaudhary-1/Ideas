// The quick bar (one row of tools, one slider, a tick): Adjust and Filters, in Edit mode on a desktop window and on a phone.
// Run the app first (`npm run dev -- -p 3100`).
const { chromium, devices } = require('playwright');
const path = require('path');
const S = path.resolve(__dirname, '../../public/samples') + '/';
const base = process.env.BASE_URL || 'http://localhost:3100';
let pass = 0, fail = 0;
const ok = (c, m, extra) => { c ? pass++ : fail++; console.log((c ? 'PASS ' : 'FAIL ') + m + (c || extra === undefined ? '' : '  → ' + JSON.stringify(extra))); };
const fill = (page) => page.evaluate(() => { const s = window.__store.getState(); const sl = s.project.slides.find((x) => x.id === s.project.activeSlideId); const el = sl.elements.find((e) => e.fill); return { adj: el.fill.adjustments, filter: el.fill.filter }; });

async function run(label, ctxOpts, tap) {
  const browser = await chromium.launch();
  const ctx = await browser.newContext(ctxOpts);
  const page = await ctx.newPage();
  const errs = []; page.on('pageerror', (e) => errs.push(e.message));
  const click = (sel) => (tap ? page.tap(sel) : page.click(sel));
  await page.goto(base, { waitUntil: 'networkidle' });
  await page.waitForSelector('[data-testid=new-project-dialog]');
  await click('[data-testid=intent-edit]');
  await page.setInputFiles('[data-testid=new-project-input]', [S + 'sample-1.jpg', S + 'sample-2.jpg']);
  await click('[data-testid=create-project]'); await page.waitForTimeout(3500);
  await page.evaluate(() => window.__store.getState().setUI({ sheet: null })); await page.waitForTimeout(400);
  // the wheel (folded on a narrow stage) opens, then Light & colour opens the bar
  if (await page.locator('[data-testid=photo-wheel-toggle]').count()) { await click('[data-testid=photo-wheel-toggle]'); await page.waitForTimeout(350); }
  await click('[data-testid=wheel-light]'); await page.waitForTimeout(400);
  ok(await page.locator('[data-testid=quick-adjust]').isVisible(), `${label}: Light & colour opens the quick bar`);
  ok(!(await page.locator('[data-testid=photo-toolbar]').count()), `${label}: and the wheel steps aside`);
  await click('[data-testid=quick-contrast]'); await page.waitForTimeout(200);
  await page.locator('[data-testid=quick-adjust] input[type=range]').fill('30'); await page.waitForTimeout(300);
  ok((await fill(page)).adj.contrast === 30, `${label}: the single slider edits the chosen tool`, (await fill(page)).adj);
  ok(/\+30/.test(await page.locator('[data-testid=quick-contrast]').textContent()), `${label}: and the chip shows its value`);
  await click('[data-testid=quick-saturation]'); await page.waitForTimeout(200);
  await page.locator('[data-testid=quick-adjust] input[type=range]').fill('-20'); await page.waitForTimeout(300);
  const a = (await fill(page)).adj;
  ok(a.saturation === -20 && a.contrast === 30, `${label}: another tool keeps the first one's value`, a);
  await click('[data-testid=quick-tab-filters]'); await page.waitForTimeout(500);
  ok((await page.locator('[data-testid=quick-adjust] [data-testid^=filter-]').count()) >= 15, `${label}: Filters shows a row of live previews`);
  await click('[data-testid=filter-vivid]'); await page.waitForTimeout(300);
  ok((await fill(page)).filter.id === 'vivid', `${label}: tapping one applies it`);
  await page.locator('[data-testid=quick-adjust] input[type=range]').fill('40'); await page.waitForTimeout(300);
  ok((await fill(page)).filter.intensity === 40, `${label}: and the slider sets its strength`);
  const b = await page.locator('[data-testid=quick-adjust]').boundingBox();
  const vp = page.viewportSize();
  ok(b.x >= 0 && b.x + b.width <= vp.width && b.y >= 0 && b.y + b.height <= vp.height, `${label}: the bar fits the screen`, b);
  await click('[data-testid=quick-done]'); await page.waitForTimeout(300);
  ok(!(await page.locator('[data-testid=quick-adjust]').count()), `${label}: the tick puts it away`);
  ok((await fill(page)).adj.contrast === 30 && (await fill(page)).filter.id === 'vivid', `${label}: and keeps every edit`);
  await click('[data-testid=wheel-filters]').catch(() => {}); await page.waitForTimeout(300);
  ok(errs.length === 0, `${label}: no page errors`, errs.slice(0, 2));
  await page.screenshot({ path: `${process.env.SHOTS || '/tmp'}/quick-${label}.png` });
  await browser.close();
}

(async () => {
  await run('desktop', { viewport: { width: 1360, height: 820 } }, false);
  await run('phone', { ...devices['iPhone 13'], viewport: { width: 390, height: 844 } }, true);
  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
})();
