// The phone editor: one slim bar above the canvas, one bar below it, nothing floating over the picture.
// Run the app first (`npm run dev -- -p 3100`).
const { chromium, devices } = require('playwright');
const path = require('path');
const S = path.resolve(__dirname, '../../public/samples') + '/';
const base = process.env.BASE_URL || 'http://localhost:3100';
let pass = 0, fail = 0;
const ok = (c, m, extra) => { c ? pass++ : fail++; console.log((c ? 'PASS ' : 'FAIL ') + m + (c || extra === undefined ? '' : '  → ' + JSON.stringify(extra))); };
const rect = (page, sel) => page.evaluate((s) => { const e = document.querySelector(s); if (!e || e.offsetParent === null) return null; const r = e.getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height, r: r.right, b: r.bottom }; }, sel);
const visible = (page, sel) => page.evaluate((s) => [...document.querySelectorAll(s)].some((e) => e.getClientRects().length > 0 && e.getBoundingClientRect().width > 0), sel);
const store = (page, fn, arg) => page.evaluate(fn, arg);

async function start(browser, vp, mode = 'carousel', files = [S + 'sample-1.jpg', S + 'sample-2.jpg', S + 'sample-3.jpg']) {
  const ctx = await browser.newContext({ ...devices['iPhone 13'], viewport: vp });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => errs.push(e.message));
  await page.goto(base, { waitUntil: 'networkidle' });
  await page.waitForSelector('[data-testid=home]');
  await page.tap('[data-testid=home-create]'); await page.waitForSelector('[data-testid=new-project-dialog]');
  await page.tap(`[data-testid=mode-${mode}]`);
  if (files.length) await page.setInputFiles('[data-testid=new-project-input]', files);
  await page.tap('[data-testid=create-project]'); await page.waitForTimeout(files.length ? 4000 : 1500);
  return { ctx, page };
}
const errs = [];

(async () => {
  const browser = await chromium.launch();

  // ── the layout: a bar on top, the canvas, a strip, a bar below
  let { ctx, page } = await start(browser, { width: 390, height: 844 });
  await store(page, () => window.__store.getState().clearSelection());
  await page.waitForTimeout(300);
  const bar = await rect(page, '[data-testid=compact-bar]'), stage = await rect(page, '[data-testid=workspace]'), dock = await rect(page, '[data-testid=dock]');
  ok(!!bar && !!stage && bar.b <= stage.y + 1, 'the top bar sits above the canvas, not over it', { bar: bar && bar.b, stage: stage && stage.y });
  ok(!!dock && dock.y >= stage.b - 1, 'the bottom bar sits below it', { dock: dock && dock.y, stage: stage && stage.b });
  ok(stage.h >= 844 * 0.55, 'the canvas gets at least 55% of the screen', Math.round(stage.h / 8.44) + '%');
  for (const id of ['format-chip', 'zoom-fit', 'preview', 'photo-wheel-toggle', 'edit-chip', 'play-slide']) ok(!(await visible(page, `[data-testid=${id}]`)), `${id} no longer floats over the canvas`);
  ok(await visible(page, '[data-testid=guide-chip]') && (await page.locator('[data-testid=guide-chip]').textContent()).includes('Carousel'), 'the kind of project is the line under its name');
  const row = await store(page, () => { const r = (id) => document.querySelector(`[data-testid=${id}]`).getBoundingClientRect(); return ['back-home', 'undo', 'redo', 'export', 'app-menu'].map((i) => Math.round(r(i).right)); });
  ok(row.every((x) => x <= 390), 'every top-bar button is on screen', row);
  ok((await rect(page, '[data-testid=slide-strip]')).h <= 80, 'the slide strip is one slim row of thumbnails', (await rect(page, '[data-testid=slide-strip]')).h);
  ok(!(await visible(page, '[data-testid=slide-thumb] button[aria-label="Duplicate slide"]')), 'with no buttons on top of the thumbnails');

  // ── the bottom bar follows the selection
  const picks = await store(page, () => { const s = window.__store.getState(); const sl = s.project.slides.find((x) => x.id === s.project.activeSlideId); return sl.elements.length; });
  await store(page, () => { const s = window.__store.getState(); const sl = s.project.slides.find((x) => x.id === s.project.activeSlideId); s.select([sl.elements[0].id]); });
  await page.waitForTimeout(400);
  ok(await visible(page, '[data-testid=ctx-crop]') && !(await visible(page, '[data-testid=dock]')), 'a selected photo swaps the tool rail for photo tools');
  await page.tap('[data-testid=ctx-done]'); await page.waitForTimeout(300);
  ok(await visible(page, '[data-testid=dock]'), 'Done brings the tool rail back');
  await page.tap('[data-testid=rail-text]'); await page.waitForTimeout(400);
  await page.tap('[data-testid=add-heading]'); await page.waitForTimeout(500);
  ok(await visible(page, '[data-testid=ctx-done]') && (await page.locator('[data-testid=context-bar]').textContent()).includes('Done'), 'while typing, the bar offers Done');
  await store(page, () => window.__store.getState().setUI({ editingTextId: null, sheet: null })); await page.waitForTimeout(400);
  const before = await store(page, () => { const s = window.__store.getState(); return s.project.slides.find((x) => x.id === s.project.activeSlideId).elements.length; });
  await page.tap('[data-testid=ctx-duplicate]'); await page.waitForTimeout(300);
  const dup = await store(page, () => { const s = window.__store.getState(); return s.project.slides.find((x) => x.id === s.project.activeSlideId).elements.length; });
  ok(dup === before + 1, 'Duplicate copies the selected text', { before, dup });
  await page.tap('[data-testid=ctx-delete]'); await page.waitForTimeout(300);
  const del = await store(page, () => { const s = window.__store.getState(); return s.project.slides.find((x) => x.id === s.project.activeSlideId).elements.length; });
  ok(del === before, 'and Delete removes it', { before, del });

  // ── the menu holds everything that used to float
  await page.tap('[data-testid=app-menu]'); await page.waitForTimeout(350);
  const menu = await rect(page, '[data-testid=app-menu-panel]');
  ok(!!menu && menu.x >= 0 && menu.r <= 390 && menu.b <= 844, 'the menu opens inside the screen', menu);
  for (const id of ['new-project', 'open-projects', 'preview', 'zoom-fit', 'format-chip', 'view-menu', 'menu-duplicate-slide', 'menu-delete-slide', 'toggle-theme']) ok(await visible(page, `[data-testid=${id}]`), `the menu has ${id}`);
  await page.tap('[data-testid=format-chip]'); await page.waitForTimeout(400);
  ok(await visible(page, '[data-testid=format-menu-inline]'), 'Canvas size opens the size choices inside the menu');
  const mfit = await rect(page, '[data-testid=format-menu-inline]');
  ok(mfit.x >= 0 && mfit.r <= 390, 'and they fit', mfit);
  await page.keyboard.press('Escape'); await page.waitForTimeout(250);
  const n0 = await store(page, () => window.__store.getState().project.slides.length);
  await page.tap('[data-testid=app-menu]'); await page.waitForTimeout(300); await page.tap('[data-testid=menu-duplicate-slide]'); await page.waitForTimeout(500);
  ok((await store(page, () => window.__store.getState().project.slides.length)) === n0 + 1, 'Duplicate slide adds one');
  await page.tap('[data-testid=app-menu]'); await page.waitForTimeout(300); await page.tap('[data-testid=menu-delete-slide]'); await page.waitForTimeout(500);
  ok((await store(page, () => window.__store.getState().project.slides.length)) === n0, 'Delete slide removes it');
  await page.tap('[data-testid=app-menu]'); await page.waitForTimeout(300); await page.tap('[data-testid=preview]'); await page.waitForTimeout(900);
  ok(await visible(page, '[data-testid=preview-dialog]'), 'Preview opens from the menu');
  await store(page, () => window.__store.getState().setUI({ previewOpen: false })); await page.waitForTimeout(300);
  await page.tap('[data-testid=app-menu]'); await page.waitForTimeout(300); await page.tap('[data-testid=toggle-theme]'); await page.waitForTimeout(300);
  ok((await store(page, () => document.documentElement.dataset.theme)) === 'dark', 'the theme switch is in the menu');
  await page.tap('[data-testid=app-menu]'); await page.waitForTimeout(300); await page.tap('[data-testid=toggle-theme]'); await page.waitForTimeout(200);

  // ── rename from the title, and back to the projects
  await page.tap('[data-testid=project-name]'); await page.waitForTimeout(200);
  await page.fill('input[aria-label="Project name"]', 'Spring trip'); await page.keyboard.press('Enter'); await page.waitForTimeout(300);
  ok((await store(page, () => window.__store.getState().project.name)) === 'Spring trip', 'tapping the name renames the project');
  await page.tap('[data-testid=back-home]'); await page.waitForSelector('[data-testid=home]');
  ok((await page.locator('[data-testid=home]').count()) === 1, 'the back arrow goes to your projects');
  await ctx.close();

  // ── Edit mode: the tools are the bar, and Compare is hold-to-show
  const e = await browser.newContext({ ...devices['iPhone 13'], viewport: { width: 390, height: 844 } });
  const ep = await e.newPage(); ep.on('pageerror', (x) => errs.push(x.message));
  await ep.goto(base, { waitUntil: 'networkidle' }); await ep.waitForSelector('[data-testid=home]');
  await ep.tap('[data-testid=home-edit]'); await ep.waitForSelector('[data-testid=new-project-dialog]');
  await ep.setInputFiles('[data-testid=new-project-input]', [S + 'sample-2.jpg', S + 'sample-1.jpg']);
  await ep.tap('[data-testid=create-project]'); await ep.waitForTimeout(4000);
  ok(await visible(ep, '[data-testid=ctx-crop]') && await visible(ep, '[data-testid=ctx-filters]') && await visible(ep, '[data-testid=ctx-more]'), 'Edit mode shows crop, filters, light and more in the bottom bar');
  ok(!(await store(ep, () => window.__store.getState().ui.sheet)), 'and no sheet is open in the way');
  await ep.locator('[data-testid=compare]').scrollIntoViewIfNeeded();
  const cb = await ep.locator('[data-testid=compare]').boundingBox();
  await ep.touchscreen.tap(cb.x + 4, cb.y + 4).catch(() => {});
  await ep.mouse.move(cb.x + cb.width / 2, cb.y + cb.height / 2); await ep.mouse.down(); await ep.waitForTimeout(200);
  ok(await store(ep, () => window.__store.getState().ui.compare === true), 'holding Compare shows the original');
  await ep.mouse.up(); await ep.waitForTimeout(200);
  ok(await store(ep, () => window.__store.getState().ui.compare === false), 'and letting go brings the edit back');
  const edStrip = await rect(ep, '[data-testid=slide-strip]');
  ok(edStrip.h <= 130, 'the photo strip is flat and short', edStrip.h);
  await e.close();

  // ── the smallest phone
  ({ ctx, page } = await start(browser, { width: 320, height: 568 }));
  const sw = await store(page, () => document.documentElement.scrollWidth - innerWidth);
  ok(sw <= 0, '320×568: no sideways scroll', sw);
  const row320 = await store(page, () => { const r = (id) => document.querySelector(`[data-testid=${id}]`).getBoundingClientRect(); return ['back-home', 'undo', 'redo', 'export', 'app-menu'].map((i) => Math.round(r(i).right)); });
  ok(row320.every((x) => x <= 320), '320×568: the top-bar buttons are all on screen', row320);
  const name = await rect(page, '[data-testid=project-name]');
  ok(!!name && name.w >= 56, '320×568: the name still has room', name && name.w);
  const st320 = await rect(page, '[data-testid=workspace]');
  ok(st320.h >= 568 * 0.4, '320×568: the canvas keeps at least 40% of the screen', Math.round(st320.h / 5.68) + '%');
  await page.tap('[data-testid=app-menu]'); await page.waitForTimeout(350);
  const m320 = await rect(page, '[data-testid=app-menu-panel]');
  ok(!!m320 && m320.x >= 0 && m320.r <= 320 && m320.b <= 568, '320×568: the menu fits the screen', m320);
  await ctx.close();

  ok(errs.length === 0, 'no page errors', errs.slice(0, 2));
  console.log(`\n${pass} passed, ${fail} failed`);
  await browser.close();
  process.exit(fail ? 1 : 0);
})();
