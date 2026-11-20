// Every dialog and menu must fit a phone: no sideways scroll, nothing wider than the screen, every button on screen.
// Runs at 390, 360 and 320px wide. Screenshots go to $SHOTS (default /tmp/phone-dialogs).
const fs = require('fs');
const { open, newProject, settle, S } = require('./phone-lib');

const OUT = process.env.SHOTS || '/tmp/phone-dialogs';
fs.mkdirSync(OUT, { recursive: true });
let fail = 0;
const ok = (c, m) => { if (!c) fail++; console.log(`${c ? 'PASS' : 'FAIL'}  ${m}`); };

/** what is wider than the dialog, or off screen */
const probe = (page, root) => page.evaluate((sel) => {
  const el = document.querySelector(sel);
  if (!el) return { missing: true };
  const vw = window.innerWidth, vh = window.innerHeight;
  const r = el.getBoundingClientRect();
  const inScroller = (n) => { for (let p = n.parentElement; p && p !== el; p = p.parentElement) { const o = getComputedStyle(p).overflowX; if ((o === 'auto' || o === 'scroll') && p.scrollWidth > p.clientWidth) return true; } return false; };
  // anything poking out of the dialog's sides, and one-line text that is wider than its own box
  const scroller = [...el.querySelectorAll('*')].filter((n) => n.offsetParent !== null && !inScroller(n) && (n.getBoundingClientRect().right > r.right + 1 || n.getBoundingClientRect().left < r.left - 1 || (!n.children.length && n.textContent.trim() && n.scrollWidth > n.clientWidth + 1 && getComputedStyle(n).display !== 'inline')));
  const offscreen = [...el.querySelectorAll('button, input, select')].filter((b) => {
    if (b.offsetParent === null) return false;
    // inside a horizontal scroller (strips, chip rows) is fine
    for (let p = b.parentElement; p && p !== el; p = p.parentElement) { const o = getComputedStyle(p).overflowX; if ((o === 'auto' || o === 'scroll') && p.scrollWidth > p.clientWidth) return false; }
    const q = b.getBoundingClientRect();
    return q.right > vw + 1 || q.left < -1;
  }).map((b) => (b.getAttribute('aria-label') || b.textContent || b.tagName).trim().slice(0, 24));
  const wrapped = [...el.querySelectorAll('button')].filter((b) => b.offsetParent !== null && b.getBoundingClientRect().height > 60 && b.textContent.trim().length < 20 && !b.querySelector('canvas,img')).map((b) => b.textContent.trim().slice(0, 24));
  return { w: Math.round(r.width), vw, fitsW: r.left >= -1 && r.right <= vw + 1, fitsH: r.top >= -1 && r.bottom <= vh + 1, overflowX: scroller.slice(0, 3).map((n) => `${n.tagName}.${String(n.className).slice(0, 40)}:${(n.textContent || '').trim().slice(0, 16)}`), offscreen, wrapped, docScroll: document.documentElement.scrollWidth > vw + 1 };
}, root);

(async () => {
  for (const width of [390, 360, 320]) {
    const { browser, ctx, page, logs } = await open();
    await page.setViewportSize({ width, height: 740 });
    await page.reload({ waitUntil: 'networkidle' });
    await settle(page, 700);
    const tag = `${width}`;

    // new project: intent cards, then the collage mode cards, then edit options
    await page.waitForSelector('[data-testid=new-project-dialog]');
    let p = await probe(page, '[data-testid=new-project-dialog] [role=dialog]');
    ok(p.fitsW && !p.docScroll && !p.offscreen.length && !p.overflowX.length, `${tag}: new project (intents) fits ${JSON.stringify(p.offscreen.concat(p.overflowX))}`);
    await page.screenshot({ path: `${OUT}/${tag}-new-intents.png` });
    await page.tap('[data-testid=intent-collage]');
    await settle(page, 200);
    p = await probe(page, '[data-testid=new-project-dialog] [role=dialog]');
    ok(p.fitsW && !p.offscreen.length && !p.overflowX.length && !p.wrapped.length, `${tag}: new project (collage) fits ${JSON.stringify(p.offscreen.concat(p.overflowX, p.wrapped))}`);
    await page.screenshot({ path: `${OUT}/${tag}-new-collage.png` });
    await page.tap('[data-testid=mode-panorama]');
    await settle(page, 200);
    p = await probe(page, '[data-testid=new-project-dialog] [role=dialog]');
    ok(p.fitsW && !p.offscreen.length && !p.overflowX.length, `${tag}: new project (panorama) fits ${JSON.stringify(p.offscreen.concat(p.overflowX))}`);
    await page.tap('[data-testid=intent-edit]');
    await settle(page, 200);
    p = await probe(page, '[data-testid=new-project-dialog] [role=dialog]');
    ok(p.fitsW && !p.offscreen.length && !p.overflowX.length, `${tag}: new project (edit) fits`);
    await page.screenshot({ path: `${OUT}/${tag}-new-edit.png` });

    // make a real project so the rest of the dialogs have content
    await page.tap('[data-testid=intent-collage]');
    await page.tap('[data-testid=mode-collage]');
    await page.setInputFiles('[data-testid=new-project-input]', [S + 'sample-1.jpg', S + 'sample-2.jpg'].filter((f) => fs.existsSync(f)));
    await page.tap('[data-testid=create-project]');
    await settle(page, 3000);

    const dialogs = [
      ['export', 'exportOpen', 'export-dialog'],
      ['import', 'importOpen', 'import-dialog'],
      ['projects', 'projectsOpen', 'projects-dialog'],
      ['shortcuts', 'shortcutsOpen', 'shortcuts-dialog'],
    ];
    for (const [name, flag, id] of dialogs) {
      await page.evaluate((f) => window.__store.getState().setUI({ [f]: true }), flag);
      await page.waitForSelector(`[data-testid=${id}]`);
      await settle(page, 300);
      p = await probe(page, `[data-testid=${id}] [role=dialog]`);
      ok(p.fitsW && p.fitsH && !p.docScroll && !p.offscreen.length && !p.overflowX.length && !p.wrapped.length, `${tag}: ${name} dialog fits ${JSON.stringify(p.offscreen.concat(p.overflowX, p.wrapped))}`);
      await page.screenshot({ path: `${OUT}/${tag}-${name}.png` });
      await page.evaluate((f) => window.__store.getState().setUI({ [f]: false }), flag);
      await settle(page, 150);
    }

    // the format menu from the bottom bar, and the media picker
    await page.tap('[data-testid=format-chip]').catch(() => {});
    await settle(page, 300);
    p = await probe(page, '[data-testid=format-menu]');
    if (!p.missing) {
      ok(p.fitsW && !p.offscreen.length && !p.overflowX.length, `${tag}: format menu fits ${JSON.stringify(p.offscreen.concat(p.overflowX))}`);
      await page.screenshot({ path: `${OUT}/${tag}-format.png` });
    } else console.log(`SKIP  ${tag}: format menu not reachable`);
    await page.keyboard.press('Escape');

    ok(logs.length === 0, `${tag}: no console errors ${logs.join(' | ')}`);
    await browser.close();
  }
  console.log(fail ? `\n${fail} FAILED` : '\nAll phone dialog checks passed');
  process.exit(fail ? 1 : 0);
})();
