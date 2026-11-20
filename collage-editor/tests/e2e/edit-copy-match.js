const { open, settle, S, T } = require('./lib');
let pass = 0, fail = 0;
const ok = (c, m, extra) => { c ? pass++ : fail++; console.log((c ? 'PASS ' : 'FAIL ') + m + (c || extra === undefined ? '' : '  → ' + JSON.stringify(extra))); };
const fills = (page) => page.evaluate(() => window.__store.getState().project.slides.map(s => { const f = s.elements[0].fill; return { id: s.id, name: s.name, w: s.width, h: s.height, adj: f.adjustments, filter: f.filter, match: f.match || null, rot: f.rotation90, flipX: f.flipX, zoom: f.zoom, kind: f.kind }; }));
const ui = (page) => page.evaluate(() => { const s = window.__store.getState(); return { sel: s.ui.mediaSel, active: s.project.activeSlideId, ref: s.ui.refSlideId, clip: s.editClip && s.editClip.ids }; });
const slide = (page, i) => page.locator('[data-testid=thumb-open]').nth(i);
const setRange = async (page, label, v) => { await page.locator(`input[type=range][aria-label="${label}"]`).first().fill(String(v)); await settle(page, 250); };
const openSection = async (page, title) => { const b = page.locator('section button', { hasText: title }).first(); if ((await b.getAttribute('aria-expanded')) !== 'true') await b.click(); await settle(page, 200); };
(async () => {
  const { browser, page, logs } = await open();
  page.setDefaultTimeout(20000);
  await page.waitForSelector('[data-testid=new-project-dialog]');
  await page.click('[data-testid=intent-edit]');
  await page.setInputFiles('[data-testid=new-project-input]', [S + 'dharamshala-1.jpg', S + 'dharamshala-2.jpg', S + 'dharamshala-3.jpg', S + 'dharamshala-4.jpg']);
  await page.click('[data-testid=create-project]'); await settle(page, 4500);

  // ── copy & paste: choose what to copy
  await setRange(page, 'Exposure', 30); await setRange(page, 'Saturation', -40); await setRange(page, 'Vignette', 25); await setRange(page, 'Temperature', 18);
  await openSection(page, 'Copy & paste settings');
  await page.click('[data-testid=copy-settings]'); await settle(page, 300);
  ok(await page.locator('[data-testid=copy-picker]').count() === 1, 'Copy settings opens the property picker');
  const labels = await page.locator('[data-testid=copy-picker] [role=checkbox]').allTextContents();
  const need = ['Exposure', 'Brightness', 'Contrast', 'Highlights', 'Shadows', 'Whites', 'Blacks', 'Temperature', 'Tint', 'Saturation', 'Vibrance', 'HSL colour mix', 'Curves', 'Colour grading', 'Filter', 'Effects', 'Sharpness', 'Grain', 'Vignette', 'Crop, rotation & flip'];
  ok(need.every(n => labels.some(l => l.startsWith(n))), 'the picker lists every property', labels);
  ok((await page.locator('[data-testid=copy-transform]').getAttribute('aria-checked')) === 'false', 'crop / transform is optional and off by default');
  await page.click('[data-testid=copy-none]');
  await page.click('[data-testid=copy-exposure]'); await page.click('[data-testid=copy-saturation]');
  await page.click('[data-testid=copy-confirm]'); await settle(page, 300);
  let u = await ui(page); ok(JSON.stringify(u.clip) === '["exposure","saturation"]', 'only the ticked properties are copied', u.clip);
  await slide(page, 2).click(); await settle(page, 300);
  await page.click('[data-testid=paste-settings]'); await settle(page, 400);
  let f = await fills(page);
  ok(f[2].adj.exposure === 30 && f[2].adj.saturation === -40, 'paste applies the copied properties');
  ok((f[2].adj.vignette ?? 0) === 0 && (f[2].adj.temperature ?? 0) === 0, 'properties that were not copied are left alone', [f[2].adj.vignette, f[2].adj.temperature]);
  await setRange(page, 'Exposure', 5); f = await fills(page);
  ok(f[2].adj.exposure === 5 && f[0].adj.exposure === 30, 'pasted settings stay fully editable (and the source is untouched)');
  // paste onto several at once, with everything
  await slide(page, 0).click(); await page.click('[data-testid=copy-settings]'); await page.click('[data-testid=copy-confirm]'); await settle(page, 300);
  await page.click('[data-testid=select-all]'); await settle(page, 300);
  await page.click('[data-testid=paste-settings]'); await settle(page, 400);
  f = await fills(page);
  ok([1, 2, 3].every(i => f[i].adj.exposure === 30 && f[i].adj.vignette === 25 && f[i].adj.temperature === 18), 'paste onto a multi-selection applies to all of them', f.map(x => [x.adj.exposure, x.adj.vignette]));
  // keyboard
  await slide(page, 1).click(); await setRange(page, 'Tint', 12);
  await page.locator('[data-testid=stage-chrome]').click({ position: { x: 5, y: 5 } }).catch(() => {});
  await page.keyboard.press('Control+C'); await slide(page, 3).click(); await page.keyboard.press('Control+V'); await settle(page, 300);
  f = await fills(page); ok(f[3].adj.tint === 12, 'Ctrl+C / Ctrl+V copy and paste settings', f[3].adj.tint);
  // transform is optional but works
  await slide(page, 0).click(); await settle(page, 200);
  await page.click('[data-testid=rotate-right]'); await settle(page, 300);
  f = await fills(page); ok(f[0].rot === 90 && f[0].w > f[0].h, 'rotate right turns the photo and swaps the frame', [f[0].rot, f[0].w, f[0].h]);
  await page.click('[data-testid=copy-settings]'); await page.click('[data-testid=copy-none]'); await page.click('[data-testid=copy-transform]'); await page.click('[data-testid=copy-confirm]'); await settle(page, 300);
  await slide(page, 1).click(); await page.click('[data-testid=paste-settings]'); await settle(page, 400);
  f = await fills(page); ok(f[1].rot === 90 && f[1].w > f[1].h, 'crop & rotation paste when opted in', [f[1].rot, f[1].w, f[1].h]);
  await page.click('[data-testid=reset-crop]'); await settle(page, 300);
  f = await fills(page); ok(f[1].rot === 0 && f[1].h > f[1].w, 'Reset puts the crop and rotation back');

  // ── crop & transform
  await page.click('[data-testid="aspect-1:1"]'); await settle(page, 300);
  f = await fills(page); ok(f[1].w === f[1].h, '1:1 re-cuts the frame to a square', [f[1].w, f[1].h]);
  ok((await page.locator('[data-testid="aspect-1:1"]').getAttribute('aria-pressed')) === 'true', 'the active ratio is highlighted');
  await page.click('[data-testid="aspect-16:9"]'); await settle(page, 300);
  f = await fills(page); ok(Math.abs(f[1].w / f[1].h - 16 / 9) < 0.02, '16:9 crop', [f[1].w, f[1].h]);
  await page.click('[data-testid=flip-x]'); f = await fills(page); ok(f[1].flipX === true, 'flip horizontally');
  await page.click('[data-testid=reset-crop]'); await settle(page, 300);
  f = await fills(page); ok(!f[1].flipX && f[1].h > f[1].w, 'Reset restores original proportions');
  await page.click('[data-testid=crop-toggle]'); await settle(page, 300);
  ok(await page.evaluate(() => !!window.__store.getState().ui.cropId), 'Crop turns on move & zoom on the canvas');
  await page.keyboard.press('Escape'); await settle(page, 200);

  // ── match look
  await slide(page, 0).click(); await settle(page, 300);
  await openSection(page, 'Match look');
  await page.click('[data-testid=reset-crop]');
  await page.click('[data-testid=set-reference]'); await settle(page, 300);
  u = await ui(page); f = await fills(page); ok(u.ref === f[0].id, 'Use as reference sets the reference');
  ok(await page.locator('[data-testid=ref-badge]').count() === 1, 'the filmstrip marks the reference');
  await setRange(page, 'Exposure', 35); await setRange(page, 'Temperature', 40); await setRange(page, 'Contrast', 30);
  await slide(page, 2).click(); await settle(page, 300);
  const before = (await fills(page))[2];
  await page.click('[data-testid=match-selected]'); await settle(page, 1500);
  f = await fills(page);
  ok(f[2].match && f[2].match.intensity === 100 && Object.keys(f[2].match.adj).length > 0, 'Match look solves a match layer for the selected photo', f[2].match);
  ok((f[2].match.adj.temperature ?? 0) > 5, 'it warms the photo toward the warm reference', f[2].match && f[2].match.adj);
  ok(JSON.stringify(f[2].adj) === JSON.stringify(before.adj), "the photo's own edits are untouched (the match is a separate layer)");
  ok(f[0].match === null, 'the reference itself is never changed');
  await page.locator('[data-testid=match-intensity] input[type=range]').fill('50'); await settle(page, 300);
  f = await fills(page); ok(f[2].match.intensity === 50, 'match intensity slider adapts the strength', f[2].match.intensity);
  await setRange(page, 'Saturation', 15); f = await fills(page);
  ok(f[2].adj.saturation === 15 && f[2].match, 'a matched photo can still be fine-tuned by hand');
  // toggles are used
  await page.click('[data-testid=match-opt-tone]'); await page.click('[data-testid=match-opt-grading]');
  await slide(page, 3).click(); await settle(page, 300);
  await page.click('[data-testid=match-selected]'); await settle(page, 1500);
  f = await fills(page); const adj3 = f[3].match.adj;
  ok(adj3.temperature === undefined && adj3.tint === undefined, 'with Colour tone off, temperature and tint are not matched', adj3);
  // batch match + remove
  await page.click('[data-testid=select-all]'); await settle(page, 300);
  await page.click('[data-testid=match-selected]'); await settle(page, 2000);
  f = await fills(page); ok(f[1].match && f[2].match && f[3].match && !f[0].match, 'matching a whole selection matches every non-reference item');
  await page.click('[data-testid=remove-match]'); await settle(page, 300);
  f = await fills(page); ok(f.every(x => !x.match), 'Remove match clears it from the selection');

  // ── persistence
  await settle(page, 1500);
  await page.reload({ waitUntil: 'networkidle' }); await settle(page, 2500);
  const kind = await page.evaluate(() => window.__store.getState().project.kind);
  const n = await page.evaluate(() => window.__store.getState().project.slides.length);
  ok(kind === 'edit' && n === 4, 'reloading reopens the edit project with all items', { kind, n });
  ok(await page.locator('[data-testid=slide-thumb]').count() === 4, 'the filmstrip is back');

  console.log(logs.join('\n') || 'no console errors');
  console.log(`\n${pass} passed, ${fail} failed`);
    await browser.close();
  process.exit(fail ? 1 : 0);
})().catch((e) => { console.error('FAIL', e.message); process.exit(1); });
