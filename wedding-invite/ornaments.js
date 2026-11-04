/* Procedural traditional ornament. Every template draws from this: nothing is a stock image.
   ORN.mandala(ctx, cx, cy, r, color, opts)     gold mandala, 12- or 16-fold
   ORN.toran(canvas, color)                      marigold garland strings hanging from the top edge
   ORN.blockPrint(colors, size)                  data URL tile of a boota (block-print flower) for CSS backgrounds
   ORN.bandhani(color, size)                     data URL tile of tie-dye dots
   ORN.paisleySVG(color)                         an SVG string of a paisley with inner curls (corner ornament)
   ORN.archPath(w, h, cusps)                     SVG path of a cusped (Mughal) arch                                */
const ORN = (() => {
  const TAU = Math.PI * 2;

  function petal(ctx, cx, cy, ang, len, wid, pointed = true) {
    ctx.save(); ctx.translate(cx, cy); ctx.rotate(ang);
    ctx.beginPath(); ctx.moveTo(0, 0);
    if (pointed) { ctx.bezierCurveTo(wid, len * .35, wid, len * .75, 0, len); ctx.bezierCurveTo(-wid, len * .75, -wid, len * .35, 0, 0); }
    else { ctx.ellipse(0, len / 2, wid, len / 2, 0, 0, TAU); }
    ctx.closePath(); ctx.restore();
  }

  function mandala(ctx, cx, cy, r, color, o = {}) {
    const n = o.n || 16, lw = o.lineWidth || 1;
    ctx.save(); ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = lw; ctx.lineJoin = "round";
    const ring = (rad, w = lw, dash) => { ctx.beginPath(); ctx.setLineDash(dash || []); ctx.lineWidth = w; ctx.arc(cx, cy, rad, 0, TAU); ctx.stroke(); ctx.setLineDash([]); ctx.lineWidth = lw; };
    const petals = (rad, len, wid, count, off = 0, fill = 0, pointed = true) => {
      for (let i = 0; i < count; i++) { petal(ctx, cx, cy, off + i * TAU / count, len, wid, pointed);
        ctx.save(); ctx.translate(cx, cy); ctx.rotate(off + i * TAU / count); ctx.translate(0, rad); ctx.rotate(-(off + i * TAU / count)); ctx.restore();
      }
    };
    const petalsAt = (rad, len, wid, count, off = 0, fill = 0, pointed = true) => {
      for (let i = 0; i < count; i++) { const a = off + i * TAU / count;
        ctx.save(); ctx.translate(cx + Math.cos(a) * rad, cy + Math.sin(a) * rad); ctx.rotate(a - Math.PI / 2);
        petal(ctx, 0, 0, 0, len, wid, pointed); if (fill) { ctx.globalAlpha = fill; ctx.fill(); ctx.globalAlpha = 1; } ctx.stroke(); ctx.restore(); }
    };
    const dots = (rad, count, size, off = 0) => { for (let i = 0; i < count; i++) { const a = off + i * TAU / count; ctx.beginPath(); ctx.arc(cx + Math.cos(a) * rad, cy + Math.sin(a) * rad, size, 0, TAU); ctx.fill(); } };
    // outer scalloped edge
    ring(r); ring(r * .96, lw * .6);
    petalsAt(r * .96, -r * .16, r * .055, n, 0, .12);
    dots(r * .83, n, lw * 1.4, TAU / n / 2);
    ring(r * .78, lw * .6, [lw * 3, lw * 3]);
    petalsAt(r * .42, r * .33, r * .07, n, TAU / n / 2, .1);
    petalsAt(r * .42, r * .24, r * .05, n, 0, .18);
    ring(r * .44);
    dots(r * .5, n * 2, lw * .9);
    petalsAt(r * .12, r * .26, r * .07, n / 2, 0, .22);
    petalsAt(r * .08, r * .16, r * .05, n / 2, TAU / n, .35);
    ring(r * .1, lw * .8); ctx.beginPath(); ctx.arc(cx, cy, r * .035, 0, TAU); ctx.fill();
    ctx.restore();
  }

  function marigold(ctx, x, y, r, hueA, hueB) {
    const g = ctx.createRadialGradient(x - r * .2, y - r * .2, r * .1, x, y, r);
    g.addColorStop(0, hueB); g.addColorStop(1, hueA);
    ctx.fillStyle = g; ctx.beginPath();
    const k = 14; for (let i = 0; i <= k * 4; i++) { const a = i / (k * 4) * TAU; const rr = r * (0.82 + 0.18 * Math.abs(Math.sin(a * k / 2))); ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); }
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = "rgba(120,50,0,.35)"; ctx.beginPath();
    for (let i = 0; i <= k * 4; i++) { const a = i / (k * 4) * TAU; const rr = r * .5 * (0.8 + 0.2 * Math.abs(Math.sin(a * k / 2 + 1))); ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); }
    ctx.closePath(); ctx.fill();
  }
  function leaf(ctx, x, y, ang, len, color) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(ang); ctx.fillStyle = color; ctx.beginPath(); ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(len * .28, len * .45, 0, len); ctx.quadraticCurveTo(-len * .28, len * .45, 0, 0); ctx.fill();
    ctx.strokeStyle = "rgba(0,0,0,.25)"; ctx.lineWidth = .6; ctx.beginPath(); ctx.moveTo(0, len * .08); ctx.lineTo(0, len * .92); ctx.stroke(); ctx.restore();
  }

  /* Garland strings across the top of the canvas, with hanging tassels at both ends. */
  function toran(c, opts = {}) {
    const ctx = c.getContext("2d"); const dpr = Math.min(devicePixelRatio || 1, 2);
    const W = c.clientWidth, H = c.clientHeight; c.width = W * dpr; c.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    const orange = opts.orange || "#e5781c", yellow = opts.yellow || "#f6b63a", green = opts.green || "#3f7a3a", greenDark = opts.greenDark || "#2c5a2a";
    const fr = Math.max(7, Math.min(11, W / 48)); // flower radius
    const span = fr * 9.5; const n = Math.max(2, Math.round(W / span)); const seg = W / n; const sag = Math.min(70, seg * .32);
    const place = (x, y, i) => { if (i % 3 === 2) { leaf(ctx, x, y - fr * .3, Math.PI * .9, fr * 2, i % 2 ? green : greenDark); leaf(ctx, x, y - fr * .3, Math.PI * 1.1, fr * 2, green); } marigold(ctx, x, y, fr * (i % 2 ? .95 : 1.05), orange, yellow); };
    // strings
    ctx.strokeStyle = "rgba(60,30,0,.55)"; ctx.lineWidth = 1.2;
    for (let s = 0; s < n; s++) { const x0 = s * seg, x1 = (s + 1) * seg; ctx.beginPath(); ctx.moveTo(x0, 0); ctx.quadraticCurveTo((x0 + x1) / 2, sag * 2, x1, 0); ctx.stroke(); }
    // flowers along each curve
    for (let s = 0; s < n; s++) { const x0 = s * seg, x1 = (s + 1) * seg; const cnt = Math.round(seg / (fr * 1.5));
      for (let i = 0; i <= cnt; i++) { const t = i / cnt; const x = (1 - t) * (1 - t) * x0 + 2 * (1 - t) * t * (x0 + x1) / 2 + t * t * x1; const y = 2 * (1 - t) * t * sag * 2; place(x, y + fr * .2, i + s); } }
    // tassels at the ends
    const tassel = (x) => { ctx.strokeStyle = "rgba(60,30,0,.55)"; ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H - fr * 2.2); ctx.stroke();
      const cnt = Math.floor((H - fr * 2.4) / (fr * 1.5)); for (let i = 0; i < cnt; i++) place(x, fr * .9 + i * fr * 1.5, i + 1);
      leaf(ctx, x, H - fr * 2.4, Math.PI * .08, fr * 2.2, green); leaf(ctx, x, H - fr * 2.4, -Math.PI * .08, fr * 2.2, greenDark); };
    if (opts.tassels !== false && H > fr * 5) { tassel(fr * 1.4); tassel(W - fr * 1.4); }
  }

  function tile(size, draw) { const c = document.createElement("canvas"); const s = 2; c.width = size * s; c.height = size * s; const ctx = c.getContext("2d"); ctx.scale(s, s); draw(ctx, size); return c.toDataURL("image/png"); }

  /* Boota: a block-print flower with stem and two leaves, in a half-drop grid. */
  function blockPrint(colors, size = 96) {
    return tile(size, (ctx, S) => {
      const boota = (x, y, sc) => { ctx.save(); ctx.translate(x, y); ctx.scale(sc, sc);
        ctx.strokeStyle = colors.leaf; ctx.lineWidth = 1.4; ctx.lineCap = "round";
        ctx.beginPath(); ctx.moveTo(0, 10); ctx.quadraticCurveTo(2, 20, 0, 30); ctx.stroke();
        leaf(ctx, 0, 17, Math.PI * .62, 11, colors.leaf); leaf(ctx, 0, 21, -Math.PI * .62, 11, colors.leaf);
        ctx.fillStyle = colors.petal; for (let i = 0; i < 8; i++) { petal(ctx, 0, 0, i * TAU / 8, 11, 3.2, false); ctx.fill(); }
        ctx.fillStyle = colors.center; ctx.beginPath(); ctx.arc(0, 0, 3.2, 0, TAU); ctx.fill();
        ctx.fillStyle = colors.dot; for (let i = 0; i < 8; i++) { const a = i * TAU / 8 + TAU / 16; ctx.beginPath(); ctx.arc(Math.cos(a) * 14.5, Math.sin(a) * 14.5, 1.1, 0, TAU); ctx.fill(); }
        ctx.restore(); };
      boota(S * .25, S * .22, 1); boota(S * .75, S * .72, 1);
      ctx.fillStyle = colors.dot; [[.75, .22], [.25, .72]].forEach(([x, y]) => { ctx.beginPath(); ctx.arc(S * x, S * y, 1.6, 0, TAU); ctx.fill();
        for (let i = 0; i < 4; i++) { const a = i * TAU / 4; ctx.beginPath(); ctx.arc(S * x + Math.cos(a) * 6, S * y + Math.sin(a) * 6, 1, 0, TAU); ctx.fill(); } });
    });
  }

  function bandhani(color, size = 28) {
    return tile(size, (ctx, S) => { ctx.strokeStyle = color; ctx.lineWidth = 1.2;
      [[.25, .25], [.75, .75]].forEach(([x, y]) => { ctx.beginPath(); ctx.arc(S * x, S * y, 3.2, 0, TAU); ctx.stroke(); ctx.beginPath(); ctx.arc(S * x, S * y, .9, 0, TAU); ctx.fillStyle = color; ctx.fill(); });
    });
  }

  /* Paisley (ambi) with inner curls; 120x160 viewBox, stem at bottom-left. */
  function paisleySVG(color, extra = "") {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 160" fill="none" stroke="${color}" stroke-width="1.6" stroke-linecap="round" ${extra}>
<path d="M28 150C-6 118 2 60 40 32 62 16 86 8 104 20c10 10-6 28-12 44-8 20 2 46-10 66-10 18-34 32-54 20z" fill="${color}" fill-opacity=".08"/>
<path d="M36 140C12 112 18 68 48 44c14-10 34-16 46-8 6 6-6 18-10 32-6 18 2 40-8 56-8 14-28 24-40 16z"/>
<path d="M50 122c-12-20-4-48 18-62 10-6 22-8 28-4 4 4-6 12-8 24-4 16 2 34-6 46-6 10-24 6-32-4z" stroke-dasharray="3 3"/>
<path d="M62 102c-4-10 0-24 10-30 6-4 12-2 12 2 2 6-8 8-8 16 0 6 4 10 0 14-4 2-10 2-14-2z"/>
<circle cx="72" cy="86" r="3" fill="${color}"/>
<path d="M104 20c8-10 20-6 14 6" /><path d="M40 32c-6-10-20-10-18 2"/>
<circle cx="112" cy="14" r="2.2" fill="${color}"/><circle cx="26" cy="28" r="2.2" fill="${color}"/>
<path d="M22 150c-6 2-10 6-8 10m14-8c-4 4-4 8-2 12m18-10c0 4 2 8 6 10" />
</svg>`;
  }

  /* Cusped (multifoil) arch for an SVG of size w x h: a scalloped semicircle on top, straight sides, closed along the bottom. */
  function archPath(w, h, cusps = 7) {
    const r = w / 2, cx = w / 2, bulge = r * 0.2, cy = r + bulge + 2;
    let d = `M0 ${h} L0 ${cy.toFixed(1)} `;
    for (let i = 0; i < cusps; i++) {
      const a0 = Math.PI + Math.PI * i / cusps, a1 = Math.PI + Math.PI * (i + 1) / cusps, am = (a0 + a1) / 2;
      const x1 = cx + Math.cos(a1) * r, y1 = cy + Math.sin(a1) * r;
      const mx = cx + Math.cos(am) * (r + bulge), my = cy + Math.sin(am) * (r + bulge);
      d += `Q${mx.toFixed(1)} ${my.toFixed(1)} ${x1.toFixed(1)} ${y1.toFixed(1)} `;
    }
    d += `L${w} ${h} Z`; return d;
  }

  return { mandala, toran, blockPrint, bandhani, paisleySVG, archPath, marigold, leaf };
})();
