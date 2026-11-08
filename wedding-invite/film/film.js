/* film.js: choreography for the six screens of the Figma page "Final".
   renderAt(tau) draws one scene at scene-local time tau (seconds). Everything is a pure function of tau, so frames can be rendered
   in any order, in parallel. The Python compositor (compose.py) joins scenes with the transitions.
   Only the layers that exist in the Figma file are animated: arch shapes, Ganesha, calligraphy, couple photo, lotus, the two hands,
   chhatri, the ghat scene and every text. Added on top are light, particles, petals, birds and lanterns, kept restrained. */
(function () {
  const W = 1081, H = 1920, SC = window.SCENE;
  const DUR = [0, 5, 6, 5, 5, 9, 10];            // scene durations (s)
  const START = [0, 0, 5, 11, 16, 21, 30];       // global start of each scene (s)
  const $ = id => document.getElementById(id);
  const clamp = (x, a = 0, b = 1) => x < a ? a : x > b ? b : x;
  const prog = (t, a, b) => clamp((t - a) / (b - a));
  const mix = (a, b, t) => a + (b - a) * t;
  const E = {
    inOut: x => x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2,
    sine: x => -(Math.cos(Math.PI * x) - 1) / 2,
    out2: x => 1 - Math.pow(1 - x, 2), out3: x => 1 - Math.pow(1 - x, 3), out4: x => 1 - Math.pow(1 - x, 4),
    outExpo: x => x >= 1 ? 1 : 1 - Math.pow(2, -10 * x),
    outBack: (x, s = 1.6) => { const c = s + 1; return 1 + c * Math.pow(x - 1, 3) + s * Math.pow(x - 1, 2); }
  };
  function rng(seed) { let a = seed >>> 0; return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  const fract = x => ((x % 1) + 1) % 1;

  /* ---------- dhol beat grid, shared with audio.py (96 bpm) ---------- */
  const BEAT = 60 / 96;
  function beatEnergy(tg, from, to) {          // 0..1 pulse right after each dhol hit between `from` and `to` (global seconds)
    if (tg < from || tg > to) return 0;
    const k = Math.floor((tg - from) / BEAT), tb = from + k * BEAT, d = tg - tb;
    const strong = (k % 4 === 0) ? 1 : (k % 2 === 0 ? .65 : .42);
    return strong * Math.exp(-d / .11);
  }

  /* ---------- DOM helpers ---------- */
  const root = $("s" + SC);
  const cam = document.createElement("div");
  cam.style.cssText = "position:absolute;inset:0;transform-origin:0 0;";
  [...root.children].forEach(c => cam.appendChild(c)); root.appendChild(cam);
  function canvas(z, before) {
    const c = document.createElement("canvas"); c.width = W; c.height = H;
    c.style.cssText = `position:absolute;left:0;top:0;width:${W}px;height:${H}px;pointer-events:none;z-index:${z};`;
    if (before) cam.insertBefore(c, before); else cam.appendChild(c);
    return c;
  }
  const baseT = new Map();
  function tf(el, tx = 0, ty = 0, sc = 1, rot = 0, extra = "") {
    if (!baseT.has(el)) baseT.set(el, (el.classList.contains("cx") || el.id === "s5chh") ? "translateX(-50%) " : (el.classList.contains("arch") ? "translateX(-50%) " : ""));
    el.style.transform = baseT.get(el) + `translate(${tx}px,${ty}px) scale(${sc}) rotate(${rot}deg) ${extra}`;
  }
  function cameraTo(sx, tx, ty, ox, oy) { cam.style.transformOrigin = `${ox}px ${oy}px`; cam.style.transform = `translate(${tx}px,${ty}px) scale(${sx})`; }
  const ext = new Map();   // text extent inside its box as [left,right] fractions, measured before anything is transformed
  function measure(el) {
    if (ext.has(el)) return ext.get(el);
    const r = document.createRange(); r.selectNodeContents(el);
    const bb = r.getBoundingClientRect(), eb = el.getBoundingClientRect();
    const v = [Math.max(0, (bb.left - eb.left) / eb.width), Math.min(1, (bb.right - eb.left) / eb.width)];
    ext.set(el, v); return v;
  }
  function wipe(el, p, soft = .16) {
    if (p >= 1) { el.style.webkitMaskImage = el.style.maskImage = ""; return; }
    const [l, r] = measure(el); const h = mix(l, r + soft, p);
    el.style.webkitMaskImage = el.style.maskImage = `linear-gradient(90deg,#000 0,#000 ${(h - soft) * 100}%,transparent ${h * 100}%,transparent 100%)`;
  }
  function reveal(el, p0, o = {}) {              // soft mask wipe + rise + defocus
    const { rise = 22, blur = 5, soft = .16 } = o, e = E.out3(p0);
    if (p0 <= 0) { el.style.visibility = "hidden"; return; }
    el.style.visibility = "visible"; wipe(el, E.sine(p0), soft);
    tf(el, 0, (1 - e) * rise); el.style.opacity = clamp(p0 * 2.2);
    el.style.filter = p0 >= 1 ? "" : `blur(${(1 - e) * blur}px)`;
    if (p0 >= 1) { el.style.opacity = ""; el.style.transform = baseT.get(el) || ""; }
  }
  function sweepText(el, p, base, hi, w = .2) {
    if (p <= 0 || p >= 1) { el.style.backgroundImage = ""; el.style.webkitBackgroundClip = ""; el.style.backgroundClip = ""; el.style.webkitTextFillColor = ""; return; }
    const [l, r] = measure(el), c = mix(l - w, r + w, p) * 100;
    el.style.backgroundImage = `linear-gradient(100deg,${base} ${c - w * 100}%,${hi} ${c}%,${base} ${c + w * 100}%)`;
    el.style.webkitBackgroundClip = "text"; el.style.backgroundClip = "text"; el.style.webkitTextFillColor = "transparent";
  }
  function hideAll(...els) { els.forEach(e => { e.style.visibility = "hidden"; }); }
  function clipTop(el, p) { el.style.clipPath = p >= 1 ? "" : `inset(0 0 ${(1 - p) * 100}% 0)`; }       // reveal downward
  function clipBottom(el, p) { el.style.clipPath = p >= 1 ? "" : `inset(${(1 - p) * 100}% 0 0 0)`; }    // reveal upward

  /* ---------- light and particle toolkit ---------- */
  const sprites = {};
  function glowSprite(rgb) {
    if (sprites[rgb]) return sprites[rgb];
    const c = document.createElement("canvas"); c.width = c.height = 128; const g = c.getContext("2d");
    const r = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    r.addColorStop(0, `rgba(${rgb},1)`); r.addColorStop(.22, `rgba(${rgb},.5)`); r.addColorStop(.55, `rgba(${rgb},.14)`); r.addColorStop(1, `rgba(${rgb},0)`);
    g.fillStyle = r; g.fillRect(0, 0, 128, 128); return sprites[rgb] = c;
  }
  function glow(ctx, x, y, r, rgb, a, comp = "lighter") {
    if (a <= 0.003 || r <= 0) return;
    ctx.save(); ctx.globalCompositeOperation = comp; ctx.globalAlpha = clamp(a); ctx.drawImage(glowSprite(rgb), x - r, y - r, r * 2, r * 2); ctx.restore();
  }
  function petal(ctx, x, y, s, rot, flip, c1, c2, a) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(flip, 1); ctx.globalAlpha = a;
    const g = ctx.createLinearGradient(0, -s, 0, s); g.addColorStop(0, c1); g.addColorStop(1, c2); ctx.fillStyle = g;
    ctx.beginPath(); ctx.moveTo(0, -s); ctx.bezierCurveTo(s * .95, -s * .55, s * .8, s * .55, 0, s); ctx.bezierCurveTo(-s * .8, s * .55, -s * .95, -s * .55, 0, -s); ctx.fill();
    ctx.globalAlpha = a * .35; ctx.strokeStyle = "#fff"; ctx.lineWidth = Math.max(.6, s * .045); ctx.beginPath(); ctx.moveTo(0, -s * .78); ctx.lineTo(0, s * .66); ctx.stroke();
    ctx.restore();
  }
  const PAL = {
    marigold: [["#f6a21e", "#e0701a"], ["#f9c04b", "#ee8d22"], ["#ffd36b", "#f4a02a"]],
    rose: [["#f4b6c6", "#e07f9e"], ["#fbd3dc", "#ee9db3"], ["#f7c1cf", "#d9728f"]],
    lotus: [["#fde3ea", "#f09bb7"], ["#f9c9d6", "#e9789e"], ["#ffeef2", "#f4b1c6"]],
    gold: [["#fff1c4", "#e2b457"], ["#ffe29b", "#d49a35"]]
  };
  /* petals drift analytically: position is a function of tau only */
  function petals(ctx, tau, o) {
    const n = o.n, win = o.win || [-99, 99];
    for (let i = 0; i < n; i++) {
      const r = rng(o.seed * 1009 + i * 131);
      const life = o.life * (.7 + .6 * r()), u = fract(tau / life + r());
      const env = Math.pow(Math.sin(Math.PI * u), .55) * (o.alpha ?? .9);
      const a = env * prog(tau, win[0], win[0] + .8) * (1 - prog(tau, win[1] - .8, win[1]));
      if (a < .01) continue;
      const x0 = mix(o.x0, o.x1, r()), s = mix(o.size[0], o.size[1], r());
      const dir = o.dir || 1, y = dir > 0 ? mix(o.y0, o.y1, u) : mix(o.y1, o.y0, u);
      const x = x0 + Math.sin((u * (o.sway || 2.2) + r()) * Math.PI * 2) * (o.swayAmp || 40) + (o.drift || 0) * (u - .5);
      const rot = r() * 6.283 + u * (o.spin || 4) * (r() > .5 ? 1 : -1), flip = Math.cos(u * (o.flutter || 7) + r() * 6.283);
      const pal = o.pal[Math.floor(r() * o.pal.length)];
      petal(ctx, x, y, s, rot, Math.abs(flip) < .18 ? .18 : flip, pal[0], pal[1], a);
    }
  }
  function dust(ctx, tau, o) {
    const win = o.win || [-99, 99];
    for (let i = 0; i < o.n; i++) {
      const r = rng(o.seed * 7919 + i * 211);
      const life = o.life * (.7 + .6 * r()), u = fract(tau / life + r());
      const a = Math.sin(Math.PI * u) * (.35 + .65 * (.5 + .5 * Math.sin(tau * mix(1.5, 4, r()) + r() * 6.28))) * (o.alpha ?? .8) * prog(tau, win[0], win[0] + .8) * (1 - prog(tau, win[1] - .8, win[1]));
      if (a < .01) continue;
      const x = mix(o.x0, o.x1, r()) + Math.sin(u * 5 + r() * 6.28) * (o.sway || 18), y = mix(o.y0, o.y1, u);
      glow(ctx, x, y, mix(o.size[0], o.size[1], r()), o.rgb || "255,222,150", a);
    }
  }
  function lightBand(ctx, p, o) {     // a soft diagonal band of light travelling across the frame
    if (p <= 0 || p >= 1) return;
    ctx.save(); ctx.globalCompositeOperation = o.comp || "lighter";
    const ang = o.angle ?? -.45, len = Math.hypot(W, H) * 1.3, c = mix(-len * .55, len * .55, p);
    ctx.translate(W / 2 + (o.cx || 0), H / 2 + (o.cy || 0)); ctx.rotate(ang);
    const g = ctx.createLinearGradient(c - o.width, 0, c + o.width, 0);
    const a = (o.alpha ?? .2) * Math.sin(Math.PI * p);
    g.addColorStop(0, `rgba(${o.rgb || "255,228,170"},0)`); g.addColorStop(.5, `rgba(${o.rgb || "255,228,170"},${a})`); g.addColorStop(1, `rgba(${o.rgb || "255,228,170"},0)`);
    ctx.fillStyle = g; ctx.fillRect(-len, -len, len * 2, len * 2); ctx.restore();
  }
  function keyline(svgHost, p, color = "#e6c88a", width = 2.6, op = 1) {   // gold line drawn along an arch outline
    const path = svgHost.querySelector("path"); path.style.strokeDashoffset = String(1 - clamp(p)); svgHost.style.opacity = String(op);
    path.setAttribute("stroke", color); path.setAttribute("stroke-width", width);
  }
  let ARCH_D = "";
  async function makeKeyline(zBefore) {
    if (!ARCH_D) { const t = await (await fetch("assets/f2-mask2.svg")).text(); ARCH_D = /d="([^"]+)"/.exec(t)[1]; }
    const ns = "http://www.w3.org/2000/svg", s = document.createElementNS(ns, "svg");
    s.setAttribute("width", 978); s.setAttribute("height", 1675); s.setAttribute("viewBox", "0 0 978 1675");
    s.style.cssText = "position:absolute;left:52px;top:122px;pointer-events:none;z-index:6;overflow:visible";
    const p = document.createElementNS(ns, "path"); p.setAttribute("d", ARCH_D); p.setAttribute("fill", "none"); p.setAttribute("pathLength", "1");
    p.style.strokeDasharray = "1 1"; p.style.strokeDashoffset = "1"; p.setAttribute("stroke-linejoin", "round");
    s.appendChild(p); if (zBefore) cam.insertBefore(s, zBefore); else cam.appendChild(s); return s;
  }
  function bird(ctx, x, y, s, flap, a, col = "#5b4a52") {
    ctx.save(); ctx.translate(x, y); ctx.globalAlpha = a; ctx.strokeStyle = col; ctx.lineWidth = Math.max(1.4, s * .13); ctx.lineCap = "round"; ctx.lineJoin = "round";
    const w = Math.sin(flap) * .62;
    ctx.beginPath(); ctx.moveTo(-s, -s * .12 - s * w); ctx.quadraticCurveTo(-s * .5, -s * .5 - s * w * .6, 0, 0); ctx.quadraticCurveTo(s * .5, -s * .5 - s * w * .6, s, -s * .12 - s * w); ctx.stroke(); ctx.restore();
  }
  function lantern(ctx, x, y, s, a, fl) {
    glow(ctx, x, y, s * 4.2, "255,170,70", a * .55 * fl);
    ctx.save(); ctx.translate(x, y); ctx.globalAlpha = a;
    const g = ctx.createLinearGradient(0, -s, 0, s * 1.1); g.addColorStop(0, "#ffe6a8"); g.addColorStop(.55, "#ffb44f"); g.addColorStop(1, "#e2702a");
    ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(-s * .55, -s * .9); ctx.quadraticCurveTo(0, -s * 1.15, s * .55, -s * .9); ctx.lineTo(s * .78, s * .75); ctx.quadraticCurveTo(0, s * 1.05, -s * .78, s * .75); ctx.closePath(); ctx.fill();
    ctx.globalAlpha = a * .5; ctx.strokeStyle = "#a5481a"; ctx.lineWidth = Math.max(.7, s * .05); ctx.beginPath(); ctx.moveTo(-s * .2, -s * .95); ctx.lineTo(-s * .3, s * .85); ctx.moveTo(s * .2, -s * .95); ctx.lineTo(s * .3, s * .85); ctx.stroke();
    ctx.restore(); glow(ctx, x, y + s * .3, s * 1.5, "255,240,190", a * .75 * fl);
  }
  const ctxOf = c => c.getContext("2d");

  /* ====================================================================================
     SCENE 1: opening blessing (Ganesha)           D = 5 s, visible tau 0 .. 5.6
     ==================================================================================== */
  const S = {};
  S[1] = async function () {
    const arch = root.querySelector(".arch"), mask = root.querySelector(".mask"), inv = $("s1inv"), gan = $("s1gan"), cal = $("s1cal"), cl = $("s1cl");
    const back = canvas(1, gan), front = canvas(5, null);
    const calShine = document.createElement("div");
    calShine.style.cssText = "position:absolute;left:234px;top:1261px;width:614px;height:305px;-webkit-mask-image:url(assets/f1-calligraphy.svg);mask-image:url(assets/f1-calligraphy.svg);-webkit-mask-size:100% 100%;mask-size:100% 100%;mix-blend-mode:screen;pointer-events:none;z-index:4;";
    cam.insertBefore(calShine, cl);
    const lines = [...cl.children]; lines.forEach(p => { p.style.display = "block"; });
    [inv, ...lines].forEach(e => measure(e)); measure(cal);
    return function (tau) {
      // arch unrolls downward, Ganesha rises into the light, calligraphy is drawn left to right, lines follow
      const pa = E.out3(prog(tau, .1, 1.9));
      clipTop(arch, pa); arch.style.opacity = clamp(pa * 3); tf(arch, 0, (1 - pa) * -40, 1 + (1 - pa) * .03);
      const pg = prog(tau, .5, 2.4), eg = E.out4(pg);
      gan.style.opacity = clamp(pg * 2.4); gan.style.transformOrigin = "50% 100%";
      tf(gan, 0, (1 - eg) * 64 - 3 * Math.sin(tau * 1.1), (.94 + .06 * eg) * (1 + .0045 * Math.sin(tau * 1.5)));
      gan.style.filter = pg >= 1 ? "" : `blur(${(1 - eg) * 7}px)`;
      reveal(inv, prog(tau, 1.2, 2.5), { rise: 12, blur: 3, soft: .12 }); sweepText(inv, prog(tau, 2.4, 3.6), "#ffebd5", "#ffffff", .16);
      const pc = E.sine(prog(tau, 1.9, 3.7)); wipe(cal, pc, .14); cal.style.visibility = pc <= 0 ? "hidden" : "visible"; cal.style.opacity = clamp(pc * 4);
      const sh = prog(tau, 3.6, 4.9); calShine.style.opacity = sh > 0 && sh < 1 ? String(Math.sin(Math.PI * sh) * .85) : "0";
      calShine.style.background = `linear-gradient(105deg,transparent ${sh * 140 - 40}%,rgba(255,214,120,.95) ${sh * 140 - 22}%,transparent ${sh * 140 - 4}%)`;
      reveal(lines[0], prog(tau, 3.0, 3.9)); reveal(lines[1], prog(tau, 3.25, 4.15));
      // golden halo behind the head, breathing; petals and dust in front of the figure, below the text
      let c = ctxOf(back); c.clearRect(0, 0, W, H);
      const halo = E.out3(prog(tau, .9, 2.6)) * (.78 + .22 * Math.sin(tau * 1.9));
      glow(c, 541, 662, 330, "255,205,110", .55 * halo); glow(c, 541, 662, 175, "255,232,170", .5 * halo);
      c = ctxOf(front); c.clearRect(0, 0, W, H);
      dust(c, tau, { n: 46, seed: 3, x0: 170, x1: 920, y0: 1280, y1: 380, life: 6, size: [7, 22], alpha: .75, win: [.9, 7] });
      petals(c, tau, { n: 13, seed: 11, x0: 60, x1: 1020, y0: -50, y1: 1990, life: 11, size: [14, 24], pal: [...PAL.marigold, ...PAL.rose], swayAmp: 70, drift: 90, alpha: .85, win: [.8, 7] });
      // slow push toward Ganesha
      const k = E.sine(clamp(tau / 5.6)); cameraTo(1 + .05 * k, 0, -12 * k, 541, 760);
    };
  };

  /* ====================================================================================
     SCENE 2: couple portrait                        D = 6 s, visible tau -0.6 .. 6.6
     ==================================================================================== */
  S[2] = async function () {
    const photo = $("s2photo"), img = $("s2img"), g = [...root.querySelectorAll(".g")], tx = $("s2tx"), n1 = $("s2n1"), n2 = $("s2n2"), n3 = $("s2n3"), sub = $("s2sub");
    const key = await makeKeyline(tx);
    const txl = [...tx.children]; txl.forEach(p => { p.style.display = "block"; });
    const fx = canvas(4, tx); fx.style.cssText += "-webkit-mask-image:url(assets/f2-mask2.svg);mask-image:url(assets/f2-mask2.svg);-webkit-mask-position:52px 122px;mask-position:52px 122px;-webkit-mask-size:978px 1675px;mask-size:978px 1675px;-webkit-mask-repeat:no-repeat;mask-repeat:no-repeat;";
    const top = canvas(12, null);
    [sub, n1, n2, n3, ...txl].forEach(e => measure(e));
    img.style.transformOrigin = "1568px 555px";
    return function (tau) {
      // the portrait settles from a closer frame, then drifts toward the couple
      const s0 = 1.15 - .1 * E.out3(prog(tau, -.6, 1.9)) + .075 * E.sine(prog(tau, 1.9, 6.6));
      img.style.transform = `scale(${s0}) translate(${(1 - E.out3(prog(tau, -.6, 2))) * 18}px,0)`;
      reveal(sub, prog(tau, .35, 1.3), { rise: 10, blur: 3, soft: .1 });
      reveal(n1, prog(tau, .8, 2.1), { rise: 34, blur: 8, soft: .2 });
      const pw = prog(tau, 1.6, 2.6); n2.style.visibility = pw > 0 ? "visible" : "hidden"; n2.style.opacity = E.out3(pw); tf(n2, 0, (1 - E.out3(pw)) * 14, mix(.94, 1, E.out3(pw))); n2.style.filter = pw >= 1 ? "" : `blur(${(1 - pw) * 6}px)`; if (pw >= 1) { n2.style.opacity = ""; n2.style.transform = baseT.get(n2); }
      reveal(n3, prog(tau, 2.0, 3.3), { rise: 34, blur: 8, soft: .2 });
      sweepText(n1, prog(tau, 3.2, 4.4), "#fff8ed", "#ffd98a", .2); sweepText(n3, prog(tau, 3.55, 4.75), "#fff8ed", "#ffd98a", .2); sweepText(n2, prog(tau, 3.4, 4.2), "#fff8ed", "#ffd98a", .3);
      reveal(txl[0], prog(tau, 4.0, 4.9), { rise: 12, blur: 2 }); reveal(txl[1], prog(tau, 4.2, 5.1), { rise: 12, blur: 2 });
      keyline(key, E.sine(prog(tau, .2, 2.6)), "#e6c88a", 2.8, 1 - .45 * prog(tau, 3, 5));
      let c = ctxOf(fx); c.clearRect(0, 0, W, H);
      lightBand(c, prog(tau, .9, 2.9), { width: 190, alpha: .2, angle: -.55, rgb: "255,226,172" });
      lightBand(c, prog(tau, 4.4, 6.2), { width: 150, alpha: .11, angle: -.5, rgb: "255,226,172" });
      dust(c, tau, { n: 38, seed: 21, x0: 90, x1: 990, y0: 1700, y1: 200, life: 7, size: [10, 44], alpha: .42, win: [-.4, 6.6], rgb: "255,214,140", sway: 30 });
      dust(c, tau, { n: 30, seed: 22, x0: 120, x1: 960, y0: 1500, y1: 300, life: 4.5, size: [4, 9], alpha: .9, win: [-.4, 6.6], rgb: "255,238,190", sway: 14 });
      petals(c, tau, { n: 9, seed: 23, x0: 140, x1: 940, y0: 180, y1: 1700, life: 9, size: [13, 22], pal: [...PAL.rose, ...PAL.gold], swayAmp: 50, drift: -80, alpha: .8, win: [.3, 6.6] });
      c = ctxOf(top); c.clearRect(0, 0, W, H);
      const k = E.sine(clamp((tau + .6) / 7.2)); cameraTo(1 + .018 * k, 0, 0, 541, 760);
    };
  };

  /* ====================================================================================
     SCENE 3: two families (lotus)                   D = 5 s, visible tau -0.6 .. 5.6
     ==================================================================================== */
  S[3] = async function () {
    const g = [$("s3g1"), $("s3g2")], d1 = $("s3d1"), d2 = $("s3d2"), n1 = $("s3n1"), n2 = $("s3n2"), l1 = $("s3l1"), l2 = $("s3l2"), lot = $("s3lot");
    const key = await makeKeyline(d1);
    const fxA = canvas(3, lot), fxB = canvas(12, null);
    // the lotus is redrawn in strips so the stems can bend and the blooms can open
    const holder = lot.firstElementChild; holder.innerHTML = "";
    const lc = document.createElement("canvas"); lc.width = 1253; lc.height = 2226; lc.style.cssText = "width:1253px;height:2226px;display:block";
    holder.appendChild(lc);
    const limg = new Image(); limg.src = "assets/f3-lotus.png"; await limg.decode();
    const L1 = [...l1.children], L2 = [...l2.children]; [...L1, ...L2].forEach(p => { p.style.display = "block"; });
    [n1, n2, ...L1, ...L2].forEach(e => measure(e));
    const SW = 577, SH = 1024, K = 1253 / 577;
    function drawLotus(tau) {
      const c = lc.getContext("2d"); c.clearRect(0, 0, 1253, 2226);
      const bloom = E.outBack(prog(tau, -.1, 1.9), 1.2), rise = E.out4(prog(tau, -.4, 1.7));
      const sway = Math.sin(tau * 1.25) * 1, sway2 = Math.sin(tau * .9 + 1.4);
      const STEP = 2;
      for (let sy = 0; sy < SH; sy += STEP / K) {
        const y = sy * K; if (y > 2226) break;
        const h = Math.min(STEP, 2226 - y), hs = h / K;
        // 0 at the stem base (bottom), 1 at the top of the plant
        const up = 1 - sy / SH, upe = Math.pow(clamp((up - .02) / .5), 1.5);
        const dx = (sway * 10 + sway2 * 5) * upe + (1 - rise) * -60 * upe;
        // blooms open outward around the two flower centres (source px): lower-left (225,790), upper-right (385,560)
        let cxs = 0, fac = 1;
        if (sy > 440 && sy < 700) { cxs = 385; fac = mix(.78, 1, bloom); }
        else if (sy >= 700 && sy < 900) { cxs = 225; fac = mix(.82, 1, bloom); }
        const sx0 = 0, dxScale = fac;
        const dstX = (cxs ? cxs * K - cxs * K * dxScale + 0 : 0) + dx;
        c.save(); c.translate(dstX, y); c.scale(dxScale, 1);
        c.drawImage(limg, 0, sy, SW, hs + .6 / K, 0, 0, 1253, h + .6);
        c.restore();
      }
    }
    return function (tau) {
      const pg = E.out3(prog(tau, -.55, 1.3)); g.forEach(e => clipBottom(e, pg)); g.forEach(e => { e.style.opacity = clamp(pg * 3); });
      reveal(n1, prog(tau, .15, 1.25), { rise: 30, blur: 7, soft: .22 });
      reveal(L1[0], prog(tau, .65, 1.55), { rise: 12, blur: 2 }); reveal(L1[1], prog(tau, .8, 1.7), { rise: 12, blur: 2 });
      reveal(n2, prog(tau, 1.05, 2.15), { rise: 30, blur: 7, soft: .22 });
      reveal(L2[0], prog(tau, 1.55, 2.45), { rise: 12, blur: 2 }); reveal(L2[1], prog(tau, 1.7, 2.6), { rise: 12, blur: 2 });
      sweepText(n1, prog(tau, 2.5, 3.7), "#fff8ed", "#ffd98a", .2); sweepText(n2, prog(tau, 2.8, 4.0), "#fff8ed", "#ffd98a", .2);
      keyline(key, E.sine(prog(tau, -.1, 2.4)), "#e9cf9a", 2.6, 1 - .35 * prog(tau, 3, 5));
      lot.style.opacity = clamp(prog(tau, -.4, .5) * 1.3);
      lot.style.transform = `translate(0,${(1 - E.out4(prog(tau, -.4, 1.7))) * 260}px)`;
      drawLotus(tau);
      let c = ctxOf(fxA); c.clearRect(0, 0, W, H);
      glow(c, 720, 1500, 360, "255,214,200", .2 * prog(tau, 1, 2.4) * (.8 + .2 * Math.sin(tau * 1.6)));
      c = ctxOf(fxB); c.clearRect(0, 0, W, H);
      lightBand(c, prog(tau, 1.0, 3.0), { width: 160, alpha: .2, angle: -.6, rgb: "255,236,214", cy: 420 });
      petals(c, tau, { n: 15, seed: 31, x0: 120, x1: 960, y0: -40, y1: 1200, life: 8, size: [13, 24], pal: PAL.lotus, swayAmp: 55, drift: 70, alpha: .85, win: [.4, 5.6] });
      dust(c, tau, { n: 34, seed: 32, x0: 140, x1: 940, y0: 1180, y1: 160, life: 6.5, size: [6, 20], alpha: .6, win: [.2, 5.6], rgb: "255,224,170" });
      const k = E.sine(clamp((tau + .6) / 6.2)); cameraTo(1 + .035 * k, mix(22, -22, k), -10 * k, 541, 1100);
    };
  };

  /* ====================================================================================
     SCENE 4: journey & blessings                    D = 5 s, visible tau -0.6 .. 5.6
     ==================================================================================== */
  S[4] = async function () {
    const bg = $("s4bg"), pn = $("s4pn"), bl = [$("s4bl1"), $("s4bl2")], lab = $("s4lab"), inn = $("s4in"), hd = $("s4hd"), bt = $("s4bt"), hands = $("s4hands");
    hands.innerHTML = `<img src="assets/f4-hand-L.png" id="hL" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover"><img src="assets/f4-hand-R.png" id="hR" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover">`;
    const hL = $("hL"), hR = $("hR"); await Promise.all([hL.decode(), hR.decode()]);
    const back = canvas(2, hands), glowc = canvas(3, hd), top = canvas(12, null);
    const il = [...inn.children], bl2 = [...bt.children]; [...il, ...bl2].forEach(p => { p.style.display = "block"; });
    [lab, hd, ...il, ...bl2].forEach(e => measure(e));
    const TX = 540, TY = 1236;     // where the two fingertips meet
    return function (tau) {
      const kz = E.sine(clamp((tau + .6) / 6.2));
      bg.style.transformOrigin = "540px 700px"; bg.style.transform = `scale(${1 + .03 * kz})`;
      // the carved arch catches a travelling light
      const pbl = E.out3(prog(tau, -.4, 1.5)); bl.forEach(e => { e.style.opacity = clamp(pbl * 2); e.style.transformOrigin = "50% 55%"; e.style.transform = `scale(${mix(.9, 1, pbl)}, ${mix(.78, 1, pbl)})`; });
      reveal(lab, prog(tau, .1, 1.0), { rise: 8, blur: 2, soft: .1 });
      reveal(hd, prog(tau, .35, 1.6), { rise: 30, blur: 8, soft: .22 });
      reveal(il[0], prog(tau, 1.0, 1.9), { rise: 12, blur: 2 }); reveal(il[1], prog(tau, 1.15, 2.05), { rise: 12, blur: 2 });
      reveal(bt, prog(tau, 2.9, 3.9), { rise: 14, blur: 2 });
      // the two hands reach in from either side and settle exactly where the design places them
      const pL = E.out4(prog(tau, -.2, 2.1)), pR = E.out4(prog(tau, .05, 2.3));
      hL.style.opacity = clamp(pL * 3); hR.style.opacity = clamp(pR * 3);
      const fl = Math.sin(tau * 1.3) * 1.2;
      hL.style.transform = `translate(${(1 - pL) * -150}px,${(1 - pL) * -22 + fl * .6}px)`;
      hR.style.transform = `translate(${(1 - pR) * 150}px,${(1 - pR) * 26 - fl * .6}px)`;
      // warm light where they meet, a small burst of gold as they arrive, one red petal lifting from her palm
      let c = ctxOf(back); c.clearRect(0, 0, W, H);
      const near = E.out3(prog(tau, 1.4, 3.1)), pulse = .85 + .15 * Math.sin(tau * 2.2);
      glow(c, TX, TY, 420, "255,205,140", .34 * near * pulse); glow(c, TX, TY, 150, "255,236,190", .55 * near * pulse);
      lightBand(c, prog(tau, .6, 2.7), { width: 150, alpha: .16, angle: -.6, rgb: "255,214,150", cy: -150 });
      c = ctxOf(top); c.clearRect(0, 0, W, H);
      const burst = prog(tau, 1.9, 3.4);
      for (let i = 0; i < 26 && burst > 0 && burst < 1; i++) {
        const r = rng(401 + i * 17), a = r() * 6.283, d = E.out3(burst) * mix(60, 250, r()), life = 1 - burst;
        glow(c, TX + Math.cos(a) * d, TY + Math.sin(a) * d * .8, mix(6, 15, r()), "255,226,160", life * .9);
      }
      dust(c, tau, { n: 30, seed: 41, x0: 380, x1: 700, y0: 1320, y1: 880, life: 5, size: [6, 16], alpha: .75, win: [1.8, 5.6], sway: 22 });
      const pp = prog(tau, 2.2, 5.6);
      if (pp > 0) petal(c, 702 + Math.sin(pp * 6) * 18, 1270 - E.out2(pp) * 300, 11, pp * 3 - .4, Math.cos(pp * 9) * .8 + .2, "#d63a3a", "#a31f2a", Math.sin(Math.PI * pp) * .95);
      petals(c, tau, { n: 8, seed: 42, x0: 120, x1: 960, y0: -40, y1: 700, life: 9, size: [12, 20], pal: [...PAL.marigold, ...PAL.rose], swayAmp: 45, drift: 60, alpha: .55, win: [.6, 5.6] });
      cameraTo(1 + .06 * kz, mix(0, -4, kz), mix(0, -18, kz), TX, TY);
    };
  };

  /* ====================================================================================
     SCENE 5: baraat schedule (date and time reveal)   D = 9 s, visible tau -0.6 .. 9.6
     ==================================================================================== */
  S[5] = async function () {
    const g = [...root.querySelectorAll(".g")], lab = $("s5lab"), date = $("s5date"), time = $("s5time"), wel = $("s5wel"), chh = $("s5chh"), mask = root.querySelector(".mask");
    const key = await makeKeyline(lab);
    const wl = [...wel.children]; wl.forEach(p => { p.style.display = "block"; });
    const back = canvas(1, chh), front = canvas(5, null);
    [lab, date, time, ...wl].forEach(e => measure(e));
    const ls = []; for (let i = 0; i < 9; i++) { const r = rng(700 + i); ls.push({ x: mix(120, 960, r()), sp: mix(34, 62, r()), s: mix(9, 20, r()), ph: r() * 6.28, t0: r() * 7, drift: mix(-40, 40, r()) }); }
    return function (tau) {
      const tg = START[5] + tau;
      const pg = E.out3(prog(tau, -.5, 1.5)); g.forEach(e => { clipTop(e, pg); e.style.opacity = clamp(pg * 3); });
      reveal(lab, prog(tau, .3, 1.2), { rise: 8, blur: 2, soft: .1 });
      // date: wipes in with weight, then a gold light crosses it and it glows once
      const pd = prog(tau, .8, 2.5); reveal(date, pd, { rise: 36, blur: 10, soft: .24 });
      if (pd > 0 && pd < 1) tf(date, 0, (1 - E.out3(pd)) * 36, mix(1.1, 1, E.out3(pd)));
      sweepText(date, prog(tau, 2.5, 3.8), "#fff8ed", "#ffd98a", .18);
      const gl = Math.sin(Math.PI * prog(tau, 2.6, 4.4)); date.style.textShadow = gl > .01 ? `0 0 ${26 * gl}px rgba(255,206,130,${.7 * gl})` : "";
      // time tracks in from a wide spacing
      const pt = prog(tau, 2.0, 3.3); reveal(time, pt, { rise: 10, blur: 3 }); time.style.letterSpacing = `${mix(14, 3, E.out3(pt))}px`;
      reveal(wl[0], prog(tau, 3.3, 4.3), { rise: 18, blur: 4 }); reveal(wl[1], prog(tau, 3.75, 4.75), { rise: 18, blur: 4 }); reveal(wl[2], prog(tau, 4.2, 5.2), { rise: 18, blur: 4 });
      keyline(key, E.sine(prog(tau, -.2, 2.8)), "#e9cf9a", 2.6, 1 - .4 * prog(tau, 4, 7));
      // the chhatri rises into place, is lit from within, and breathes with the dhol
      const bt = beatEnergy(tg, 21.0, 30.0), pc = E.out4(prog(tau, -.3, 2.2));
      chh.style.opacity = clamp(pc * 2.5); chh.style.transformOrigin = "50% 100%";
      tf(chh, 0, (1 - pc) * 260 + 3 * Math.sin(tau * 1.1), (.96 + .04 * pc) * (1 + .006 * bt)); chh.style.filter = pc >= 1 ? "" : `blur(${(1 - pc) * 6}px)`;
      let c = ctxOf(back); c.clearRect(0, 0, W, H);
      const lit = E.out3(prog(tau, 2.2, 6)) , flick = .86 + .14 * Math.sin(tau * 3.1) * Math.sin(tau * 1.7 + 1);
      glow(c, 542, 1215, 420, "255,196,120", .3 * lit * (flick + .35 * bt)); glow(c, 542, 1660, 260, "255,176,90", .42 * lit * (flick + .3 * bt));
      glow(c, 542, 1665, 120, "255,226,160", .5 * lit * flick);
      c = ctxOf(front); c.clearRect(0, 0, W, H);
      lightBand(c, prog(tau, 4.2, 6.2), { width: 120, alpha: .18, angle: -.7, rgb: "255,236,200", cy: 520 });
      // sky lanterns lift slowly through the arch
      ls.forEach(L => { const u = fract((tau + L.t0) / mix(14, 20, (L.s - 9) / 11)); const y = mix(1980, 120, u), x = L.x + Math.sin(u * 9 + L.ph) * 26 + L.drift * u;
        const a = Math.sin(Math.PI * u) * prog(tau, 1.2, 3) * (1 - prog(tau, 8.4, 9.6)) * .92; if (a > .02 && !(y > 640 && y < 900 && x > 130 && x < 950 && false)) lantern(c, x, y, L.s, a, .85 + .15 * Math.sin(tau * 4 + L.ph)); });
      dust(c, tau, { n: 40, seed: 51, x0: 140, x1: 940, y0: 1900, y1: 700, life: 7, size: [6, 18], alpha: .65, win: [1.5, 9.6], rgb: "255,214,140" });
      petals(c, tau, { n: 14, seed: 52, x0: 80, x1: 1000, y0: -40, y1: 1990, life: 9, size: [13, 23], pal: PAL.marigold, swayAmp: 60, drift: 100, alpha: .9, win: [.2, 9.6], flutter: 9 });
      glow(c, 542, 1215, 520, "255,214,150", .1 * bt);
      const k = E.sine(clamp((tau + .6) / 10.2)); cameraTo(1 + .06 * k, 0, mix(0, -26, k), 542, 1250);
    };
  };

  /* ====================================================================================
     SCENE 6: venue & closing (ghat at sunset)      D = 10 s, visible tau -0.6 .. 10
     ==================================================================================== */
  S[6] = async function () {
    const rv = $("s6rv"), lab = $("s6lab"), adr = $("s6adr"), cty = $("s6cty"), cls = $("s6cls"), frame = $("s6frame");
    // address as three lines so each can be revealed in turn
    const al = adr.textContent.split("\n"); adr.innerHTML = ""; al.forEach(t => { const s = document.createElement("span"); s.style.display = "block"; s.textContent = t.replace(/ /g, " "); adr.appendChild(s); });
    const A = [...adr.children], CL = [...cls.children]; CL.forEach(p => { p.style.display = "block"; });
    // the background is drawn on a canvas so the water can ripple and the camera can move through it
    rv.style.display = "none";
    const bgc = canvas(0, lab), back = canvas(1, lab), front = canvas(5, null);
    const img = new Image(); img.src = "assets/f6-riverside.png"; await img.decode();
    frame.style.border = "none"; frame.innerHTML = `<svg width="1018" height="1854" viewBox="0 0 1018 1854" style="position:absolute;left:-1px;top:-1px;overflow:visible"><rect x="1" y="1" width="1016" height="1852" fill="none" stroke="#fff" stroke-width="2" pathLength="1" style="stroke-dasharray:1 1;stroke-dashoffset:1" id="s6r"/></svg>`;
    const rect = $("s6r");
    [lab, ...A, cty, ...CL].forEach(e => measure(e));
    const X0 = -119.34, Y0 = -266.54, WW = 1319.674, HH = 2494.073;
    function drawBg(tau) {
      const c = ctxOf(bgc); c.clearRect(0, 0, W, H);
      c.save(); c.translate(X0 + WW, Y0); c.scale(-1, 1);          // the artwork is mirrored in the Figma file
      const sx = 542 / WW, sy = 1024 / HH;
      const water0 = 1452, STEP = 3;
      // everything above the waterline is drawn in one piece
      c.drawImage(img, 0, 0, 542, (water0 - Y0) * sy, 0, 0, WW, water0 - Y0 + .6);
      // the water is drawn in thin strips that drift sideways, more so toward the viewer
      for (let y = water0; y < H + STEP; y += STEP) {
        const d = (y - water0) / (H - water0), amp = mix(.5, 5.2, d * d), ph = y * .045;
        const off = Math.sin(tau * 1.5 + ph) * amp + Math.sin(tau * .8 + ph * 2.3) * amp * .5;
        c.drawImage(img, 0, (y - Y0) * sy, 542, STEP * sy + .01, off, y - Y0, WW, STEP + .6);
      }
      c.restore();
    }
    const birds = []; for (let i = 0; i < 7; i++) { const r = rng(900 + i); birds.push({ y: mix(960, 1240, r()), s: mix(9, 16, r()), sp: mix(34, 52, r()), ph: r() * 6.28, x0: mix(-120, 500, r()), fr: mix(5, 7.5, r()) }); }
    const puffs = []; for (let i = 0; i < 16; i++) { const r = rng(950 + i); puffs.push({ ph: r(), x: 615, y: 1010 }); }
    return function (tau) {
      drawBg(tau);
      // frame draws itself, then the text arrives line by line
      rect.style.strokeDashoffset = String(1 - E.sine(prog(tau, -.3, 2.4)));
      reveal(lab, prog(tau, .5, 1.4), { rise: 8, blur: 2, soft: .1 });
      reveal(A[0], prog(tau, 1.0, 2.0), { rise: 26, blur: 6, soft: .2 }); reveal(A[1], prog(tau, 1.4, 2.4), { rise: 26, blur: 6, soft: .2 }); reveal(A[2], prog(tau, 1.8, 2.8), { rise: 26, blur: 6, soft: .2 });
      reveal(cty, prog(tau, 3.2, 4.4), { rise: 26, blur: 6, soft: .2 });
      reveal(CL[0], prog(tau, 4.9, 5.9), { rise: 14, blur: 3 }); reveal(CL[1], prog(tau, 5.2, 6.2), { rise: 14, blur: 3 });
      // light: the sun breathes, lamp flames flicker, smoke rises from the aarti lamp
      let c = ctxOf(back); c.clearRect(0, 0, W, H);
      const br = .88 + .12 * Math.sin(tau * 1.1);
      glow(c, 286, 1325, 230, "255,214,130", .5 * br); glow(c, 286, 1325, 90, "255,238,180", .6 * br);
      const fk = (s, sp) => .82 + .18 * Math.sin(tau * sp + s) * Math.sin(tau * sp * .63 + s * 2) + .06 * Math.sin(tau * 13 + s);
      [[615, 1068, 70, 1.0, 1], [900, 1190, 44, .8, 2], [880, 1316, 30, .6, 3], [1020, 1700, 80, 1.1, 4], [575, 1846, 52, .9, 5]].forEach(([x, y, r, a, s]) => { const f = fk(s, 7 + s); glow(c, x, y, r * 2.6, "255,176,80", .38 * a * f); glow(c, x, y, r, "255,226,150", .62 * a * f); });
      glow(c, 1005, 1110, 90, "255,190,100", .22 * (.9 + .1 * Math.sin(tau * 2.1)));
      puffs.forEach(p => { const u = fract(tau / 5 + p.ph); const x = p.x + Math.sin(u * 7 + p.ph * 6) * (14 + u * 40), y = p.y - u * 190; glow(c, x, y, mix(10, 46, u), "255,246,235", Math.sin(Math.PI * u) * .16, "source-over"); });
      c = ctxOf(front); c.clearRect(0, 0, W, H);
      lightBand(c, prog(tau, 1.2, 4.2), { width: 220, alpha: .09, angle: -.9, rgb: "255,226,170" });
      birds.forEach(b => { const u = (tau + 1.5) * b.sp + b.x0; const x = (u % 1500) - 200; bird(c, x, b.y + Math.sin((tau + b.ph) * .8) * 14, b.s, tau * b.fr + b.ph, .7 * prog(tau, .4, 1.6)); });
      dust(c, tau, { n: 26, seed: 61, x0: 560, x1: 1060, y0: 1880, y1: 1000, life: 6, size: [6, 16], alpha: .55, win: [.5, 10], rgb: "255,200,120" });
      petals(c, tau, { n: 8, seed: 62, x0: 560, x1: 1060, y0: 1850, y1: 1300, life: 7, size: [11, 18], pal: [...PAL.marigold, ...PAL.rose], swayAmp: 40, drift: -40, alpha: .8, dir: -1, win: [1.5, 10] });
      // a slow pull back from the aarti, then a still hold
      const k = 1 - E.sine(prog(tau, -.6, 8.4)); cameraTo(1 + .075 * k, mix(0, -26, k), mix(0, 40, k), 700, 1300);
    };
  };

  /* ---------- go ---------- */
  window.RENDER_READY = (async () => {
    await window.READY;
    const fn = await S[SC]();
    window.renderAt = tau => { fn(tau); };
    window.SCENE_INFO = { scene: SC, dur: DUR[SC], start: START[SC] };
    return true;
  })();
})();
