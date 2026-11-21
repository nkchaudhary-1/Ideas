const { open, settle, S, T } = require('./lib');
const fs = require('fs'); const { execSync } = require('child_process');
let pass = 0, fail = 0;
const ok = (c, m, extra) => { c ? pass++ : fail++; console.log((c ? 'PASS ' : 'FAIL ') + m + (c || extra === undefined ? '' : '  → ' + JSON.stringify(extra))); };
const setRange = async (page, label, v) => { await page.locator(`input[type=range][aria-label="${label}"]`).first().fill(String(v)); await settle(page, 250); };
const slide = (page, i) => page.locator('[data-testid=thumb-open]').nth(i);
const shot = async (page) => { const b = await page.locator('[data-testid=workspace]').boundingBox(); const buf = await page.screenshot({ clip: { x: b.x + b.width / 2 - 100, y: b.y + b.height / 2 - 140, width: 200, height: 280 } }); return require('crypto').createHash('md5').update(buf).digest('hex'); };
(async () => {
  const { browser, page, logs } = await open();
  page.setDefaultTimeout(30000);
  await page.waitForSelector('[data-testid=home]'); await page.click('[data-testid=home-create]'); await page.waitForSelector('[data-testid=new-project-dialog]');
  await page.click('[data-testid=intent-edit]');
  await page.setInputFiles('[data-testid=new-project-input]', [S + 'sample-1.jpg', S + 'sample-2.jpg', T + 'clip-portrait.mp4']);
  await page.click('[data-testid=create-project]'); await settle(page, 4500);

  // ── compare
  await setRange(page, 'Exposure', 40); await setRange(page, 'Saturation', -60); await settle(page, 600);
  const edited = await shot(page);
  await page.locator('[data-testid=compare]').dispatchEvent('pointerdown', { pointerId: 1, isPrimary: true }); await settle(page, 600);
  const orig = await shot(page);
  ok(await page.evaluate(() => window.__store.getState().ui.compare === true), 'holding Compare turns the flag on');
  await page.locator('[data-testid=compare]').dispatchEvent('pointerup', { pointerId: 1, isPrimary: true }); await settle(page, 600);
  const back = await shot(page);
  ok(edited !== orig && edited === back, 'Compare shows the original while held, then the edit again', { edited, orig, back });
  await page.keyboard.down('\\'); await settle(page, 300);
  ok(await page.evaluate(() => window.__store.getState().ui.compare === true), 'holding the \\ key compares too');
  await page.keyboard.up('\\'); await settle(page, 300);
  ok(await page.evaluate(() => window.__store.getState().ui.compare === false), 'releasing the key returns to the edit');
  ok(await page.evaluate(() => { const p = window.__store.getState().project; return p.slides[0].elements[0].fill.adjustments.exposure === 40; }), 'comparing never touches the edit itself');

  // ── export: names, native size, edits baked in
  await slide(page, 1).click(); await setRange(page, 'Contrast', 30);
  await slide(page, 0).click(); await settle(page, 300);
  await page.click('[data-testid=export]'); await page.waitForSelector('[data-testid=export-dialog]'); await settle(page, 800);
  const plan = await page.locator('[data-testid=export-plan] li').allTextContents();
  console.log('plan:', plan.map(t => t.replace(/\s+/g, ' ').trim()).join(' | '));
  ok(plan.length === 3, 'the export plan lists every item', plan.length);
    // photos only as PNG into a zip
  const dl = page.waitForEvent('download', { timeout: 90000 });
  await page.click('[data-testid=export-run]');
  const d = await dl; const path = require('os').tmpdir() + '/edit-export-out' + (d.suggestedFilename().endsWith('.zip') ? '.zip' : '');
  await d.saveAs(path); console.log('download:', d.suggestedFilename());
  if (path.endsWith('.zip')) {
    const list = execSync(`unzip -l ${path}`).toString();
    ok(/sample-1-edit\.png/.test(list) && /sample-2-edit\.png/.test(list), 'files keep their own names: <name>-edit.png', list);
    ok(/clip-portrait-edit\.(mp4|webm|png)/.test(list), 'the video is exported too, under its own name', list);
    const unz = require('os').tmpdir() + '/edit-export-unz';
    execSync(`rm -rf ${unz} && mkdir ${unz} && cd ${unz} && unzip -q ${path}`);
    const dims = execSync(`python3 -c "
import struct,glob
for f in sorted(glob.glob('${unz}/*.png')):
    d=open(f,'rb').read(32); print(f.split('/')[-1], struct.unpack('>II', d[16:24]))
"`).toString();
    ok(/sample-1-edit.png \(900, 1600\)/.test(dims), 'images are exported at their native size (900x1600)', dims);
  }
  console.log(logs.join('\n') || 'no console errors');
  console.log(`\n${pass} passed, ${fail} failed`);
  await browser.close();
  process.exit(fail ? 1 : 0);
})().catch((e) => { console.error('FAIL', e.message); process.exit(1); });
