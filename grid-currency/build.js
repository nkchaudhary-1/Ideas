'use strict';
/*
 *   node build.js            build every note and blueprint into dist/
 *   node build.js 1000       build one denomination
 */
const fs = require('fs');
const path = require('path');
const N = require('./lib/note');
const { buildBlueprint } = require('./lib/blueprint');
const { gallery } = require('./lib/gallery');

const NOTES = ['1000', '500', '200', '100', '50'];
const only = process.argv[2];
const dist = path.join(__dirname, 'dist');
fs.mkdirSync(dist, { recursive: true });

function loadNote(id) {
  try { return require(`./notes/n${id}`); } catch (e) { if (e.code === 'MODULE_NOT_FOUND' && e.message.includes(`n${id}`)) return null; throw e; }
}

function buildNote(def) {
  const ctx = new N.Ctx(def);
  def.build(ctx);
  const svg = N.assemble(ctx, {
    id: `GRID_${def.id}_${def.name.toUpperCase()}`,
    title: `GRID ${def.value} — ${def.name}`,
    desc: `${def.value} GRID banknote. ${def.name}: ${def.phrase}. 160 × 75 mm, viewBox 0 0 1600 750, eight named layers, flat colour only.`,
  });
  return { svg, ctx };
}

(async () => {
  const defs = NOTES.map(loadNote).filter(Boolean);
  const meta = NOTES.map((id) => { const d = loadNote(id); return d ? { id: d.id, value: d.value, name: d.name } : { id, value: +id, name: { 1000: 'Creativity', 500: 'Clarity', 200: 'Empathy', 100: 'Craft', 50: 'Impact' }[id] }; });
  for (const def of defs) {
    if (only && only !== def.id) continue;
    const name = `GRID-${def.id}-${def.key}`;
    const { svg, ctx } = buildNote(def);
    const notePath = path.join(dist, `${name}.svg`);
    fs.writeFileSync(notePath, svg);
    console.log(`${name}.svg  ${(svg.length / 1024).toFixed(0)} KB`);
    let coverage = null;
    try { coverage = await require('./tests/coverage').coverage(notePath, def.palette); } catch (e) { console.warn('coverage skipped:', e.message); }
    const bpSvg = buildBlueprint(def, ctx, { frameNo: `0${NOTES.indexOf(def.id) + 1}`, notesMeta: meta, coverage, noteSvgBytes: svg.length });
    fs.writeFileSync(path.join(dist, `${name}-blueprint.svg`), bpSvg);
    console.log(`${name}-blueprint.svg  ${(bpSvg.length / 1024).toFixed(0)} KB`);
  }
  if (!only && defs.length === NOTES.length) { fs.writeFileSync(path.join(__dirname, 'index.html'), gallery(defs)); console.log('index.html'); }
})();
