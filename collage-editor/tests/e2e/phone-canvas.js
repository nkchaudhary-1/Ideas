const { open, newProject, state, settle, S } = require('./phone-lib');
let pass = 0, fail = 0;
const ok = (c, m, extra) => { c ? pass++ : fail++; console.log((c ? 'PASS ' : 'FAIL ') + m + (c || extra === undefined ? '' : '  → ' + JSON.stringify(extra))); };
(async () => {
  const { browser, page, logs, drag, pinch } = await open();
  page.setDefaultTimeout(20000);
  await newProject(page, { intent: 'collage', mode: 'blank' });
  // a free frame so there is something to move
  await page.tap('[data-testid=rail-text]'); await settle(page, 500);
  await page.tap('[data-testid=add-heading]'); await settle(page, 500);
  await page.keyboard.press('Escape');
  await page.tap('[data-testid=sheet-close]'); await settle(page, 700);
  let s = await state(page);
  const stage = await page.locator('[data-testid=workspace]').boundingBox();
  const cx = stage.x + stage.width / 2, cy = stage.y + stage.height * 0.5;
  ok(s.els.some((e) => e.type === 'text'), 'a heading was added with a tap');

  // ── pinch zooms the view
  const v0 = s.view;
  await pinch([cx - 40, cy + 40], [cx + 40, cy + 40], [cx - 100, cy + 40], [cx + 100, cy + 40]);
  await settle(page, 300);
  s = await state(page);
  ok(s.view.scale > v0.scale * 1.8, 'a two-finger spread zooms the canvas in', { before: v0.scale, after: s.view.scale });
  const v1 = s.view;
  await pinch([cx - 100, cy + 40], [cx + 100, cy + 40], [cx - 40, cy + 40], [cx + 40, cy + 40]);
  await settle(page, 300);
  s = await state(page);
  ok(s.view.scale < v1.scale * 0.6, 'pinching in zooms back out', { before: v1.scale, after: s.view.scale });

  // ── one finger on empty canvas pans
  const v2 = s.view;
  await drag([stage.x + 30, stage.y + 140], [stage.x + 90, stage.y + 200]);
  await settle(page, 300);
  s = await state(page);
  ok(Math.abs(s.view.x - (v2.x + 60)) < 6 && Math.abs(s.view.y - (v2.y + 60)) < 6, 'dragging empty canvas pans it', { dx: s.view.x - v2.x, dy: s.view.y - v2.y });
  ok(s.view.scale === v2.scale, 'panning does not change the zoom');

  // ── drag an element
  await page.tap('[data-testid=zoom-fit]'); await settle(page, 500);
  s = await state(page);
  const tx = s.els.find((e) => e.type === 'text');
  const sc = s.view.scale;
  const sx = stage.x + s.view.x + (tx.x + tx.w / 2) * sc, sy = stage.y + s.view.y + (tx.y + tx.h / 2) * sc;
  await drag([sx, sy], [sx + 40, sy + 60]);
  await settle(page, 400);
  const s2 = await state(page);
  const tx2 = s2.els.find((e) => e.type === 'text');
  ok(tx2.x > tx.x + 40 / sc * 0.7 && tx2.y > tx.y + 60 / sc * 0.7, 'a finger drag moves a selected element', { before: [tx.x, tx.y], after: [tx2.x, tx2.y] });
  ok(s2.sel.includes(tx.id), 'touching an element selects it');

  // ── tap on empty canvas deselects
  await page.touchscreen.tap(stage.x + 30, stage.y + 150); await settle(page, 400);
  const s3 = await state(page);
  ok(s3.sel.length === 0, 'tapping empty canvas deselects');

  // ── a second finger during a drag does not move the element
  const before = tx2;
  await page.touchscreen.tap(sx + 40, sy + 60); await settle(page, 300);
  console.log(logs.join('\n') || 'no console errors');
  console.log(`\n${pass} passed, ${fail} failed`);
  await browser.close();
  process.exit(fail ? 1 : 0);
})().catch((e) => { console.error('FAIL', e.message); process.exit(1); });
