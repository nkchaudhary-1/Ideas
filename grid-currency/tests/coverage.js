'use strict';
/*
 * Colour coverage of a flat-colour note: render it, count pixels, snap each to the nearest palette role.
 * Used by the blueprint (palette panel). Returns { primary: 0.47, ... } summing to 1.
 */
const fs = require('fs');

async function coverage(svgPath, palette) {
  const { chromium } = require('playwright');
  const svg = fs.readFileSync(svgPath, 'utf8');
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 800, height: 375 } });
  const roles = Object.entries(palette);
  const data = await page.evaluate(async ({ svg, roles }) => {
    const url = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
    const img = new Image();
    await new Promise((res, rej) => { img.onload = res; img.onerror = rej; img.src = url; });
    const c = document.createElement('canvas'); c.width = 800; c.height = 375;
    const x = c.getContext('2d', { willReadFrequently: true });
    x.drawImage(img, 0, 0, 800, 375);
    const px = x.getImageData(0, 0, 800, 375).data;
    const rgb = roles.map(([, h]) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)]);
    const counts = roles.map(() => 0);
    for (let i = 0; i < px.length; i += 4) {
      let best = 0, bd = 1e9;
      for (let k = 0; k < rgb.length; k++) {
        const d = (px[i] - rgb[k][0]) ** 2 + (px[i + 1] - rgb[k][1]) ** 2 + (px[i + 2] - rgb[k][2]) ** 2;
        if (d < bd) { bd = d; best = k; }
      }
      counts[best]++;
    }
    return counts;
  }, { svg, roles });
  await browser.close();
  const total = data.reduce((a, b) => a + b, 0);
  return Object.fromEntries(roles.map(([k], i) => [k, data[i] / total]));
}
module.exports = { coverage };
