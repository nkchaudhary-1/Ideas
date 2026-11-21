// Knowing where you are: the mode chip and its steps (an empty canvas stays clear), the labelled rail, the merged Elements panel.
// Run the app first (`npm run dev -- -p 3100`).
const { chromium, devices } = require('playwright');
const path = require('path');
const S = path.resolve(__dirname, '../../public/samples') + '/';
const base = process.env.BASE_URL || 'http://localhost:3100';
let pass = 0, fail = 0;
const ok = (c, m, extra) => { c ? pass++ : fail++; console.log((c ? 'PASS ' : 'FAIL ') + m + (c || extra === undefined ? '' : '  → ' + JSON.stringify(extra))); };
const addPhoto = (page, file) => page.evaluate(async (f) => { const blob = await (await fetch('/samples/' + f)).blob(); const s = window.__store.getState(); const assets = await s.importMedia([new File([blob], f, { type: blob.type })]); s.addMediaToCanvas(assets[0]); }, file);
const chipText = async (page) => (await page.locator('[data-testid=guide-chip]').textContent()).replace(/\s+/g, ' ').trim();

(async () => {
  const browser = await chromium.launch();
  const errs = [];
  const fresh = async (opts) => { const ctx = await browser.newContext(opts); const page = await ctx.newPage(); page.on('pageerror', (e) => errs.push(e.message)); await page.goto(base, { waitUntil: 'networkidle' }); await page.waitForSelector('[data-testid=home]'); await page.click('[data-testid=home-create]'); await page.waitForSelector('[data-testid=new-project-dialog]'); return { ctx, page }; };

  // ── a carousel, start to finish, on a desktop window
  let { ctx, page } = await fresh({ viewport: { width: 1360, height: 820 } });
  await page.click('[data-testid=mode-carousel]'); await page.click('[data-testid=create-project]'); await page.waitForTimeout(1600);
  let t = await chipText(page);
  ok(/Carousel/.test(t) && /Step 1 of 4/.test(t) && /Add photos/.test(t), 'the chip names the mode and the step', t);
  ok(!(await page.locator('[data-testid=guide-panel]').count()), 'the guide never opens on its own and covers nothing');
  await page.click('[data-testid=guide-chip]'); await page.waitForTimeout(300);
  ok(await page.locator('[data-testid=guide-panel]').isVisible(), 'a tap on the chip opens it');
  ok((await page.locator('[data-testid^=guide-step-]').count()) === 4, 'with four steps');
  ok((await page.locator('[data-testid=guide-panel]').textContent()).includes('You’re making a carousel'), 'and says what you are making');
  ok((await page.locator('[data-testid=guide-step-style]').getAttribute('data-done')) === 'false', 'later steps are not ticked before earlier ones');
  await page.keyboard.press('Escape'); await page.waitForTimeout(250);
  ok(!(await page.locator('[data-testid=empty-canvas]').count()), 'an empty slide stays clear: nothing sits over the canvas');
  await page.click('[data-testid=guide-chip]'); await page.waitForTimeout(250);
  await page.click('[data-testid=guide-do-photos]'); await page.waitForTimeout(400);
  ok(await page.evaluate(() => window.__store.getState().ui.leftPanel === 'uploads'), 'the first step opens Media');
  await addPhoto(page, 'sample-1.jpg'); await page.waitForTimeout(2000);
  t = await chipText(page);
  ok(/Step 2 of 4/.test(t) && /Add more slides/.test(t), 'and the chip moves to the next step', t);
  await page.evaluate(() => { const s = window.__store.getState(); s.addSlide({ afterId: s.project.activeSlideId }); }); await page.waitForTimeout(500);
  t = await chipText(page);
  ok(/Step 3 of 4/.test(t), 'a second slide completes step 2', t);
  ok(!(await page.locator('[data-testid=empty-canvas]').count()), 'and the empty second slide stays clear too');
  await page.click('[data-testid=guide-chip]'); await page.waitForTimeout(300);
  ok((await page.locator('[data-testid=guide-step-photos]').getAttribute('data-done')) === 'true', 'finished steps are ticked');
  await page.click('[data-testid=guide-do-style]'); await page.waitForTimeout(400);
  ok(await page.evaluate(() => window.__store.getState().ui.leftPanel === 'text'), 'a step button opens the right tool');
  await page.click('[data-testid=guide-chip]'); await page.waitForTimeout(250);
  await page.click('[data-testid=guide-hide]'); await page.waitForTimeout(250);
  ok(/what to do next/i.test((await page.locator('[data-testid=guide-chip]').getAttribute('aria-label')) || ''), '"Hide steps" folds the chip into a help button');
  await ctx.close();

  // ── the labelled rail and the merged Elements panel
  ({ ctx, page } = await fresh({ viewport: { width: 1360, height: 820 } }));
  await page.click('[data-testid=mode-single]'); await page.click('[data-testid=create-project]'); await page.waitForTimeout(1000);
  const rail = (await page.locator('[data-testid=left-rail]').textContent()) || '';
  for (const w of ['Media', 'Layouts', 'Templates', 'Text', 'Elements', 'Frames', 'Backdrop', 'Colours', 'Layers']) ok(rail.includes(w), `the rail labels "${w}"`);
  for (const w of ['Add', 'Design', 'Manage']) ok(rail.includes(w), `and titles the "${w}" group`);
  await page.click('[data-testid=rail-elements]'); await page.waitForTimeout(400);
  const panel = (await page.locator('[data-testid=elements-panel]').textContent()) || '';
  ok(!/Graphics & decor|Interface pieces/.test(panel), 'Elements is one grid, not stacked cards');
  const all = await page.locator('[data-testid^=el-]:not([data-testid=el-search])').count();
  ok(all >= 30, 'with every shape and graphic in it', all);
  await page.getByRole('tab', { name: 'Graphics' }).click(); await page.waitForTimeout(200);
  const gfx = await page.locator('[data-testid^=el-]:not([data-testid=el-search])').count();
  ok(gfx > 5 && gfx < all, 'a tab narrows it down', { gfx, all });
  await page.getByRole('tab', { name: 'All' }).click();
  await page.fill('[data-testid=el-search]', 'heart'); await page.waitForTimeout(200);
  ok((await page.locator('[data-testid=el-heart]').count()) === 1 && (await page.locator('[data-testid^=el-]:not([data-testid=el-search])').count()) === 1, 'search finds a heart');
  await page.fill('[data-testid=el-search]', 'zzz'); await page.waitForTimeout(200);
  ok((await page.locator('[data-testid=elements-panel]').textContent()).includes('Nothing called'), 'and says so when nothing matches');

  // ── Layouts is one grid with tabs, not a stack of blocks; each name shows on hover
  await page.click('[data-testid=rail-layouts]'); await page.waitForTimeout(500);
  const tabNames = await page.locator('[data-testid=layout-tabs] [role=tab]').allTextContents();
  ok(['All', 'My layouts', 'Cards', 'Basic', 'Asymmetric', 'Dense', 'Editorial'].every((t) => tabNames.includes(t)), 'Layouts has one row of tabs', tabNames);
  const tiles = await page.locator('[data-testid^=grid-]').count();
  ok(tiles >= 25, 'with every layout in the one grid', tiles);
  ok(!/Choose a layout|^Cards$/m.test((await page.locator('[data-testid=layouts-panel] section').allTextContents()).join('\n')) || (await page.locator('[data-testid=layouts-panel] section').count()) <= 1, 'and no stack of blocks above it');
  const op = (sel) => page.evaluate((q) => getComputedStyle(document.querySelector(q)).opacity, sel);
  ok((await op('[data-testid=grid-four] span')) === '0', 'a name is hidden until you point at the layout');
  await page.hover('[data-testid=grid-four]'); await page.waitForTimeout(350);
  ok((await op('[data-testid=grid-four] span')) === '1' && (await page.locator('[data-testid=grid-four] span').textContent()).length > 0, 'and shows while you do');
  await page.getByRole('tab', { name: 'Cards' }).click(); await page.waitForTimeout(250);
  ok((await page.locator('[data-testid^=grid-]').count()) === 4, 'a tab narrows the grid (Cards has four)');
  await page.getByRole('tab', { name: 'My layouts' }).click(); await page.waitForTimeout(250);
  ok((await page.locator('[data-testid=layout-grid]').textContent()).includes('Save layout'), 'My layouts says how to save one when there are none');
  await ctx.close();

  // ── a panorama and an Edit project name themselves too
  ({ ctx, page } = await fresh({ viewport: { width: 1360, height: 820 } }));
  await page.click('[data-testid=mode-panorama]'); await page.click('[data-testid=create-project]'); await page.waitForTimeout(1400);
  t = await chipText(page);
  ok(/Panorama/.test(t), 'a panorama says Panorama', t);
  const size = ((await page.locator('[data-testid=format-chip]').textContent()) || '').replace(/\s+/g, ' ');
  ok(/slides/.test(size) && !/28:5|12:5/.test(size.replace('Size', '')) || /4:5/.test(size), 'and its size chip counts slides of 4:5, not 12:5', size);
  await ctx.close();
  ({ ctx, page } = await fresh({ viewport: { width: 1360, height: 820 } }));
  await page.click('[data-testid=intent-edit]'); await page.setInputFiles('[data-testid=new-project-input]', [S + 'sample-1.jpg']); await page.click('[data-testid=create-project]'); await page.waitForTimeout(3000);
  t = await chipText(page);
  ok(/Photo & video edit/.test(t), 'an Edit project says so', t);
  await ctx.close();

  // ── on a phone the chip is short and the prompt fits
  ({ ctx, page } = await fresh({ ...devices['iPhone 13'], viewport: { width: 390, height: 844 } }));
  await page.tap('[data-testid=mode-carousel]'); await page.tap('[data-testid=create-project]'); await page.waitForTimeout(1600);
  t = await chipText(page);
  ok(/Carousel/.test(t) && /1\/4/.test(t), 'on a phone the chip reads "Carousel · 1/4"', t);
  await page.keyboard.press('Escape'); await page.waitForTimeout(300);
  const box = await page.locator('[data-testid=guide-chip]').boundingBox();
  ok(!!box && box.x >= 0 && box.x + box.width <= 390, 'the chip fits the screen', box);
  ok(!(await page.locator('[data-testid=empty-canvas]').count()), 'and no card covers the canvas');
  const sw = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
  ok(sw <= 0, 'no sideways scroll', sw);
  await page.tap('[data-testid=rail-layouts]'); await page.waitForTimeout(600);
  const nm = await page.evaluate(() => { const e = document.querySelector('[data-testid=grid-four] span'); const c = getComputedStyle(e); return { opacity: c.opacity, position: c.position }; });
  ok(nm.opacity === '1' && nm.position === 'static', 'on a phone, where nothing hovers, layout names are always shown', nm);
  await ctx.close();

  ok(errs.length === 0, 'no page errors', errs.slice(0, 2));
  console.log(`\n${pass} passed, ${fail} failed`);
  await browser.close();
  process.exit(fail ? 1 : 0);
})();
