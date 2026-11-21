// Panorama: a template fills only the slide you picked, and templates, elements, frames and text can be dragged onto the canvas
// and land on the slide under the drop point. Run the app first (`npm run dev -- -p 3100`).
const { open, settle } = require('./lib');
let pass = 0, fail = 0;
const ok = (c, m, extra) => { c ? pass++ : fail++; console.log((c ? 'PASS ' : 'FAIL ') + m + (c || extra === undefined ? '' : '  → ' + JSON.stringify(extra))); };

(async () => {
  const { browser, page, logs } = await open();
  page.setDefaultTimeout(20000);
  await page.waitForSelector('[data-testid=home]');
  await page.click('[data-testid=home-create]'); await page.waitForSelector('[data-testid=new-project-dialog]');
  await page.click('[data-testid=mode-panorama]'); await page.click('[data-testid=create-project]'); await settle(page, 1800);
  await page.keyboard.press('Escape');
  const slide = () => page.evaluate(() => { const s = window.__store.getState(); const sl = s.project.slides.find((x) => x.id === s.project.activeSlideId); return { w: sl.width, h: sl.height, els: sl.elements.map((e) => ({ id: e.id, type: e.type, name: e.name, x: Math.round(e.x), y: Math.round(e.y), w: Math.round(e.width), h: Math.round(e.height) })) }; });
  const span = (els) => els.length ? { x0: Math.min(...els.map((e) => e.x)), x1: Math.max(...els.map((e) => e.x + e.w)) } : null;
  const s0 = await slide();
  ok(s0.w === 3240 && s0.els.length === 0, 'a new panorama is three empty slides', { w: s0.w, n: s0.els.length });

  // ── a template fills only the slide you picked
  await page.evaluate(() => window.__store.getState().setUI({ leftPanel: 'templates' })); await settle(page, 700);
  const apply = async () => { await page.locator('[data-testid=template-card]').first().hover(); await page.locator('[data-testid^=apply-]').first().click({ force: true }); await settle(page, 700); };
  await page.evaluate(() => window.__store.getState().setUI({ pinSegment: 1 }));
  await apply();
  let s1 = await slide(); let sp = span(s1.els);
  ok(s1.els.length > 0 && sp.x0 >= 1079 && sp.x1 <= 2161, 'with slide 2 picked, the template stays inside slide 2 (x 1080 to 2160)', sp);
  ok((await page.evaluate(() => window.__store.getState().ui.pinSegment)) === null, 'and the pick is used up');
  // nothing picked: it goes to the first empty slide, which is slide 1
  await apply();
  s1 = await slide(); const first = s1.els.filter((e) => e.x < 1080);
  ok(first.length > 0 && span(first).x1 <= 1081, 'with nothing picked it fills the first empty slide, not the whole strip', span(first));
  ok(s1.els.every((e) => e.w <= 1081), 'and nothing is stretched across slides', s1.els.filter((e) => e.w > 1081));

  // ── drag onto the canvas: where each lands depends on where it is dropped
  const target = async (seg) => page.evaluate((seg) => { const s = window.__store.getState(); const r = document.querySelector('[data-testid=workspace]').getBoundingClientRect(); const v = s.ui.view; return { x: v.x + (seg * 1080 + 540) * v.scale, y: v.y + 540 * v.scale, w: r.width, h: r.height }; }, seg);
  await page.evaluate(() => { const s = window.__store.getState(); s.deleteElements(s.project.slides.find((x) => x.id === s.project.activeSlideId).elements.map((e) => e.id)); s.requestFit && s.requestFit(); }); await settle(page, 600);
  const before = (await slide()).els.length;
  // a template dropped on slide 3
  let t = await target(2);
  ok(t.x > 0 && t.x < t.w, 'slide 3 is on screen to drop onto', t);
  await page.dragAndDrop('[data-testid=template-card] >> nth=0', '[data-testid=workspace]', { targetPosition: { x: t.x, y: t.y } }); await settle(page, 800);
  let s2 = await slide(); sp = span(s2.els);
  ok(s2.els.length > before && sp.x0 >= 2159 && sp.x1 <= 3241, 'a template dropped on slide 3 fills slide 3 only', sp);

  // an element dropped on slide 2, centred where it landed
  await page.evaluate(() => window.__store.getState().setUI({ leftPanel: 'elements' })); await settle(page, 600);
  const n2 = (await slide()).els.length;
  t = await target(1);
  await page.dragAndDrop('[data-testid=el-rounded]', '[data-testid=workspace]', { targetPosition: { x: t.x, y: t.y } }); await settle(page, 600);
  s2 = await slide();
  const el = s2.els[s2.els.length - 1];
  ok(s2.els.length === n2 + 1 && el.x >= 1079 && el.x + el.w <= 2161, 'an element dropped on slide 2 lands in slide 2', el);
  ok(Math.abs(el.x + el.w / 2 - 1620) < 60, 'centred on the drop point', { cx: el.x + el.w / 2 });
  // click-add on a panorama goes to the picked slide, not the middle of the strip
  await page.evaluate(() => window.__store.getState().setUI({ pinSegment: 0 }));
  await page.click('[data-testid=el-ellipse]'); await settle(page, 500);
  s2 = await slide(); const el2 = s2.els[s2.els.length - 1];
  ok(el2.x >= -1 && el2.x + el2.w <= 1081, 'a click adds to the picked slide (slide 1)', el2);

  // a frame and a heading dropped on slide 1 and 3
  await page.evaluate(() => window.__store.getState().setUI({ leftPanel: 'frames' })); await settle(page, 600);
  t = await target(0);
  await page.dragAndDrop('[data-testid=frame-circle]', '[data-testid=workspace]', { targetPosition: { x: t.x, y: t.y } }); await settle(page, 600);
  s2 = await slide(); const fr = s2.els[s2.els.length - 1];
  ok(fr.x >= -1 && fr.x + fr.w <= 1081, 'a frame dropped on slide 1 lands in slide 1', fr);
  await page.evaluate(() => window.__store.getState().setUI({ leftPanel: 'text' })); await settle(page, 600);
  t = await target(2);
  await page.dragAndDrop('[data-testid=add-heading]', '[data-testid=workspace]', { targetPosition: { x: t.x, y: t.y } }); await settle(page, 700);
  s2 = await slide(); const tx = s2.els[s2.els.length - 1];
  ok(tx.type === 'text' && tx.x >= 2159 && tx.x + tx.w <= 3241, 'a heading dropped on slide 3 lands in slide 3, sized to the slide', tx);
  ok(tx.w <= 1081, 'and is no wider than one slide', { w: tx.w });
  await page.keyboard.press('Escape');

  const errs = logs.filter((l) => !/favicon|ResizeObserver/.test(l));
  ok(errs.length === 0, 'no console errors', errs);
  console.log(`\n${pass} passed, ${fail} failed`);
  await browser.close();
  process.exit(fail ? 1 : 0);
})();
