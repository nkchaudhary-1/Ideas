// The right-hand properties card takes room, so it opens only when something is selected. Run the app first (`npm run dev -- -p 3100`).
const { open, settle, S } = require('./lib');
let pass = 0, fail = 0;
const ok = (c, m, extra) => { c ? pass++ : fail++; console.log((c ? 'PASS ' : 'FAIL ') + m + (c || extra === undefined ? '' : '  → ' + JSON.stringify(extra))); };

(async () => {
  const { browser, page, logs } = await open();
  page.setDefaultTimeout(20000);
  await page.waitForSelector('[data-testid=home]');
  await page.click('[data-testid=home-create]'); await page.waitForSelector('[data-testid=new-project-dialog]');
  await page.click('[data-testid=mode-single]'); await page.click('[data-testid=create-project]'); await settle(page, 1800);
  const shown = () => page.locator('[data-testid=properties]').count().then((n) => n > 0);
  const view = () => page.evaluate(() => window.__store.getState().ui.view);

  ok(!(await shown()), 'a new project starts without the properties card, so the canvas has the room');

  // selecting opens it, and clearing the selection closes it again
  await page.click('[data-testid=rail-text]'); await settle(page, 400);
  await page.click('[data-testid=add-heading]'); await settle(page, 500);
  await page.keyboard.press('Escape'); await settle(page, 500);
  ok(await shown(), 'selecting something opens the card');
  await page.evaluate(() => window.__store.getState().clearSelection()); await settle(page, 500);
  ok(!(await shown()), 'and it closes when nothing is selected');

  // the toggle is yours: open with nothing selected, and it stays through selecting and clearing
  await page.click('[data-testid=toggle-properties]'); await settle(page, 400);
  ok(await shown() && (await page.locator('[data-testid=properties]').innerText()).includes('Canvas'), 'the top-bar toggle opens the canvas settings when nothing is selected');
  await page.evaluate(() => { const s = window.__store.getState(); const sl = s.project.slides.find((x) => x.id === s.project.activeSlideId); s.select([sl.elements[0].id]); }); await settle(page, 400);
  await page.evaluate(() => window.__store.getState().clearSelection()); await settle(page, 400);
  ok(await shown(), 'a card you opened yourself stays open when the selection clears');
  await page.click('[data-testid=toggle-properties]'); await settle(page, 400);
  ok(!(await shown()), 'and the toggle closes it');

  // hiding it while something is selected sticks until the next selection
  await page.evaluate(() => { const s = window.__store.getState(); const sl = s.project.slides.find((x) => x.id === s.project.activeSlideId); s.select([sl.elements[0].id]); }); await settle(page, 500);
  ok(await shown(), 'selecting opens it again');
  await page.click('[data-testid=toggle-properties]'); await settle(page, 400);
  ok(!(await shown()), 'hiding it while something is selected keeps it hidden');
  ok(await page.locator('[data-testid=edit-chip-desktop]').isVisible(), 'with an Edit chip to bring it back');
  await page.evaluate(() => window.__store.getState().clearSelection()); await settle(page, 300);
  await page.evaluate(() => { const s = window.__store.getState(); const sl = s.project.slides.find((x) => x.id === s.project.activeSlideId); s.select([sl.elements[0].id]); }); await settle(page, 500);
  ok(await shown(), 'the next selection opens it');
  await page.evaluate(() => window.__store.getState().clearSelection()); await settle(page, 500);

  // zooming in and then selecting does not throw the view back to fit; what was in the middle stays in the middle
  await page.keyboard.press('+'); await settle(page, 400); await page.keyboard.press('+'); await settle(page, 500);
  const stage = async () => page.evaluate(() => { const r = document.querySelector('[data-testid=workspace]').getBoundingClientRect(); return { w: r.width, h: r.height }; });
  const centre = async () => { const v = await view(), st = await stage(); return { s: v.scale, x: (st.w / 2 - v.x) / v.scale, y: (st.h / 2 - v.y) / v.scale }; };
  const before = await centre();
  await page.evaluate(() => { const s = window.__store.getState(); const sl = s.project.slides.find((x) => x.id === s.project.activeSlideId); s.select([sl.elements[0].id]); }); await settle(page, 700);
  const after = await centre();
  ok(await shown() && Math.abs(after.s - before.s) < 0.001, 'the zoom is kept when the card opens', { before: before.s, after: after.s });
  ok(Math.abs(after.x - before.x) < 2 && Math.abs(after.y - before.y) < 2, 'and the same spot stays in the middle of the stage', { before, after });
  await page.evaluate(() => window.__store.getState().clearSelection()); await settle(page, 600);
  const back = await centre();
  ok(Math.abs(back.s - before.s) < 0.001 && Math.abs(back.x - before.x) < 2, 'and again when it closes', { before, back });

  // Edit mode: the card is the editor, so it stays open
  await page.evaluate(() => window.__store.getState().goHome()); await page.waitForSelector('[data-testid=home]');
  await page.click('[data-testid=home-edit]'); await page.waitForSelector('[data-testid=new-project-dialog]');
  await page.setInputFiles('[data-testid=new-project-input]', [S + 'sample-1.jpg', S + 'sample-2.jpg']);
  await page.click('[data-testid=create-project]'); await settle(page, 3500);
  ok(await shown(), 'Edit mode opens its card with the project');
  await page.evaluate(() => window.__store.getState().clearSelection()); await settle(page, 500);
  ok(await shown(), 'and keeps it open with nothing selected');

  const errs = logs.filter((l) => !/favicon|ResizeObserver/.test(l));
  ok(errs.length === 0, 'no console errors', errs);
  console.log(`\n${pass} passed, ${fail} failed`);
  await browser.close();
  process.exit(fail ? 1 : 0);
})();
