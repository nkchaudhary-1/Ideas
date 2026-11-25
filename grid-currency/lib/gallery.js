'use strict';
/* index.html: a viewer for the five notes and their blueprints. Generated from the note definitions. */
const { PANELS } = require('./blueprint');

const RULES = {
  1000: 'Every square turns 45° and grows by √2 from one shared corner.',
  500: 'Eight stripes close their gaps in stages: 8, 4, 2, 1.',
  200: 'The grid, inverted in a circle: two pencils of circles that touch at one point.',
  100: 'A carpet divided by three, three times, with circle, square and circle holes.',
  50: 'A dot lattice reshaped by a wave that fades with distance.',
};
const ROLES = ['primary', 'secondary', 'accent', 'pattern', 'paper', 'ink', 'highlight'];

function gallery(defs) {
  const data = defs.map((d) => ({
    id: d.id, value: d.value, name: d.name, phrase: d.phrase, symbol: d.bp.symbolName, rule: RULES[d.value],
    file: `GRID-${d.id}-${d.key}`, palette: ROLES.map((r) => [r, d.palette[r]]),
  }));
  return `<!doctype html>
<html lang="en-GB">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="color-scheme" content="light dark">
<title>GRID: currency for the creative world</title>
<style>
:root{--bg:#F5F3EF;--surface:#FFFFFF;--stage:#E8E4EE;--ink:#17141F;--muted:#5A5566;--line:#DDD8E4;--accent:#6C46C1;--on-accent:#FFFFFF;--focus:#6C46C1}
@media (prefers-color-scheme:dark){:root{--bg:#100E15;--surface:#1A1722;--stage:#0B0A10;--ink:#F3F0F9;--muted:#A8A2B6;--line:#2B2736;--accent:#BCA8FF;--on-accent:#17141F;--focus:#BCA8FF}}
*{box-sizing:border-box}
html{-webkit-text-size-adjust:100%}
body{margin:0;background:var(--bg);color:var(--ink);font:16px/24px "Inter Display",Inter,system-ui,-apple-system,"Segoe UI",sans-serif;padding:env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left)}
.wrap{max-width:1600px;margin:0 auto;padding:24px 32px 48px;display:grid;gap:24px}
header{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:16px}
h1{margin:0;font:400 40px/40px Impact,"GRID Impact Fallback",Haettenschweiler,"Arial Narrow Bold",sans-serif;letter-spacing:.01em}
.sub{margin:4px 0 0;color:var(--muted)}
.bar{display:flex;flex-wrap:wrap;gap:8px;align-items:center}
.seg{display:flex;flex-wrap:wrap;gap:4px;padding:4px;border:1px solid var(--line);border-radius:9999px;background:var(--surface)}
button,.btn{font:600 14px/20px "Inter Display",Inter,system-ui,sans-serif;height:36px;padding:0 16px;border-radius:9999px;border:0;background:transparent;color:var(--ink);cursor:pointer;display:inline-flex;align-items:center;justify-content:center;gap:8px;white-space:nowrap;text-decoration:none}
button[aria-pressed="true"]{background:var(--accent);color:var(--on-accent)}
.btn{border:1px solid var(--line);background:var(--surface)}
button:hover:not([aria-pressed="true"]),.btn:hover{background:var(--stage)}
:focus-visible{outline:2px solid var(--focus);outline-offset:2px}
.chips{display:flex;flex-wrap:wrap;gap:8px;align-items:center}
.chips[hidden]{display:none}
.chips button{border:1px solid var(--line);background:var(--surface)}
.chips button[aria-pressed="true"]{border-color:var(--accent);background:var(--accent)}
.chips .n{opacity:.6;font-variant-numeric:tabular-nums}
main{display:grid;grid-template-columns:minmax(0,1fr) 384px;gap:24px;align-items:start}
main.sheet{grid-template-columns:minmax(0,1fr)}
main.sheet aside{display:none}
.stage{background:var(--stage);border-radius:32px;padding:24px}
.vp{position:relative;width:100%;aspect-ratio:var(--ar,1600/750);overflow:hidden;border-radius:8px;background:var(--bgart,transparent)}
.vp img{position:absolute;display:block;max-width:none;height:auto;left:calc(var(--x,0)*-100%);top:calc(var(--y,0)*-100%);width:calc(var(--k,1)*100%)}
aside{background:var(--surface);border:1px solid var(--line);border-radius:24px;padding:32px;display:grid;gap:0}
aside section{padding:24px 0;border-top:1px solid var(--line)}
aside section:first-child{padding-top:0;border-top:0}
aside section:last-child{padding-bottom:0}
.big{display:flex;align-items:baseline;gap:16px;flex-wrap:wrap}
.big b{font:400 72px/72px Impact,"GRID Impact Fallback",Haettenschweiler,"Arial Narrow Bold",sans-serif}
.big span{font-size:24px;line-height:32px;font-weight:600}
.lead{margin:8px 0 0;color:var(--muted)}
.k{margin:0 0 8px;font-size:12px;line-height:16px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:var(--muted)}
.v{margin:0}
.sw{display:flex;gap:8px;margin:0 0 16px;padding:0;list-style:none}
.sw li{flex:1 1 0;max-width:36px;aspect-ratio:1;border-radius:9999px;border:1px solid var(--line)}
.hex{display:grid;grid-template-columns:auto 1fr auto 1fr;gap:4px 12px;margin:0;font-size:14px;line-height:20px}
.hex dt{color:var(--muted)} .hex dd{margin:0;font-variant-numeric:tabular-nums}
.foot{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:16px;margin-top:16px}
.foot p{margin:0;color:var(--muted)}
.foot div{display:flex;flex-wrap:wrap;gap:8px}
@media (max-width:1100px){main{grid-template-columns:minmax(0,1fr)}}
@media (max-width:640px){.wrap{padding:16px}.stage{padding:12px}main.sheet .stage{overflow-x:auto;-webkit-overflow-scrolling:touch}main.sheet .vp{min-width:760px}h1{font-size:32px;line-height:32px}.hex{grid-template-columns:auto 1fr}.big b{font-size:64px;line-height:64px}}
@media (pointer:coarse){button,.btn{height:44px}}
@media (min-width:1920px){aside{border-radius:32px}}
</style>
</head>
<body>
<div class="wrap">
  <header>
    <div>
      <h1>GRID</h1>
      <p class="sub">Currency for the creative world. Five notes, one system.</p>
    </div>
    <div class="bar">
      <div class="seg" role="group" aria-label="Denomination" id="denoms"></div>
      <div class="seg" role="group" aria-label="View" id="views">
        <button type="button" data-view="note" aria-pressed="true">Banknote</button>
        <button type="button" data-view="blueprint" aria-pressed="false">Blueprint</button>
      </div>
    </div>
  </header>
  <div class="chips" id="chips" role="group" aria-label="Blueprint section" hidden></div>
  <main id="main">
    <div>
      <div class="stage"><div class="vp" id="vp"><img id="art" alt=""></div></div>
      <div class="foot"><p id="cap"></p><div><a class="btn" id="open" target="_blank" rel="noopener">Open SVG</a><a class="btn" id="dl" download>Download SVG</a></div></div>
    </div>
    <aside>
      <section>
        <div class="big"><b id="val"></b><span id="name"></span></div>
        <p class="lead" id="phrase"></p>
      </section>
      <section>
        <p class="k">Symbol</p>
        <p class="v"><strong id="symbol"></strong>. <span id="rule"></span></p>
      </section>
      <section>
        <p class="k">Colour</p>
        <ul class="sw" id="swatches"></ul>
        <dl class="hex" id="hex"></dl>
      </section>
    </aside>
  </main>
</div>
<script>
const NOTES = ${JSON.stringify(data)};
const PANELS = ${JSON.stringify(PANELS)};
const SHEET = { w: 2400, h: 1600 };
let cur = NOTES[0], view = 'note', panel = 0;
const $ = (id) => document.getElementById(id);
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
function frame() {
  const vp = $('vp');
  if (view === 'note') { vp.style.cssText = '--ar:1600/750;--x:0;--y:0;--k:1'; return; }
  const p = PANELS[panel], pad = panel ? 12 : 0;
  const x = p.x - pad, y = p.y - pad, w = p.w + pad * 2, h = p.h + pad * 2;
  vp.style.cssText = '--ar:' + w + '/' + h + ';--x:' + x / w + ';--y:' + y / h + ';--k:' + SHEET.w / w + ';--bgart:#101824';
}
function show() {
  const f = 'dist/' + cur.file + (view === 'blueprint' ? '-blueprint' : '') + '.svg';
  const img = $('art');
  if (img.getAttribute('src') !== f) img.src = f;
  img.alt = view === 'blueprint' ? 'Design blueprint for the ' + cur.value + ' GRID note, ' + cur.name : cur.value + ' GRID banknote, ' + cur.name;
  frame();
  $('main').className = view === 'blueprint' ? 'sheet' : '';
  $('chips').hidden = view !== 'blueprint';
  $('val').textContent = cur.value;
  $('name').textContent = cur.name;
  $('phrase').textContent = cur.phrase + '.';
  $('symbol').textContent = cur.symbol;
  $('rule').textContent = cur.rule;
  $('open').href = f; $('dl').href = f;
  $('swatches').innerHTML = cur.palette.map(([r, h]) => '<li style="background:' + h + '" title="' + cap(r) + ' ' + h + '"></li>').join('');
  $('hex').innerHTML = cur.palette.map(([r, h]) => '<dt>' + cap(r) + '</dt><dd>' + h + '</dd>').join('');
  document.querySelectorAll('#denoms button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.id === cur.id)));
  document.querySelectorAll('#views button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.view === view)));
  document.querySelectorAll('#chips button').forEach((b) => b.setAttribute('aria-pressed', String(+b.dataset.n === panel)));
  $('cap').textContent = cur.value + ' ' + cur.name + ' · ' + (view === 'blueprint' ? 'Blueprint' + (panel ? ', section ' + panel + ': ' + PANELS[panel].label : '') : 'Banknote, 160 × 75 mm');
}
$('denoms').innerHTML = NOTES.map((n) => '<button type="button" data-id="' + n.id + '" aria-pressed="false">' + n.value + '</button>').join('');
$('chips').innerHTML = PANELS.map((p) => '<button type="button" data-n="' + p.n + '" aria-pressed="false">' + (p.n ? '<span class="n">0' + p.n + '</span>' : '') + p.label + '</button>').join('');
$('denoms').addEventListener('click', (e) => { const b = e.target.closest('button'); if (b) { cur = NOTES.find((n) => n.id === b.dataset.id); show(); } });
$('views').addEventListener('click', (e) => { const b = e.target.closest('button'); if (b) { view = b.dataset.view; show(); } });
$('chips').addEventListener('click', (e) => { const b = e.target.closest('button'); if (b) { panel = +b.dataset.n; show(); } });
show();
</script>
</body>
</html>
`;
}
module.exports = { gallery };
