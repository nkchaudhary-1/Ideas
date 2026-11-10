/* Wedding film: every frame is a pure function of global time t (seconds). renderAt(t) lays out and animates the seven screens of the
   Figma page "Bride Side", applies the transition between neighbours and draws light/particles on top.
   Timeline (s): scene k+1 starts at B[k]; the transition between them is centred on B[k] and lasts 2*HW.
   The soundtrack hits (10.9, 19.9, 33.8 s) are matched to the families reveal, the haldi burst and the closing blessing; the hands touch on a beat at 14.49 s. */
(function () {
  const W = 1081, H = 1920, DUR = 40, HW = .55;
  const B = [0, 5.2, 10.9, 16.3, 22.3, 28.0, 33.8, 40];
  const HITS = [10.9, 14.49, 19.9, 33.8], TOUCH = 14.49, HALDI = 19.9, BEAT = 60 / 84, PH = .202;
  const $ = id => document.getElementById(id);
  const clamp = (x, a = 0, b = 1) => x < a ? a : x > b ? b : x, mix = (a, b, t) => a + (b - a) * t, prog = (t, a, b) => clamp((t - a) / (b - a));
  const E = {
    inOut: x => x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2, sine: x => -(Math.cos(Math.PI * x) - 1) / 2,
    out3: x => 1 - Math.pow(1 - x, 3), out4: x => 1 - Math.pow(1 - x, 4), out5: x => 1 - Math.pow(1 - x, 5), in3: x => x * x * x, in2: x => x * x,
    expo: x => x >= 1 ? 1 : 1 - Math.pow(2, -10 * x), smooth: x => x * x * (3 - 2 * x)
  };
  function rng(seed) { let a = seed >>> 0; return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  const STILL = /still/.test(location.search), DPR = +(new URLSearchParams(location.search).get("dpr") || 1), TAU = Math.PI * 2, fract = x => ((x % 1) + 1) % 1;
  const pulse = t => Math.exp(-fract((t - PH) / BEAT) * BEAT / .16);     // 1 on each beat, decays

  const SC = [null, ...[1, 2, 3, 4, 5, 6, 7].map(i => $("s" + i))], CAM = [null, ...[1, 2, 3, 4, 5, 6, 7].map(i => $("c" + i))];
  const start = k => k === 1 ? 0 : B[k - 1] - HW, end = k => k === 7 ? DUR + .1 : B[k] + HW;
  const PL = {};   // lines per auto-wrapped paragraph

  /* ---- text reveal helpers ---- */
  function rise(el, t, t0, d, o = {}) {
    const k = clamp((t - t0) / d), e = (o.ease || E.out4)(k), dist = o.dist == null ? 1.4 : o.dist;
    if (k >= 1) { el.style.transform = "none"; el.style.opacity = 1; el.style.filter = "none"; return; }
    el.style.transform = `translateY(${((1 - e) * dist * 100).toFixed(2)}%)`;
    el.style.opacity = clamp(k / (o.fade || .4)).toFixed(3);
    const b = (1 - e) * (o.blur == null ? 7 : o.blur); el.style.filter = b > .15 ? `blur(${b.toFixed(2)}px)` : "none";
  }
  function setT(el, tx, ty, s = 1, r = 0, o = 1) { el.style.transform = `translate(${tx.toFixed(2)}px,${ty.toFixed(2)}px) scale(${s.toFixed(5)}) rotate(${r.toFixed(3)}deg)`; el.style.opacity = o.toFixed(3); }
  function camera(k, s, tx = 0, ty = 0, ox = 540, oy = 960) {
    if (STILL) { s = 1; tx = ty = 0; }
    const sr = +s.toFixed(5); CAM[k].style.transformOrigin = `${ox}px ${oy}px`; CAM[k].style.transform = `translate(${tx.toFixed(2)}px,${ty.toFixed(2)}px) scale(${sr})`;
    // the art pushes in, the type does not: cancelling the zoom on text groups keeps glyphs on a fixed raster (no pixel stair-stepping while it drifts)
    const g = $("g" + k); if (g) { g.style.transformOrigin = `${ox}px ${oy}px`; g.style.transform = `scale(${1 / sr}) translate(${(-tx).toFixed(2)}px,${(-ty).toFixed(2)}px)`; }
  }
  const ids = (p, a) => [...a].map(c => $(p + c));

  /* ============ scenes: tau = seconds since the scene's own start ============ */
  const S = {};
  S[1] = t => {
    camera(1, mix(1, 1.05, t / 5.75), 0, 0, 540, 880);
    const ban = E.out5(prog(t, .15, 1.9)); setT($("s1banw"), 0, -430 * (1 - ban), 1, 0, 1);
    rise($("s1inv"), t, 1.3, 1.3, { dist: .5, blur: 5 });
    const g = $("s1gan"), gk = E.out4(prog(t, .7, 2.5)), br = STILL ? 1 : 1 + .012 * Math.sin(t * TAU / 4.2) * gk;
    setT(g, 0, 70 * (1 - gk), mix(.93, 1, gk) * br, 0, clamp(gk * 2));
    const h = $("s1halo"), hk = E.out3(prog(t, .9, 2.8)); setT(h, 0, 0, mix(.7, 1, hk) * (1 + .03 * pulse(t)), 0, hk * (.8 + .12 * Math.sin(t * 1.3)));
    // calligraphy: written left to right
    const c = $("s1cal"), ck = E.sine(prog(t, 2.3, 4.2)), sf = .16, edge = mix(-sf * 100, 100 + 1, ck);
    const m = `linear-gradient(90deg,#000 ${edge - sf * 100}%,transparent ${edge}%)`;
    c.style.webkitMaskImage = c.style.maskImage = ck >= 1 ? "none" : m; c.style.opacity = clamp(ck * 5);
    c.style.transform = `translateY(${(1 - E.out3(prog(t, 2.3, 3.6))) * 22}px)`;
  };
  S[2] = t => {
    const k = clamp(t / 6.8), img = $("s2img");
    img.style.transform = STILL ? "none" : `scale(${mix(1.2, 1, E.out3(prog(t, 0, 5.8))).toFixed(5)}) translate(${mix(-26, 0, E.out3(k))}px,${mix(14, 0, E.out3(k))}px)`;
    camera(2, mix(1, 1.035, k), 0, 0, 540, 960);
    rise($("s2t"), t, 1.45, 1.1, { dist: .4, blur: 4 });
    rise($("s2a"), t, 1.75, 1.15); rise($("s2b"), t, 2.15, 1.15); rise($("s2c"), t, 2.55, 1.15);
    rise($("s2d"), t, 3.45, 1.1, { dist: .5, blur: 4 }); rise($("s2e"), t, 3.7, 1.1, { dist: .5, blur: 4 });
    rise($("s2f"), t, 4.3, 1.2, { dist: 1.2 });
    $("s2glow").style.opacity = (.55 + .45 * Math.sin(t * 1.1)).toFixed(3);
  };
  const hl = $("s3hl"), hr = $("s3hr"), hf = $("s3hf");
  S[3] = t => {
    camera(3, mix(1, 1.04, E.sine(clamp(t / 6.5))), 0, 0, 540, 1100);
    rise($("s3a"), t, 1.2, 1.2); rise($("s3b"), t, 1.8, 1.1, { dist: .5, blur: 4 }); rise($("s3c"), t, 2.05, 1.1, { dist: .5, blur: 4 });
    rise($("s3d"), t, 2.6, 1.2); rise($("s3e"), t, 3.2, 1.1, { dist: .5, blur: 4 }); rise($("s3f"), t, 3.45, 1.1, { dist: .5, blur: 4 });
    // the two hands travel toward each other and touch on a beat (14.49 s)
    const meet = TOUCH - start(3), a = E.out4(prog(t, 1.0, meet)), op = clamp(prog(t, 1.0, 1.9)), bob = Math.sin(t * 1.6) * 5 * (1 - a);
    if (t < meet) {
      hf.style.display = "none"; hl.style.display = hr.style.display = "block";
      const dl = 1 - a; setT(hl, -360 * dl, -230 * dl + bob, 1, 0, op); setT(hr, 340 * dl, 240 * dl - bob, 1, 0, op);
    } else {
      hf.style.display = "block"; hl.style.display = hr.style.display = "none";
      const settle = E.out3(prog(t, meet, meet + 1.2)); setT(hf, 0, 0, STILL ? 1 : 1 + .012 * settle, 0, 1);
    }
    const gl = $("s3glow"), gk = t < meet ? 0 : Math.exp(-(t - meet) / .9); gl.style.opacity = clamp(gk * 1.1).toFixed(3);
    gl.style.transform = `translate(2px,4px) scale(${(1 + (1 - gk) * .6).toFixed(3)})`;
  };
  S[4] = t => {
    camera(4, mix(1.0, 1.045, clamp(t / 7.1)), 0, 0, 540, 1200);
    rise($("s4a"), t, 1.2, 1.0, { dist: .4, blur: 4 }); rise($("s4b"), t, 1.4, 1.2, { dist: 1.2 }); rise($("s4c"), t, 2.0, 1.0, { dist: .5, blur: 4 });
    for (let i = 0; i < (PL.s4p || 0); i++) rise($("s4p_" + i), t, 2.5 + i * .28, 1.1, { dist: .5, blur: 4 });
    rise($("s4d"), t, 3.3, 1.1, { dist: .5, blur: 4 }); rise($("s4e"), t, 3.55, 1.1, { dist: .5, blur: 4 });
    // the turmeric hands and the thali rise into place; on the musical drop (19.9 s) the haldi "lands" with a warm burst
    const bt = t - (HALDI - start(4)), thump = STILL || bt < 0 ? 0 : .03 * Math.exp(-bt / .28);
    const hk = E.out5(prog(t, .9, 3.1)); setT($("s4hw"), 0, 300 * (1 - hk), mix(1.05, 1, hk) * (1 + thump), -2 * (1 - hk), clamp(prog(t, .9, 1.6)));
    const bk = E.out5(prog(t, 1.4, 3.5)); setT($("s4bw"), 0, 340 * (1 - bk), mix(.94, 1, bk) * (1 + thump * .8), 0, clamp(prog(t, 1.4, 2.1)));
    $("s4sun").style.opacity = (E.out3(prog(t, 1.2, 3.6)) * (.55 + .25 * pulse(t + 15.75)) + (bt < 0 ? 0 : .6 * Math.exp(-bt / .7))).toFixed(3);
    const fl = clamp(bk * 1.4) * (.75 + .25 * Math.sin(t * 9) * Math.sin(t * 5.3) + .1 * Math.sin(t * 17)); $("s4flame").style.opacity = fl.toFixed(3); $("s4flame").style.transform = `translateY(${(340 * (1 - bk)).toFixed(1)}px)`;
  };
  S[5] = t => {
    camera(5, 1 + .0045 * t, 0, 0, 540, 1000);
    rise($("s5a"), t, 1.2, 1.0, { dist: .4, blur: 4 }); rise($("s5b"), t, 1.4, 1.2, { dist: 1.2 }); rise($("s5c"), t, 2.0, 1.0, { dist: .5, blur: 4 });
    rise($("s5d"), t, 2.4, 1.1, { dist: .5, blur: 4 }); rise($("s5e"), t, 2.65, 1.1, { dist: .5, blur: 4 }); rise($("s5f"), t, 3.2, 1.1, { dist: .5, blur: 4 }); rise($("s5g"), t, 3.45, 1.1, { dist: .5, blur: 4 });
        // the henna hands glide in from the right, then slip away to the right before the match cut
    const ek = E.out4(prog(t, .8, 3.0)), ex = E.smooth(prog(t, 4.7, 5.8));
    setT($("s5aw"), 520 * (1 - ek) + 640 * ex, 70 * (1 - ek) + 60 * ex, 1, 3 * (1 - ek), clamp(prog(t, .8, 1.5)) * (1 - ex));
    $("g5").style.opacity = (1 - E.smooth(prog(t, 4.9, 5.6))).toFixed(3);
  };
  S[6] = t => {
    camera(6, 1 + .0045 * (t + 5.7), 0, 0, 540, 1000);
    rise($("s6a"), t, 1.2, 1.0, { dist: .4, blur: 4 }); rise($("s6b"), t, 1.4, 1.2, { dist: 1.2 }); rise($("s6c"), t, 2.0, 1.0, { dist: .5, blur: 4 });
    for (let i = 0; i < (PL.s6p || 0); i++) rise($("s6p_" + i), t, 2.4 + i * .28, 1.1, { dist: .5, blur: 4 });
    rise($("s6d"), t, 3.4, 1.2, { dist: 1.2 }); rise($("s6e"), t, 3.65, 1.2, { dist: 1.2 });
    const ck = E.out5(prog(t, .7, 3.0)); setT($("s6cw"), 0, 280 * (1 - ck), mix(.96, 1, ck) * (STILL ? 1 : 1 + .008 * Math.sin(t * .8)), 0, clamp(ck * 2.5));
    $("s6glow").style.opacity = (E.out3(prog(t, 1.2, 3.4)) * (.7 + .3 * pulse(t + 27.45))).toFixed(3);
  };
  S[7] = t => {
    camera(7, mix(1.0, 1.05, E.sine(clamp(t / 6.75))), 0, 0, 540, 1100);
    rise($("s7a"), t, 1.25, 1.2); rise($("s7b"), t, 1.5, 1.2);
    rise($("s7c"), t, 2.15, 1.1, { dist: .5, blur: 4 }); rise($("s7d"), t, 2.4, 1.1, { dist: .5, blur: 4 });
    for (let i = 0; i < (PL.s7p || 0); i++) rise($("s7p_" + i), t, 4.0 + i * .28, 1.1, { dist: .5, blur: 4 });
    $("s7arch").style.opacity = E.out3(prog(t, .9, 2.4)).toFixed(3);
    const kk = E.out5(prog(t, .8, 3.4)); const ko = clamp(prog(t, .8, 1.6)); setT($("s7ka"), 0, 60 * (1 - kk), mix(1.08, 1, kk), 0, ko); setT($("s7kb"), 0, 60 * (1 - kk), mix(1.08, 1, kk), 0, ko);
    $("s7glow").style.opacity = (E.out3(prog(t, 1.4, 3.6)) * (.7 + .3 * pulse(t + 33.25))).toFixed(3);
  };

  /* ============ transitions ============ */
  let ARCH = null, ARCHD = null;
  const maskArch = (el, s) => {
    if (s == null) { el.style.webkitMaskImage = el.style.maskImage = "none"; return; }
    const w = 978 * s, h = 1675 * s, x = 541 - 489 * s, y = 959.5 - 837.5 * s;
    el.style.webkitMaskImage = el.style.maskImage = "url(assets/s2-mask.svg)"; el.style.webkitMaskRepeat = el.style.maskRepeat = "no-repeat";
    el.style.webkitMaskSize = el.style.maskSize = `${w}px ${h}px`; el.style.webkitMaskPosition = el.style.maskPosition = `${x}px ${y}px`;
  };
  const FXQ = { archS: 0, archA: 0, bloom: 0, streak: 0, flash: 0, ring: null };   // per-frame instructions for the canvas
  function clearSC() { document.getElementById("stage").style.background = "#1d0907"; for (let k = 1; k <= 7; k++) { const s = SC[k]; s.style.opacity = 1; s.style.transform = "none"; s.style.transformOrigin = ""; s.style.filter = "none"; s.style.webkitMaskImage = s.style.maskImage = "none"; s.style.zIndex = k; } }
  function transitions(t) {
    FXQ.archA = 0; FXQ.bloom = 0; FXQ.streak = 0; FXQ.flash = 0; FXQ.rgb = "255,224,170";
    document.getElementById("hbg").setAttribute("stdDeviation", "0 0");
    for (let k = 2; k <= 7; k++) {
      const c = B[k - 1], p = (t - (c - HW)) / (2 * HW); if (p <= 0 || p >= 1) continue;
      const a = SC[k - 1], b = SC[k];
      if (k === 2) {                                         // the portrait grows out of the blessing, arch first
        const sc = mix(.05, 1, E.out3(p)); maskArch(b, sc);
        CAM[2].style.transformOrigin = "541px 959.5px"; CAM[2].style.transform = `scale(${sc.toFixed(4)})`; b.style.opacity = clamp(p * 12).toFixed(3);
        const q = prog(p, 0, .6); a.style.opacity = (1 - E.smooth(q)).toFixed(3); a.style.transform = `scale(${mix(1, 1.12, E.sine(q)).toFixed(4)})`;
        FXQ.archS = sc; FXQ.archA = Math.sin(Math.PI * clamp(p * .92 + .04)) * .95; document.getElementById("stage").style.background = "#fff8ed";
      } else if (k === 3) {                                  // the same arch opens again and carries the next scene
        const e = E.sine(p), s = .8 * Math.pow(3.6 / .8, e); maskArch(b, s); b.style.opacity = E.smooth(prog(p, 0, .3)).toFixed(3);
        a.style.transform = `scale(${mix(1, 1.07, e).toFixed(4)})`; $("g2").style.opacity = (1 - E.smooth(prog(p, 0, .35))).toFixed(3); FXQ.archS = s; FXQ.archA = Math.sin(Math.PI * clamp(p * 1.05)) * .95;
        FXQ.flash = Math.exp(-Math.pow((p - .5) / .09, 2)) * .25;
      } else if (k === 4) {                                  // golden light blooms and carries the eye through the knot into the temple
        const e = E.smooth(prog(p, .28, .72)); b.style.opacity = e.toFixed(3); $("g3").style.opacity = (1 - E.smooth(prog(p, 0, .4))).toFixed(3);
        a.style.transformOrigin = "540px 1150px"; a.style.transform = `scale(${mix(1, 1.16, E.in2(p)).toFixed(4)})`;
        b.style.transformOrigin = "540px 1060px"; b.style.transform = `scale(${mix(1.14, 1, E.out3(p)).toFixed(4)})`;
        FXQ.bloom = Math.sin(Math.PI * p); FXQ.rgb = "255,212,110";
      } else if (k === 5) {                                  // whip pan: the journey sets off to the right
        const e = E.inOut(p), v = Math.sin(Math.PI * p);
        a.style.transform = `translateX(${(-W * e).toFixed(2)}px)`; b.style.transform = `translateX(${(W * (1 - e)).toFixed(2)}px)`;
        a.style.filter = b.style.filter = "url(#hb)"; document.getElementById("hbg").setAttribute("stdDeviation", `${(70 * Math.pow(v, 1.4)).toFixed(1)} 0`);
        FXQ.streak = v;
      } else if (k === 6) {                                  // match cut: the white arch stays, only what lives inside it changes
        b.style.opacity = E.smooth(prog(p, .2, .8)).toFixed(3);
      } else if (k === 7) {                                  // we walk through the arch into the reception
        a.style.zIndex = 20; b.style.zIndex = 10;
        const clr = 1 - E.smooth(prog(p, 0, .32)); $("g6").style.opacity = clr.toFixed(3); $("s6cw").style.opacity = clr.toFixed(3); $("s6glow").style.opacity = clr.toFixed(3);
        const e = E.in3(p); a.style.transformOrigin = "541px 1000px"; a.style.transform = `scale(${(1 + 2.6 * e).toFixed(4)})`;
        a.style.opacity = (1 - E.smooth(prog(p, .38, .9))).toFixed(3);
        b.style.transformOrigin = "541px 1000px"; b.style.transform = `scale(${mix(.9, 1, E.out3(p)).toFixed(4)})`;
        FXQ.flash = Math.exp(-Math.pow((p - .5) / .12, 2)) * .5; FXQ.bloom = .5 * Math.sin(Math.PI * p);
      }
    }
  }

  /* ============ particles and light (canvas, above the scenes) ============ */
  const fx = $("fx").getContext("2d"), gr = $("grain"), gctx = gr.getContext("2d");
  const spr = {};
  function sprite(rgb) { if (spr[rgb]) return spr[rgb]; const c = document.createElement("canvas"); c.width = c.height = 128; const g = c.getContext("2d"), r = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    r.addColorStop(0, `rgba(${rgb},1)`); r.addColorStop(.22, `rgba(${rgb},.55)`); r.addColorStop(.55, `rgba(${rgb},.13)`); r.addColorStop(1, `rgba(${rgb},0)`); g.fillStyle = r; g.fillRect(0, 0, 128, 128); return spr[rgb] = c; }
  function glow(x, y, r, rgb, a, op = "lighter") { if (a <= .004) return; fx.globalCompositeOperation = op; fx.globalAlpha = clamp(a); fx.drawImage(sprite(rgb), x - r, y - r, r * 2, r * 2); }
  function star(x, y, r, a, rot, rgb = "255,236,190") {
    glow(x, y, r * 2.2, rgb, a * .55); fx.save(); fx.globalCompositeOperation = "lighter"; fx.globalAlpha = clamp(a); fx.translate(x, y); fx.rotate(rot); fx.fillStyle = `rgb(${rgb})`;
    fx.beginPath(); fx.moveTo(0, -r); fx.quadraticCurveTo(r * .1, -r * .1, r, 0); fx.quadraticCurveTo(r * .1, r * .1, 0, r); fx.quadraticCurveTo(-r * .1, r * .1, -r, 0); fx.quadraticCurveTo(-r * .1, -r * .1, 0, -r); fx.fill(); fx.restore(); }
  const PAL = { marigold: [["#f6a21e", "#e0701a"], ["#f9c04b", "#ee8d22"], ["#ffd36b", "#f4a02a"]], rose: [["#f4b6c6", "#e07f9e"], ["#fbd3dc", "#ee9db3"], ["#f7c1cf", "#d9728f"]] };
  function petal(x, y, s, rot, flip, c1, c2, a) {
    fx.save(); fx.globalCompositeOperation = "source-over"; fx.translate(x, y); fx.rotate(rot); fx.scale(flip, 1); fx.globalAlpha = clamp(a);
    const g = fx.createLinearGradient(0, -s, 0, s); g.addColorStop(0, c1); g.addColorStop(1, c2); fx.fillStyle = g;
    fx.beginPath(); fx.moveTo(0, -s); fx.bezierCurveTo(s * .95, -s * .55, s * .8, s * .55, 0, s); fx.bezierCurveTo(-s * .8, s * .55, -s * .95, -s * .55, 0, -s); fx.fill();
    fx.globalAlpha = clamp(a) * .3; fx.strokeStyle = "#fff"; fx.lineWidth = Math.max(.6, s * .045); fx.beginPath(); fx.moveTo(0, -s * .78); fx.lineTo(0, s * .66); fx.stroke(); fx.restore(); }

  const R0 = rng(7), DUST = Array.from({ length: 95 }, () => ({ x: R0() * W, y: R0() * (H + 200), v: 9 + R0() * 30, s: 1.2 + R0() * 3.6, ph: R0() * TAU, sw: 12 + R0() * 40, tw: .4 + R0() * 1.2 }));
  const R1 = rng(21), PET = Array.from({ length: 46 }, () => ({ x: R1() * W, y: R1() * H, vy: 70 + R1() * 90, vx: -20 + R1() * 40, s: 12 + R1() * 22, ph: R1() * TAU, rot: R1() * TAU, spin: 1 + R1() * 3, pal: Math.floor(R1() * 3), kind: R1() > .45 ? "marigold" : "rose" }));
      const SPARK1 = [[300, 700, 0], [790, 640, 1.3], [200, 1010, 2.2], [880, 1010, .7], [330, 520, 3.1], [760, 1180, 2.6], [540, 470, 1.9], [440, 380, .4]];

  function sceneAt(t) { let k = 1; for (let i = 2; i <= 7; i++) if (t >= B[i - 1]) k = i; return k; }
  function drawFx(t) {
    fx.setTransform(DPR, 0, 0, DPR, 0, 0); fx.clearRect(0, 0, W, H); fx.globalAlpha = 1;
    const cur = sceneAt(t), dark = [0, 0, 1, 1, 1, 1, 1, 0][cur];
    /* drifting gold dust: soft motes rising slowly */
    const dv = clamp(prog(t, .8, 2.4)) * (cur === 1 ? .5 : 1);
    for (const d of DUST) {
      const y = ((d.y - d.v * t) % (H + 200) + (H + 200)) % (H + 200) - 100, x = d.x + Math.sin(t * .35 + d.ph) * d.sw, tw = .35 + .65 * (.5 + .5 * Math.sin(t * d.tw * 2 + d.ph));
      if (dark) glow(x, y, d.s * 4.2, "255,208,140", .42 * tw * dv); else glow(x, y, d.s * 3.6, "230,160,70", .32 * tw * dv, "source-over");
    }
    /* S1: sparkles around Ganesha */
    if (t < 6) SPARK1.forEach(([x, y, ph], i) => { const a = clamp(prog(t, 1.4 + i * .18, 2.2 + i * .18)) * clamp(1 - prog(t, 4.9, 5.7)) * Math.pow(.5 + .5 * Math.sin(t * 2.2 + ph * 2), 3); star(x + Math.sin(t * .3 + ph) * 8, y - t * 4, 10 + 8 * (i % 3), a, t * .3 + ph, "255,226,170"); });
    /* S5: marigold and rose petals blow past with the baraat; S7: they fall gently over the couple */
    const petalRun = (t0, t1, mode, amt) => {
      const a = clamp(prog(t, t0, t0 + 1.4)) * clamp(1 - prog(t, t1 - 1.2, t1)); if (a <= .01) return;
      PET.forEach((p, i) => {
        if (i >= amt) return; const tt = t - t0;
        let x, y; if (mode === "wind") { x = ((p.x + 150 + 340 * tt * (.7 + p.vy / 240)) % (W + 300)) - 150; x = W - x; y = ((p.y + 30 * tt * p.vx / 20 + Math.sin(tt * 1.3 + p.ph) * 60) % (H + 100) + H + 100) % (H + 100) - 50; }
        else { x = ((p.x + p.vx * tt + Math.sin(tt * .9 + p.ph) * 70) % (W + 100) + W + 100) % (W + 100) - 50; y = ((p.y + p.vy * .55 * tt) % (H + 140)) - 70; }
        const flip = Math.cos(tt * (2 + p.spin) + p.ph), pal = PAL[p.kind][p.pal];
        petal(x, y, p.s * (mode === "wind" ? .9 : 1), p.rot + tt * p.spin * .5, Math.abs(flip) < .18 ? .18 : flip, pal[0], pal[1], a * .9);
      });
    };
    petalRun(20.1, 22.4, "fall", 14); petalRun(28.6, 34.2, "fall", 26); petalRun(35.2, 40.6, "fall", 18);
    /* S5: a glint rides the tip of the henna cone as the pattern is drawn */
    if (t > 24.5 && t < 26.5) {
      const a = clamp(prog(t, 24.5, 25.2)) * clamp(1 - prog(t, 25.9, 26.45)), tt = t - 24.5;
      const tx = 710 + Math.sin(tt * 1.7) * 14, ty = 1357 + Math.cos(tt * 2.1) * 8;
      glow(tx, ty, 70 + 25 * pulse(t), "255,214,140", .7 * a); star(tx, ty, 22 + 10 * pulse(t), a * (.6 + .4 * Math.sin(tt * 5)), tt * .6);
      for (let i = 0; i < 14; i++) { const u = fract(tt * .55 + i / 14), x = tx - u * 360 + Math.sin(i * 3 + tt) * 18, y = ty + u * 160 + Math.cos(i * 2 + tt) * 14;
        glow(x, y, 5 + 6 * (1 - u), "255,200,120", a * (1 - u) * .8); }
    }
    /* S4: the haldi burst on the musical drop (19.9 s) */
    const hb = t - HALDI;
    if (hb > -.6 && hb < 2.6) {
      const k = clamp(hb / 1.3);
      glow(540, 1340, 240 + 700 * k, "255,196,50", hb < 0 ? clamp((hb + .6) / .6) * .15 : (1 - k) * .55);
      if (hb >= 0) {
        fx.save(); fx.globalCompositeOperation = "lighter"; fx.globalAlpha = (1 - k) * .7; fx.strokeStyle = "rgb(255,214,100)"; fx.lineWidth = 3 + 6 * (1 - k); fx.beginPath(); fx.arc(540, 1340, 40 + 600 * E.out3(k), 0, TAU); fx.stroke(); fx.restore();
        const r = rng(44); for (let i = 0; i < 80; i++) { const ang = r() * TAU, sp = 140 + r() * 640, d = sp * E.out3(clamp(hb / (1.4 + r()))), sz = 5 + r() * 10;
          glow(540 + Math.cos(ang) * d, 1340 + Math.sin(ang) * d * .85 + 60 * hb * hb, sz, r() > .5 ? "255,196,40" : "255,150,40", (1 - clamp(hb / 2)) * (.45 + .55 * Math.sin(hb * 9 + i))); }
        star(540, 1340, 90 * (1 - E.out3(clamp(hb / 1.1))) + 16, Math.exp(-hb / .45) * .9, Math.PI / 4, "255,226,150");
      }
    }
    /* the touch: ring of light, spark burst and a lens glint where the fingertips meet */
    const th = t - TOUCH;
    if (th > -.9 && th < 2.6) {
      const k = clamp(th / 1.1), prePull = clamp((th + .9) / .9);
      glow(542, 1354, 90 + 260 * k, "255,226,170", (th < 0 ? prePull * .25 : (1 - k) * .75 + .15 * Math.exp(-th / 1.6)));
      if (th >= 0) {
        fx.save(); fx.globalCompositeOperation = "lighter"; fx.globalAlpha = (1 - k) * .8; fx.strokeStyle = "rgb(255,230,170)"; fx.lineWidth = 3 + 5 * (1 - k); fx.beginPath(); fx.arc(542, 1354, 30 + 520 * E.out3(k), 0, TAU); fx.stroke(); fx.restore();
        const r = rng(91); for (let i = 0; i < 46; i++) { const ang = r() * TAU, sp = 120 + r() * 520, d = sp * E.out3(clamp(th / (1.3 + r())));
          glow(542 + Math.cos(ang) * d, 1354 + Math.sin(ang) * d * .8 + 40 * th * th, 4 + r() * 8, "255,222,150", (1 - clamp(th / 1.8)) * (.5 + .5 * Math.sin(th * 14 + i))); }
        star(542, 1354, 70 * (1 - E.out3(clamp(th / 1.2))) + 14, Math.exp(-th / .5), Math.PI / 4);
        star(542, 1354, 120 * (1 - E.out3(clamp(th / 1.0))) + 10, Math.exp(-th / .45) * .8, 0);
      }
    }
    /* the flower in her palm glows softly once the hands have met */
    if (th > 0 && t < 15.8) { const a = E.out3(clamp(th / 1.2)) * (.35 + .12 * Math.sin(th * 3)) * clamp((15.7 - t) / .5); glow(787, 1410, 140, "255,120,90", a); }
    /* arch edge: a gold line tracing the opening arch */
    if (FXQ.archA > .01 && ARCH) {
      const s = FXQ.archS; fx.save(); fx.globalCompositeOperation = "lighter"; fx.translate(541 - 489 * s, 959.5 - 837.5 * s); fx.scale(s, s); fx.lineJoin = "round";
      fx.globalAlpha = FXQ.archA * .7; fx.strokeStyle = "rgb(255,208,130)"; fx.lineWidth = 14 / s; fx.filter = "blur(6px)"; fx.stroke(ARCH);
      fx.filter = "none"; fx.globalAlpha = FXQ.archA; fx.strokeStyle = "rgb(255,236,190)"; fx.lineWidth = 3 / s; fx.stroke(ARCH); fx.restore();
      const r = rng(5), p = (t - (B[sceneAt(t) - 1] - HW)) / (2 * HW); for (let i = 0; i < 40; i++) { const ang = r() * TAU, d = (120 + 700 * clamp(p)) * (.4 + r() * .9) * s / 1.4;
        glow(541 + Math.cos(ang) * d * .75, 960 + Math.sin(ang) * d * 1.1, 6 + r() * 12, "255,224,160", FXQ.archA * .7 * (.4 + .6 * Math.sin(p * 9 + i))); }
    }
    /* light bloom (T3, T6) */
    if (FXQ.bloom > .01) { const b = FXQ.bloom; glow(540, 1060, 650 + 1250 * b, FXQ.rgb, .62 * b); glow(540, 1060, 260 + 520 * b, "255,244,222", .5 * b);
      fx.globalCompositeOperation = "lighter"; fx.globalAlpha = .2 * b; fx.fillStyle = "rgb(255,214,160)"; fx.fillRect(0, 0, W, H); }
    /* whip-pan streaks (T4) */
    if (FXQ.streak > .02) { const r = rng(13); for (let i = 0; i < 14; i++) { const y = r() * H, len = 300 + r() * 600, x = ((r() * W * 2 - W + (t * 900) * (.5 + r())) % (W + len)) - len / 2;
        const g = fx.createLinearGradient(x - len / 2, 0, x + len / 2, 0); g.addColorStop(0, "rgba(255,220,160,0)"); g.addColorStop(.5, `rgba(255,228,180,${(.28 * FXQ.streak).toFixed(3)})`); g.addColorStop(1, "rgba(255,220,160,0)");
        fx.globalCompositeOperation = "lighter"; fx.globalAlpha = 1; fx.fillStyle = g; fx.fillRect(x - len / 2, y, len, 2 + r() * 3); } }
    /* the camera flash that rides on the big musical hits */
    if (FXQ.flash > .01) { fx.globalCompositeOperation = "lighter"; fx.globalAlpha = FXQ.flash; fx.fillStyle = "rgb(255,238,208)"; fx.fillRect(0, 0, W, H); }
    fx.globalAlpha = 1; fx.globalCompositeOperation = "source-over";
  }
  function grain(n) {
    const id = gctx.createImageData(W, H), d = id.data, r = rng(1000 + n % 7);
    for (let i = 0; i < d.length; i += 4) { const v = r() * 255 | 0; d[i] = d[i + 1] = d[i + 2] = v; d[i + 3] = 9; }
    gctx.putImageData(id, 0, 0);
  }

  /* ============ the frame ============ */
  window.renderAt = function (t, n) {
    clearSC();
    for (let k = 1; k <= 7; k++) {
      const vis = t >= start(k) - .001 && t < end(k); SC[k].style.display = vis ? "block" : "none";
      if (vis) S[k](t - start(k));
    }
    transitions(t);
    drawFx(t);
    if (/grain/.test(location.search)) grain(n == null ? Math.round(t * 30) : n);   // off by default: per-frame noise multiplies the bitrate
    // global fade in from deep maroon and out to it
    const fin = 1 - E.sine(prog(t, .1, 1.6)), fout = E.sine(prog(t, DUR - 1.3, DUR - .05));
    $("fade").style.opacity = Math.max(fin, fout).toFixed(3);
  };

  /* ---- boot ---- */
  async function boot() {
    $("fx").width = W * DPR; $("fx").height = H * DPR;
    const loads = ["400 20px Fraunces", "600 112px Fraunces", "400 20px 'Cormorant Garamond'", "500 20px 'Cormorant Garamond'", "600 20px 'Cormorant Garamond'", "500 20px Inter", "600 20px Inter", "400 20px 'Noto Sans Devanagari'"];
    await Promise.all(loads.map(f => document.fonts.load(f, "AaBb॥NEELESH")));
    await document.fonts.ready;
    // wrap paragraphs into their natural lines so each line can be revealed on its own
    document.querySelectorAll(".para").forEach(P => {
      const probe = document.createElement("div"); probe.className = "probe " + P.dataset.cls; probe.style.width = P.dataset.w + "px";
      probe.innerHTML = P.dataset.text.split(" ").map(w => `<span>${w}</span>`).join(" "); document.body.appendChild(probe);
      const lines = []; let last = null; probe.querySelectorAll("span").forEach(s => { const tp = s.offsetTop; if (tp !== last) { lines.push([]); last = tp; } lines[lines.length - 1].push(s.textContent); });
      probe.remove();
      lines.forEach((ws, i) => { const rv = document.createElement("div"); rv.className = "rv"; rv.style.top = (+P.dataset.top + i * +P.dataset.lh) + "px"; const p = document.createElement("p"); p.className = P.dataset.cls; p.id = P.id + "_" + i; p.textContent = ws.join(" "); rv.appendChild(p); P.parentNode.insertBefore(rv, P); });
      PL[P.id] = lines.length; P.remove();
    });
    const svg = await (await fetch("assets/s2-mask.svg")).text(); const d = /\sd="([^"]+)"/.exec(svg)[1]; ARCH = new Path2D(d);
    await Promise.all([...document.images].map(i => i.decode().catch(() => 0)));
    window.RENDER_READY = true;
  }
  boot();
})();
