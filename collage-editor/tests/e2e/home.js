// The front page: the app opens on it (never straight into the editor), it offers Create, Edit photos & videos and the saved projects,
// and the editor is a place you go to and can leave. Run the app first (`npm run dev -- -p 3100`).
const { chromium, devices } = require('playwright');
const path = require('path');
const S = path.resolve(__dirname, '../../public/samples') + '/';
const base = process.env.BASE_URL || 'http://localhost:3100';
let pass = 0, fail = 0;
const ok = (c, m, extra) => { c ? pass++ : fail++; console.log((c ? 'PASS ' : 'FAIL ') + m + (c || extra === undefined ? '' : '  → ' + JSON.stringify(extra))); };
const count = (page, sel) => page.locator(sel).count();
const cards = (page) => page.evaluate(() => [...document.querySelectorAll('[data-testid=home-project-card]')].map((c) => c.innerText.replace(/\s+/g, ' ').trim()));

(async () => {
  const browser = await chromium.launch();
  const errs = [];
  const fresh = async (opts) => { const ctx = await browser.newContext(opts); const page = await ctx.newPage(); page.on('pageerror', (e) => errs.push(e.message)); await page.goto(base, { waitUntil: 'networkidle' }); await page.waitForSelector('[data-testid=home]'); return { ctx, page }; };
  const goHome = async (page) => { await page.click('[data-testid=app-menu]'); await page.waitForTimeout(250); await page.click('[data-testid=open-projects]'); await page.waitForSelector('[data-testid=home]'); await page.waitForTimeout(500); };

  // ── a first visit
  let { ctx, page } = await fresh({ viewport: { width: 1360, height: 820 } });
  ok((await count(page, '[data-testid=editor-root]')) === 0, 'the app opens on the front page, not in the editor');
  ok((await count(page, '[data-testid=new-project-dialog]')) === 0, 'and no dialog is waiting over it');
  ok((await page.locator('h1').textContent()).includes('What do you want to make?'), 'it asks what you want to make');
  ok(await page.locator('[data-testid=home-create]').isVisible() && await page.locator('[data-testid=home-edit]').isVisible(), 'Create and Edit photos & videos are the two ways to start');
  ok((await page.locator('[data-testid=home-empty]').textContent()).includes('Nothing here yet.'), 'with nothing saved, it says where projects will show up');
  await page.click('[data-testid=home-theme]'); await page.waitForTimeout(200);
  ok((await page.evaluate(() => document.documentElement.dataset.theme)) === 'dark', 'the theme can be switched from the front page');
  await page.click('[data-testid=home-theme]');

  // ── the two ways in open the new-project dialog on the right intent, and cancelling stays put
  await page.click('[data-testid=home-edit]'); await page.waitForSelector('[data-testid=new-project-dialog]');
  ok(await page.locator('[data-testid=edit-options]').isVisible(), 'Edit photos & videos opens the dialog on adding photos and videos');
  await page.getByRole('button', { name: 'Cancel' }).click(); await page.waitForTimeout(250);
  ok((await count(page, '[data-testid=home]')) === 1 && (await count(page, '[data-testid=editor-root]')) === 0, 'Cancel leaves you on the front page');
  await page.click('[data-testid=home-create]'); await page.waitForSelector('[data-testid=new-project-dialog]');
  ok((await page.locator('[data-testid=intent-collage]').getAttribute('aria-pressed')) === 'true', 'Create opens it on collage modes');

  // ── making something opens the editor, and the menu brings you back
  await page.click('[data-testid=mode-carousel]'); await page.click('[data-testid=create-project]'); await page.waitForTimeout(1600);
  ok((await count(page, '[data-testid=editor-root]')) === 1 && (await count(page, '[data-testid=home]')) === 0, 'creating a project opens the editor');
  await page.keyboard.press('Escape');
  await goHome(page);
  ok((await count(page, '[data-testid=editor-root]')) === 0, 'All projects in the menu goes back to the front page');
  await page.waitForFunction(() => document.querySelectorAll('[data-testid=home-project-card]').length === 1, null, { timeout: 8000 }).catch(() => {});
  let list = await cards(page);
  ok(list.length === 1 && list[0].includes('Untitled carousel') && list[0].includes('Carousel · 4:5'), 'the project is listed with its name and kind', list);
  ok((await page.locator('[data-testid=home-count]').textContent()).trim() === '1', 'and the list is counted');

  // ── it comes back after a reload: the front page again, with the project in it
  await page.reload({ waitUntil: 'networkidle' }); await page.waitForSelector('[data-testid=home]');
  ok((await count(page, '[data-testid=editor-root]')) === 0, 'a reload lands on the front page, even with a project saved');
  list = await cards(page);
  ok(list.length === 1, 'and the saved project is still there', list);

  // ── open, duplicate, delete
  await page.click('[data-testid=home-project]'); await page.waitForSelector('[data-testid=editor-root]');
  ok((await page.evaluate(() => window.__store.getState().project.name)) === 'Untitled carousel', 'tapping a project opens it');
  await page.click('[data-testid=logo-home]'); await page.waitForSelector('[data-testid=home]');
  ok((await count(page, '[data-testid=editor-root]')) === 0, 'clicking the logo goes to the front page');
  await page.click('[data-testid=home-project]'); await page.waitForSelector('[data-testid=editor-root]');
  await page.evaluate(() => window.__store.getState().addSlide({}));
  await page.waitForTimeout(1200);
  await goHome(page);
  await page.waitForFunction(() => /2 slides|Carousel · 4:5 · 2/.test(document.querySelector('[data-testid=home-project-card]')?.innerText ?? ''), null, { timeout: 8000 }).catch(() => {});
  list = await cards(page);
  ok(list[0].includes('2 slides'), 'the card keeps up with the project (2 slides)', list);
  await page.click('[data-testid=home-duplicate]'); await page.waitForTimeout(900);
  list = await cards(page);
  ok(list.length === 2 && list.some((c) => c.includes('Untitled carousel copy')), 'Duplicate adds a copy', list);
  ok((await count(page, '[data-testid=home]')) === 1, 'and stays on the front page');
  await page.locator('[data-testid=home-delete]').first().click(); await page.waitForTimeout(250);
  ok(await page.locator('[data-testid=home-delete-confirm]').isVisible(), 'Delete asks first');
  await page.click('[data-testid=home-delete-confirm]'); await page.waitForTimeout(700);
  ok((await cards(page)).length === 1 && (await count(page, '[data-testid=editor-root]')) === 0, 'confirming deletes it without opening anything else');
  // the project still loaded in the editor is the one left; deleting it must not throw you into a blank editor
  await page.locator('[data-testid=home-delete]').first().click(); await page.click('[data-testid=home-delete-confirm]'); await page.waitForTimeout(700);
  ok((await count(page, '[data-testid=home-empty]')) === 1 && (await count(page, '[data-testid=editor-root]')) === 0, 'deleting the last project shows the empty state, still on the front page');
  await ctx.close();

  // ── nothing in the editor can be touched from the front page
  ({ ctx, page } = await fresh({ viewport: { width: 1360, height: 820 } }));
  await page.click('[data-testid=home-edit]'); await page.waitForSelector('[data-testid=new-project-dialog]');
  await page.setInputFiles('[data-testid=new-project-input]', [S + 'sample-1.jpg', S + 'sample-2.jpg']);
  await page.click('[data-testid=create-project]'); await page.waitForTimeout(3500);
  const before = await page.evaluate(() => { const s = window.__store.getState(); return { slides: s.project.slides.length, past: s.history.past.length }; });
  await goHome(page);
  await page.keyboard.press('Delete'); await page.keyboard.press('Backspace'); await page.keyboard.press('Control+z'); await page.keyboard.press('Control+a'); await page.keyboard.press('Control+v');
  await page.waitForTimeout(300);
  const after = await page.evaluate(() => { const s = window.__store.getState(); return { slides: s.project.slides.length, past: s.history.past.length, sel: s.selection.length }; });
  ok(after.slides === before.slides && after.past === before.past && after.sel === 0, 'keys and paste do nothing to the hidden project while on the front page', { before, after });
  list = await cards(page);
  ok(list.length === 1 && list[0].includes('Photo & video edit · 2 items'), 'an Edit project says what it is and how many items it holds', list);
  await ctx.close();

  // ── a panorama is described by its slides, never by the ratio of the whole strip
  ({ ctx, page } = await fresh({ viewport: { width: 1360, height: 820 } }));
  await page.click('[data-testid=home-create]'); await page.waitForSelector('[data-testid=new-project-dialog]');
  await page.click('[data-testid=mode-panorama]'); await page.click('[data-testid=create-project]'); await page.waitForTimeout(1600);
  await page.keyboard.press('Escape');
  await goHome(page);
  await page.waitForFunction(() => document.querySelectorAll('[data-testid=home-project-card]').length === 1, null, { timeout: 8000 }).catch(() => {});
  list = await cards(page);
  ok(list.length === 1 && /Panorama · 4:5 · 3 slides/.test(list[0]) && !/12:5/.test(list[0]), 'a panorama reads "4:5 · 3 slides", not 12:5', list);
  await ctx.close();

  // ── on a phone
  ({ ctx, page } = await fresh({ ...devices['iPhone 13'], viewport: { width: 390, height: 844 } }));
  const view = await page.evaluate(() => { const r = (id) => document.querySelector(`[data-testid=${id}]`).getBoundingClientRect(); const c = r('home-create'), e = r('home-edit'); return { sideways: document.documentElement.scrollWidth - innerWidth, createInside: c.left >= 0 && c.right <= innerWidth, bothVisible: e.bottom <= innerHeight, tall: Math.round(c.height) }; });
  ok(view.sideways <= 0 && view.createInside, 'the front page fits a phone with no sideways scroll', view);
  ok(view.bothVisible && view.tall <= 140, 'both ways to start are on the first screen, in compact rows', view);
  await page.tap('[data-testid=home-create]'); await page.waitForSelector('[data-testid=new-project-dialog]');
  await page.tap('[data-testid=mode-single]'); await page.tap('[data-testid=create-project]'); await page.waitForTimeout(1600);
  ok((await count(page, '[data-testid=editor-root]')) === 1, 'on a phone too, creating opens the editor');
  await page.tap('[data-testid=app-menu]'); await page.waitForTimeout(300); await page.tap('[data-testid=open-projects]'); await page.waitForSelector('[data-testid=home]');
  await page.waitForTimeout(600);
  ok((await cards(page)).length === 1, 'and the menu brings you back to the front page with the project in it');
  const fits = await page.evaluate(() => [...document.querySelectorAll('[data-testid=home-project-card]')].every((c) => { const r = c.getBoundingClientRect(); return r.left >= 0 && r.right <= innerWidth; }));
  ok(fits, 'project cards fit the screen');
  await ctx.close();

  ok(errs.length === 0, 'no page errors', errs.slice(0, 2));
  console.log(`\n${pass} passed, ${fail} failed`);
  await browser.close();
  process.exit(fail ? 1 : 0);
})();
