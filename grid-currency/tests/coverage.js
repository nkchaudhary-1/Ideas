'use strict';
/*
 * Ink coverage per plate. Each ink is rendered alone on a transparent ground; the sum of alpha over the sheet is the
 * area that ink really covers (fine lines count by their weight, not by the colour they average to).
 *   coverage({ primary: '<svg…>', secondary: '<svg…>', … })  ->  { primary: 0.31, … }   (fractions of the note)
 */
async function coverage(plates) {
  const { chromium } = require('playwright');
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1600, height: 750 } });
  const out = {};
  for (const [role, svg] of Object.entries(plates)) {
    out[role] = await page.evaluate(async (s) => {
      const img = new Image();
      await new Promise((res, rej) => { img.onload = res; img.onerror = rej; img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(s); });
      const c = document.createElement('canvas'); c.width = 1600; c.height = 750;
      const x = c.getContext('2d', { willReadFrequently: true });
      x.drawImage(img, 0, 0);
      const d = x.getImageData(0, 0, 1600, 750).data;
      let a = 0; for (let i = 3; i < d.length; i += 4) a += d[i];
      return a / 255 / (1600 * 750);
    }, svg);
  }
  await browser.close();
  return out;
}
module.exports = { coverage };
