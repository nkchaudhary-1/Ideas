// A layout's border (outer margin and gutter) and corners come with it and stay locked until you unlock them.
// Run the app first (`npm run dev -- -p 3100`).
const { open, settle } = require('./lib');
let pass = 0, fail = 0;
const ok = (c, m, extra) => { c ? pass++ : fail++; console.log((c ? 'PASS ' : 'FAIL ') + m + (c || extra === undefined ? '' : '  → ' + JSON.stringify(extra))); };

(async () => {
  const { browser, page, logs } = await open();
  page.setDefaultTimeout(20000);
  await page.waitForSelector('[data-testid=home]');
  await page.click('[data-testid=home-create]'); await page.waitForSelector('[data-testid=new-project-dialog]');
  await page.click('[data-testid=mode-single]'); await page.click('[data-testid=create-project]'); await settle(page, 1600);
  await page.click('[data-testid=rail-layouts]'); await settle(page, 500);
  await page.click('[data-testid=grid-four]'); await settle(page, 600);
  const grid = () => page.evaluate(() => { const s = window.__store.getState(); const sl = s.project.slides.find((x) => x.id === s.project.activeSlideId); const g = sl.elements.find((e) => e.type === 'grid'); return g ? { id: g.id, margin: g.margin, gutter: g.gutter, radius: g.radius } : null; });
  const g0 = await grid();
  ok(!!g0, 'a layout is on the slide', g0);
  await page.evaluate((id) => window.__store.getState().select([id]), g0.id); await settle(page, 500);

  const has = (id) => page.locator(`[data-testid=${id}]`).count();
  ok((await has('grid-lock-row')) === 1, 'the layout shows a Border & corners row');
  ok((await page.locator('[data-testid=grid-lock-row]').innerText()).includes('Locked to the layout'), 'it says the border and corners are locked');
  ok((await page.locator('[data-testid=grid-lock]').innerText()).trim() === 'Unlock', 'with an Unlock button');
  ok((await has('grid-margin')) === 0 && (await has('grid-gutter')) === 0 && (await has('grid-radius')) === 0, 'and no margin, gutter or corner controls to change');

  await page.click('[data-testid=grid-lock]'); await settle(page, 300);
  ok((await page.locator('[data-testid=grid-lock]').innerText()).trim() === 'Lock', 'Unlock turns into Lock');
  ok((await has('grid-margin')) === 1 && (await has('grid-gutter')) === 1 && (await has('grid-radius')) === 1, 'and the margin, gutter and corner controls appear');
  const radius = page.locator('[data-testid=grid-radius] input[type=range], input[type=range][aria-label=Corner]').first();
  await radius.focus(); for (let i = 0; i < 5; i++) await page.keyboard.press('ArrowRight'); await settle(page, 300);
  const g1 = await grid();
  ok(g1.radius !== g0.radius, 'the corner can be changed once unlocked', { before: g0.radius, after: g1.radius });
  ok(g1.margin === g0.margin && g1.gutter === g0.gutter, 'and the rest stays as designed', g1);

  await page.click('[data-testid=grid-lock]'); await settle(page, 300);
  ok((await has('grid-radius')) === 0 && (await page.locator('[data-testid=grid-lock-row]').innerText()).includes('Locked'), 'Lock puts it back');
  ok((await grid()).radius === g1.radius, 'and keeps the corner you set');

  // changing the layout puts its own border and corners back, locked again
  await page.click('[data-testid=grid-lock]'); await settle(page, 200);
  ok((await has('grid-radius')) === 1, 'unlocked again');
  await page.evaluate(() => window.__store.getState().setUI({ leftPanel: 'layouts' })); await settle(page, 400);
  await page.click('[data-testid=grid-cards-3]'); await settle(page, 700);
  const g2 = await grid();
  ok(g2.id === g0.id && g2.radius !== g1.radius, 'a new layout from the panel replaces it in place with its own corners', { g1, g2 });
  ok((await has('grid-radius')) === 0 && (await page.locator('[data-testid=grid-lock-row]').innerText()).includes('Locked'), 'and comes back locked');

  const errs = logs.filter((l) => !/favicon|ResizeObserver/.test(l));
  ok(errs.length === 0, 'no console errors', errs);
  console.log(`\n${pass} passed, ${fail} failed`);
  await browser.close();
  process.exit(fail ? 1 : 0);
})();
