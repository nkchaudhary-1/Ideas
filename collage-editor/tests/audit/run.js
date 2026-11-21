// UI audit: drives the editor through every screen, dialog and popover and measures corner radii, spacing, clipping,
// hit targets and accessible names (see probe.js). Writes a screenshot per state next to a findings summary.
//   node tests/audit/run.js [--w=1600] [--h=950] [--theme=light|dark] [--out=/tmp/audit] [--only=name,name] [--shots]
//   node tests/audit/run.js --phone [--w=390] [--h=844]   the same states on an emulated phone (touch, tool dock, bottom sheets)
const path = require('path');
const fs = require('fs');
const { chromium, devices } = require('playwright');
const probe = require('./probe');
const S = path.resolve(__dirname, '../../public/samples') + '/';
const T = path.resolve(__dirname, '../fixtures') + '/';
const arg = (k, d) => { const a = process.argv.find((x) => x.startsWith(`--${k}=`)); return a ? a.split('=')[1] : d; };
const PHONE = process.argv.includes('--phone');
const W = +arg('w', PHONE ? 390 : 1600), H = +arg('h', PHONE ? 844 : 950), THEME = arg('theme', 'light'), OUT = arg('out', '/tmp/audit');
const ONLY = arg('only', '') ? arg('only', '').split(',') : null;
const SHOTS = process.argv.includes('--shots');
const TAG = PHONE ? `phone-${THEME}` : THEME;
fs.mkdirSync(OUT, { recursive: true });

const wait = (p, ms = 350) => p.waitForTimeout(ms);
const expandAll = (p) => p.evaluate(() => document.querySelectorAll('[data-testid=properties] section button[aria-expanded=false], [data-testid=left-panel] section button[aria-expanded=false]').forEach((b) => b.click()));
const store = (p, fn, arg) => p.evaluate(fn, arg);

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext(PHONE ? { ...devices['iPhone 13'], viewport: { width: W, height: H }, acceptDownloads: true } : { viewport: { width: W, height: H }, acceptDownloads: true });
  // the guide opens itself the first time a kind of project is made; the audit opens it on purpose instead (see pop-guide)
  await ctx.addInitScript(() => { try { localStorage.setItem('collage.guide.seen', JSON.stringify(['single', 'collage', 'carousel', 'panorama', 'story', 'edit'])); } catch { /* ignore */ } });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push('pageerror ' + e.message));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text().slice(0, 160)); });
  await page.goto(process.env.BASE_URL || 'http://localhost:3100', { waitUntil: 'networkidle' });
  await page.waitForSelector('[data-testid=home]');
  await page.evaluate((p) => { window.__phone = p; }, PHONE);
  if (THEME === 'dark') { await page.evaluate(() => window.__store.getState().setTheme('dark')); await wait(page); }

  // On a phone the tool rail is a dock and panels / properties are bottom sheets; open the one a state needs.
  const sheet = (v) => PHONE ? page.evaluate((x) => window.__store.getState().setUI(x ? { sheet: x.k, sheetSize: x.size } : { sheet: null }), v) : Promise.resolve();
  const openTool = async (id) => { if (PHONE) await page.evaluate((i) => window.__store.getState().setUI({ leftPanel: i, sheet: 'tools', sheetSize: 'full' }), id); else await page.click(`[data-testid=rail-${id}]`); };
  const sheetFor = (name) => /^(edit-|save-preset)/.test(name) ? { k: 'props', size: 'half' } : /^(props-|pop-color)/.test(name) && !/-cell$/.test(name) ? { k: 'props', size: 'full' } : /^panel-/.test(name) ? { k: 'tools', size: 'full' } : null;
  const findings = {};
  const record = async (name) => {
    await wait(page, 250);
    const f = await page.evaluate(`(${probe.toString()})()`);
    findings[name] = f;
    if (SHOTS) await page.screenshot({ path: path.join(OUT, `${TAG}-${W}-${name}.png`) });
  };
  const run = async (name, fn) => {
    if (ONLY && !ONLY.includes(name)) return;
    try { const sh = sheetFor(name); if (PHONE && sh && sh.k === 'props') await sheet(sh); await fn(); if (PHONE && !sh) await sheet(null); await record(name); } catch (e) { console.log(`  (skipped ${name}: ${e.message.split('\n').slice(0, 14).join(' | ').slice(0, 900)})`); }
  };
  // on a phone size, view options and preview live in the "⋯" menu
  const viaMenu = async (id) => { if (PHONE) { await page.click('[data-testid=app-menu]'); await wait(page, 300); } await page.click(`[data-testid=${id}]`); };
  const closeAny = async () => { await page.keyboard.press('Escape'); await wait(page, 150); await page.mouse.click(5, 5).catch(() => {}); await wait(page, 100); };

  // ── the front page (nothing saved yet), then the entry dialog it opens
  await run('home-empty', async () => {});
  await page.click('[data-testid=home-create]'); await page.waitForSelector('[data-testid=new-project-dialog]');
  await run('dlg-new-collage', async () => {});
  await run('dlg-new-collage-pano', async () => { await page.click('[data-testid=mode-panorama]'); await wait(page, 300); });
  await run('dlg-new-collage-custom', async () => { await page.click('[data-testid=mode-carousel]'); await page.click('[data-testid=fmt-custom]'); await wait(page, 300); });
  await run('dlg-new-collage-more', async () => { await page.click('[data-testid=fmt-more]'); await wait(page, 300); });
  await run('dlg-new-edit', async () => { await page.click('[data-testid=intent-edit]'); await wait(page, 300); });
  await page.click('[data-testid=intent-collage]');
  await page.click('[data-testid=mode-carousel]');
  await page.click('[data-testid=fmt-4-5]').catch(() => {});
  await page.setInputFiles('[data-testid=new-project-input]', [S + 'sample-1.jpg', S + 'sample-2.jpg', T + 'clip-portrait.mp4', S + 'sample-3.jpg']);
  await page.click('[data-testid=create-project]'); await wait(page, 4500);

  await page.evaluate(() => window.__store.getState().setUI({ rightOpen: true })); await wait(page, 400); // small windows start with it closed
  // ── left rail panels
  for (const id of ['uploads', 'layouts', 'templates', 'text', 'elements', 'frames', 'backgrounds', 'palettes', 'layers']) {
    await run(`panel-${id}`, async () => {
      const open = await page.evaluate(() => window.__store.getState().ui.leftPanel);
      if (PHONE) await openTool(id); else if (open !== id) await page.click(`[data-testid=rail-${id}]`);
      await wait(page, 500); await expandAll(page); await wait(page, 200);
    });
  }
  // ── properties: canvas, image, video
  await run('props-canvas', async () => { await page.evaluate(() => window.__store.getState().clearSelection()); await expandAll(page); });
  await run('props-canvas-bg-gradient', async () => { await page.getByRole('button', { name: 'Gradient', exact: true }).click(); await wait(page, 300); await expandAll(page); });
  await run('props-canvas-bg-pattern', async () => { await page.getByRole('button', { name: 'Pattern', exact: true }).click(); await wait(page, 300); await expandAll(page); });
  await page.getByRole('button', { name: 'Solid', exact: true }).click();
  await run('props-image', async () => {
    if (PHONE) await page.evaluate(() => window.__store.getState().setUI({ leftPanel: null })); else await page.click('[data-testid=rail-uploads]').catch(() => {}); // close panel for more canvas room
    await page.evaluate(() => { const s = window.__store.getState(); s.setActiveSlide(s.project.slides[0].id); });
    await wait(page, 400);
    await page.evaluate(() => { const s = window.__store.getState(); const sl = s.project.slides.find((x) => x.id === s.project.activeSlideId); s.select([sl.elements[0].id]); });
    await wait(page, 400); await expandAll(page);
  });
  await run('props-video', async () => {
    await page.evaluate(() => { const s = window.__store.getState(); s.setActiveSlide(s.project.slides[2].id); });
    await wait(page, 400);
    await page.evaluate(() => { const s = window.__store.getState(); const sl = s.project.slides.find((x) => x.id === s.project.activeSlideId); s.select([sl.elements[0].id]); });
    await wait(page, 500); await expandAll(page);
  });
  await run('props-image-crop', async () => { await page.click('[data-testid=crop-toggle]'); await wait(page, 300); });
  await page.keyboard.press('Escape');

  // ── text, shape, grid, frame
  const addVia = async (rail, pick) => { await openTool(rail); await wait(page, 400); await pick(); await wait(page, 500); await sheet({ k: 'props', size: 'full' }); await wait(page, 300); await expandAll(page); };
  await page.evaluate(() => { const s = window.__store.getState(); s.setActiveSlide(s.project.slides[1].id); s.clearSelection(); });
  await run('props-text', async () => { await addVia('text', async () => { await page.getByText('Add a heading').first().click(); }); await page.keyboard.press('Escape'); await wait(page, 300); await expandAll(page); });
  await run('props-shape', async () => { await addVia('elements', async () => { await page.click('[data-testid=el-rounded]'); }); });
  await run('props-grid', async () => {
    await page.evaluate(() => { const s = window.__store.getState(); s.setActiveSlide(s.project.slides[3].id); s.deleteElements(s.project.slides[3].elements.map((e) => e.id)); });
    await addVia('layouts', async () => { await page.click('[data-testid=grid-four]'); });
  });
  await run('props-grid-cell', async () => {
    await sheet(null); await wait(page, 500);
    const b = await page.locator('[data-testid=workspace]').boundingBox();
    const v = await page.evaluate(() => { const s = window.__store.getState(); return s.ui.view; });
    await page.mouse.click(b.x + v.x + 540 * v.scale * 0.5, b.y + v.y + 675 * v.scale * 0.5); await wait(page, 400); await sheet({ k: 'props', size: 'full' }); await wait(page, 300); await expandAll(page);
  });
  await run('props-multi', async () => { await page.evaluate(() => { const s = window.__store.getState(); s.setActiveSlide(s.project.slides[1].id); const sl = s.project.slides[1]; s.select(sl.elements.map((e) => e.id)); }); await wait(page, 400); await expandAll(page); });
  await run('props-frame', async () => { await addVia('frames', async () => { await page.locator('[data-testid=left-panel] button').nth(2).click(); }); });

  // ── popovers
  await page.evaluate(() => { const s = window.__store.getState(); s.clearSelection(); s.setUI({ leftPanel: null, sheet: null }); });
  await run('pop-format', async () => { await viaMenu('format-chip'); await wait(page, 400); });
  await closeAny();
  await run('pop-view', async () => { await viaMenu('view-menu'); await wait(page, 400); });
  await closeAny();
  await run('pop-app', async () => { await page.click('[data-testid=app-menu]'); await wait(page, 400); });
  await closeAny();
  await run('pop-addslide', async () => { await page.click('[data-testid=add-slide]'); await wait(page, 400); });
  await closeAny();
  await run('pop-color', async () => { await page.click('[data-testid=bg-color]'); await wait(page, 400); });
  await closeAny();
  await run('pop-guide', async () => { await sheet(null); await page.click('[data-testid=guide-chip]'); await wait(page, 450); });
  await closeAny();
  await run('empty-slide', async () => { await sheet(null); await page.evaluate(() => { const s = window.__store.getState(); s.addSlide({ afterId: s.project.activeSlideId }); }); await wait(page, 700); });
  await page.evaluate(() => { const s = window.__store.getState(); s.deleteSlide(s.project.activeSlideId); });
  await run('pop-picker', async () => {
    await sheet(null); await wait(page, 500);
    await page.evaluate(() => { const s = window.__store.getState(); s.setActiveSlide(s.project.slides[3].id); });
    await wait(page, 400);
    const b = await page.locator('[data-testid=workspace]').boundingBox(); const v = await page.evaluate(() => window.__store.getState().ui.view);
    await page.mouse.click(b.x + v.x + 270 * v.scale, b.y + v.y + 337 * v.scale); await wait(page, 500);
  });
  await closeAny();
  await page.evaluate(() => { window.__store.getState().clearSelection(); });

  // ── states that only appear mid-task
  await run('panel-layers-selected', async () => {
    await page.evaluate(() => { const s = window.__store.getState(); s.setActiveSlide(s.project.slides[1].id); s.select(s.project.slides[1].elements.map((e) => e.id).slice(0, 1)); s.setUI({ leftPanel: 'layers', sheet: window.__phone ? 'tools' : null, sheetSize: 'full' }); });
    await wait(page, 500);
  });
  await run('save-preset-open', async () => {
    await page.evaluate(() => { const s = window.__store.getState(); s.setActiveSlide(s.project.slides[0].id); s.select([s.project.slides[0].elements[0].id]); s.setUI({ leftPanel: null }); });
    await wait(page, 400); await expandAll(page);
    await page.click('[data-testid=save-look]'); await wait(page, 300);
  });
  await page.evaluate(() => window.__store.getState().clearSelection());
  await run('dlg-import-items', async () => {
    await page.evaluate(() => window.__store.getState().setUI({ importOpen: true, importQueue: [] })); await wait(page, 600);
    await page.setInputFiles('[data-testid=import-input]', [T + 'photo-5.jpg', T + 'photo-6.jpg', T + 'clip-portrait.mp4']); await wait(page, 2500);
  });
  await page.evaluate(() => window.__store.getState().setUI({ importOpen: false }));
  await run('toast', async () => { await page.evaluate(() => window.__store.getState().toast('3 items matched to “sample-1”', 'ok')); await wait(page, 300); });

  // ── dialogs
  await run('dlg-shortcuts', async () => { await page.evaluate(() => window.__store.getState().setUI({ shortcutsOpen: true })); await wait(page, 400); });
  await page.evaluate(() => window.__store.getState().setUI({ shortcutsOpen: false }));
  await run('dlg-export', async () => { await page.click('[data-testid=export]'); await wait(page, 900); });
  await page.evaluate(() => window.__store.getState().setUI({ exportOpen: false }));
  await run('dlg-preview', async () => { await viaMenu('preview'); await wait(page, 1200); });
  await page.evaluate(() => window.__store.getState().setUI({ previewOpen: false }));
  await run('dlg-import', async () => { await page.evaluate(() => window.__store.getState().setUI({ importOpen: true, importQueue: [] })); await wait(page, 400); });
  await page.evaluate(() => window.__store.getState().setUI({ importOpen: false }));
  await run('photo-selected', async () => { await page.evaluate(() => { const s = window.__store.getState(); const sl = s.project.slides.find((x) => x.id === s.project.activeSlideId); const el = sl.elements.find((e) => e.type === 'image' || e.type === 'grid'); s.select([el.id]); s.setUI({ sheet: null }); }); await wait(page, 600); });
  await run('quick-bar', async () => { await page.evaluate(() => window.__store.getState().setUI({ quick: 'filters' })); await wait(page, 1000); });
  await page.evaluate(() => { const s = window.__store.getState(); s.setUI({ quick: null }); s.clearSelection(); });
  await run('editor-chrome', async () => { await page.evaluate(() => window.__store.getState().setUI({ leftPanel: 'uploads', sheet: window.__phone ? 'tools' : null })); await wait(page, 300); });

  // ── edit mode
  await page.evaluate(() => window.__store.getState().setUI({ newProjectOpen: true })); await wait(page, 400);
  await page.click('[data-testid=intent-edit]');
  await page.setInputFiles('[data-testid=new-project-input]', [S + 'sample-1.jpg', S + 'sample-2.jpg', T + 'clip-portrait.mp4', S + 'sample-3.jpg']);
  await page.click('[data-testid=create-project]'); await wait(page, 4500);
  await run('edit-single', async () => { await expandAll(page); });
  await run('edit-reference', async () => { await page.click('[data-testid=set-reference]'); await page.click('[data-testid=thumb-open] >> nth=1'); await page.click('[data-testid=thumb-open] >> nth=3', { modifiers: ['Shift'] }); await wait(page, 400); await expandAll(page); });
  await run('edit-batch-matched', async () => { await page.click('[data-testid=match-selected]'); await wait(page, 2000); await expandAll(page); });
  await run('edit-copy-picker', async () => { await page.click('[data-testid=copy-settings]'); await wait(page, 400); });
  await closeAny();
  await run('edit-curves-open', async () => { await page.locator('[data-testid=curve-editor]').scrollIntoViewIfNeeded(); });
  await page.evaluate(() => { const s = window.__store.getState(); s.removeEditSlides(s.project.slides.map((x) => x.id)); });
  await run('edit-empty', async () => { await wait(page, 400); });

  // ── the front page again, now with projects in it
  await page.evaluate(() => window.__store.getState().goHome()); await wait(page, 3500);
  await run('home-projects', async () => { await wait(page, 300); });
  await run('home-confirm-delete', async () => { await page.click('[data-testid=home-delete] >> nth=0'); await wait(page, 300); });

  // ── summary
  const bucket = {};
  for (const [state, f] of Object.entries(findings)) {
    for (const kind of Object.keys(f)) for (const it of f[kind]) {
      const key = `${kind}|${it.kind || ''}|${it.el}|${it.cls || ''}|${it.r ?? ''}|${it.ideal ?? ''}|${it.N ?? ''}|${it.a ?? ''}|${it.b ?? ''}|${it.h ?? ''}`;
      (bucket[key] = bucket[key] || { ...it, cat: kind, states: [] }).states.push(state);
    }
  }
  const rows = Object.values(bucket);
  fs.writeFileSync(path.join(OUT, `${TAG}-${W}-findings.json`), JSON.stringify({ errors, rows, findings }, null, 1));
  const by = (k) => rows.filter((r) => r.cat === k);
  const show = (k, n = 80) => {
    const list = by(k); console.log(`\n## ${k}: ${list.length}`);
    list.slice(0, n).forEach((r) => console.log(`  ${r.kind ? `[${r.kind}] ` : ''}${r.el}  ${Object.entries(r).filter(([a]) => !['kind', 'cat', 'el', 'states', 'chain', 'cls', 'aEx', 'bEx'].includes(a)).map(([a, b]) => `${a}=${b}`).join(' ')}  (${r.states.length} state${r.states.length > 1 ? 's' : ''}: ${r.states.slice(0, 3).join(',')})`));
  };
  console.log(`audit ${TAG} ${W}x${H}: ${Object.keys(findings).length} states, console errors: ${errors.length}`);
  errors.slice(0, 5).forEach((e) => console.log('  !', e));
  for (const k of (arg('show', 'radius,grid,clip,small,names,align,heights')).split(',')) show(k, +arg('n', 60));
  await browser.close();
})().catch((e) => { console.error('FAIL', e); process.exit(1); });
