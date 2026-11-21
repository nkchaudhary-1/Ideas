const { open, settle, S, T } = require('./lib');
let pass = 0, fail = 0;
const ok = (c, m, extra) => { c ? pass++ : fail++; console.log((c ? 'PASS ' : 'FAIL ') + m + (c || extra === undefined ? '' : '  → ' + JSON.stringify(extra))); };
const fill0 = (page) => page.evaluate(() => { const p = window.__store.getState().project; const f = p.slides.find(s => s.id === p.activeSlideId).elements[0].fill; return { adj: f.adjustments }; });
const openSection = async (page, title) => { const b = page.locator('section button', { hasText: title }).first(); if ((await b.getAttribute('aria-expanded')) !== 'true') await b.click(); await settle(page, 250); };
(async () => {
  const { browser, page, logs } = await open();
  page.setDefaultTimeout(20000);
  await page.waitForSelector('[data-testid=home]'); await page.click('[data-testid=home-create]'); await page.waitForSelector('[data-testid=new-project-dialog]');
  await page.click('[data-testid=intent-edit]');
  await page.setInputFiles('[data-testid=new-project-input]', [S + 'sample-4.jpg']);
  await page.click('[data-testid=create-project]'); await settle(page, 3500);
  const scroll = page.locator('[data-testid=properties-scroll]');

  // ── HSL
  await openSection(page, 'Colour mix');
  await page.click('[data-testid=hsl-band-blue]');
  await page.locator('[data-testid=hsl-sat] input[type=range]').fill('-70'); await settle(page, 300);
  await page.locator('[data-testid=hsl-hue] input[type=range]').fill('40'); await settle(page, 300);
  await page.click('[data-testid=hsl-band-orange]');
  await page.locator('[data-testid=hsl-lum] input[type=range]').fill('30'); await settle(page, 300);
  let a = (await fill0(page)).adj;
  ok(a.hsl && a.hsl.blue && a.hsl.blue[1] === -70 && a.hsl.blue[0] === 40, 'HSL: blue band hue and saturation are stored per colour', a.hsl);
  ok(a.hsl.orange && a.hsl.orange[2] === 30 && !a.hsl.red, 'HSL: orange luminance is separate; untouched bands stay empty', a.hsl);
  await page.locator('[data-testid=hsl-bands]').scrollIntoViewIfNeeded();
    await page.click('[data-testid=reset-hsl]'); await settle(page, 300);
  a = (await fill0(page)).adj; ok(!a.hsl, 'HSL reset clears every band');

  // ── Curves
  await openSection(page, 'Curves');
  await page.locator('[data-testid=curve-editor]').scrollIntoViewIfNeeded(); await settle(page, 200);
  const box = await page.locator('[data-testid=curve-editor]').boundingBox();
  const at = (x, y) => [box.x + (x + 8) / 272 * box.width, box.y + (255 - y + 8) / 272 * box.height];
  let [cx, cy] = at(128, 128);
  await page.mouse.move(cx, cy); await page.mouse.down(); const [tx, ty] = at(128, 175); await page.mouse.move(tx, ty, { steps: 6 }); await page.mouse.up(); await settle(page, 300);
  a = (await fill0(page)).adj;
  ok(a.curves && a.curves.m && a.curves.m.length === 3 && a.curves.m[1][1] > 160, 'Curves: clicking the line adds a point and dragging bends it', a.curves);
  // second point on the lower quarter
  [cx, cy] = at(64, 64); await page.mouse.move(cx, cy); await page.mouse.down(); const [t2x, t2y] = at(64, 40); await page.mouse.move(t2x, t2y, { steps: 4 }); await page.mouse.up(); await settle(page, 300);
  a = (await fill0(page)).adj; ok(a.curves.m.length === 4, 'Curves: several points', a.curves.m.length);
  // channel curves are independent
  await page.locator('[aria-pressed]', { hasText: /^R$/ }).first().click();
  [cx, cy] = at(128, 128); await page.mouse.move(cx, cy); await page.mouse.down(); const [t3x, t3y] = at(128, 90); await page.mouse.move(t3x, t3y, { steps: 4 }); await page.mouse.up(); await settle(page, 300);
  a = (await fill0(page)).adj; ok(a.curves.r && a.curves.r.length === 3 && a.curves.r[1][1] < 110 && a.curves.m.length === 4, 'Curves: the red channel has its own curve', a.curves);
    // remove a point with a double-click
  await page.locator('[aria-pressed]', { hasText: /^RGB$/ }).first().click();
  await page.locator('[data-testid=curve-point]').nth(1).dblclick(); await settle(page, 300);
  a = (await fill0(page)).adj; ok(a.curves.m.length === 3, 'Curves: double-click removes a point', a.curves.m.length);
  // undo one gesture
  await page.keyboard.press('Control+Z'); await settle(page, 300);
  a = (await fill0(page)).adj; ok(a.curves.m.length === 4, 'one undo step restores the removed point');
  await page.click('[data-testid=reset-curves]'); await settle(page, 300);
  a = (await fill0(page)).adj; ok(!a.curves, 'Curves reset clears all channels');

  // ── Colour grading
  await openSection(page, 'Colour grading');
  await page.locator('[data-testid=grade-wheel]').scrollIntoViewIfNeeded(); await settle(page, 200);
  const w = await page.locator('[data-testid=grade-wheel]').boundingBox();
  await page.mouse.click(w.x + w.width * 0.78, w.y + w.height * 0.5); await settle(page, 300);   // east side → blue-ish hue ~90°
  a = (await fill0(page)).adj;
  ok(a.grade && a.grade.sh[1] > 40 && Math.abs(a.grade.sh[0] - 90) < 8, 'Grading: picking on the wheel sets hue and strength for shadows', a.grade && a.grade.sh);
  await page.click('[data-testid=grade-zone-hi]');
  await page.mouse.click(w.x + w.width * 0.5, w.y + w.height * 0.2); await settle(page, 300);       // north → hue 0
  await page.locator('[data-testid=grade-lum] input[type=range]').fill('25'); await settle(page, 300);
  await page.locator('[data-testid=grade-bal] input[type=range]').fill('-30'); await settle(page, 300);
  a = (await fill0(page)).adj;
  ok(a.grade.hi[1] > 30 && a.grade.hi[2] === 25 && a.grade.bal === -30 && a.grade.sh[1] > 40, 'Grading: highlights, luminance and balance are independent of shadows', a.grade);
    await page.click('[data-testid=reset-grade]'); await settle(page, 300);
  a = (await fill0(page)).adj; ok(!a.grade, 'Grading reset');

  // ── the canvas actually changes
  const sig = async () => { const b = await page.locator('[data-testid=workspace]').boundingBox(); const buf = await page.screenshot({ clip: { x: b.x + b.width / 2 - 120, y: b.y + b.height / 2 - 120, width: 240, height: 240 } }); return require('crypto').createHash('md5').update(buf).digest('hex'); };
  const s0 = await sig();
  await openSection(page, 'Colour grading');
  await page.locator('[data-testid=grade-wheel]').scrollIntoViewIfNeeded(); await settle(page, 200);
  const w2 = await page.locator('[data-testid=grade-wheel]').boundingBox();
  await page.mouse.click(w2.x + w2.width * 0.5, w2.y + w2.height * 0.1); await settle(page, 900);
  const s1 = await sig();
  ok(s0 !== s1, 'the canvas re-renders with the grade', [s0, s1]);

  console.log(logs.join('\n') || 'no console errors');
  console.log(`\n${pass} passed, ${fail} failed`);
  await browser.close();
  process.exit(fail ? 1 : 0);
})().catch((e) => { console.error('FAIL', e.message); process.exit(1); });
