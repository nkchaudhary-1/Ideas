'use strict';
/*
 * Structural validation of everything in dist/.
 *   node tests/validate.js
 * Exits 1 on any failure.
 */
const fs = require('fs');
const path = require('path');
const B = require('../lib/bpcolors');
const N = require('../lib/note');

const dist = path.join(__dirname, '..', 'dist');
const NOTES = ['1000', '500', '200', '100', '50'];
const defs = Object.fromEntries(NOTES.map((id) => [id, require(`../notes/n${id}`)]));
const BP_COLOURS = new Set([...Object.values(B), '#0B121C', '#16273A'].map((c) => c.toLowerCase()));
const FAIL = [];
const fail = (file, msg) => FAIL.push(`${file}: ${msg}`);

const hexes = (svg) => [...new Set((svg.match(/#[0-9a-fA-F]{6}\b/g) || []).map((h) => h.toLowerCase()))];
const ids = (svg) => [...svg.matchAll(/\bid="([^"]+)"/g)].map((m) => m[1]);

function common(file, svg) {
  if (/NaN|undefined|Infinity/.test(svg)) fail(file, 'contains NaN / undefined / Infinity');
  if (/<image\b|data:image|<foreignObject/.test(svg)) fail(file, 'raster or foreignObject content');
  if (/<(linear|radial)Gradient|<filter\b|<mask\b|<feGaussian|mix-blend|filter="/.test(svg)) fail(file, 'gradient, filter, mask or blend mode');
  const dup = ids(svg).filter((v, i, a) => a.indexOf(v) !== i);
  if (dup.length) fail(file, `duplicate ids: ${[...new Set(dup)].slice(0, 5).join(', ')}`);
  const fonts = [...new Set([...svg.matchAll(/font-family="([^"]+)"/g)].map((m) => m[1]))];
  fonts.forEach((fm) => { if (!/^(Impact,|'Inter Display',)/.test(fm)) fail(file, `unexpected font-family: ${fm}`); });
  if (!svg.includes("font-family:'GRID Impact Fallback'")) fail(file, 'font fallback style missing');
  const refs = [...svg.matchAll(/(?:url\(#|href="#)([^)"]+)/g)].map((m) => m[1]);
  const idset = new Set(ids(svg));
  refs.forEach((r) => { if (!idset.has(r)) fail(file, `dangling reference #${r}`); });
}

function note(file, svg, def) {
  if (!svg.includes('viewBox="0 0 1600 750"')) fail(file, 'viewBox is not 0 0 1600 750');
  const found = [...svg.matchAll(/<g id="(L0[1-8]_[A-Z_]+)">/g)].map((m) => m[1]);
  const want = N.LAYERS.map(([id]) => id);
  if (found.join() !== want.join()) fail(file, `layers ${found.join(',')} ≠ ${want.join(',')}`);
  const pal = new Set(Object.values(def.palette).map((c) => c.toLowerCase()));
  hexes(svg).filter((h) => !pal.has(h)).forEach((h) => fail(file, `colour ${h} is not in the ${def.id} palette`));
  const used = hexes(svg);
  Object.entries(def.palette).forEach(([k, h]) => { if (!used.includes(h.toLowerCase())) fail(file, `palette role ${k} (${h}) is never used`); });
  if (/\bopacity="|fill-opacity|stroke-opacity/.test(svg)) fail(file, 'opacity found: flat colour only');
  // typography lives in L07 (and the thread label in L08): no <text> in L01-L06
  const starts = want.map((id) => svg.indexOf(`<g id="${id}">`));
  for (let i = 0; i < 6; i++) if (/<text\b/.test(svg.slice(starts[i], starts[i + 1]))) fail(file, `<text> inside ${want[i]}`);
  const kb = Buffer.byteLength(svg) / 1024;
  if (kb > 500) fail(file, `${kb.toFixed(0)} KB is larger than 500 KB`);
  ['T01_DENOMINATION', 'T03_TITLE', 'T04_PHRASE', 'T05_SERIAL_PRIMARY', 'GRID_LOGO', 'SECURITY_THREAD', 'TACTILE_CODE', 'FRAME_KEYLINE_OUTER'].forEach((k) => {
    if (!svg.includes(`id="${k}"`)) fail(file, `required element ${k} missing`);
  });
  if (!svg.includes('font-family="Impact')) fail(file, 'no Impact text');
  if (!svg.includes("font-family=\"'Inter Display'")) fail(file, 'no Inter Display text');
}

function blueprint(file, svg, def) {
  if (!svg.includes('viewBox="0 0 2400 1600"')) fail(file, 'viewBox is not 0 0 2400 1600');
  if (!svg.includes('id="BP_BACKGROUND"') || !svg.includes('fill="#101824"')) fail(file, 'background #101824 missing');
  for (let i = 1; i <= 9; i++) if (!new RegExp(`id="PANEL_0${i}_`).test(svg)) fail(file, `panel 0${i} missing`);
  N.LAYERS.forEach(([id]) => { if (!svg.includes(`id="${id}"`)) fail(file, `layer ${id} not embedded`); });
  const pal = new Set([...BP_COLOURS, ...Object.values(def.palette).map((c) => c.toLowerCase())]);
  hexes(svg).filter((h) => !pal.has(h)).forEach((h) => fail(file, `colour ${h} not in technical or note palette`));
  Object.values(B).forEach((c) => { if (!svg.toLowerCase().includes(c.toLowerCase())) fail(file, `technical colour ${c} unused`); });
  const kb = Buffer.byteLength(svg) / 1024;
  if (kb > 3000) fail(file, `${kb.toFixed(0)} KB is larger than 3 MB`);
}

(async () => {
  const files = fs.readdirSync(dist).filter((f) => f.endsWith('.svg')).sort();
  if (files.length !== 10) fail('dist', `expected 10 svg files, found ${files.length}`);
  const { chromium } = require('playwright');
  const browser = await chromium.launch();
  const page = await browser.newPage();
  for (const file of files) {
    const svg = fs.readFileSync(path.join(dist, file), 'utf8');
    common(file, svg);
    const id = file.split('-')[1];
    const def = defs[id];
    if (!def) { fail(file, 'unknown denomination'); continue; }
    file.includes('blueprint') ? blueprint(file, svg, def) : note(file, svg, def);
    const err = await page.evaluate((s) => {
      const d = new DOMParser().parseFromString(s, 'image/svg+xml');
      const e = d.querySelector('parsererror');
      return e ? e.textContent.slice(0, 200) : null;
    }, svg);
    if (err) fail(file, `XML parse error: ${err}`);
    console.log(`${FAIL.some((f) => f.startsWith(file)) ? '✗' : '✓'} ${file}  ${(Buffer.byteLength(svg) / 1024).toFixed(0)} KB`);
  }
  await browser.close();
  if (FAIL.length) { console.error('\n' + FAIL.join('\n')); process.exit(1); }
  console.log('\nAll checks passed.');
})();
