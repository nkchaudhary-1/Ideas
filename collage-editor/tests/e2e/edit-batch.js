const { open, settle, S, T } = require('./lib');
let pass = 0, fail = 0;
const ok = (c, m, extra) => { c ? pass++ : fail++; console.log((c ? 'PASS ' : 'FAIL ') + m + (c || extra === undefined ? '' : '  → ' + JSON.stringify(extra))); };
const fills = (page) => page.evaluate(() => window.__store.getState().project.slides.map(s => { const f = s.elements[0].fill; return { id: s.id, name: s.name, w: s.width, h: s.height, adj: f.adjustments, filter: f.filter.id, match: f.match || null, rot: f.rotation90, flipX: f.flipX, zoom: f.zoom, kind: f.kind }; }));
const ui = (page) => page.evaluate(() => { const s = window.__store.getState(); return { sel: s.ui.mediaSel, active: s.project.activeSlideId, ref: s.ui.refSlideId, clip: s.editClip && s.editClip.ids.length }; });
const thumb = (page, i) => page.locator('[data-testid=slide-thumb] button[aria-pressed]').nth(i);
const slide = (page, i) => page.locator('[data-testid=thumb-open]').nth(i);
const setRange = async (page, label, v) => { await page.locator(`input[type=range][aria-label="${label}"]`).first().fill(String(v)); await settle(page, 250); };
(async () => {
  const { browser, page, logs } = await open();
  page.setDefaultTimeout(20000);
  await page.waitForSelector('[data-testid=new-project-dialog]');
  await page.click('[data-testid=intent-edit]');
  await page.setInputFiles('[data-testid=new-project-input]', [S + 'dharamshala-1.jpg', S + 'dharamshala-2.jpg', T + 'clip-portrait.mp4', S + 'dharamshala-3.jpg']);
  await page.click('[data-testid=create-project]'); await settle(page, 4500);

  // ── single-asset edit, independent per item
  let f = await fills(page);
  ok(f.length === 4 && f.map(x => x.kind).join() === 'image,image,video,image', 'four items: three photos and a video');
  await setRange(page, 'Exposure', 30);
  f = await fills(page);
  ok(f[0].adj.exposure === 30 && f.slice(1).every(x => (x.adj.exposure ?? 0) === 0), 'editing one item leaves the others alone', f.map(x => x.adj.exposure));
  await setRange(page, 'Whites', 25); await setRange(page, 'Blacks', -20); await setRange(page, 'Vibrance', 35);
  f = await fills(page);
  ok(f[0].adj.whites === 25 && f[0].adj.blacks === -20 && f[0].adj.vibrance === 35, 'whites, blacks and vibrance sliders write through');

  // ── batch: select all, edit, apply a filter
  await page.click('[data-testid=select-all]'); await settle(page, 300);
  let u = await ui(page);
  ok(u.sel.length === 4, 'Select all selects every item', u.sel.length);
  ok((await page.locator('[data-testid=edit-title]').textContent()) === '4 selected', 'the card says 4 selected');
  await setRange(page, 'Contrast', 20);
  f = await fills(page);
  ok(f.every(x => x.adj.contrast === 20), 'batch: a slider change applies to all four (photos and the video)', f.map(x => x.adj.contrast));
  ok(f[0].adj.exposure === 30, 'batch edits keep each item\'s other settings');
  await page.click('[data-testid=filter-vintage]'); await settle(page, 400);
  f = await fills(page);
  ok(f.every(x => x.filter === 'vintage'), 'batch: a filter applies to every selected item', f.map(x => x.filter));
  // one undo step reverts the whole batch
  await page.keyboard.press('Control+Z'); await settle(page, 300);
  f = await fills(page);
  ok(f.every(x => x.filter === 'original'), 'one undo reverts the batch filter on all items');
  await page.click('[data-testid=filter-vintage]'); await settle(page, 300);

  // ── select photos / videos / none
  await page.click('[data-testid=select-photos]'); await settle(page, 200);
  u = await ui(page); ok(u.sel.length === 3, 'Photos selects only the three photos', u.sel.length);
  await page.click('[data-testid=select-videos]'); await settle(page, 200);
  u = await ui(page); ok(u.sel.length === 1 && f[2].id === u.sel[0], 'Videos selects only the video');
  await page.click('[data-testid=select-all]'); await settle(page, 200);
  await page.click('[data-testid=select-none]'); await settle(page, 200);
  u = await ui(page); ok(u.sel.length === 1, 'None collapses to the active item');

  // ── individual edit after batch
  await slide(page, 1).click(); await settle(page, 300);
  u = await ui(page); ok(u.sel.length === 1 && u.active === f[1].id, 'clicking an item selects just it');
  await setRange(page, 'Contrast', 55);
  f = await fills(page);
  ok(f[1].adj.contrast === 55 && f[0].adj.contrast === 20 && f[2].adj.contrast === 20 && f[3].adj.contrast === 20, 'after a batch, one item can still be edited on its own', f.map(x => x.adj.contrast));
  // ctrl-click adds, shift-click ranges
  await slide(page, 3).click({ modifiers: ['Control'] }); await settle(page, 200);
  u = await ui(page); ok(u.sel.length === 2, 'Ctrl-click adds to the selection', u.sel.length);
  await slide(page, 0).click(); await slide(page, 2).click({ modifiers: ['Shift'] }); await settle(page, 200);
  u = await ui(page); ok(u.sel.length === 3, 'Shift-click selects a range', u.sel.length);

  // ── reset selected
  await page.click('[data-testid=select-photos]'); await settle(page, 200);
  await page.locator('[data-testid=reset-edits]').click(); await settle(page, 400);
  f = await fills(page);
  const photosClean = [0, 1, 3].every(i => (f[i].adj.contrast ?? 0) === 0 && (f[i].adj.exposure ?? 0) === 0 && f[i].filter === 'original');
  ok(photosClean, 'Reset selected clears photos only', f.map(x => [x.adj.contrast, x.filter]));
  ok(f[2].adj.contrast === 20 && f[2].filter === 'vintage', 'the unselected video keeps its edits');

  console.log(logs.join('\n') || 'no console errors');
  console.log(`\n${pass} passed, ${fail} failed`);
    await browser.close();
  process.exit(fail ? 1 : 0);
})().catch((e) => { console.error('FAIL', e.message); process.exit(1); });
