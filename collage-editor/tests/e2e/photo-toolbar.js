// The photo wheel: while a photo is selected (or open, in Edit mode) a radial wheel of tools (zoom, move & crop, turn, flip, replace, filters, light, reset) is on screen.
// Also: Edit mode opens its adjustments card by itself on a smaller window. Run the app first (`npm run dev -- -p 3100`).
const { chromium, devices } = require('playwright');
const path = require('path');
const S = path.resolve(__dirname, '../../public/samples') + '/';
const T = path.resolve(__dirname, '../fixtures') + '/';
let pass = 0, fail = 0;
const ok = (c, m, extra) => { c ? pass++ : fail++; console.log((c ? 'PASS ' : 'FAIL ') + m + (c || extra === undefined ? '' : '  → ' + JSON.stringify(extra))); };
const base = process.env.BASE_URL || 'http://localhost:3100';

const firstFill = (page) => page.evaluate(() => {
  const s = window.__store.getState();
  const sl = s.project.slides.find((x) => x.id === s.project.activeSlideId);
  const el = sl.elements.find((e) => e.type === 'grid' || ((e.type === 'image' || e.type === 'video') && e.fill));
  if (el.type !== 'grid') return { zoom: el.fill.zoom, rot: el.fill.rotation90, flip: el.fill.flipX };
  const f = (function walk(n) { if (n.fill) return n.fill; for (const k of n.children || []) { const r = walk(k); if (r) return r; } return null; })(el.tree);
  return { zoom: f.zoom, rot: f.rotation90, flip: f.flipX };
});

(async () => {
  const browser = await chromium.launch();

  // ── a collage cell on a 1280px desktop window (the properties card starts shut here)
  let ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  let page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', (e) => errs.push(e.message));
  await page.goto(base, { waitUntil: 'networkidle' });
  await page.waitForSelector('[data-testid=home]'); await page.click('[data-testid=home-create]'); await page.waitForSelector('[data-testid=new-project-dialog]');
  await page.click('[data-testid=mode-collage]');
  await page.setInputFiles('[data-testid=new-project-input]', [S + 'sample-1.jpg', S + 'sample-2.jpg', S + 'sample-3.jpg', T + 'photo-4.jpg']);
  await page.click('[data-testid=create-project]'); await page.waitForTimeout(3500);
  ok(!(await page.locator('[data-testid=photo-toolbar]').count()), 'no photo wheel while nothing is selected');
  // pick one cell
  const geo = await page.evaluate(() => { const b = document.querySelector('[data-testid=workspace]').getBoundingClientRect(); const v = window.__store.getState().ui.view; return { x: b.x + v.x + 270 * v.scale, y: b.y + v.y + 337 * v.scale }; });
  await page.mouse.click(geo.x, geo.y); await page.waitForTimeout(500);
  ok(await page.locator('[data-testid=photo-wheel-toggle]').isVisible(), 'selecting a photo on a narrow stage shows the folded wheel button, so the photo stays clear');
  await page.click('[data-testid=photo-wheel-toggle]'); await page.waitForTimeout(350);
  ok(await page.locator('[data-testid=photo-toolbar]').isVisible(), 'and tapping it opens the wheel');
  ok((await page.locator('[data-testid^=wheel-]').count()) === 8, 'the wheel has eight tools');
  ok(await page.locator('[data-testid=properties]').isVisible(), 'the properties card opens by itself on first selection');
  // the wheel can be dragged anywhere on the canvas by its middle, and stays where it is dropped
  const wb = await page.locator('[data-testid=photo-toolbar]').boundingBox();
  const mid = await page.locator('[data-testid=photo-wheel-close]').boundingBox();
  const mx = mid.x + mid.width / 2, my = mid.y + mid.height / 2;
  await page.mouse.move(mx, my); await page.mouse.down(); await page.mouse.move(mx - 60, my - 90, { steps: 6 }); await page.mouse.up(); await page.waitForTimeout(300);
  const wb2 = await page.locator('[data-testid=photo-toolbar]').boundingBox();
  ok(Math.abs(wb2.x - (wb.x - 60)) < 6 && Math.abs(wb2.y - (wb.y - 90)) < 6, 'dragging the middle moves the wheel', { before: [wb.x, wb.y], after: [wb2.x, wb2.y] });
  ok(await page.locator('[data-testid=photo-toolbar]').isVisible(), 'and a drag does not fold it');
  const stageBox = await page.locator('[data-testid=workspace]').boundingBox();
  await page.mouse.move(wb2.x + wb2.width / 2, wb2.y + wb2.height / 2); await page.mouse.down(); await page.mouse.move(stageBox.x - 400, stageBox.y - 400, { steps: 6 }); await page.mouse.up(); await page.waitForTimeout(300);
  const wb3 = await page.locator('[data-testid=photo-toolbar]').boundingBox();
  ok(wb3.x >= stageBox.x - 1 && wb3.y >= stageBox.y - 1, 'it cannot be dragged off the canvas', { wheel: [wb3.x, wb3.y], stage: [stageBox.x, stageBox.y] });
  const z0 = (await firstFill(page)).zoom;
  await page.click('[data-testid=wheel-zoom]'); await page.waitForTimeout(150);
  await page.click('[data-testid=photo-zoom-in]'); await page.click('[data-testid=photo-zoom-in]'); await page.waitForTimeout(250);
  const z1 = (await firstFill(page)).zoom;
  ok(Math.abs(z1 - (z0 + 0.2)) < 0.011, 'zoom in twice adds 20%', { z0, z1 });
  ok((await page.locator('[data-testid=photo-zoom-pct]').textContent()).trim() === `${Math.round(z1 * 100)}%`, 'the zoom readout follows');
  await page.click('[data-testid=photo-zoom-out]'); await page.waitForTimeout(200);
  ok(Math.abs((await firstFill(page)).zoom - (z1 - 0.1)) < 0.011, 'zoom out takes 10% off');
  await page.click('[data-testid=photo-zoom-pct]'); await page.waitForTimeout(200);
  ok((await firstFill(page)).zoom === 1, 'the readout resets zoom to 100%');
  await page.click('[data-testid=wheel-turn]'); await page.waitForTimeout(200);
  ok((await firstFill(page)).rot === 90, 'rotate turns the photo 90 degrees');
  await page.click('[data-testid=wheel-flip]'); await page.waitForTimeout(200);
  ok((await firstFill(page)).flip === true, 'flip mirrors the photo');
  await page.click('[data-testid=wheel-move]'); await page.waitForTimeout(250);
  ok(await page.evaluate(() => !!window.__store.getState().ui.cropId), 'Move & crop enters crop mode');
  ok(await page.locator('[aria-label="Done"]').count() === 1, 'and the segment becomes Done');
  await page.click('[data-testid=wheel-move]'); await page.waitForTimeout(250);
  ok(await page.evaluate(() => !window.__store.getState().ui.cropId), 'Done leaves crop mode');
  await page.click('[data-testid=wheel-replace]'); await page.waitForTimeout(300);
  ok(await page.locator('[data-testid=media-picker]').isVisible(), 'Replace opens the photo picker');
  await page.keyboard.press('Escape'); await page.waitForTimeout(200);
  await page.evaluate(() => window.__store.getState().setUI({ rightOpen: false })); await page.waitForTimeout(200);
  ok(await page.locator('[data-testid=edit-chip-desktop]').isVisible(), 'with the card shut, an Edit chip brings it back');
  await page.click('[data-testid=wheel-light]'); await page.waitForTimeout(500);
  ok(await page.locator('[data-testid=quick-adjust]').isVisible() && !(await page.locator('[data-testid=photo-toolbar]').count()), 'Light & colour opens the quick bar and the wheel steps aside');
  await page.click('[data-testid=quick-more]'); await page.waitForTimeout(500);
  ok(await page.locator('[data-testid=properties]').isVisible(), '"More" opens the properties card');
  ok(await page.locator('[data-testid=photo-toolbar]').isVisible(), 'and the wheel comes back');
  await page.click('[data-testid=photo-wheel-close]'); await page.waitForTimeout(250);
  ok(await page.locator('[data-testid=photo-wheel-toggle]').isVisible() && !(await page.locator('[data-testid=photo-toolbar]').count()), 'tapping the middle folds the wheel into a button');
  await page.click('[data-testid=photo-wheel-toggle]'); await page.waitForTimeout(250);
  ok(await page.locator('[data-testid=photo-toolbar]').isVisible(), 'and the button opens it again');
  await ctx.close();

  // ── Edit mode on a small window: the adjustments card is open from the start and the toolbar belongs to the open photo
  ctx = await browser.newContext({ viewport: { width: 1000, height: 640 } });
  page = await ctx.newPage();
  page.on('pageerror', (e) => errs.push(e.message));
  await page.goto(base, { waitUntil: 'networkidle' });
  await page.waitForSelector('[data-testid=home]'); await page.click('[data-testid=home-create]'); await page.waitForSelector('[data-testid=new-project-dialog]');
  await page.click('[data-testid=intent-edit]');
  await page.setInputFiles('[data-testid=new-project-input]', [S + 'sample-1.jpg', S + 'sample-2.jpg']);
  await page.click('[data-testid=create-project]'); await page.waitForTimeout(3500);
  ok(await page.locator('[data-testid=properties]').isVisible(), 'Edit mode opens the adjustments card on a 1000px window');
  ok(await page.getByText('Filters', { exact: true }).first().isVisible(), 'the Filters section is visible');
  await page.click('[data-testid=photo-wheel-toggle]'); await page.waitForTimeout(350);
  ok(await page.locator('[data-testid=photo-toolbar]').isVisible(), 'the photo wheel is there without selecting anything');
  const w = await page.evaluate(() => { const r = document.querySelector('[data-testid=photo-toolbar]').getBoundingClientRect(); const s = document.querySelector('[data-testid=workspace]').getBoundingClientRect(); return { l: r.left >= s.left - 1, r: r.right <= s.right + 1 }; });
  ok(w.l && w.r, 'the wheel fits inside the stage', w);
  await page.click('[data-testid=wheel-zoom]'); await page.waitForTimeout(150);
  await page.click('[data-testid=photo-zoom-in]'); await page.waitForTimeout(250);
  ok((await firstFill(page)).zoom > 1.05, 'zoom works on the open photo');
  await page.screenshot({ path: process.env.SHOT || '/tmp/photo-toolbar-edit.png' });
  await ctx.close();

  // ── phone: no wheel; the bottom bar carries the selected photo's tools
  ctx = await browser.newContext({ ...devices['iPhone 13'], viewport: { width: 390, height: 844 } });
  page = await ctx.newPage();
  page.on('pageerror', (e) => errs.push(e.message));
  await page.goto(base, { waitUntil: 'networkidle' });
  await page.waitForSelector('[data-testid=home]'); await page.click('[data-testid=home-create]'); await page.waitForSelector('[data-testid=new-project-dialog]');
  await page.tap('[data-testid=mode-single]');
  await page.setInputFiles('[data-testid=new-project-input]', [S + 'sample-1.jpg']);
  await page.tap('[data-testid=create-project]'); await page.waitForTimeout(3500);
  await page.evaluate(() => { const s = window.__store.getState(); const sl = s.project.slides.find((x) => x.id === s.project.activeSlideId); s.select([sl.elements[0].id]); s.setUI({ sheet: null }); });
  await page.waitForTimeout(500);
  ok((await page.locator('[data-testid=photo-wheel-toggle]').count()) === 0 && (await page.locator('[data-testid=photo-toolbar]').count()) === 0, 'on a phone there is no wheel over the picture');
  const bar = await page.locator('[data-testid=context-bar]').boundingBox();
  ok(!!bar && bar.x >= 0 && bar.x + bar.width <= 390, 'the photo tools sit in one bar along the bottom, inside the screen', bar);
  await page.tap('[data-testid=ctx-turn]'); await page.waitForTimeout(250);
  ok((await firstFill(page)).rot === 90, 'Turn rotates the photo');
  await page.tap('[data-testid=ctx-flip]'); await page.waitForTimeout(250);
  ok((await firstFill(page)).flip === true, 'Flip mirrors it');
  await page.tap('[data-testid=ctx-reset]'); await page.waitForTimeout(250);
  const r = await firstFill(page);
  ok(r.rot === 0 && r.flip === false && r.zoom === 1, 'Reset puts it back', r);
  await page.tap('[data-testid=ctx-crop]'); await page.waitForTimeout(250);
  ok(await page.evaluate(() => !!window.__store.getState().ui.cropId) && (await page.locator('[data-testid=ctx-crop]').textContent()).includes('Done'), 'Crop enters crop mode and the button becomes Done');
  await page.tap('[data-testid=ctx-crop]'); await page.waitForTimeout(250);
  ok(await page.evaluate(() => !window.__store.getState().ui.cropId), 'Done leaves it');
  await page.tap('[data-testid=ctx-replace]'); await page.waitForTimeout(350);
  ok(await page.locator('[data-testid=media-picker]').isVisible(), 'Replace opens the photo picker');
  await page.keyboard.press('Escape'); await page.waitForTimeout(250);
  await page.tap('[data-testid=ctx-filters]'); await page.waitForTimeout(500);
  ok(await page.evaluate(() => window.__store.getState().ui.quick === 'filters') && await page.locator('[data-testid=quick-adjust]').isVisible(), 'Filters opens the quick bar on its filter row');
  await page.tap('[data-testid=quick-more]'); await page.waitForTimeout(500);
  ok(await page.evaluate(() => window.__store.getState().ui.sheet === 'props'), '"More" opens the properties sheet');
  await page.tap('[data-testid=sheet-close]'); await page.waitForTimeout(300);
  await page.tap('[data-testid=ctx-done]'); await page.waitForTimeout(300);
  ok(await page.evaluate(() => window.__store.getState().selection.length === 0) && await page.locator('[data-testid=dock]').isVisible(), 'Done deselects and the tool rail comes back');
  await ctx.close();

  ok(errs.length === 0, 'no page errors', errs.slice(0, 2));
  console.log(`\n${pass} passed, ${fail} failed`);
  await browser.close();
  process.exit(fail ? 1 : 0);
})();
