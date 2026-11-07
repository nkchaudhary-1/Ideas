/* ILL: the illustration library. Every piece is an SVG string, drawn in code and themed through CSS variables,
   so one set of art serves all three templates. Pieces that animate expose classes for the choreography
   (.lp lotus petal, .flame, .win lit window, .rot-a/.rot-b spinning rings).
     ILL.skyline(opts)    layered palace skyline: onion domes, chhatris, minarets, scalloped parapets, lit windows
     ILL.moon(size)       moon with halo
     ILL.lotus()          side-view lotus, four rings of petals that can open
     ILL.lilypad(r)       lotus leaf
     ILL.diya()           clay lamp with flame and glow
     ILL.kalash()         pot with mango leaves and coconut
     ILL.plume()          fan of peacock feathers
     ILL.sun()            sun / rangoli mandala with rays
     ILL.mandalaSVG()     small self-drawing emblem
     ILL.flourish(w)      divider with a lotus bud
     ILL.jali(color,bg)   data-URI lattice tile for door panels
     ILL.archPath()       cusped arch path
     ILL.toran(canvas)    marigold garland on canvas                                                          */
const ILL = (() => {
  const TAU = Math.PI * 2, f = n => +n.toFixed(1);
  let uidN = 0; const uid = p => `${p}${++uidN}`;
  const rng = seed => () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };

  /* ---------- skyline ---------- */
  function skyline({ w = 1600, h = 300, seed = 1, fill = "var(--sk)", lit = "var(--win)", scale = 1, windows = true, gap = 1 } = {}) {
    const r = rng(seed), y0 = h, shapes = [], wins = [];
    const rect = (x, y, rw, rh) => `<rect x="${f(x)}" y="${f(y)}" width="${f(rw)}" height="${f(rh)}"/>`;
    const dome = (cx, y, rad, hgt) => `<path d="M${f(cx - rad * .8)},${f(y)}C${f(cx - rad * 1.22)},${f(y - hgt * .3)} ${f(cx - rad * .5)},${f(y - hgt * .64)} ${f(cx)},${f(y - hgt)}C${f(cx + rad * .5)},${f(y - hgt * .64)} ${f(cx + rad * 1.22)},${f(y - hgt * .3)} ${f(cx + rad * .8)},${f(y)}Z"/>`;
    const finial = (cx, y, len) => `${rect(cx - .8, y - len, 1.6, len)}<circle cx="${f(cx)}" cy="${f(y - len)}" r="2.2"/>`;
    const parapet = (x, y, bw) => { let d = ""; const n = Math.max(2, Math.floor(bw / 10)), s = bw / n; for (let i = 0; i < n; i++) d += `M${f(x + i * s)},${f(y)}a${f(s / 2)},${f(s / 2)} 0 0 1 ${f(s)},0Z`; return `<path d="${d}"/>`; };
    const chhatri = (cx, y, s) => { // pavilion: slab, four pillars, roof slab, dome, finial
      const out = [rect(cx - s * .55, y - 3, s * 1.1, 3)]; const ph = s * .62;
      for (const k of [-.42, -.14, .14, .42]) out.push(rect(cx + k * s - 1.1, y - 3 - ph, 2.2, ph));
      out.push(rect(cx - s * .6, y - 6 - ph, s * 1.2, 3), dome(cx, y - 6 - ph, s * .46, s * .72), finial(cx, y - 6 - ph - s * .72, s * .3)); return out.join("");
    };
    const window_ = (x, y, ww, hh) => `<path d="M${f(x)},${f(y + hh)}V${f(y + ww * .6)}Q${f(x)},${f(y + ww * .1)} ${f(x + ww / 2)},${f(y)}Q${f(x + ww)},${f(y + ww * .1)} ${f(x + ww)},${f(y + ww * .6)}V${f(y + hh)}Z" style="--d:${r().toFixed(2)}"/>`;
    let x = -30;
    while (x < w + 40) {
      const t = r();
      if (t < .34) {                                   // wall block with scalloped parapet, maybe a chhatri
        const bw = 70 + r() * 120, bh = (36 + r() * 60) * scale;
        shapes.push(rect(x, y0 - bh, bw, bh), parapet(x, y0 - bh, bw));
        if (r() < .62) shapes.push(chhatri(x + bw * (.2 + r() * .6), y0 - bh, (22 + r() * 12) * scale));
        if (windows && bh > 50) { const n = Math.floor(bw / 26); for (let i = 0; i < n; i++) if (r() < .7) wins.push(window_(x + 10 + i * 26, y0 - bh + 14, 8, 15)); }
        x += bw + (r() < .5 ? 0 : 6 + r() * 22) * gap;
      } else if (t < .52) {                            // minaret
        const tw = 16 + r() * 10, th = (130 + r() * 90) * scale, cx = x + tw / 2;
        shapes.push(rect(x, y0 - th, tw, th), rect(x - 3, y0 - th * .62, tw + 6, 3.5), rect(x - 3, y0 - th * .3, tw + 6, 3.5), rect(x - 2, y0 - th - 4, tw + 4, 4), dome(cx, y0 - th - 4, tw * .75, tw * 1.15), finial(cx, y0 - th - 4 - tw * 1.15, tw * .9));
        if (windows) wins.push(window_(cx - 2.5, y0 - th * .8, 5, 12), window_(cx - 2.5, y0 - th * .45, 5, 12));
        x += tw + 6 + r() * 30 * gap;
      } else if (t < .66) {                            // great dome on a drum
        const dw = 120 + r() * 70, cx = x + dw / 2, bh = (44 + r() * 26) * scale, drum = dw * .34;
        shapes.push(rect(x, y0 - bh, dw, bh), parapet(x, y0 - bh, dw), rect(cx - drum / 2, y0 - bh - drum * .6, drum, drum * .6), dome(cx, y0 - bh - drum * .6, dw * .3, dw * .46), finial(cx, y0 - bh - drum * .6 - dw * .46, dw * .12));
        for (const k of [-.36, .36]) shapes.push(chhatri(cx + k * dw, y0 - bh, 22 * scale));
        if (windows) { const n = Math.floor(dw / 24); for (let i = 0; i < n; i++) wins.push(window_(x + 12 + i * 24, y0 - bh + 14, 8, 16)); wins.push(window_(cx - 3.5, y0 - bh - drum * .45, 7, 13)); }
        x += dw + 8 + r() * 24 * gap;
      } else if (t < .8) {                             // low arcade wall
        const bw = 60 + r() * 90, bh = (22 + r() * 16) * scale;
        shapes.push(rect(x, y0 - bh, bw, bh), parapet(x, y0 - bh, bw)); x += bw + r() * 14;
      } else x += 14 + r() * 38 * gap;                 // open gap
    }
    return `<svg class="ill skyline" viewBox="0 0 ${w} ${h}" preserveAspectRatio="xMidYMax slice" aria-hidden="true"><g fill="${fill}">${shapes.join("")}</g>${windows ? `<g class="wins" fill="${lit}">${wins.join("")}</g>` : ""}</svg>`;
  }

  /* ---------- moon ---------- */
  function moon(size = 220) {
    const g = uid("mn");
    return `<svg class="ill moon" viewBox="-110 -110 220 220" width="${size}" height="${size}" aria-hidden="true"><defs>
      <radialGradient id="${g}h"><stop offset=".5" stop-color="var(--moon-glow)" stop-opacity=".5"/><stop offset="1" stop-color="var(--moon-glow)" stop-opacity="0"/></radialGradient>
      <radialGradient id="${g}b" cx=".38" cy=".34"><stop offset="0" stop-color="var(--moon-a)"/><stop offset="1" stop-color="var(--moon-b)"/></radialGradient></defs>
      <circle r="108" fill="url(#${g}h)"/><circle r="60" fill="url(#${g}b)"/>
      <g fill="var(--moon-b)" opacity=".22"><circle cx="-18" cy="-14" r="11"/><circle cx="16" cy="12" r="15"/><circle cx="-4" cy="30" r="7"/><circle cx="26" cy="-26" r="6"/></g>
      <circle r="76" fill="none" stroke="var(--moon-glow)" stroke-opacity=".28" stroke-width=".8"/><circle r="92" fill="none" stroke="var(--moon-glow)" stroke-opacity=".14" stroke-width=".8"/></svg>`;
  }

  /* ---------- lotus (side view, petals can open) ---------- */
  function lotus() {
    const g = uid("lt");
    const petal = (len, wid) => `M0,0C${f(wid * .95)},${f(-len * .22)} ${f(wid * .95)},${f(-len * .72)} 0,${f(-len)}C${f(-wid * .95)},${f(-len * .72)} ${f(-wid * .95)},${f(-len * .22)} 0,0Z`;
    const rings = [
      { c: 1, len: 74, wid: 19, a: [-76, -52, -28, 28, 52, 76] },
      { c: 2, len: 88, wid: 21, a: [-62, -40, -18, 18, 40, 62] },
      { c: 3, len: 98, wid: 22, a: [-34, -12, 12, 34] },
      { c: 4, len: 104, wid: 23, a: [-18, 0, 18] }
    ];
    let body = ""; for (const R of rings) for (const a of R.a) body += `<g class="lp r${R.c}" data-a="${a}" transform="rotate(${a})"><path d="${petal(R.len, R.wid)}" fill="url(#${g}${R.c})"/><path d="M0,${f(-R.len * .1)}V${f(-R.len * .78)}" stroke="var(--lo-line)" stroke-opacity=".45" stroke-width=".9" fill="none"/></g>`;
    const defs = [1, 2, 3, 4].map(i => `<linearGradient id="${g}${i}" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="var(--p${i}a)"/><stop offset="1" stop-color="var(--p${i}b)"/></linearGradient>`).join("");
    return `<svg class="ill lotus" viewBox="-115 -125 230 135" aria-hidden="true"><defs>${defs}</defs>${body}</svg>`;
  }
  function lilypad(r = 46) {
    const t = .14;
    return `<svg class="ill pad" viewBox="${-r - 2} ${-r * .34} ${r * 2 + 4} ${r * .68}" aria-hidden="true"><path d="M0,0L${f(r * Math.cos(t))},${f(-r * .3 * Math.sin(t))}A${r},${f(r * .3)} 0 1 0 ${f(r * Math.cos(t))},${f(r * .3 * Math.sin(t))}Z" fill="var(--pad)"/><path d="M0,0L${-r * .7},${-r * .08}M0,0L${-r * .55},${r * .16}M0,0L${r * .2},${-r * .2}M0,0L${r * .25},${r * .2}" stroke="var(--pad-vein)" stroke-width=".8" fill="none" opacity=".6"/></svg>`;
  }

  /* ---------- diya ---------- */
  function diya() {
    const g = uid("dy");
    return `<svg class="ill diya" viewBox="-50 -70 100 118" aria-hidden="true" style="overflow:visible"><defs>
      <radialGradient id="${g}g"><stop offset="0" stop-color="var(--flame-glow)" stop-opacity=".85"/><stop offset="1" stop-color="var(--flame-glow)" stop-opacity="0"/></radialGradient>
      <linearGradient id="${g}f" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#ff7a1a"/><stop offset=".55" stop-color="#ffb13a"/><stop offset="1" stop-color="#fff0b0"/></linearGradient>
      <linearGradient id="${g}b" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="var(--dy1)"/><stop offset="1" stop-color="var(--dy2)"/></linearGradient></defs>
      <circle class="glow" cy="-22" r="64" fill="url(#${g}g)"/>
      <g class="flame" style="transform-origin:0 -2px"><g class="fl" style="transform-box:fill-box;transform-origin:50% 100%"><path d="M0,-2C-10,-14 -8,-30 0,-52C8,-30 10,-14 0,-2Z" fill="url(#${g}f)"/><path d="M0,-4C-4,-12 -3,-22 0,-33C3,-22 4,-12 0,-4Z" fill="#fff7d6" opacity=".9"/></g></g>
      <path d="M-4,4 Q0,-4 4,4Z" fill="var(--dy2)"/>
      <path d="M-42,0C-42,26 -22,40 0,40C22,40 42,26 42,0Z" fill="url(#${g}b)"/>
      <path d="M-46,-1Q0,10 46,-1Q44,4 0,8Q-44,4 -46,-1Z" fill="var(--dy-rim)"/>
      <g fill="var(--dy-rim)" opacity=".9"><circle cx="-22" cy="20" r="1.8"/><circle cx="-11" cy="26" r="1.8"/><circle cx="0" cy="28" r="1.8"/><circle cx="11" cy="26" r="1.8"/><circle cx="22" cy="20" r="1.8"/></g></svg>`;
  }

  /* ---------- kalash ---------- */
  function kalash() {
    const leaf = a => `<path transform="rotate(${a} 60 80)" d="M60,80C48,60 50,30 60,6C70,30 72,60 60,80Z" fill="var(--k3)"/><path transform="rotate(${a} 60 80)" d="M60,78V14" stroke="var(--k3b)" stroke-width="1.2" fill="none" opacity=".7"/>`;
    return `<svg class="ill kalash" viewBox="0 0 120 200" aria-hidden="true">
      ${[-64, -38, -14, 14, 38, 64].map(leaf).join("")}${leaf(0)}
      <circle cx="60" cy="52" r="21" fill="var(--k4)"/><path d="M44,38Q60,30 76,38M42,48Q60,40 78,48" stroke="var(--k4b)" stroke-width="1.4" fill="none" opacity=".7"/><path d="M52,34Q60,22 68,34" stroke="var(--k4b)" stroke-width="2" fill="none"/>
      <path d="M44,76h32a5,5 0 0 1 0,10h-32a5,5 0 0 1 0-10Z" fill="var(--k2)"/>
      <path d="M46,86H74L82,100H38Z" fill="var(--k1)"/>
      <path d="M38,100C12,110 8,160 28,184C42,198 78,198 92,184C112,160 108,110 82,100Z" fill="var(--k1)"/>
      <path d="M17,126C40,138 80,138 103,126" stroke="var(--k2)" stroke-width="5" fill="none"/>
      <path d="M13,152C38,166 82,166 107,152" stroke="var(--k2)" stroke-width="5" fill="none"/>
      <g fill="var(--k2)"><circle cx="38" cy="142" r="2.6"/><circle cx="60" cy="146" r="2.6"/><circle cx="82" cy="142" r="2.6"/><circle cx="48" cy="170" r="2.6"/><circle cx="72" cy="170" r="2.6"/></g>
      <path d="M26,112C20,122 18,140 20,150" stroke="#fff" stroke-opacity=".18" stroke-width="4" fill="none" stroke-linecap="round"/></svg>`;
  }

  /* ---------- peacock plume ---------- */
  function plume() {
    const cx = 130, cy = 232, feathers = [];
    const angles = [-68, -46, -23, 23, 46, 68, 0], lens = [138, 168, 188, 188, 168, 138, 206];
    angles.forEach((deg, k) => {
      const a = deg * Math.PI / 180, L = lens[k], bend = deg * -.18;
      const P0 = [cx, cy], P2 = [cx + Math.sin(a) * L, cy - Math.cos(a) * L], P1 = [cx + Math.sin(a) * L * .45 + bend, cy - Math.cos(a) * L * .55];
      const B = t => [(1 - t) ** 2 * P0[0] + 2 * (1 - t) * t * P1[0] + t * t * P2[0], (1 - t) ** 2 * P0[1] + 2 * (1 - t) * t * P1[1] + t * t * P2[1]];
      const T = t => { const dx = 2 * (1 - t) * (P1[0] - P0[0]) + 2 * t * (P2[0] - P1[0]), dy = 2 * (1 - t) * (P1[1] - P0[1]) + 2 * t * (P2[1] - P1[1]); return Math.atan2(dy, dx); };
      let barbs = "";
      for (let t = .2; t < .84; t += .016) { const [bx, by] = B(t), ph = T(t), l = 21 * (1 - (t - .2) * .75) + 5; for (const s of [-1, 1]) { const ang = ph + s * 0.95; barbs += `M${f(bx)},${f(by)}L${f(bx + Math.cos(ang) * l)},${f(by + Math.sin(ang) * l)}`; } }
      const [ex, ey] = B(.9), tilt = Math.atan2(P2[1] - ey, P2[0] - ex) * 180 / Math.PI + 90;
      feathers.push(`<g class="feather"><path d="M${P0[0]},${P0[1]}Q${f(P1[0])},${f(P1[1])} ${f(P2[0])},${f(P2[1])}" stroke="var(--pl1)" stroke-width="1.6" fill="none"/><path d="${barbs}" stroke="var(--pl1)" stroke-width=".9" fill="none" opacity=".75"/>
        <g transform="translate(${f(ex)} ${f(ey)}) rotate(${f(tilt)})"><ellipse rx="13.5" ry="19.5" fill="var(--pl2)"/><ellipse rx="10" ry="15" fill="var(--pl3)"/><ellipse rx="7.2" ry="11" fill="var(--pl2)"/><ellipse cx="0" cy="-1" rx="4.4" ry="6.6" fill="var(--pl4)"/><ellipse cx="0" cy="-2" rx="1.8" ry="2.6" fill="var(--pl2)"/></g></g>`);
    });
    return `<svg class="ill plume" viewBox="0 0 260 244" aria-hidden="true">${feathers.join("")}</svg>`;
  }

  /* ---------- sun / rangoli mandala ---------- */
  function ringPath(r0, L, w, n, off = 0) {
    let d = "";
    for (let i = 0; i < n; i++) {
      const a = off + i * TAU / n, ux = Math.cos(a), uy = Math.sin(a), vx = -uy, vy = ux, P = (x, y) => `${f(ux * (r0 + y) + vx * x)},${f(uy * (r0 + y) + vy * x)}`;
      d += `M${P(0, 0)}C${P(w, L * .35)} ${P(w, L * .75)} ${P(0, L)}C${P(-w, L * .75)} ${P(-w, L * .35)} ${P(0, 0)}`;
    }
    return d;
  }
  function sun({ rays = 24 } = {}) {
    let ray = ""; for (let i = 0; i < rays; i++) { const a = i * TAU / rays, long = i % 2 === 0, r1 = 74, r2 = long ? 98 : 88, hw = long ? .06 : .045; ray += `M${f(Math.cos(a - hw) * r1)},${f(Math.sin(a - hw) * r1)}L${f(Math.cos(a) * r2)},${f(Math.sin(a) * r2)}L${f(Math.cos(a + hw) * r1)},${f(Math.sin(a + hw) * r1)}Z`; }
    let dots = ""; for (let i = 0; i < 48; i++) { const a = i * TAU / 48; dots += `<circle cx="${f(Math.cos(a) * 67)}" cy="${f(Math.sin(a) * 67)}" r="1.1"/>`; }
    return `<svg class="ill sun" viewBox="-100 -100 200 200" aria-hidden="true">
      <g class="rot-a" fill="var(--sun-ray)"><path d="${ray}"/></g>
      <circle r="71" fill="none" stroke="var(--sun-line)" stroke-width="1"/><g fill="var(--sun-line)">${dots}</g>
      <circle r="62" fill="var(--sun-disc)"/>
      <g class="rot-b" fill="none" stroke="var(--sun-line)" stroke-width="1"><path d="${ringPath(40, 21, 7, 16)}"/><path d="${ringPath(22, 19, 6, 16, Math.PI / 16)}"/><path d="${ringPath(8, 13, 4.6, 8)}"/><circle r="3.2" fill="var(--sun-line)"/><circle r="58"/><circle r="38" stroke-dasharray="2 3"/></g></svg>`;
  }

  /* ---------- small emblem that draws itself ---------- */
  function mandalaSVG(size = 92) {
    const ring = (r0, L, w, n, off = 0) => { let d = ""; for (let i = 0; i < n; i++) { const a = off + i * TAU / n, ux = Math.cos(a), uy = Math.sin(a), vx = -uy, vy = ux, P = (x, y) => `${f(50 + ux * (r0 + y) + vx * x)},${f(50 + uy * (r0 + y) + vy * x)}`; d += `M${P(0, 0)}C${P(w, L * .35)} ${P(w, L * .75)} ${P(0, L)}C${P(-w, L * .75)} ${P(-w, L * .35)} ${P(0, 0)}`; } return d; };
    const p = (d, i) => `<path d="${d}" pathLength="1" style="--i:${i}"/>`, c = (r, i) => `<circle cx="50" cy="50" r="${r}" pathLength="1" style="--i:${i}"/>`;
    return `<svg class="emblem" viewBox="0 0 100 100" width="${size}" height="${size}" aria-hidden="true">${c(48.5, 0)}${c(45.5, 0)}${p(ring(31, 14, 5.2, 16), 1)}${p(ring(15, 16, 5, 16, Math.PI / 16), 2)}${p(ring(6, 12, 3.6, 8), 3)}${c(3, 4)}</svg>`;
  }

  function flourish(w = 220) {
    return `<svg class="ill flourish" viewBox="0 0 220 28" width="${w}" height="${f(w * 28 / 220)}" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1"><path d="M4,14H84C92,14 96,8 104,8M216,14H136C128,14 124,8 116,8" /><path d="M110,3C104,9 104,16 110,25C116,16 116,9 110,3Z" fill="currentColor" fill-opacity=".18"/><path d="M110,25C100,22 94,18 90,12M110,25C120,22 126,18 130,12"/><circle cx="84" cy="14" r="1.8" fill="currentColor"/><circle cx="136" cy="14" r="1.8" fill="currentColor"/></svg>`;
  }

  /* jali lattice as a data-URI tile (door panels, screens) */
  function jali(color = "#d9b563", op = .3) {
    const s = `<svg xmlns="http://www.w3.org/2000/svg" width="56" height="56" viewBox="0 0 56 56" fill="none" stroke="${color}" stroke-opacity="${op}" stroke-width="1"><path d="M28 2L40 16L54 28L40 40L28 54L16 40L2 28L16 16Z"/><path d="M28 14L34 22L42 28L34 34L28 42L22 34L14 28L22 22Z"/><circle cx="28" cy="28" r="2.2"/><path d="M0 0L8 8M56 0L48 8M0 56L8 48M56 56L48 48"/></svg>`;
    return `url("data:image/svg+xml,${encodeURIComponent(s)}")`;
  }

  function archPath(w, h, cusps = 7) {
    const r = w / 2, cx = w / 2, bulge = r * 0.2, cy = r + bulge + 2; let d = `M0 ${h} L0 ${cy.toFixed(1)} `;
    for (let i = 0; i < cusps; i++) { const a0 = Math.PI + Math.PI * i / cusps, a1 = Math.PI + Math.PI * (i + 1) / cusps, am = (a0 + a1) / 2; d += `Q${(cx + Math.cos(am) * (r + bulge)).toFixed(1)} ${(cy + Math.sin(am) * (r + bulge)).toFixed(1)} ${(cx + Math.cos(a1) * r).toFixed(1)} ${(cy + Math.sin(a1) * r).toFixed(1)} `; }
    return d + `L${w} ${h} Z`;
  }

  /* ---------- marigold garland (canvas) ---------- */
  function marigold(ctx, x, y, r, a, b) {
    const g = ctx.createRadialGradient(x - r * .2, y - r * .2, r * .1, x, y, r); g.addColorStop(0, b); g.addColorStop(1, a);
    ctx.fillStyle = g; ctx.beginPath(); const k = 14;
    for (let i = 0; i <= k * 4; i++) { const t = i / (k * 4) * TAU, rr = r * (.82 + .18 * Math.abs(Math.sin(t * k / 2))); ctx.lineTo(x + Math.cos(t) * rr, y + Math.sin(t) * rr); }
    ctx.closePath(); ctx.fill(); ctx.fillStyle = "rgba(120,50,0,.32)"; ctx.beginPath();
    for (let i = 0; i <= k * 4; i++) { const t = i / (k * 4) * TAU, rr = r * .5 * (.8 + .2 * Math.abs(Math.sin(t * k / 2 + 1))); ctx.lineTo(x + Math.cos(t) * rr, y + Math.sin(t) * rr); }
    ctx.closePath(); ctx.fill();
  }
  function leafC(ctx, x, y, ang, len, color) { ctx.save(); ctx.translate(x, y); ctx.rotate(ang); ctx.fillStyle = color; ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(len * .28, len * .45, 0, len); ctx.quadraticCurveTo(-len * .28, len * .45, 0, 0); ctx.fill(); ctx.restore(); }
  function toran(c, o = {}) {
    const ctx = c.getContext("2d"), dpr = Math.min(devicePixelRatio || 1, 2), W = c.clientWidth, H = c.clientHeight;
    c.width = W * dpr; c.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, W, H);
    const orange = o.orange || "#e5781c", yellow = o.yellow || "#f6b63a", green = o.green || "#3f7a3a", dark = o.greenDark || "#2c5a2a";
    const fr = Math.max(7, Math.min(12, W / 44)), n = Math.max(2, Math.round(W / (fr * 9.5))), seg = W / n, sag = Math.min(60, seg * .4);
    ctx.strokeStyle = "rgba(60,30,0,.5)"; ctx.lineWidth = 1.2;
    for (let s = 0; s < n; s++) { const x0 = s * seg, x1 = x0 + seg; ctx.beginPath(); ctx.moveTo(x0, 0); ctx.quadraticCurveTo((x0 + x1) / 2, sag * 2, x1, 0); ctx.stroke(); }
    for (let s = 0; s < n; s++) { const x0 = s * seg, x1 = x0 + seg, cnt = Math.round(seg / (fr * 1.5));
      for (let i = 0; i <= cnt; i++) { const t = i / cnt, x = (1 - t) * (1 - t) * x0 + 2 * (1 - t) * t * (x0 + x1) / 2 + t * t * x1, y = 2 * (1 - t) * t * sag * 2 + fr * .2, k = i + s;
        if (k % 3 === 2) { leafC(ctx, x, y - fr * .3, Math.PI * .9, fr * 2, k % 2 ? green : dark); leafC(ctx, x, y - fr * .3, Math.PI * 1.1, fr * 2, green); }
        marigold(ctx, x, y, fr * (k % 2 ? .95 : 1.05), orange, yellow); } }
  }

  return { skyline, moon, lotus, lilypad, diya, kalash, plume, sun, mandalaSVG, flourish, jali, archPath, toran, rng };
})();
