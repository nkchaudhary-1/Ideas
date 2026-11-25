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
  fonts.forEach((fm) => { if (fm !== 'Impact' && fm !== 'Inter Display') fail(file, `font-family must be exactly "Impact" or "Inter Display", found: ${fm}`); });
  if (/letter-spacing="[^"]*em"/.test(svg)) fail(file, 'letter-spacing in em: use px for Figma and Illustrator');
  if (!svg.includes('text[font-family="Impact"]{') || !svg.includes('text[font-family="Inter Display"]{')) fail(file, 'font stack CSS rules missing');
  if (!svg.includes("font-family:'GRID Impact Fallback'")) fail(file, 'font fallback style missing');
  const refs = [...svg.matchAll(/(?:url\(#|href="#)([^)"]+)/g)].map((m) => m[1]);
  const idset = new Set(ids(svg));
  refs.forEach((r) => { if (!idset.has(r)) fail(file, `dangling reference #${r}`); });
}

/* Declared overlap inks: <metadata id="OVERLAP_INKS">#HEX=role+role …</metadata>. Each must equal the multiply of its roles. */
function overlapInks(svg, def) {
  const m = svg.match(/<metadata id="OVERLAP_INKS">[^<]*<\/metadata>/);
  const out = {};
  if (!m) return out;
  [...m[0].matchAll(/(#[0-9A-Fa-f]{6})=([a-z+]+)/g)].forEach(([, hex, roles]) => { out[hex.toLowerCase()] = roles.split('+'); });
  return out;
}
const mul = (a, b) => '#' + [1, 3, 5].map((i) => Math.round(parseInt(a.slice(i, i + 2), 16) * parseInt(b.slice(i, i + 2), 16) / 255).toString(16).padStart(2, '0')).join('');

function note(file, svg, def) {
  if (!svg.includes('viewBox="0 0 1600 750"')) fail(file, 'viewBox is not 0 0 1600 750');
  const found = [...svg.matchAll(/<g id="(L0[1-8]_[A-Z_]+)">/g)].map((m) => m[1]);
  const want = N.LAYERS.map(([id]) => id);
  if (found.join() !== want.join()) fail(file, `layers ${found.join(',')} ≠ ${want.join(',')}`);
  const pal = new Set(Object.values(def.palette).map((c) => c.toLowerCase()));
  const ov = overlapInks(svg, def);
  hexes(svg).filter((h) => !pal.has(h) && !ov[h]).forEach((h) => fail(file, `colour ${h} is neither in the ${def.id} palette nor a declared overlap ink`));
  Object.entries(ov).forEach(([h, roles]) => {
    const vals = roles.map((r) => def.palette[r]);
    if (vals.some((v) => !v)) return fail(file, `overlap ink ${h}: unknown role in ${roles.join('+')}`);
    const expect = vals.slice(1).reduce((acc, v) => mul(acc, v.toLowerCase()), vals[0].toLowerCase());
    if (expect !== h && roles.length === 2) fail(file, `overlap ink ${h} is not the multiply of ${roles.join(' × ')} (${expect})`);
  });
  if (Object.keys(ov).length > 8) fail(file, `${Object.keys(ov).length} overlap inks: keep to 8 or fewer`);
  const used = hexes(svg);
  Object.entries(def.palette).forEach(([k, h]) => { if (!used.includes(h.toLowerCase())) fail(file, `palette role ${k} (${h}) is never used`); });
  if (/\bopacity="|fill-opacity|stroke-opacity/.test(svg)) fail(file, 'opacity found: flat colour only');
  // typography lives in L07 (and the thread label in L08): no <text> in L01-L06
  const starts = want.map((id) => svg.indexOf(`<g id="${id}">`));
  for (let i = 0; i < 6; i++) if (/<text\b/.test(svg.slice(starts[i], starts[i + 1]))) fail(file, `<text> inside ${want[i]}`);
  const kb = Buffer.byteLength(svg) / 1024;
  if (kb > 800) fail(file, `${kb.toFixed(0)} KB is larger than 800 KB`);
  ['T01_DENOMINATION', 'T03_TITLE', 'T04_PHRASE', 'T05_SERIAL_PRIMARY', 'GRID_LOGO', 'SECURITY_THREAD', 'TACTILE_CODE', 'FRAME_KEYLINE_OUTER'].forEach((k) => {
    if (!svg.includes(`id="${k}"`)) fail(file, `required element ${k} missing`);
  });
  if (!svg.includes('font-family="Impact')) fail(file, 'no Impact text');
  if (!svg.includes('font-family="Inter Display"')) fail(file, 'no Inter Display text');
}

function blueprint(file, svg, def) {
  if (!svg.includes('viewBox="0 0 2400 1600"')) fail(file, 'viewBox is not 0 0 2400 1600');
  if (!svg.includes('id="BP_BACKGROUND"') || !svg.includes('fill="#101824"')) fail(file, 'background #101824 missing');
  for (let i = 1; i <= 9; i++) if (!new RegExp(`id="PANEL_0${i}_`).test(svg)) fail(file, `panel 0${i} missing`);
  N.LAYERS.forEach(([id]) => { if (!svg.includes(`id="${id}"`)) fail(file, `layer ${id} not embedded`); });
  const noteSvg = fs.readFileSync(path.join(dist, file.replace('-blueprint', '')), 'utf8');
  const pal = new Set([...BP_COLOURS, ...Object.values(def.palette).map((c) => c.toLowerCase()), ...Object.keys(overlapInks(noteSvg, def))]);
  hexes(svg).filter((h) => !pal.has(h)).forEach((h) => fail(file, `colour ${h} not in technical or note palette`));
  Object.values(B).forEach((c) => { if (!svg.toLowerCase().includes(c.toLowerCase())) fail(file, `technical colour ${c} unused`); });
  const kb = Buffer.byteLength(svg) / 1024;
  if (kb > 4000) fail(file, `${kb.toFixed(0)} KB is larger than 4 MB`);
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
