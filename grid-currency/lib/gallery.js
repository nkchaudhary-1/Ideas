'use strict';
/* index.html: a viewer for the five notes and their blueprints. Generated from the note definitions. */

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
h1{margin:0;font:400 36px/40px Impact,Haettenschweiler,"Arial Narrow Bold",sans-serif;letter-spacing:.01em}
.sub{margin:0;color:var(--muted)}
.bar{display:flex;flex-wrap:wrap;gap:8px;align-items:center}
.seg{display:flex;flex-wrap:wrap;gap:4px;padding:4px;border:1px solid var(--line);border-radius:9999px;background:var(--surface)}
button,.btn{font:600 14px/20px "Inter Display",Inter,system-ui,sans-serif;height:36px;padding:0 16px;border-radius:9999px;border:0;background:transparent;color:var(--ink);cursor:pointer;display:inline-flex;align-items:center;justify-content:center;gap:8px;white-space:nowrap;text-decoration:none}
button[aria-pressed="true"]{background:var(--accent);color:var(--on-accent)}
.btn{border:1px solid var(--line);background:var(--surface)}
button:hover:not([aria-pressed="true"]),.btn:hover{background:var(--stage)}
:focus-visible{outline:2px solid var(--focus);outline-offset:2px}
main{display:grid;grid-template-columns:minmax(0,1fr) 384px;gap:24px;align-items:start}
.stage{background:var(--stage);border-radius:32px;padding:24px;display:grid;place-items:center;min-height:240px}
.stage img{display:block;width:100%;height:auto}
aside{background:var(--surface);border:1px solid var(--line);border-radius:24px;padding:32px;display:grid;gap:20px}
aside h2{margin:0;font:400 48px/48px Impact,Haettenschweiler,"Arial Narrow Bold",sans-serif}
.k{margin:0;font-size:12px;line-height:16px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:var(--muted)}
.v{margin:4px 0 0}
.sw{display:flex;flex-wrap:wrap;gap:8px;margin:8px 0 0;padding:0;list-style:none}
.sw li{width:36px;height:36px;border-radius:9999px;border:1px solid var(--line)}
.hex{display:grid;grid-template-columns:auto 1fr;gap:4px 16px;margin:8px 0 0;font-size:14px;line-height:20px}
.hex dt{color:var(--muted)} .hex dd{margin:0;font-variant-numeric:tabular-nums}
.actions{display:flex;flex-wrap:wrap;gap:8px}
@media (max-width:1100px){main{grid-template-columns:minmax(0,1fr)}}
@media (max-width:640px){.wrap{padding:16px}.stage{padding:12px}h1{font-size:32px}}
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
  <main>
    <div class="stage"><img id="art" alt=""></div>
    <aside>
      <div><p class="k" id="kv">Value</p><h2 id="title"></h2></div>
      <div><p class="k">Principle</p><p class="v" id="phrase"></p></div>
      <div><p class="k">Symbol</p><p class="v"><strong id="symbol"></strong>. <span id="rule"></span></p></div>
      <div><p class="k">Colour</p><ul class="sw" id="swatches"></ul><dl class="hex" id="hex"></dl></div>
      <div class="actions"><a class="btn" id="open" target="_blank" rel="noopener">Open SVG</a><a class="btn" id="dl" download>Download SVG</a></div>
    </aside>
  </main>
</div>
<script>
const NOTES = ${JSON.stringify(data)};
let cur = NOTES[0], view = 'note';
const $ = (id) => document.getElementById(id);
function show() {
  const f = 'dist/' + cur.file + (view === 'blueprint' ? '-blueprint' : '') + '.svg';
  $('art').src = f;
  $('art').alt = view === 'blueprint' ? 'Design blueprint for the ' + cur.value + ' GRID note, ' + cur.name : cur.value + ' GRID banknote, ' + cur.name;
  $('title').textContent = cur.value + ' ' + cur.name;
  $('phrase').textContent = cur.phrase + '.';
  $('symbol').textContent = cur.symbol;
  $('rule').textContent = cur.rule;
  $('open').href = f; $('dl').href = f;
  $('swatches').innerHTML = cur.palette.map(([r, h]) => '<li style="background:' + h + '" title="' + r + ' ' + h + '"></li>').join('');
  $('hex').innerHTML = cur.palette.map(([r, h]) => '<dt>' + r.charAt(0).toUpperCase() + r.slice(1) + '</dt><dd>' + h + '</dd>').join('');
  document.querySelectorAll('#denoms button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.id === cur.id)));
  document.querySelectorAll('#views button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.view === view)));
}
$('denoms').innerHTML = NOTES.map((n) => '<button type="button" data-id="' + n.id + '" aria-pressed="false">' + n.value + '</button>').join('');
$('denoms').addEventListener('click', (e) => { const b = e.target.closest('button'); if (b) { cur = NOTES.find((n) => n.id === b.dataset.id); show(); } });
$('views').addEventListener('click', (e) => { const b = e.target.closest('button'); if (b) { view = b.dataset.view; show(); } });
show();
</script>
</body>
</html>
`;
}
module.exports = { gallery };
