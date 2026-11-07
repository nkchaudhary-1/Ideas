/* FX: canvas effects. One fixed canvas carries ambient drift (embers or petals) and one-off bursts
   (fireworks or petals). Stars are a separate small canvas inside a scene. Everything is a no-op under reduced motion. */
const FX = (() => {
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const TAU = Math.PI * 2, R = (a, b) => a + Math.random() * (b - a), pick = a => a[Math.floor(Math.random() * a.length)];
  let cv, ctx, W = 0, H = 0, dpr = 1, raf = 0, last = 0, additive = true, amb = null;
  const P = [];                                        // live particles
  const cap = 900;

  function size() { if (!cv) return; dpr = Math.min(devicePixelRatio || 1, 2); W = innerWidth; H = innerHeight; cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); }
  function init(canvas, o = {}) { if (reduced) { canvas.remove(); return; } cv = canvas; ctx = cv.getContext("2d"); additive = o.additive !== false; size(); addEventListener("resize", size); document.addEventListener("visibilitychange", () => { if (!document.hidden) kick(); }); }
  function kick() { if (!raf && cv) { last = performance.now(); raf = requestAnimationFrame(tick); } }

  /* ambient: a fixed population that recycles. kind "embers" rises, "petals" falls. */
  function ambient(cfg) {
    if (reduced || !cv) return; amb = cfg; const n = cfg.count || 24;
    for (let i = 0; i < n; i++) P.push(cfg.kind === "petals" ? petal(R(0, W), R(-H, H), cfg, true) : ember(R(0, W), R(0, H), cfg));
    kick();
  }
  const ember = (x, y, c) => ({ t: "ember", x, y, r: R(.6, 1.9), vy: R(.12, .45), sw: R(.4, 1.2), ph: R(0, TAU), tw: R(.6, 1.6), c: c.color || "217,181,99", amb: true });
  const petal = (x, y, c, amb = false) => ({ t: "petal", x, y, r: R(...(c.size || [5, 9])), vy: R(...(c.speed || [.3, .7])), sw: R(.5, 1.6), ph: R(0, TAU), rot: R(0, TAU), vr: R(-.03, .03), fl: R(0, TAU), vf: R(.02, .06), col: pick(c.colors), al: R(.55, .95), amb, life: 1, g: 0, vx: 0 });

  /* bursts */
  function firework(x, y, colors) {
    if (reduced || !cv) return; const n = Math.round(R(70, 110)), ring = Math.random() < .4, col = colors || ["255,214,120", "255,150,170", "255,238,200"], c1 = pick(col), c2 = pick(col);
    for (let i = 0; i < n; i++) { const a = R(0, TAU), s = ring ? R(3.6, 4) : R(1.2, 5.2); P.push({ t: "spark", x, y, tr: [], vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: 1, dec: R(.0055, .0105), c: i % 3 ? c1 : c2, w: R(1.3, 2.6), tw: R(0, TAU) }); }
    P.push({ t: "flash", x, y, life: 1 }); trim(); kick();
  }
  function rocket(x, y, colors) { if (reduced || !cv) return; P.push({ t: "rocket", x: x + R(-30, 30), y: H + 10, ty: y, vy: -R(9, 12), colors }); kick(); }
  function salvo(n = 3, colors) { if (reduced || !cv) return; for (let i = 0; i < n; i++) setTimeout(() => rocket(R(W * .18, W * .82), R(H * .12, H * .46), colors), i * R(380, 620)); }
  function petals(x, y, cfg, n = 46) { if (reduced || !cv) return; for (let i = 0; i < n; i++) { const p = petal(x, y, cfg); const a = R(-Math.PI * .95, -Math.PI * .05), s = R(3, 9); p.vx = Math.cos(a) * s; p.vy = Math.sin(a) * s; p.g = .13; p.life = 1; p.dec = R(.003, .006); p.burst = true; P.push(p); } trim(); kick(); }
  function shower(cfg, count = 46, spread = 3600) { if (reduced || !cv) return; for (let i = 0; i < count; i++) { const p = petal(R(0, W), -20, cfg); p.wait = R(0, spread); p.vy = R(1.2, 2.6); p.shower = true; P.push(p); } trim(); kick(); }
  const trim = () => { while (P.length > cap) { const i = P.findIndex(p => !p.amb); if (i < 0) break; P.splice(i, 1); } };

  function tick(now) {
    raf = 0; if (document.hidden) return; const dt = Math.min(2, (now - last) / 16.67); last = now;
    ctx.clearRect(0, 0, W, H);
    for (let i = P.length - 1; i >= 0; i--) {
      const p = P[i];
      if (p.t === "ember") {
        p.y -= p.vy * dt; p.x += Math.sin(now / 1400 * p.sw + p.ph) * .25 * dt; if (p.y < -10) { p.y = H + 10; p.x = R(0, W); }
        const fade = Math.min(1, p.y / (H * .25)), a = (.2 + .5 * (.5 + .5 * Math.sin(now / 1000 * p.tw + p.ph))) * Math.max(0, fade);
        ctx.shadowBlur = 8; ctx.shadowColor = `rgba(${p.c},.8)`; ctx.fillStyle = `rgba(${p.c},${a.toFixed(3)})`; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, TAU); ctx.fill(); ctx.shadowBlur = 0;
      } else if (p.t === "petal") {
        if (p.wait > 0) { p.wait -= 16.67 * dt; continue; }
        if (p.burst) { p.vx *= .985; p.vy += p.g * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy *= .992; p.life -= p.dec * dt; if (p.life <= 0 || p.y > H + 30) { P.splice(i, 1); continue; } }
        else { p.y += p.vy * dt; p.x += Math.sin(now / 900 * p.sw + p.ph) * .6 * dt; if (p.y > H + 20) { if (p.amb) { p.y = -20; p.x = R(0, W); } else { P.splice(i, 1); continue; } } }
        p.rot += p.vr * dt; p.fl += p.vf * dt;
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot); ctx.scale(Math.max(.25, Math.abs(Math.cos(p.fl))), 1); ctx.globalAlpha = p.al * Math.min(1, (p.life ?? 1) * 2); ctx.fillStyle = p.col; ctx.beginPath(); ctx.ellipse(0, 0, p.r * .62, p.r, 0, 0, TAU); ctx.fill(); ctx.restore();
      } else if (p.t === "rocket") {
        p.y += p.vy * dt; p.vy *= .985; ctx.globalCompositeOperation = additive ? "lighter" : "source-over"; ctx.strokeStyle = "rgba(255,225,160,.9)"; ctx.lineWidth = 2.2; ctx.shadowBlur = 12; ctx.shadowColor = "rgba(255,210,120,.9)"; ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x, p.y + 26); ctx.stroke(); ctx.shadowBlur = 0; ctx.globalCompositeOperation = "source-over";
        if (p.y <= p.ty || p.vy > -1.2) { P.splice(i, 1); firework(p.x, p.y, p.colors); }
      } else if (p.t === "spark") {
        p.tr.push(p.x, p.y); if (p.tr.length > 22) p.tr.splice(0, 2);
        p.vx *= .984; p.vy = p.vy * .984 + .04 * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.life -= p.dec * dt; if (p.life <= 0) { P.splice(i, 1); continue; }
        const tw = .75 + .25 * Math.sin(now / 60 + p.tw), al = Math.min(1, p.life * 1.3) * tw;
        ctx.globalCompositeOperation = additive ? "lighter" : "source-over"; ctx.lineCap = "round"; ctx.lineJoin = "round";
        ctx.strokeStyle = `rgba(${p.c},${(al * .42).toFixed(3)})`; ctx.lineWidth = p.w * .8; ctx.beginPath(); ctx.moveTo(p.tr[0], p.tr[1]); for (let k = 2; k < p.tr.length; k += 2) ctx.lineTo(p.tr[k], p.tr[k + 1]); ctx.lineTo(p.x, p.y); ctx.stroke();
        ctx.fillStyle = `rgba(${p.c},${al.toFixed(3)})`; ctx.shadowBlur = 10; ctx.shadowColor = `rgba(${p.c},.9)`; ctx.beginPath(); ctx.arc(p.x, p.y, p.w * (.7 + p.life * .6), 0, TAU); ctx.fill(); ctx.shadowBlur = 0; ctx.globalCompositeOperation = "source-over";
      } else if (p.t === "flash") {
        p.life -= .09 * dt; if (p.life <= 0) { P.splice(i, 1); continue; } const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, 120 * (1 - p.life * .4)); g.addColorStop(0, `rgba(255,236,190,${(p.life * .35).toFixed(3)})`); g.addColorStop(1, "rgba(255,236,190,0)"); ctx.globalCompositeOperation = additive ? "lighter" : "source-over"; ctx.fillStyle = g; ctx.fillRect(p.x - 130, p.y - 130, 260, 260); ctx.globalCompositeOperation = "source-over";
      }
    }
    if (P.length) raf = requestAnimationFrame(tick);
  }

  /* stars: a small twinkling canvas for a night scene; pauses off screen */
  function stars(canvas, o = {}) {
    if (reduced) { canvas.remove(); return () => {}; }
    const c = canvas.getContext("2d"); let w, h, ps = [], on = true, id = 0;
    const fit = () => { const d = Math.min(devicePixelRatio || 1, 2); w = canvas.clientWidth; h = canvas.clientHeight; canvas.width = w * d; canvas.height = h * d; c.setTransform(d, 0, 0, d, 0, 0); ps = Array.from({ length: o.count || 120 }, () => ({ x: R(0, w), y: R(0, h * (o.band || .75)), r: R(.3, 1.4), ph: R(0, TAU), s: R(.5, 1.6) })); };
    fit(); addEventListener("resize", fit);
    const draw = t => { id = 0; c.clearRect(0, 0, w, h); for (const s of ps) { c.fillStyle = `rgba(${o.color || "255,244,220"},${(.25 + .6 * (.5 + .5 * Math.sin(t / 900 * s.s + s.ph))).toFixed(3)})`; c.beginPath(); c.arc(s.x, s.y, s.r, 0, TAU); c.fill(); } if (on && !document.hidden) id = requestAnimationFrame(draw); };
    new IntersectionObserver(e => { on = e[0].isIntersecting; if (on && !id) id = requestAnimationFrame(draw); }).observe(canvas); id = requestAnimationFrame(draw);
  }

  return { init, ambient, firework, salvo, petals, shower, stars, reduced };
})();
