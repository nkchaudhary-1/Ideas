// The top bar and its motion: nothing opens off-screen, theme lives in the menu, preview sits with history, tooltips and glide zoom work.
// Run the app first (`npm run dev -- -p 3100`).
const { chromium } = require('playwright');
const base = process.env.BASE_URL || 'http://localhost:3100';
let pass = 0, fail = 0;
const ok = (c, m, extra) => { c ? pass++ : fail++; console.log((c ? 'PASS ' : 'FAIL ') + m + (c || extra === undefined ? '' : '  → ' + JSON.stringify(extra))); };

(async () => {
  const browser = await chromium.launch();
  const errs = [];
  const ctx = await browser.newContext({ viewport: { width: 1000, height: 600 } });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => errs.push(e.message));
  await page.goto(base, { waitUntil: 'networkidle' });
  await page.waitForSelector('[data-testid=new-project-dialog]');
  await page.click('[data-testid=mode-carousel]'); await page.click('[data-testid=create-project]'); await page.waitForTimeout(1200);

  // the size menu opens down from the top bar and stays on screen, even in a short window
  await page.click('[data-testid=format-chip]'); await page.waitForTimeout(400);
  const pop = await page.locator('[data-testid=format-menu]').evaluate((el) => { const p = el.closest('.pop'); const r = p.getBoundingClientRect(); return { top: Math.round(r.top), bottom: Math.round(r.bottom), vh: innerHeight }; });
  ok(pop.top >= 0 && pop.bottom <= pop.vh, 'the size menu opens fully inside the window', pop);
  const chip = await page.locator('[data-testid=format-chip]').boundingBox();
  ok(pop.top >= chip.y + chip.height - 4, 'and opens below the top bar, not up off the screen', { popTop: pop.top, chipBottom: chip.y + chip.height });
  await page.keyboard.press('Escape'); await page.waitForTimeout(200);

  // fewer floating things: theme is in the menu; preview sits with undo and redo
  ok(!(await page.locator('[data-testid=stage-chrome] [data-testid=toggle-theme]').count()), 'there is no theme button in the bar');
  await page.click('[data-testid=app-menu]'); await page.waitForTimeout(300);
  const before = await page.evaluate(() => document.documentElement.dataset.theme);
  await page.click('[data-testid=toggle-theme]'); await page.waitForTimeout(300);
  const after = await page.evaluate(() => document.documentElement.dataset.theme);
  ok(before !== after, 'the menu switches the theme', { before, after });
  const sameRow = await page.evaluate(() => { const a = document.querySelector('[data-testid=undo]').getBoundingClientRect(), b = document.querySelector('[data-testid=preview]').getBoundingClientRect(); const pa = document.querySelector('[data-testid=undo]').parentElement, pb = document.querySelector('[data-testid=preview]').parentElement; return { samePill: pa === pb, dy: Math.abs(a.top - b.top) }; });
  ok(sameRow.samePill && sameRow.dy < 2, 'Preview sits in the same pill as undo and redo', sameRow);

  // a quiet tooltip, after a short pause, with the shortcut
  await page.keyboard.press('Escape');
  await page.addInitScript(() => {});
  await page.hover('[data-testid=zoom-in]'); await page.waitForTimeout(150);
  const early = await page.locator('[data-testid=zoom-in]').evaluate((el) => getComputedStyle(el, '::after').opacity);
  await page.waitForTimeout(600);
  const late = await page.locator('[data-testid=zoom-in]').evaluate((el) => ({ o: getComputedStyle(el, '::after').opacity, t: getComputedStyle(el, '::after').content }));
  ok(Number(early) < 0.5, 'a tooltip does not flash up the moment you pass', early);
  ok(Number(late.o) === 1 && /Zoom in/.test(late.t), 'and arrives after a beat, naming the control', late);

  // zoom glides: partway after a few frames, exactly there when done
  await page.mouse.move(5, 5);
  const v0 = await page.evaluate(() => window.__store.getState().ui.view.scale);
  await page.click('[data-testid=zoom-in]');
  await page.waitForTimeout(40);
  const mid = await page.evaluate(() => window.__store.getState().ui.view.scale);
  await page.waitForTimeout(400);
  const end = await page.evaluate(() => window.__store.getState().ui.view.scale);
  ok(mid > v0 && mid < end - 0.001, 'zoom eases in rather than jumping', { v0, mid, end });
  ok(Math.abs(end / v0 - 1.25) < 0.02, 'and lands on exactly 1.25×', { ratio: end / v0 });

  // keyboard focus is visible
  await page.focus('[data-testid=undo]'); await page.keyboard.press('Tab');
  const ring = await page.evaluate(() => { const el = document.activeElement; const cs = getComputedStyle(el); return { w: cs.outlineWidth, s: cs.outlineStyle }; });
  ok(ring.s === 'solid' && parseFloat(ring.w) >= 2, 'the keyboard focus ring is drawn', ring);

  ok(errs.length === 0, 'no page errors', errs.slice(0, 2));
  console.log(`\n${pass} passed, ${fail} failed`);
  await browser.close();
  process.exit(fail ? 1 : 0);
})();
