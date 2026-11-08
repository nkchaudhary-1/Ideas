/* Reveals, scroll-scrubbed transitions, pointer parallax and one canvas for light and petals. No dependencies.
   Everything animated is optional: with reduced motion, or without JavaScript, the page shows every screen in its finished state. */
(() => {
  const doc = document.documentElement;
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const force = /[?&]force=1/.test(location.search);        // test hook (?force=1): every screen at rest, no canvas
  const motion = !reduced && !force;
  const fine = matchMedia("(hover:hover) and (pointer:fine)").matches;
  const clamp = (x, a = 0, b = 1) => x < a ? a : x > b ? b : x, lerp = (a, b, t) => a + (b - a) * t;
  const ease3 = x => 1 - Math.pow(1 - x, 3), sstep = x => x * x * (3 - 2 * x), TAU = Math.PI * 2;
  const rand = (a, b) => a + Math.random() * (b - a);
  function rng(seed) { let a = seed >>> 0; return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

  const page = document.querySelector(".page"), screens = [...document.querySelectorAll(".screen")];
  const onAt = screens.map(() => -1);

  /* ---------- reveal: a screen turns on once a good part of it is in view (armed when the gate opens) ---------- */
  let gated = doc.classList.contains("gate-on") && !force;
  let burstHook = null;
  function armReveals() {
    if (!motion || !("IntersectionObserver" in window)) { screens.forEach((s, i) => { s.classList.add("on"); onAt[i] = 0; }); return; }
    const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { const i = screens.indexOf(e.target); e.target.classList.add("on"); onAt[i] = performance.now(); io.unobserve(e.target); } }), { threshold: .28 });
    screens.forEach(s => io.observe(s));
  }
  window.__gateReady = true;

  /* ---------- countdown to 9:00 PM IST on 11 December 2026 ---------- */
  const target = new Date("2026-12-11T21:00:00+05:30").getTime(), box = document.getElementById("count");
  const tick = () => {
    const ms = target - Date.now();
    if (ms > 0) { const d = Math.floor(ms / 864e5), h = Math.floor(ms % 864e5 / 36e5); box.textContent = d >= 1 ? `${d} ${d === 1 ? "day" : "days"} to go` : `${h} ${h === 1 ? "hour" : "hours"} to go`; }
    else if (ms > -864e5) box.textContent = "Today is the day"; else box.textContent = "With love and blessings";
  };
  tick(); setInterval(tick, 60000);

  /* ---------- the gate and the song ----------
     Browsers do not let a page start sound on its own, so the tap on the lotus is what starts the song (YouTube's own player, no download). */
  const gate = document.getElementById("gate"), begin = document.getElementById("begin"), soundBtn = document.getElementById("sound"), mainEl = document.querySelector("main");
  const VIDEO = "kwjp52YYlwQ", VOL = 62;
  let yt = null, ytReady = false, ytDead = false, started = false, playing = false, userPaused = false, resume = false, fadeId = 0, audio = null;   // audio: optional local file, used instead of YouTube when present
  const ui = () => { soundBtn.hidden = ytDead || !started; soundBtn.classList.toggle("on", playing); soundBtn.setAttribute("aria-pressed", playing ? "true" : "false"); soundBtn.setAttribute("aria-label", playing ? "Mute music" : "Play music"); };
  const ytFail = e => { console.warn("music unavailable", e && e.data !== undefined ? "YouTube error " + e.data : e || ""); ytDead = true; ui(); };
  function fadeTo(v, ms, done) { cancelAnimationFrame(fadeId); let from = 0; try { from = audio ? audio.volume * 100 : yt.getVolume(); } catch (e) {} const t0 = performance.now(); const step = n => { const k = clamp((n - t0) / ms); try { if (audio) audio.volume = clamp(lerp(from, v, k) / 100); else yt.setVolume(Math.round(lerp(from, v, k))); } catch (e) {} if (k < 1) fadeId = requestAnimationFrame(step); else if (done) done(); }; fadeId = requestAnimationFrame(step); }
  function playMusic() {
    if (audio) { audio.volume = 0; const pr = audio.play(); if (pr && pr.catch) pr.catch(() => { playing = false; ui(); }); fadeTo(VOL, 3200); return; }
    if (!ytReady || ytDead) return; try { yt.unMute(); yt.setVolume(0); yt.playVideo(); fadeTo(VOL, 3200); } catch (e) {}
  }
  function pauseMusic() { if (!audio && !ytReady) return; fadeTo(0, 450, () => { try { if (audio) audio.pause(); else yt.pauseVideo(); } catch (e) {} }); }
  function loadYT() {
    if (!gate && !soundBtn) return;
    window.onYouTubeIframeAPIReady = () => {
      try {
        const opts = { width: 200, height: 200, videoId: VIDEO, host: "https://www.youtube-nocookie.com", playerVars: { autoplay: 0, controls: 0, disablekb: 1, fs: 0, iv_load_policy: 3, modestbranding: 1, playsinline: 1, rel: 0, loop: 1, playlist: VIDEO }, events: {
          onReady: () => { ytReady = true; if (started && !userPaused) playMusic(); ui(); },
          onStateChange: e => { if (e.data === 0) { try { yt.seekTo(0); yt.playVideo(); } catch (x) {} } playing = e.data === 1 || e.data === 3 && started && !userPaused; ui(); },
          onError: ytFail } };
        if (/^https?:$/.test(location.protocol)) opts.playerVars.origin = location.origin;
        yt = new YT.Player("yt", opts);
      } catch (e) { ytFail(); }
    };
    const s = document.createElement("script"); s.src = "https://www.youtube.com/iframe_api"; s.async = true; s.onerror = ytFail; document.head.appendChild(s);
    setTimeout(() => { if (!ytReady) ytFail(); }, 9000);
  }
  soundBtn.addEventListener("click", () => { if (playing) { userPaused = true; pauseMusic(); } else { userPaused = false; playMusic(); } });
  document.addEventListener("visibilitychange", () => { if ((!ytReady && !audio) || !started) return; try { if (document.hidden) { if (playing) { resume = true; audio ? audio.pause() : yt.pauseVideo(); } } else if (resume && !userPaused) { resume = false; audio ? audio.play() : yt.playVideo(); } } catch (e) {} });
  if (gated) {
    mainEl.inert = true;
    fetch("assets/song.mp3", { method: "HEAD" }).then(r => { if (!r.ok) throw 0; audio = new Audio("assets/song.mp3"); audio.loop = true; audio.preload = "auto"; audio.addEventListener("playing", () => { playing = true; ui(); }); audio.addEventListener("pause", () => { playing = false; ui(); }); }).catch(loadYT);
    try { begin.focus({ preventScroll: true }); } catch (e) {}
    gate.addEventListener("keydown", e => { if (e.key === "Tab") { e.preventDefault(); begin.focus({ preventScroll: true }); } });   // keep keyboard focus on the one button
    begin.addEventListener("click", () => {
      if (!gated) return; gated = false; started = true;
      playMusic();                                                 // inside the tap, so the browser allows sound
      const r = begin.getBoundingClientRect(); if (burstHook) burstHook(r.left + r.width / 2, r.top + r.height * .36);
      begin.classList.add("go"); gate.classList.add("lift"); doc.classList.remove("gated"); mainEl.inert = false; scrollTo(0, 0);
      armReveals(); ui();
      setTimeout(() => { if (!playing && ytReady && !userPaused) ui(); }, 1800);   // if the browser still refused, the toggle offers Play
      setTimeout(() => gate.remove(), 2200);
    });
  } else armReveals();

  if (!motion) return;

  /* ---------- state shared by the frame loop ---------- */
  const st = screens.map((el, i) => ({ el, i, p: -1, top: 0, bottom: 0, left: 0, w: 1, h: 1, u: 1, vis: false }));
  const parItems = [...document.querySelectorAll("[data-par],[data-pm]")].map(el => ({ el, k: parseFloat(el.dataset.par || 0), pm: parseFloat(el.dataset.pm || 0), s: st[screens.indexOf(el.closest(".screen"))] }));
  let mx = 0, my = 0, cx = 0, cy = 0;
  if (fine) addEventListener("pointermove", e => { mx = (e.clientX / innerWidth - .5) * 2; my = (e.clientY / innerHeight - .5) * 2; }, { passive: true });

  /* ---------- canvas ---------- */
  const cv = document.getElementById("fx"), g = cv.getContext("2d");
  let W = 0, H = 0, dpr = 1;
  const size = () => { dpr = Math.min(devicePixelRatio || 1, 1.5); W = innerWidth; H = innerHeight; cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); g.setTransform(dpr, 0, 0, dpr, 0, 0); };
  size(); addEventListener("resize", size);

  const glowSpr = {};
  const glowSprite = rgb => glowSpr[rgb] || (glowSpr[rgb] = (() => { const c = document.createElement("canvas"); c.width = c.height = 96; const x = c.getContext("2d"), r = x.createRadialGradient(48, 48, 0, 48, 48, 48); r.addColorStop(0, `rgba(${rgb},1)`); r.addColorStop(.24, `rgba(${rgb},.5)`); r.addColorStop(.6, `rgba(${rgb},.13)`); r.addColorStop(1, `rgba(${rgb},0)`); x.fillStyle = r; x.fillRect(0, 0, 96, 96); return c; })());
  function glow(x, y, r, rgb, a, comp = "lighter") { if (a < .004 || r < 1) return; g.globalCompositeOperation = comp; g.globalAlpha = clamp(a); g.drawImage(glowSprite(rgb), x - r, y - r, r * 2, r * 2); g.globalAlpha = 1; g.globalCompositeOperation = "source-over"; }

  const PAL = { marigold: [["#f6a21e", "#e0701a"], ["#f9c04b", "#ee8d22"], ["#ffd36b", "#f4a02a"]], rose: [["#f4b6c6", "#e07f9e"], ["#fbd3dc", "#ee9db3"], ["#f7c1cf", "#d9728f"]], gold: [["#fff1c4", "#e2b457"], ["#ffe29b", "#d49a35"]], red: [["#d63a3a", "#a31f2a"]] };
  const petalSpr = {};
  const petalSprite = pal => { const key = pal.join(); return petalSpr[key] || (petalSpr[key] = (() => { const c = document.createElement("canvas"); c.width = c.height = 64; const x = c.getContext("2d"), s = 28; x.translate(32, 32); const gr = x.createLinearGradient(0, -s, 0, s); gr.addColorStop(0, pal[0]); gr.addColorStop(1, pal[1]); x.fillStyle = gr; x.beginPath(); x.moveTo(0, -s); x.bezierCurveTo(s * .95, -s * .55, s * .8, s * .55, 0, s); x.bezierCurveTo(-s * .8, s * .55, -s * .95, -s * .55, 0, -s); x.fill(); x.globalAlpha = .35; x.strokeStyle = "#fff"; x.lineWidth = 1.4; x.beginPath(); x.moveTo(0, -s * .78); x.lineTo(0, s * .66); x.stroke(); return c; })()); };
  const lanternSpr = (() => { const c = document.createElement("canvas"); c.width = 120; c.height = 190; const x = c.getContext("2d"); x.translate(60, 100); const gr = x.createLinearGradient(0, -80, 0, 90); gr.addColorStop(0, "#ffe6a8"); gr.addColorStop(.55, "#ffb44f"); gr.addColorStop(1, "#e2702a"); x.fillStyle = gr; x.beginPath(); x.moveTo(-34, -66); x.quadraticCurveTo(0, -88, 34, -66); x.lineTo(48, 58); x.quadraticCurveTo(0, 80, -48, 58); x.closePath(); x.fill(); x.globalAlpha = .45; x.strokeStyle = "#a5481a"; x.lineWidth = 2; x.beginPath(); x.moveTo(-12, -72); x.lineTo(-19, 66); x.moveTo(12, -72); x.lineTo(19, 66); x.stroke(); x.globalAlpha = 1; x.fillStyle = "#ffd27a"; x.beginPath(); x.ellipse(0, 62, 22, 8, 0, 0, TAU); x.fill(); return c; })();
  function star(x, y, s, a, core) { g.globalAlpha = a; g.fillStyle = core; g.beginPath(); for (let i = 0; i < 8; i++) { const an = i * Math.PI / 4 - Math.PI / 2, rr = i % 2 ? s * .2 : s; g.lineTo(x + Math.cos(an) * rr, y + Math.sin(an) * rr); } g.closePath(); g.fill(); g.globalAlpha = 1; }
  function bird(x, y, s, flap, a) { g.save(); g.translate(x, y); g.globalAlpha = a; g.strokeStyle = "#5b4a52"; g.lineWidth = Math.max(1.2, s * .13); g.lineCap = "round"; g.lineJoin = "round"; const w = Math.sin(flap) * .62; g.beginPath(); g.moveTo(-s, -s * .12 - s * w); g.quadraticCurveTo(-s * .5, -s * .5 - s * w * .6, 0, 0); g.quadraticCurveTo(s * .5, -s * .5 - s * w * .6, s, -s * .12 - s * w); g.stroke(); g.restore(); }

  /* particles. Anchored ones (scr >= 0) live in design pixels and travel with their screen; the rest live in the viewport. */
  const P = [], MAXP = 150;
  function add(o) { if (P.length > MAXP) P.shift(); P.push(Object.assign({ t: 0, max: 3, vx: 0, vy: 0, vr: 0, rot: 0, fl: 0, vf: 0, drag: 1, sw: 0, ph: 0, sa: 0, scr: -1, kind: "m", s: 10, rgb: "255,214,140", pal: PAL.marigold[0], a: 1 }, o)); }
  const palOf = a => a[Math.floor(Math.random() * a.length)];

  /* ---------- fixed layouts (design pixels) for the sparkles, lanterns, birds and glints ---------- */
  const r1 = rng(11), stars1 = Array.from({ length: 22 }, () => { const a = r1() * TAU, d = Math.sqrt(r1()); return { x: 541 + Math.cos(a) * d * 380, y: 720 + Math.sin(a) * d * 470, s: lerp(8, 18, r1()), ph: r1() * TAU, sp: lerp(.9, 2.2, r1()) }; });
  const r3 = rng(33), stars3 = Array.from({ length: 18 }, (_, k) => { const c = k % 2 ? [760, 1470, 150] : [290, 1650, 170], a = r3() * TAU, d = Math.sqrt(r3()); return { x: c[0] + Math.cos(a) * d * c[2], y: c[1] + Math.sin(a) * d * c[2] * .85, s: lerp(7, 15, r3()), ph: r3() * TAU, sp: lerp(1, 2.4, r3()) }; });
  const r5 = rng(55), lanterns = Array.from({ length: 7 }, () => ({ x: lerp(130, 950, r5()), s: lerp(.34, .62, r5()), dur: lerp(15, 22, r5()), off: r5() * 20, drift: lerp(-60, 60, r5()), ph: r5() * TAU }));
  const r6 = rng(66), birds = Array.from({ length: 7 }, () => ({ y: lerp(960, 1240, r6()), s: lerp(9, 16, r6()), sp: lerp(34, 52, r6()), ph: r6() * TAU, x0: lerp(-120, 700, r6()), fr: lerp(5, 7.5, r6()) }));
  const glints = Array.from({ length: 18 }, () => ({ x: lerp(190, 390, r6()), y: lerp(1480, 1890, r6()), s: lerp(6, 13, r6()), ph: r6() * TAU, sp: lerp(1.2, 3, r6()) }));

  /* ---------- the seam effects: one for each transition in the film ---------- */
  const acc = [0, 0, 0, 0, 0, 0];
  function seamFx(k, e, dt, pr, speed) {
    const cxp = pr.left + pr.width / 2, seamY = st[k].top, u = Math.max(.6, pr.width / 540);
    if (k === 1) {            // arch to couple: a fall of petals
      acc[k] += 14 * e * speed * dt; while (acc[k] >= 1) { acc[k]--; add({ kind: "p", x: rand(pr.left, pr.right), y: seamY - rand(0, H * .3), vx: rand(-20, 20), vy: rand(60, 150) * u, s: rand(13, 28) * u, pal: palOf([...PAL.marigold, ...PAL.rose]), max: rand(4, 7), sw: rand(1.2, 2.4), sa: rand(14, 34), ph: rand(0, TAU), vr: rand(-2.5, 2.5), vf: rand(4, 9), a: rand(.6, 1) }); }
    } else if (k === 2) {     // couple to families: gold dust lifting
      acc[k] += 10 * e * speed * dt; while (acc[k] >= 1) { acc[k]--; add({ kind: "m", x: rand(pr.left, pr.right), y: seamY + rand(-.25, .25) * H, vx: rand(-12, 12), vy: -rand(36, 110) * u, s: rand(6, 16) * u, rgb: "255,214,140", max: rand(2.4, 4.4), a: .9 }); }
    } else if (k === 3) {     // families to journey: a bloom of light
      g.save(); g.beginPath(); g.rect(pr.left, 0, pr.width, H); g.clip();
      glow(cxp, seamY, H * .55 * (.4 + e * .6), "255,226,170", .34 * e); glow(cxp, seamY, H * .2, "255,248,230", .42 * e);
      g.globalCompositeOperation = "lighter"; g.globalAlpha = .12 * e; for (let i = 0; i < 12; i++) { const a = i * TAU / 12 + seamY * .0015, len = H * .75; const gr = g.createLinearGradient(cxp, seamY, cxp + Math.cos(a) * len, seamY + Math.sin(a) * len); gr.addColorStop(0, "rgba(255,238,196,.95)"); gr.addColorStop(1, "rgba(255,238,196,0)"); g.fillStyle = gr; g.beginPath(); g.moveTo(cxp, seamY); g.arc(cxp, seamY, len, a - .045, a + .045); g.closePath(); g.fill(); }
      g.globalAlpha = 1; g.globalCompositeOperation = "source-over"; g.restore();
      acc[k] += 14 * e * dt; while (acc[k] >= 1) { acc[k]--; const a = rand(0, TAU), v = rand(70, 240) * u; add({ kind: "m", x: cxp, y: seamY, vx: Math.cos(a) * v, vy: Math.sin(a) * v, drag: .985, s: rand(5, 13) * u, rgb: "255,236,180", max: rand(1.2, 2.2), a: 1 }); }
    } else if (k === 4) {     // journey to baraat: a seam of light and sparks flung sideways
      g.save(); g.beginPath(); g.rect(pr.left, 0, pr.width, H); g.clip();
      glow(cxp, seamY, H * .4 * e + 40, "255,222,160", .2 * e); g.restore();
      acc[k] += 16 * e * speed * dt; while (acc[k] >= 1) { acc[k]--; const sd = Math.random() < .5 ? -1 : 1; add({ kind: "m", x: cxp, y: seamY + rand(-.3, .3) * H, vx: sd * rand(90, 330) * u, vy: rand(-40, 20), drag: .985, s: rand(5, 12) * u, rgb: "255,230,170", max: rand(1.1, 2), a: 1 }); }
    } else if (k === 5) {     // baraat to venue: the lamp flares and marigold petals rise
      g.save(); g.beginPath(); g.rect(pr.left, 0, pr.width, H); g.clip();
      glow(cxp, seamY + H * .2, H * .5 * (.4 + e * .6), "255,196,120", .26 * e); glow(cxp, seamY + H * .2, H * .2, "255,236,180", .3 * e); g.restore();
      acc[k] += 34 * e * speed * dt; while (acc[k] >= 1) { acc[k]--; add({ kind: "p", x: rand(pr.left, pr.right), y: seamY + rand(0, .35) * H, vx: rand(-25, 25), vy: -rand(90, 230) * u, s: rand(12, 26) * u, pal: palOf(PAL.marigold), max: rand(3, 5.5), sw: rand(1.2, 2.4), sa: rand(14, 30), ph: rand(0, TAU), vr: rand(-3, 3), vf: rand(4, 9), a: rand(.65, 1) }); }
    }
  }

  /* a small shower of petals for a real tap only: short, nearly still, and no scrolling in between.
     Touching the screen to scroll is not a tap, so swipes never set it off. */
  let down = null, lastBurst = 0;
  page.addEventListener("pointerdown", e => { down = e.target.closest("a,button") ? null : { x: e.clientX, y: e.clientY, t: performance.now(), sy: scrollY }; }, { passive: true });
  page.addEventListener("pointercancel", () => { down = null; }, { passive: true });
  page.addEventListener("pointerup", e => {
    const d = down; down = null; if (!d) return; const now = performance.now();
    if (Math.hypot(e.clientX - d.x, e.clientY - d.y) > 10 || now - d.t > 350 || Math.abs(scrollY - d.sy) > 2 || now - lastBurst < 900) return;
    lastBurst = now; window.__bursts = (window.__bursts || 0) + 1;
    const u = Math.max(.7, page.getBoundingClientRect().width / 540);
    for (let i = 0; i < 10; i++) { const a = rand(-Math.PI * .95, -Math.PI * .05), v = rand(120, 320) * u; add({ kind: "p", x: e.clientX, y: e.clientY, vx: Math.cos(a) * v, vy: Math.sin(a) * v, drag: .985, g: 420 * u, s: rand(12, 22) * u, pal: palOf([...PAL.marigold, ...PAL.rose, ...PAL.gold]), max: rand(1.6, 2.6), sw: rand(1, 2), sa: 10, ph: rand(0, TAU), vr: rand(-5, 5), vf: rand(5, 11), a: 1 }); }
    for (let i = 0; i < 8; i++) { const a = rand(0, TAU), v = rand(60, 200) * u; add({ kind: "m", x: e.clientX, y: e.clientY, vx: Math.cos(a) * v, vy: Math.sin(a) * v, drag: .975, s: rand(5, 10) * u, rgb: "255,226,160", max: rand(.8, 1.3), a: 1 }); }
  });

  burstHook = (x, y) => {
    const u = Math.max(.9, page.getBoundingClientRect().width / 460);
    for (let i = 0; i < 34; i++) { const a = rand(-Math.PI * 1.0, 0), v = rand(180, 520) * u; add({ kind: "p", x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, drag: .982, g: 380 * u, s: rand(14, 30) * u, pal: palOf([...PAL.marigold, ...PAL.rose, ...PAL.gold]), max: rand(2.2, 3.8), sw: rand(1, 2), sa: 12, ph: rand(0, TAU), vr: rand(-5, 5), vf: rand(5, 11), a: 1 }); }
    for (let i = 0; i < 22; i++) { const a = rand(0, TAU), v = rand(80, 300) * u; add({ kind: "m", x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, drag: .975, s: rand(6, 13) * u, rgb: "255,226,160", max: rand(.9, 1.8), a: 1 }); }
  };

  /* ---------- the frame loop ---------- */
  let last = performance.now(), lastY = scrollY, vs = 0, anch = [0, 0, 0, 0, 0, 0];
  function frame(now) {
    requestAnimationFrame(frame);
    if (document.hidden) { last = now; return; }
    const dt = Math.min(.05, (now - last) / 1000); last = now; const t = now / 1000;
    if (gated) { g.clearRect(0, 0, W, H); stepP(dt); return; }
    const sy = scrollY; vs = lerp(vs, (sy - lastY) / Math.max(dt, .001), .12); lastY = sy; const speed = .4 + Math.min(1, Math.abs(vs) / 900);
    const pr = page.getBoundingClientRect();
    // read every rect first, then write
    for (const s of st) { const r = s.el.getBoundingClientRect(); s.top = r.top; s.bottom = r.bottom; s.left = r.left; s.w = r.width; s.h = r.height; s.u = r.width / 1081; s.vis = r.bottom > 0 && r.top < H; }
    // scrub progress for screens 2 to 6: 0 when the screen starts to enter, 1 when most of it is in view
    for (const s of st) { if (s.i === 0) continue; const p = clamp((H - s.top) / Math.min(s.h * .75 + H * .1, H * .95)); if (Math.abs(p - s.p) > .0015) { s.p = p; s.el.style.setProperty("--pe", ease3(p).toFixed(4)); s.el.classList.toggle("done", p >= .999); } }
    // parallax and pointer drift
    cx = lerp(cx, mx, .06); cy = lerp(cy, my, .06);
    for (const it of parItems) { const s = it.s; if (!s.vis) continue; const pp = clamp((s.top + s.h / 2 - H / 2) / (H / 2 + s.h / 2), -1, 1); it.el.style.translate = `${(cx * it.pm * s.u).toFixed(1)}px ${(pp * it.k * s.w + cy * it.pm * .5 * s.u).toFixed(1)}px`; }

    g.clearRect(0, 0, W, H);
    // seam effects
    for (let k = 1; k <= 5; k++) { const d = (st[k].top - H * .5) / (H * .62); let e = Math.max(0, 1 - Math.abs(d)); e = sstep(e); if (e > .015) seamFx(k, e, dt, pr, speed); }
    // anchored ambient effects, each clipped to its own screen
    for (const s of st) {
      if (!s.vis) continue; const i = s.i, u = s.u, X = x => s.left + x * u, Y = y => s.top + y * u; const age = onAt[i] < 0 ? 0 : clamp((performance.now() - onAt[i]) / 2200);
      g.save(); g.beginPath(); g.rect(s.left, Math.max(0, s.top), s.w, Math.min(H, s.bottom) - Math.max(0, s.top)); g.clip();
      if (i === 0) { for (const q of stars1) { const tw = Math.pow(.5 + .5 * Math.sin(t * q.sp + q.ph), 2.2); glow(X(q.x), Y(q.y), q.s * u * 3, "255,214,130", .5 * tw * age); star(X(q.x), Y(q.y), q.s * u * 1.2, .95 * tw * age, "#f0bd52"); } }
      if (i === 2) { const ap = ease3(clamp((s.p - .5) / .5)); for (const q of stars3) { const tw = Math.pow(.5 + .5 * Math.sin(t * q.sp + q.ph), 2.4); glow(X(q.x), Y(q.y), q.s * u * 3.2, "255,226,236", .55 * tw * ap); star(X(q.x), Y(q.y), q.s * u * 1.2, .95 * tw * ap, "#fff6f8"); } }
      if (i === 3 && s.p > .6) {
        anch[3] += 9 * dt; while (anch[3] >= 1) { anch[3]--; add({ scr: 3, kind: "m", x: rand(400, 690), y: 1330, vx: rand(-8, 8), vy: -rand(26, 62), s: rand(5, 12), rgb: "255,224,160", max: rand(3, 5.5), a: .85 }); }
        if (Math.floor(t / 5.5) !== anch.red) { anch.red = Math.floor(t / 5.5); add({ scr: 3, kind: "p", x: 702, y: 1268, vx: rand(-16, 10), vy: -rand(60, 90), s: 11, pal: PAL.red[0], max: 4.2, sw: 1.6, sa: 18, ph: rand(0, TAU), vr: 1.2, vf: 5, a: .95 }); }
      }
      if (i === 4) { const lp = clamp((performance.now() - Math.max(0, onAt[4])) / 2500); for (const L of lanterns) { const uu = ((t + L.off) / L.dur) % 1, y = lerp(2000, 120, uu), x = L.x + Math.sin(uu * 9 + L.ph) * 26 + L.drift * uu, a = Math.sin(Math.PI * uu) * .92 * lp * (1 - .78 * (sstep(clamp((y - 380) / 60)) - sstep(clamp((y - 900) / 60)))), sc = L.s * u * 1.5; if (a > .02) { const fl = .85 + .15 * Math.sin(t * 4 + L.ph); glow(X(x), Y(y), 90 * L.s * u * 1.5 * 2.4, "255,170,70", .5 * a * fl); g.globalAlpha = a; g.drawImage(lanternSpr, X(x) - 60 * sc, Y(y) - 100 * sc, 120 * sc, 190 * sc); g.globalAlpha = 1; glow(X(x), Y(y) + 8 * sc, 40 * sc * 1.5, "255,240,190", .7 * a * fl); } } }
      if (i === 5) {
        const bp = clamp((performance.now() - Math.max(0, onAt[5])) / 1800);
        for (const b of birds) { const x = (((t + 1.5) * b.sp + b.x0) % 1500) - 200; bird(X(x), Y(b.y + Math.sin((t + b.ph) * .8) * 14), b.s * u * 1.5, t * b.fr + b.ph, .7 * bp); }
        for (let q = 0; q < 12; q++) { const uu = (t / 5 + q / 12) % 1; glow(X(615 + Math.sin(uu * 7 + q) * (14 + uu * 40)), Y(1010 - uu * 190), lerp(10, 46, uu) * u * 1.4, "255,246,235", Math.sin(Math.PI * uu) * .17 * bp, "source-over"); }
        for (const q of glints) { const tw = Math.pow(.5 + .5 * Math.sin(t * q.sp + q.ph), 2.6); glow(X(q.x), Y(q.y), q.s * u * 3, "255,230,170", .6 * tw * bp); star(X(q.x), Y(q.y), q.s * u * 1.1, .9 * tw * bp, "#fff4d6"); }
      }
      // particles anchored to this screen
      for (const q of P) { if (q.scr !== i) continue; drawP(q, X(q.x), Y(q.y), u); }
      g.restore();
    }
    stepP(dt);
  }
  function stepP(dt) {
    for (let n = P.length - 1; n >= 0; n--) {
      const q = P[n]; q.t += dt; if (q.t > q.max) { P.splice(n, 1); continue; }
      if (q.g) q.vy += q.g * dt; if (q.drag !== 1) { const d = Math.pow(q.drag, dt * 60); q.vx *= d; q.vy *= d; }
      q.x += q.vx * dt + (q.sw ? Math.sin(q.t * q.sw + q.ph) * q.sa * dt : 0); q.y += q.vy * dt; q.rot += q.vr * dt; q.fl += q.vf * dt;
      if (q.scr < 0) drawP(q, q.x, q.y, 1);
    }
  }
  function drawP(q, x, y, u) {
    const k = q.t / q.max, env = Math.pow(Math.sin(Math.PI * clamp(k)), q.kind === "p" ? .5 : 1) * q.a;
    if (env < .01) return;
    if (q.kind === "m") glow(x, y, q.s * u * 2.4, q.rgb, env);
    else { const f = Math.cos(q.fl), sc = (q.s * u) / 28; g.save(); g.translate(x, y); g.rotate(q.rot); g.scale(Math.abs(f) < .2 ? .2 : f, 1); g.globalAlpha = env; g.drawImage(petalSprite(q.pal), -32 * sc, -32 * sc, 64 * sc, 64 * sc); g.restore(); }
  }
  requestAnimationFrame(frame);
})();
