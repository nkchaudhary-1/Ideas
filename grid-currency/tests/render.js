'use strict';
/*
 * Preview renderer (QA only; the SVGs never depend on this).
 * Impact is not installed on Linux, so previews load Anton under the same family name, scale it to Impact's
 * cap height and stretch each text run to an estimate of Impact's width.
 *
 *   node tests/render.js <file.svg> <out.png> [scale=1] [clipX clipY clipW clipH]
 *   ANTON_WOFF2=/path/to/anton-latin-400-normal.woff2 node tests/render.js ...   (or: npm i @fontsource/anton)
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const { impactWidth } = require('../lib/note');

const CANDIDATES = [
  process.env.ANTON_WOFF2,
  path.join(__dirname, '..', 'node_modules', '@fontsource', 'anton', 'files', 'anton-latin-400-normal.woff2'),
  path.join(__dirname, 'fonts', 'anton-latin-400-normal.woff2'),
].filter(Boolean);
const FONT = CANDIDATES.find((p) => fs.existsSync(p));
if (!FONT && require.main === module) {
  console.error('Anton (preview stand-in for Impact) not found. Run `npm i @fontsource/anton` here, or set ANTON_WOFF2=/path/to/anton-latin-400-normal.woff2');
  process.exit(1);
}

function preview(svg) {
  return svg.replace(/<text\b([^>]*font-family="Impact[^"]*"[^>]*)>([^<]*)<\/text>/g, (m, attrs, body) => {
    const size = parseFloat((attrs.match(/font-size="([\d.]+)"/) || [])[1] || '16');
    const ls = parseFloat((attrs.match(/letter-spacing="([\d.-]+)"/) || [])[1] || '0');
    const str = body.replace(/&amp;/g, '&');
    const tl = impactWidth(str, size, ls);
    const a = attrs.replace(/font-family="[^"]*"/, 'font-family="AntonQA"')
      .replace(/ textLength="[^"]*"/, '').replace(/ lengthAdjust="[^"]*"/, '');
    return `<text${a} textLength="${tl.toFixed(1)}" lengthAdjust="spacingAndGlyphs">${body}</text>`;
  }).replace(/font-family="Impact[^"]*"/g, 'font-family="AntonQA"');
}

async function render(svgPath, pngPath, scale = 1, clip) {
  const { chromium } = require('playwright');
  const raw = fs.readFileSync(svgPath, 'utf8').replace(/^<\?xml[^>]*\?>\s*/, '');
  const vb = raw.match(/viewBox="0 0 ([\d.]+) ([\d.]+)"/);
  const w = Math.round(parseFloat(vb[1])), h = Math.round(parseFloat(vb[2]));
  const html = `<!doctype html><meta charset="utf-8"><style>
    @font-face{font-family:AntonQA;src:url(file://${FONT});size-adjust:91.9%}
    html,body{margin:0;background:#888}svg{display:block;width:${w}px;height:${h}px}
  </style>${preview(raw)}`;
  const tmp = path.join(os.tmpdir(), `grid-preview-${process.pid}-${Date.now()}.html`);
  fs.writeFileSync(tmp, html);
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: scale });
  const errors = [];
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', (e) => errors.push(String(e)));
  await page.goto('file://' + tmp);
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(150);
  await page.screenshot({ path: pngPath, clip: clip || { x: 0, y: 0, width: w, height: h } });
  await browser.close();
  fs.unlinkSync(tmp);
  if (errors.length) console.error('console errors:', errors.join('\n'));
  return { w, h };
}

module.exports = { render, preview };

if (require.main === module) {
  const [, , svg, png, scale, cx, cy, cw, ch] = process.argv;
  render(svg, png, parseFloat(scale || '1'), cx ? { x: +cx, y: +cy, width: +cw, height: +ch } : undefined).then((r) => console.log(`rendered ${png} (${r.w}x${r.h})`));
}
