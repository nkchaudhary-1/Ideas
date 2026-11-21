// Phone shell: the dock, bottom sheets, the capsule slider under a finger, the media picker, bottom-docked dialogs, Edit mode.
// Run the app first (`npm run dev -- -p 3100`).
const { open, newProject, state, settle, S, T } = require('./phone-lib');
let pass = 0, fail = 0;
const ok = (c, m, extra) => { c ? pass++ : fail++; console.log((c ? 'PASS ' : 'FAIL ') + m + (c || extra === undefined ? '' : '  → ' + JSON.stringify(extra))); };
const ui = (page) => page.evaluate(() => { const u = window.__store.getState().ui; return { sheet: u.sheet, size: u.sheetSize, panel: u.leftPanel, picker: !!u.mediaPicker }; });
const box = async (page, sel) => { const l = page.locator(sel).first(); return (await l.count()) ? l.boundingBox() : null; };

(async () => {
  const { browser, page, logs, drag } = await open();
  page.setDefaultTimeout(20000);
  const vp = page.viewportSize();
  await newProject(page, { intent: 'collage', mode: 'single', files: [S + 'sample-1.jpg'] });

  // ── dock and sheets
  let u = await ui(page);
  ok(u.sheet === null, 'no sheet is open on a fresh project');
  // a new project selects the photo you started it with, so the bottom bar shows that photo's tools; × puts the tool rail back
  ok(!!(await box(page, '[data-testid=context-bar]')) && !(await box(page, '[data-testid=dock]')), 'a new photo is selected, so the bottom bar shows its tools');
  await page.tap('[data-testid=ctx-done]'); await settle(page, 300);
  ok(!!(await box(page, '[data-testid=dock]')) && !(await box(page, '[data-testid=context-bar]')), 'Done deselects it and the tool dock is on screen');
  await page.tap('[data-testid=rail-text]'); await settle(page, 400);
  u = await ui(page);
  ok(u.sheet === 'tools' && u.panel === 'text', 'tapping a tool opens its sheet');
  const half = await box(page, '[data-testid=left-panel]');
  ok(Math.abs(half.height - Math.max(232, vp.height * 0.32)) < 6, 'the sheet opens short: 32% of the screen, never under 232px', { h: half.height });
  ok(half.y + half.height <= vp.height, 'the sheet is fully on screen');
  const stage = await box(page, '[data-testid=workspace]');
  ok(stage.height > 150, 'the canvas stays visible above the sheet', { h: stage.height });
  await page.tap('[data-testid=rail-text]'); await settle(page, 400);
  u = await ui(page);
  ok(u.sheet === null, 'tapping the same tool again closes the sheet');

  await page.tap('[data-testid=rail-layouts]'); await settle(page, 400);
  const h = await box(page, '[data-testid=sheet-handle]');
  await drag([h.x + h.width / 2, h.y + h.height / 2], [h.x + h.width / 2, h.y - 140]); await settle(page, 400);
  u = await ui(page);
  ok(u.size === 'full', 'dragging the handle up makes the sheet taller');
  const tall = await box(page, '[data-testid=left-panel]');
  const st2 = await box(page, '[data-testid=workspace]');
  ok(tall.height > half.height + 24 && st2.height > 200, 'a tall sheet is taller and still leaves room for the canvas', { sheet: tall.height, stage: st2.height });
  const h2 = await box(page, '[data-testid=sheet-handle]');
  await drag([h2.x + h2.width / 2, h2.y + h2.height / 2], [h2.x + h2.width / 2, h2.y + 140]); await settle(page, 400);
  u = await ui(page);
  ok(u.size === 'half' && u.sheet === 'tools', 'dragging down once makes it shorter');
  const h3 = await box(page, '[data-testid=sheet-handle]');
  await drag([h3.x + h3.width / 2, h3.y + h3.height / 2], [h3.x + h3.width / 2, h3.y + 140]); await settle(page, 400);
  u = await ui(page);
  ok(u.sheet === null, 'dragging down again closes it');

  // ── selecting a photo swaps the bottom bar to that photo's tools; More opens the properties sheet
  await page.evaluate(() => { const s = window.__store.getState(); const sl = s.project.slides.find((x) => x.id === s.project.activeSlideId); s.select([sl.elements[0].id]); });
  await settle(page, 400);
  ok(!!(await box(page, '[data-testid=ctx-filters]')) && !!(await box(page, '[data-testid=ctx-crop]')) && !(await box(page, '[data-testid=dock]')), 'a selected photo gets its own tools in the bottom bar');
  ok(!(await box(page, '[data-testid=photo-wheel-toggle]')) && !(await box(page, '[data-testid=edit-chip]')), 'with no wheel button or Edit chip over the picture');
  await page.tap('[data-testid=ctx-more]'); await settle(page, 500);
  u = await ui(page);
  ok(u.sheet === 'props', 'More opens the properties sheet');
  // anything that is not a photo gets Edit, Duplicate and Delete
  await page.evaluate(() => { const s = window.__store.getState(); s.setUI({ sheet: null }); s.clearSelection(); }); await settle(page, 300);
  await page.tap('[data-testid=rail-text]'); await settle(page, 500);
  await page.tap('[data-testid=add-heading]'); await settle(page, 500);
  await page.evaluate(() => window.__store.getState().setUI({ sheet: null, editingTextId: null })); await settle(page, 500);
  const sel = await page.evaluate(() => { const s = window.__store.getState(); const sl = s.project.slides.find((x) => x.id === s.project.activeSlideId); return sl.elements.filter((e) => s.selection.includes(e.id)).map((e) => e.type); });
  ok(sel.length === 1 && sel[0] === 'text', 'adding a heading selects it', sel);
  ok(!!(await box(page, '[data-testid=ctx-edit]')) && !!(await box(page, '[data-testid=ctx-duplicate]')) && !!(await box(page, '[data-testid=ctx-delete]')), 'a selected text shows Edit, Duplicate and Delete');
  await page.evaluate(() => { const s = window.__store.getState(); const sl = s.project.slides.find((x) => x.id === s.project.activeSlideId); s.select([sl.elements.find((e) => e.type === 'image').id]); s.setUI({ sheet: 'props', editingTextId: null }); }); await settle(page, 500);

  // ── the capsule slider follows a finger
  await page.evaluate(() => { const s = window.__store.getState(); s.setUI({ sheetSize: 'full' }); document.querySelectorAll('[data-testid=properties] section button[aria-expanded=false]').forEach((b) => b.click()); });
  await settle(page, 400);
  const op = page.locator('input[type=range][aria-label="Opacity"]').first();
  await op.scrollIntoViewIfNeeded(); await settle(page, 300);
  const ob = await op.boundingBox();
  ok(ob.height >= 44, 'the slider capsule is at least 44px tall', { h: ob.height });
  const y = ob.y + ob.height / 2;
  await drag([ob.x + ob.width - 22, y], [ob.x + 22 + (ob.width - 44) * 0.3, y], 10); await settle(page, 400);
  const o1 = await page.evaluate(() => { const s = window.__store.getState(); const sl = s.project.slides.find((x) => x.id === s.project.activeSlideId); return sl.elements[0].opacity; });
  ok(o1 > 0.2 && o1 < 0.4, 'dragging the knob sets the value (about 30%)', { opacity: o1 });
  const fillW = await page.evaluate(() => { const c = document.querySelector('input[type=range][aria-label=Opacity]').parentElement; const f = c.querySelector('span.cap-fill'); return f ? f.getBoundingClientRect().width / c.getBoundingClientRect().width : -1; });
  ok(fillW > 0.2 && fillW < 0.45, 'the black fill follows the knob', { fill: fillW });

  // ── the media picker fits the screen and closes on a tap outside
  await page.evaluate(() => window.__store.getState().setUI({ sheet: null })); await settle(page, 400);
  await page.evaluate(() => { const s = window.__store.getState(); const sl = s.project.slides.find((x) => x.id === s.project.activeSlideId); s.setUI({ mediaPicker: { x: window.innerWidth - 30, y: window.innerHeight - 140, elementId: sl.elements.find((e) => e.type === 'image').id } }); });
  await settle(page, 500);
  const pk = await box(page, '[data-testid=media-picker]');
  ok(!!pk && pk.x >= 0 && pk.x + pk.width <= vp.width && pk.y >= 0 && pk.y + pk.height <= vp.height, 'the media picker stays inside the screen', pk);
  await page.touchscreen.tap(12, 130); await settle(page, 400);
  u = await ui(page);
  ok(u.picker === false, 'a tap outside closes the media picker');

  // ── dialogs dock to the bottom edge
  await page.evaluate(() => window.__store.getState().setUI({ exportOpen: true })); await settle(page, 600);
  const dlg = await box(page, '[data-testid=export-dialog] [role=dialog]');
  ok(Math.abs(dlg.x + dlg.width - (vp.width - 8)) <= 2 && Math.abs(dlg.y + dlg.height - (vp.height - 8)) <= 2, 'the export dialog docks to the bottom with an 8px margin', dlg);
  await page.evaluate(() => window.__store.getState().setUI({ exportOpen: false })); await settle(page, 200);

  // ── nothing scrolls sideways
  const sw = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  ok(sw <= 0, 'the page has no horizontal scroll', { over: sw });

  // ── Edit mode: the photo and its tools are in view from the start, with no sheet in the way; More opens the adjustments
  await page.evaluate(() => window.__store.getState().setUI({ newProjectOpen: true })); await settle(page, 500);
  await newProject(page, { intent: 'edit', files: [S + 'sample-1.jpg', S + 'sample-2.jpg', T + 'clip-portrait.mp4'] });
  u = await ui(page);
  ok(u.sheet === null && !!(await box(page, '[data-testid=ctx-filters]')), 'Edit mode starts with the photo and its tools in view, no sheet in the way');
  ok(!!(await box(page, '[data-testid=select-bar]')), 'the photo strip and its select bar are on screen');
  const kind = await state(page);
  ok(kind.kind === 'edit' && kind.slides === 3, 'three photos and videos are open', { kind: kind.kind, slides: kind.slides });
  await page.tap('[data-testid=ctx-more]'); await settle(page, 500);
  u = await ui(page);
  ok(u.sheet === 'props', 'More opens the adjustments sheet');
  // the picture comes first: with a sheet open the photo strip steps aside on a short screen (this emulated iPhone is 664px tall, like Safari with its bars)
  // and is a row of thumbnails on a tall one
  ok(!!(await box(page, '[data-testid=slide-strip]')) === (vp.height > 720), 'with the adjustments sheet open the strip steps aside on a short screen and stays on a tall one');
  ok(!(await box(page, '[data-testid=select-bar]')), 'and never shows its select bar there');
  await page.tap('[data-testid=sheet-close]'); await settle(page, 500);
  ok(!!(await box(page, '[data-testid=select-bar]')), 'closing the sheet brings back the full strip with its select bar');
  await page.tap('[data-testid=thumb-open] >> nth=1'); await settle(page, 400);
  const a = await page.evaluate(() => window.__store.getState().project.activeSlideId === window.__store.getState().project.slides[1].id);
  ok(a, 'tapping a thumbnail makes it the one being edited');

  const errs = logs.filter((l) => !/favicon|ResizeObserver/.test(l));
  ok(errs.length === 0, 'no console errors', errs);
  console.log(`\n${pass} passed, ${fail} failed`);
  await browser.close();
  process.exit(fail ? 1 : 0);
})();
