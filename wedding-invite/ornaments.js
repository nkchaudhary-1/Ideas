/* Procedural ornament and motion helpers. Nothing here is an image.
   ORN.mandalaSVG(size)        a line-art gold mandala whose strokes can draw themselves (class .emblem)
   ORN.archPath(w, h, cusps)   SVG path of a cusped (Mughal) arch
   ORN.toran(canvas, opts)     marigold garland strings across the top of a canvas
   ORN.sparks(canvas, opts)    embers rising slowly, like sparks off a diya
   ORN.petals(canvas, opts)    drifting or showering petals                                           */
const ORN = (() => {
  const TAU = Math.PI * 2;
  const reduced = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
  const R = (a, b) => a + Math.random() * (b - a);

  function ringPath(r0, L, w, n, off = 0) {
    let d = "";
    for (let i = 0; i < n; i++) {
      const a = off + i * TAU / n, ux = Math.cos(a), uy = Math.sin(a), vx = -uy, vy = ux;
      const P = (x, y) => `${(50 + ux * (r0 + y) + vx * x).toFixed(2)},${(50 + uy * (r0 + y) + vy * x).toFixed(2)}`;
      d += `M${P(0, 0)}C${P(w, L * .35)} ${P(w, L * .75)} ${P(0, L)}C${P(-w, L * .75)} ${P(-w, L * .35)} ${P(0, 0)}`;
    }
    return d;
  }
  function mandalaSVG(size = 92) {
    const p = (d, i) => `<path d="${d}" pathLength="1" style="--i:${i}"/>`;
    const c = (r, i) => `<circle cx="50" cy="50" r="${r}" pathLength="1" style="--i:${i}"/>`;
    return `<svg class="emblem" viewBox="0 0 100 100" width="${size}" height="${size}" aria-hidden="true">${c(48.5, 0)}${c(45.5, 0)}${p(ringPath(31, 14, 5.2, 16), 1)}${p(ringPath(15, 16, 5, 16, Math.PI / 16), 2)}${p(ringPath(6, 12, 3.6, 8), 3)}${c(3, 4)}</svg>`;
  }

  function archPath(w, h, cusps = 7) {
    const r = w / 2, cx = w / 2, bulge = r * 0.2, cy = r + bulge + 2;
    let d = `M0 ${h} L0 ${cy.toFixed(1)} `;
    for (let i = 0; i < cusps; i++) {
      const a0 = Math.PI + Math.PI * i / cusps, a1 = Math.PI + Math.PI * (i + 1) / cusps, am = (a0 + a1) / 2;
      const x1 = cx + Math.cos(a1) * r, y1 = cy + Math.sin(a1) * r;
      const mx = cx + Math.cos(am) * (r + bulge), my = cy + Math.sin(am) * (r + bulge);
      d += `Q${mx.toFixed(1)} ${my.toFixed(1)} ${x1.toFixed(1)} ${y1.toFixed(1)} `;
    }
    return d + `L${w} ${h} Z`;
  }

  function marigold(ctx, x, y, r, a, b) {
    const g = ctx.createRadialGradient(x - r * .2, y - r * .2, r * .1, x, y, r); g.addColorStop(0, b); g.addColorStop(1, a);
    ctx.fillStyle = g; ctx.beginPath(); const k = 14;
    for (let i = 0; i <= k * 4; i++) { const t = i / (k * 4) * TAU, rr = r * (0.82 + 0.18 * Math.abs(Math.sin(t * k / 2))); ctx.lineTo(x + Math.cos(t) * rr, y + Math.sin(t) * rr); }
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = "rgba(120,50,0,.32)"; ctx.beginPath();
    for (let i = 0; i <= k * 4; i++) { const t = i / (k * 4) * TAU, rr = r * .5 * (0.8 + 0.2 * Math.abs(Math.sin(t * k / 2 + 1))); ctx.lineTo(x + Math.cos(t) * rr, y + Math.sin(t) * rr); }
    ctx.closePath(); ctx.fill();
  }
  function leaf(ctx, x, y, ang, len, color) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(ang); ctx.fillStyle = color; ctx.beginPath(); ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(len * .28, len * .45, 0, len); ctx.quadraticCurveTo(-len * .28, len * .45, 0, 0); ctx.fill(); ctx.restore();
  }
  function toran(c, o = {}) {
    const ctx = c.getContext("2d"), dpr = Math.min(devicePixelRatio || 1, 2), W = c.clientWidth, H = c.clientHeight;
    c.width = W * dpr; c.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, W, H);
    const orange = o.orange || "#e5781c", yellow = o.yellow || "#f6b63a", green = o.green || "#3f7a3a", dark = o.greenDark || "#2c5a2a";
    const fr = Math.max(7, Math.min(11, W / 48)), n = Math.max(2, Math.round(W / (fr * 9.5))), seg = W / n, sag = Math.min(56, seg * .4);
    ctx.strokeStyle = "rgba(60,30,0,.5)"; ctx.lineWidth = 1.2;
    for (let s = 0; s < n; s++) { const x0 = s * seg, x1 = x0 + seg; ctx.beginPath(); ctx.moveTo(x0, 0); ctx.quadraticCurveTo((x0 + x1) / 2, sag * 2, x1, 0); ctx.stroke(); }
    for (let s = 0; s < n; s++) {
      const x0 = s * seg, x1 = x0 + seg, cnt = Math.round(seg / (fr * 1.5));
      for (let i = 0; i <= cnt; i++) {
        const t = i / cnt, x = (1 - t) * (1 - t) * x0 + 2 * (1 - t) * t * (x0 + x1) / 2 + t * t * x1, y = 2 * (1 - t) * t * sag * 2 + fr * .2, k = i + s;
        if (k % 3 === 2) { leaf(ctx, x, y - fr * .3, Math.PI * .9, fr * 2, k % 2 ? green : dark); leaf(ctx, x, y - fr * .3, Math.PI * 1.1, fr * 2, green); }
        marigold(ctx, x, y, fr * (k % 2 ? .95 : 1.05), orange, yellow);
      }
    }
  }

  /* Embers: slow, sparse, gold. Pauses itself when reduced motion is asked for. */
  function sparks(canvas, o = {}) {
    if (reduced()) { canvas.remove(); return; }
    const ctx = canvas.getContext("2d"), col = o.color || "217,181,99"; let W, H, dpr, ps = [];
    const size = () => { dpr = Math.min(devicePixelRatio || 1, 2); W = innerWidth; H = innerHeight; canvas.width = W * dpr; canvas.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); };
    size(); addEventListener("resize", size);
    for (let i = 0; i < (o.count || 30); i++) ps.push({ x: R(0, innerWidth), y: R(0, innerHeight), r: R(.6, 1.9), vy: R(.12, .45), sw: R(.4, 1.2), ph: R(0, TAU), tw: R(.6, 1.6) });
    (function tick(now) {
      ctx.clearRect(0, 0, W, H);
      for (const p of ps) {
        p.y -= p.vy; p.x += Math.sin(now / 1400 * p.sw + p.ph) * .25;
        if (p.y < -10) { p.y = H + 10; p.x = R(0, W); }
        const fade = Math.min(1, p.y / (H * .25)), a = (.2 + .5 * (.5 + .5 * Math.sin(now / 1000 * p.tw + p.ph))) * Math.max(0, fade);
        ctx.shadowBlur = 8; ctx.shadowColor = `rgba(${col},.8)`; ctx.fillStyle = `rgba(${col},${a.toFixed(3)})`;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, TAU); ctx.fill();
      }
      requestAnimationFrame(tick);
    })(performance.now());
  }

  /* Petals. loop:true drifts forever; loop:false is a single shower that removes its canvas when done. */
  function petals(canvas, o = {}) {
    if (reduced()) { canvas.remove(); return; }
    const ctx = canvas.getContext("2d"); let W, H, dpr;
    const size = () => { dpr = Math.min(devicePixelRatio || 1, 2); W = innerWidth; H = innerHeight; canvas.width = W * dpr; canvas.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); };
    size(); addEventListener("resize", size);
    const mk = t0 => ({ x: R(0, innerWidth), y: o.loop ? R(-innerHeight, innerHeight) : -20, r: R(...o.size), vy: R(...o.speed), sw: R(.5, 1.6), ph: R(0, TAU), rot: R(0, TAU), vr: R(-.03, .03), fl: R(0, TAU), vf: R(.02, .06), c: o.colors[Math.floor(Math.random() * o.colors.length)], al: R(.55, .95), t0 });
    const ps = Array.from({ length: o.count }, () => mk(o.loop ? 0 : R(0, o.spread || 3000)));
    const start = performance.now();
    (function tick(now) {
      const el = now - start; ctx.clearRect(0, 0, W, H); let alive = 0;
      for (const p of ps) {
        if (p.dead) continue; alive++; if (el < p.t0) continue;
        p.y += p.vy; p.x += Math.sin(el / 900 * p.sw + p.ph) * .6; p.rot += p.vr; p.fl += p.vf;
        if (p.y > H + 20) { if (o.loop) { p.y = -20; p.x = R(0, W); } else { p.dead = true; continue; } }
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot); ctx.scale(Math.max(.25, Math.abs(Math.cos(p.fl))), 1);
        ctx.globalAlpha = p.al; ctx.fillStyle = p.c; ctx.beginPath(); ctx.ellipse(0, 0, p.r * .62, p.r, 0, 0, TAU); ctx.fill(); ctx.restore();
      }
      if (alive) requestAnimationFrame(tick); else canvas.remove();
    })(start);
  }

  return { mandalaSVG, archPath, toran, sparks, petals };
})();
