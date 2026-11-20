// In-page measurements used by the UI audits. Injected with page.evaluate(`(${probe})()`).
// The rules checked here are written down in /CLAUDE.md ("Design rules").
module.exports = function probe() {
  const R = { radius: [], grid: [], clip: [], small: [], names: [] };
  const px = (v) => { const n = parseFloat(v); return Number.isNaN(n) ? 0 : n; };
  const vis = (e) => { const r = e.getBoundingClientRect(); const cs = getComputedStyle(e); return r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && cs.display !== 'none' && parseFloat(cs.opacity) > 0.05; };
  const desc = (e) => {
    const tid = e.getAttribute('data-testid');
    const txt = (e.innerText || e.getAttribute('aria-label') || e.getAttribute('title') || '').trim().replace(/\s+/g, ' ').slice(0, 26);
    return `${e.tagName.toLowerCase()}${tid ? '[' + tid + ']' : ''}${txt ? ` "${txt}"` : ''}`;
  };
  const skip = (e) => e instanceof HTMLCanvasElement || (e.closest('svg') && e.tagName.toLowerCase() !== 'svg') || e.closest('[data-audit-skip]');
  const all = [...document.querySelectorAll('body *')].filter((e) => !skip(e) && vis(e));
  const rad = (e, c = 'TopLeft') => px(getComputedStyle(e)['border' + c + 'Radius']);
  const isCapsule = (e) => { const r = e.getBoundingClientRect(); return Math.max(rad(e), rad(e, 'BottomRight')) >= Math.min(r.width, r.height) / 2 - 0.5; };
  const hasRadius = (e) => rad(e) > 0 || rad(e, 'BottomRight') > 0;
  const roundedAncestor = (e) => { let p = e.parentElement; while (p && p !== document.body) { if (hasRadius(p)) return p; p = p.parentElement; } return null; };
  const isRoot = (e) => e.matches('.card, [data-surface]') || /(^|\s)rounded-(card|big)(\s|$)/.test(e.getAttribute('class') || '');
  const insetOf = (c, p) => { const a = c.getBoundingClientRect(), b = p.getBoundingClientRect(); return [a.left - b.left, a.top - b.top, b.right - a.right, b.bottom - a.bottom]; };
  const clipsKids = (p) => { const o = getComputedStyle(p); return o.overflow !== 'visible' || o.overflowX !== 'visible'; };
  const TINY = 24;
  const pend = new Map();
  const parentIds = new WeakMap(); let pid = 0;
  const sibKey = (e) => { const p = e.parentElement; if (!parentIds.has(p)) parentIds.set(p, ++pid); return parentIds.get(p) + '|' + (e.getAttribute('class') || ''); };

  for (const e of all) {
    const r = e.getBoundingClientRect();
    const m = Math.min(r.width, r.height);
    const cs = getComputedStyle(e);
    const rt = rad(e), rtr = rad(e, 'TopRight'), rb = rad(e, 'BottomRight'), rbl = rad(e, 'BottomLeft');
    const capsule = hasRadius(e) && isCapsule(e);
    // ───── corner radius
    if (hasRadius(e) && !capsule && !e.matches('[data-radius-free]')) {
      const base = { el: desc(e), r: rt, w: Math.round(r.width), h: Math.round(r.height), cls: (e.getAttribute('class') || '').slice(0, 150) };
      if (Math.max(rt, rb) > 32) R.radius.push({ ...base, kind: 'over-32' });
      else if (!(rt === rtr && rt === rb && rt === rbl) && !e.matches('[data-radius-mixed]') && !(rt === 0 && rb === 0 || rtr === 0 && rbl === 0)) R.radius.push({ ...base, kind: 'mixed-corners', r: [rt, rtr, rb, rbl].join('/') });
      else if (m < TINY) { if (![2, 3, 4, 5, 6, 8].includes(Math.round(rt))) R.radius.push({ ...base, kind: 'glyph' }); }
      else if (isRoot(e)) { if (![24, 32].includes(Math.round(rt))) R.radius.push({ ...base, kind: 'surface-radius' }); }
      else {
        // walk up to the nearest card / dialog / stage, adding the gap at every level
        let cur = e, N = 0, bad = false, chain = [], root = null;
        for (let i = 0; i < 12; i++) {
          const par = roundedAncestor(cur);
          if (!par) break;
          let ins = insetOf(cur, par);
          // inside a scrolling list only the side the list does not scroll along says anything about nesting
          let vs = false, hs = false;
          for (let q = cur.parentElement; q; q = q.parentElement) { const o = getComputedStyle(q); if (/(auto|scroll)/.test(o.overflowY) && q.scrollHeight > q.clientHeight + 4) vs = true; if (/(auto|scroll)/.test(o.overflowX) && q.scrollWidth > q.clientWidth + 4) hs = true; if (q === par) break; }
          if (vs && !hs) ins = [ins[0], ins[2]]; else if (hs && !vs) ins = [ins[1], ins[3]];
          if (ins.some((v) => v < -1.5)) { bad = true; break; }
          N += Math.max(0, Math.min(...ins));
          chain.push(desc(par) + ' r' + rad(par));
          cur = par;
          if (isRoot(par)) { root = par; break; }
        }
        if (bad) continue; // partly scrolled out of its parent: not a visible nesting
        if (!root) {
          if (![24, 32].includes(Math.round(rt)) && !e.matches('[data-radius-free]')) R.radius.push({ ...base, kind: 'top-level', chain: chain.join(' > ') });
        } else {
          const family = Math.round(rad(root)) === 32 && /rounded-big|data-surface/.test(root.getAttribute('class') + ' ' + root.outerHTML.slice(0, 120)) ? 'bin' : 'in';
          const rootR = rad(root);
          const ideal = Math.max(8, rootR - N);
          const parentCapsule = isCapsule(roundedAncestor(e));
          if (parentCapsule) {
            if (!capsule) R.radius.push({ ...base, kind: 'should-be-capsule', ideal: 'full', chain: chain.join(' > ') });
          } else {
            // siblings of one kind (a grid of thumbnails) share a radius: the one nearest the edge decides it
            if (!pend.has(sibKey(e))) pend.set(sibKey(e), []);
            pend.get(sibKey(e)).push({ e, rt, base, N, family, rootR, chain: chain.join(' > ') });
          }
        }
      }
    }
    // ───── square boxes: a visible fill or border with no rounding at all
    if (!hasRadius(e) && m >= 12 && !e.matches('input[type=range],img,video,svg,hr,[data-radius-free],[data-radius-mixed]')) {
      const bg = cs.backgroundColor; const a = /rgba\((.+)\)/.test(bg) ? parseFloat(bg.split(',')[3]) : (bg === 'rgba(0, 0, 0, 0)' || bg === 'transparent' ? 0 : 1);
      const hasBorder = ['Top', 'Right', 'Bottom', 'Left'].every((k) => px(cs['border' + k + 'Width']) > 0 && cs['border' + k + 'Style'] !== 'none');
      const par = e.parentElement;
      let clipped = false; for (let p = par; p && p !== document.body; p = p.parentElement) { if (hasRadius(p) && clipsKids(p)) { clipped = true; break; } }
      const fullBleed = par && (() => { const a2 = e.getBoundingClientRect(), b = par.getBoundingClientRect(); return Math.abs(a2.width - b.width) < 1.5 && Math.abs(a2.height - b.height) < 1.5; })();
      if ((a > 0.04 || hasBorder) && !clipped && !fullBleed && e.tagName !== 'HTML' && e.tagName !== 'BODY' && (r.width < innerWidth * 0.98 || r.height < innerHeight * 0.98)) R.radius.push({ kind: 'square-box', el: desc(e), r: 0, w: Math.round(r.width), h: Math.round(r.height), cls: (e.getAttribute('class') || '').slice(0, 150) });
    }
    // ───── spacing on the 4px grid (0, 1 and 2px hairlines are fine)
    const vals = ['paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft', 'rowGap', 'columnGap'].map((k) => px(cs[k]));
    const off = vals.filter((v) => v > 2.5 && Math.abs(v / 4 - Math.round(v / 4)) > 0.01);
    if (off.length && e.children.length) R.grid.push({ el: desc(e), values: [...new Set(off)].join(','), cls: (e.getAttribute('class') || '').slice(0, 150) });
    // ───── text that is cut off
    if (!e.classList.contains('sr-only') && !e.closest('.sr-only') && e.scrollWidth > e.clientWidth + 2 && ['hidden', 'clip'].includes(cs.overflowX) && cs.textOverflow !== 'ellipsis' && e.clientWidth > 0 && !e.matches('input,textarea,[data-allow-clip]') && !e.querySelector('canvas,img,video'))
      R.clip.push({ kind: 'cut-off', el: desc(e), scroll: e.scrollWidth, client: e.clientWidth, cls: (e.getAttribute('class') || '').slice(0, 150) });
    if (cs.textOverflow === 'ellipsis' && e.scrollWidth > e.clientWidth + 1 && !e.getAttribute('title') && !e.closest('[title]'))
      R.clip.push({ kind: 'truncated-no-title', el: desc(e), scroll: e.scrollWidth, client: e.clientWidth, cls: (e.getAttribute('class') || '').slice(0, 150) });
    // ───── hit target + accessible name
    if (e.matches('button,[role=button],a[href],input:not([type=hidden]),select,textarea,[role=checkbox],[role=switch]')) {
      const hit = e.closest('label') ? e.closest('label').getBoundingClientRect() : r;
      // the in-canvas text editor is sized to the artwork it sits on, so it is exempt
      if ((hit.height < 24 || hit.width < 24) && !e.matches('input[type=range],input[type=file],textarea[aria-label="Edit text"]')) R.small.push({ el: desc(e), w: Math.round(hit.width), h: Math.round(hit.height), cls: (e.getAttribute('class') || '').slice(0, 150) });
      const name = (e.getAttribute('aria-label') || e.getAttribute('title') || e.innerText || e.getAttribute('placeholder') || '').trim();
      const labelled = (e.id && document.querySelector(`label[for="${e.id}"]`)) || e.closest('label');
      if (!name && !labelled && !e.getAttribute('aria-labelledby')) R.names.push({ el: desc(e), cls: (e.getAttribute('class') || '').slice(0, 150) });
    }
  }
  for (const group of pend.values()) {
    const minN = Math.min(...group.map((g) => g.N));
    for (const g of group) {
      const ideal = Math.max(8, g.rootR - minN);
      if (Math.abs(g.rt - ideal) > 1.5) R.radius.push({ ...g.base, kind: g.rt > ideal ? 'too-round' : 'too-sharp', ideal: Math.round(ideal), N: Math.round(minN), family: g.family, fix: ideal <= 8 && (g.family === 'bin' ? g.rootR - minN <= 8 : minN >= 24) ? 'rounded' : `rounded-${g.family}-${Math.round(minN)}`, chain: g.chain });
    }
  }
  // ───── near-miss alignment: inside each card, left edges of text and controls that differ by 1–7px
  R.align = [];
  for (const card of document.querySelectorAll('.card, [data-surface]')) {
    const cr = card.getBoundingClientRect();
    if (cr.width < 200 || !vis(card)) continue;
    const edges = [];
    const walker = document.createTreeWalker(card, NodeFilter.SHOW_TEXT);
    const seen = new Set();
    for (let n = walker.nextNode(); n; n = walker.nextNode()) {
      if (!n.textContent.trim()) continue;
      const el = n.parentElement;
      if (seen.has(el)) continue; seen.add(el);
      if (!el || !vis(el) || el.closest('canvas,svg,[data-audit-skip],option,select,textarea,input')) continue;
      const rg = document.createRange(); rg.selectNodeContents(n); const rr = rg.getBoundingClientRect();
      if (rr.width < 2 || rr.top < cr.top || rr.bottom > cr.bottom) continue;
      // text centred or pushed right is not a left edge
      const cs = getComputedStyle(el); if (/(center|right)/.test(cs.textAlign) || cs.justifyContent === 'center' || cs.justifyContent === 'flex-end' || el.closest('[class*="justify-center"],[class*="text-center"],[class*="ml-auto"],[class*="justify-end"],[class*="justify-between"] > :last-child')) continue;
      edges.push({ x: Math.round((rr.left - cr.left) * 2) / 2, t: n.textContent.trim().slice(0, 22) });
    }
    for (const el of card.querySelectorAll('button,input:not([type=range]),select,section,textarea')) {
      if (!vis(el)) continue; const rr = el.getBoundingClientRect(); if (rr.top < cr.top || rr.bottom > cr.bottom || rr.width < 40) continue;
      if (el.closest('[class*="justify-center"]') && rr.width < 80) continue;
      if (el.closest('[data-testid^="sheet-"]') && el.matches('[data-testid^="sheet-"]')) continue; // a sheet's own grow / close buttons float over its header
      const par = el.parentElement; if (par && /(^|\s)bg-field(\s|$)/.test(par.getAttribute('class') || '') && /(^|\s)p-1(\s|$)/.test(par.getAttribute('class') || '')) continue; // a segment inside its pill
      if (el.closest('[class*="flex-wrap"], [class*="grid-cols"], [class*="overflow-x-auto"]')) continue; // items flowing in a row or grid sit wherever the flow puts them
      edges.push({ x: Math.round((rr.left - cr.left) * 2) / 2, t: `<${el.tagName.toLowerCase()}> ${(el.innerText || el.getAttribute('aria-label') || '').trim().slice(0, 18)}` });
    }
    const xs = [...new Set(edges.map((e) => e.x))].sort((p, q) => p - q);
    for (let i = 0; i < xs.length - 1; i++) {
      const gap = xs[i + 1] - xs[i];
      if (gap > 0.9 && gap < 7.5) {
        const A = edges.filter((e) => e.x === xs[i]), B = edges.filter((e) => e.x === xs[i + 1]);
        R.align.push({ el: desc(card), a: xs[i], b: xs[i + 1], aEx: A.slice(0, 2).map((e) => e.t).join(' | '), bEx: B.slice(0, 2).map((e) => e.t).join(' | '), nA: A.length, nB: B.length });
      }
    }
  }
  // ───── control heights
  R.heights = [];
  for (const e of all.filter((x) => x.matches('button:not([role=checkbox]):not([role=switch]),input:not([type=range]):not([type=file]):not([type=hidden]),select'))) {
    const r = e.getBoundingClientRect(); const lab = e.closest('label');
    const h = Math.round((lab && e.tagName === 'INPUT' ? lab.getBoundingClientRect() : r).height);
    if (h % 4 !== 0 && !/aspect-/.test(e.getAttribute('class') || '') && !e.querySelector('canvas')) R.heights.push({ el: desc(e), h, w: Math.round(r.width), cls: (e.getAttribute('class') || '').slice(0, 150) });
  }
  return R;
};
