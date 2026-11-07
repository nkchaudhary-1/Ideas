/* EXP: the choreography. Gate preloader, hero intro and parallax, one pinned blessings stage, celebration reveal,
   diyas, live countdown, marquee, custom cursor, magnetic buttons, chapter HUD, finale.
   A template calls EXP.init(hooks). Hooks: tones{sectionId:"ink"|"paper"}, fx{}, ambient(), heroIn(), vows(tl,info),
   celebrate(), shower(x,y,n). Without GSAP, or under reduced motion, the page falls back to a plain readable layout. */
const EXP = (() => {
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const html = document.documentElement, G = window.gsap, ST = window.ScrollTrigger;
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const fine = matchMedia("(hover:hover) and (pointer:fine)").matches;
  const on = !!(G && ST) && !reduced;
  const ROMAN = ["I", "II", "III", "IV", "V", "VI", "VII"];
  const seg = window.Intl && Intl.Segmenter ? new Intl.Segmenter(undefined, { granularity: "grapheme" }) : null;
  let H = {}, ctx = null, ready = false, heroTL = null, built = null, cdTimer = 0, mqTweens = [], cleanups = [], shown = 0, litAll = false;
  if (on) { G.registerPlugin(ST); ST.config({ ignoreMobileResize: true }); }

  /* ---------- text splitting: words or characters, each inside a mask ---------- */
  function split(el, mode = "chars") {
    if (!el) return [];
    if (!el.querySelector(".ch")) el._orig = el.innerHTML; else el.innerHTML = el._orig;
    const label = el.textContent, parts = [];
    const mk = txt => { const c = document.createElement("span"); c.className = "ch"; c.setAttribute("aria-hidden", "true"); const i = document.createElement("span"); i.className = "in"; i.textContent = txt; c.appendChild(i); parts.push(i); return c; };
    const walk = node => [...node.childNodes].forEach(n => {
      if (n.nodeType === 3) {
        const frag = document.createDocumentFragment();
        n.textContent.split(/(\s+)/).forEach(tok => {
          if (!tok) return; if (/^\s+$/.test(tok)) { frag.appendChild(document.createTextNode(" ")); return; }
          const w = document.createElement("span"); w.className = "w";
          if (mode === "chars" && !/[ऀ-ॿ]/.test(tok)) (seg ? [...seg.segment(tok)].map(s => s.segment) : [...tok]).forEach(ch => w.appendChild(mk(ch))); else w.appendChild(mk(tok));
          frag.appendChild(w);
        });
        n.replaceWith(frag);
      } else if (n.nodeType === 1 && n.tagName !== "BR" && !n.classList.contains("w")) walk(n);
    });
    walk(el); el.setAttribute("aria-label", label); return parts;
  }

  /* one shared size for a pair of names, shrunk until the longer one fits */
  function fit(els, min = 24) {
    els = els.filter(Boolean); if (!els.length) return;
    els.forEach(e => { e.style.whiteSpace = "nowrap"; e.style.fontSize = ""; });
    const sizes = els.map(e => { const p = e.parentElement, cs = getComputedStyle(p), avail = p.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight), fs = parseFloat(getComputedStyle(e).fontSize), sw = e.scrollWidth; return sw > avail && avail > 0 ? fs * avail / sw * .98 : fs; });
    const s = Math.max(min, Math.min(...sizes)); els.forEach(e => e.style.fontSize = s + "px");
  }
  /* shrink one container's font-size until its widest line fits */
  function fitBox(el, min = 26) {
    if (!el) return; el.style.whiteSpace = "nowrap"; el.style.fontSize = "";
    const cs = getComputedStyle(el), avail = el.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight), fs = parseFloat(cs.fontSize), sw = el.scrollWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
    if (sw > avail && avail > 0) el.style.fontSize = Math.max(min, fs * avail / sw * .98) + "px";
  }
  const fitAll = () => { fitBox($("#title"), 26); fit([$("#nameA"), $("#nameB")], 24); };

  /* ---------- countdown ---------- */
  function countdown() {
    clearInterval(cdTimer); const box = $("#countdown"), target = INV.current.target;
    box.hidden = false; box.innerHTML = ["Days", "Hours", "Minutes", "Seconds"].map(l => `<div class="cd"><span class="cd-n"><span>00</span></span><small>${l}</small></div>`).join("");
    const spans = $$(".cd-n span", box); let prev = [];
    const tick = () => {
      const diff = target - Date.now(); if (diff <= 0) { box.hidden = true; clearInterval(cdTimer); return; }
      const s = Math.floor(diff / 1000), v = [Math.floor(s / 86400), Math.floor(s % 86400 / 3600), Math.floor(s % 3600 / 60), s % 60];
      v.forEach((n, i) => { if (n !== prev[i]) { spans[i].textContent = String(n).padStart(2, "0"); if (on && prev[i] !== undefined) G.fromTo(spans[i], { yPercent: -100 }, { yPercent: 0, duration: .5, ease: "power3.out" }); } });
      prev = v;
    };
    tick(); cdTimer = setInterval(tick, 1000);
  }

  /* ---------- diyas ---------- */
  function diyas() {
    const wrap = $("#diyas"); wrap.innerHTML = Array.from({ length: 5 }, () => `<button class="dy" type="button" aria-label="Light this diya" data-cursor="Light">${ILL.diya()}</button>`).join("");
    const items = $$(".dy", wrap), hint = $("#diyaHint"); let lit = 0; litAll = false; hint.style.opacity = 1;
    const light = (el, delay = 0) => { if (el.classList.contains("on")) return; setTimeout(() => { if (el.classList.contains("on")) return; el.classList.add("on"); lit++; if (lit === items.length && !litAll) { litAll = true; hint.style.opacity = 0; H.celebrate && H.celebrate(); } }, delay * 1000); };
    items.forEach(el => el.addEventListener("click", () => light(el)));
    if (!on) { items.forEach(el => el.classList.add("on")); hint.hidden = true; return; }
    hint.textContent = fine ? "Tap each diya to light it" : "Tap each diya to light it";
    ST.create({ trigger: wrap, start: "top 84%", once: true, onEnter: () => light(items[2], .5) });
  }

  /* ---------- sections ---------- */
  function parallax(sel, trigger, k = .3) {
    $$(sel + " .layer").forEach(l => { const d = parseFloat(l.dataset.depth || .5);
      G.fromTo(l, { y: () => -(1 - d) * innerHeight * k }, { y: () => (1 - d) * innerHeight * k, ease: "none", scrollTrigger: { trigger, start: "top bottom", end: "bottom top", scrub: true, invalidateOnRefresh: true } }); });
  }

  function hero() {
    const layers = $$("#sceneHero .layer"), title = split($("#titleA")).concat(split($("#titleB")));
    fitAll();
    const tl = G.timeline({ paused: true, defaults: { ease: "power3.out" } });
    tl.fromTo(layers, { yPercent: 14, autoAlpha: 0 }, { yPercent: 0, autoAlpha: 1, duration: 1.9, stagger: .12 }, 0)
      .from("#blessing", { autoAlpha: 0, y: 24, duration: 1 }, .5)
      .from(title, { yPercent: 118, duration: 1.3, ease: "expo.out", stagger: .035 }, .7)
      .from("#titleJoin", { autoAlpha: 0, scale: .5, rotate: -12, duration: 1, ease: "back.out(2.2)" }, 1.15)
      .from(["#mainDate", "#mainPlace"], { autoAlpha: 0, y: 18, duration: .9, stagger: .12 }, 1.5)
      .from("#scrollHint", { autoAlpha: 0, duration: 1 }, 2)
      .call(() => H.heroIn && H.heroIn(), null, 1);
    heroTL = tl;
    layers.forEach(l => { const d = parseFloat(l.dataset.depth || .5);
      G.to(l, { y: () => (1 - d) * innerHeight * .55, ease: "none", scrollTrigger: { trigger: "#hero", start: "top top", end: "bottom top", scrub: true, invalidateOnRefresh: true } }); });
    G.to("#heroCopy", { y: () => -innerHeight * .12, autoAlpha: 0, scale: .94, ease: "none", scrollTrigger: { trigger: "#hero", start: "top top", end: "65% top", scrub: true } });
    if (fine) {
      const kids = layers.map(l => ({ el: l.firstElementChild, d: parseFloat(l.dataset.depth || .5) })).filter(k => k.el);
      const qx = kids.map(k => G.quickTo(k.el, "x", { duration: 1.3, ease: "power3" })), qy = kids.map(k => G.quickTo(k.el, "y", { duration: 1.3, ease: "power3" }));
      const mv = e => { const nx = e.clientX / innerWidth - .5, ny = e.clientY / innerHeight - .5; kids.forEach((k, i) => { qx[i](-nx * k.d * 70); qy[i](-ny * k.d * 26); }); };
      $("#hero").addEventListener("pointermove", mv); cleanups.push(() => $("#hero").removeEventListener("pointermove", mv));
    }
  }

  function vows() {
    const sec = $("#vows"), beats = $$(".beat", sec), n = beats.length, dur = n + .35;
    const eyebrow = split($("#eyebrow"), "words"), nA = split($("#nameA")), nB = split($("#nameB")), lA = split($("#lineA"), "words"), lB = split($("#lineB"), "words"), inv = split($("#inviteText"), "words");
    fit([$("#nameA"), $("#nameB")], 24);
    const sign = ["#signWarm", "#signFam", "#signCity"].map(s => $(s)).filter(e => e && !e.hidden);
    G.set(beats, { autoAlpha: 0 });
    const tl = G.timeline({ defaults: { ease: "power3.out" }, scrollTrigger: { trigger: sec, start: "top top", end: () => "+=" + Math.round(innerHeight * dur * .9), pin: true, scrub: .9, anticipatePin: 1, invalidateOnRefresh: true } });
    const IN = .36, OUT = .24;
    const show = i => tl.set(beats[i], { autoAlpha: 1, y: 0, filter: "blur(0px)" }, i);
    const mask = (parts, at, st = .012, d = IN) => tl.fromTo(parts, { yPercent: 112 }, { yPercent: 0, duration: d, stagger: st }, at);
    const out = i => { if (i < n - 1) tl.to(beats[i], { autoAlpha: 0, y: -28, filter: "blur(8px)", duration: OUT, ease: "power2.in" }, i + 1 - OUT); };
    show(0); mask(eyebrow, 0, .014); out(0);
    show(1); mask(nA, 1, .022); mask(lA, 1.12, .008, .3); out(1);
    show(2); tl.fromTo("#joiner", { scale: .4, rotate: -20, autoAlpha: 0 }, { scale: 1, rotate: 0, autoAlpha: 1, duration: .5, ease: "back.out(1.8)" }, 2); out(2);
    show(3); mask(nB, 3, .022); mask(lB, 3.12, .008, .3); out(3);
    show(4); mask(inv, 4, .01); tl.fromTo(sign, { autoAlpha: 0, y: 24 }, { autoAlpha: 1, y: 0, duration: .4, stagger: .08 }, 4.35);
    tl.to({}, { duration: .35 }, n);
    H.vows && H.vows(tl, { n, dur });
  }

  function celebrate() {
    const sec = $("#celebrate"), num = $("#bnNum"), day = +num.dataset.n;
    G.to("#bigNum", { "--fill": 1, ease: "none", scrollTrigger: { trigger: sec, start: "top 65%", end: "top 6%", scrub: .6 } });
    G.fromTo(num, { yPercent: 10 }, { yPercent: -10, ease: "none", scrollTrigger: { trigger: sec, start: "top bottom", end: "bottom top", scrub: true } });
    let counted = false; const o = { v: 1 };
    const finish = () => { num.textContent = day; num.dataset.n = day; };
    num.textContent = "1"; num.dataset.n = "1";
    ST.create({ trigger: num, start: "top 88%", onEnter: () => { if (counted) return; counted = true; G.to(o, { v: day, duration: 1.5, ease: "power3.out", onUpdate: () => { const v = Math.round(o.v); num.textContent = v; num.dataset.n = v; }, onComplete: finish }); },
      onRefresh: s => { if (s.progress > 0 && !counted) { counted = true; finish(); } } });
    $$(".fn", sec).forEach(fn => {
      const h3 = $(".fn-name", fn), parts = split(h3, "words");
      G.from(parts, { yPercent: 112, duration: 1.1, ease: "expo.out", stagger: .06, scrollTrigger: { trigger: h3, start: "top 88%", once: true } });
      G.from($$(".when,.headline,.evtext,.meta,.note,.dress,.acts", fn), { autoAlpha: 0, y: 30, duration: .9, stagger: .12, scrollTrigger: { trigger: fn, start: "top 74%", once: true } });
    });
    G.from(["#fnTitle", "#fnLead"], { autoAlpha: 0, y: 20, duration: .8, stagger: .6, scrollTrigger: { trigger: sec, start: "top 60%", once: true } });
    G.from(".cd", { autoAlpha: 0, y: 40, duration: .9, stagger: .1, scrollTrigger: { trigger: "#countdown", start: "top 92%", once: true } });
    parallax("#sceneCel", sec, .2);
  }

  function marquee() {
    mqTweens.forEach(t => t.kill()); mqTweens = [];
    [["#mq1", -1], ["#mq2", 1]].forEach(([sel, dir]) => {
      const row = $(sel); $$(".mq-set", row).slice(1).forEach(x => x.remove()); const set = $(".mq-set", row), w = set.getBoundingClientRect().width; if (!w) return;
      for (let i = 1; i < Math.ceil(innerWidth * 2 / w) + 1; i++) row.appendChild(set.cloneNode(true));
      mqTweens.push(G.fromTo(row, { x: dir < 0 ? 0 : -w }, { x: dir < 0 ? -w : 0, duration: w / 70, ease: "none", repeat: -1 }));
    });
    const m = { ts: 1, sk: 0 }, apply = () => { mqTweens.forEach(t => t.timeScale(m.ts)); G.set(".mq-row", { skewX: m.sk }); };
    ST.create({ trigger: "#marquee", start: "top bottom", end: "bottom top", onUpdate: s => { const v = s.getVelocity(); m.ts = 1 + Math.min(7, Math.abs(v) / 260); m.sk = G.utils.clamp(-9, 9, v / -260); apply(); G.to(m, { ts: 1, sk: 0, duration: 1.1, ease: "power3.out", overwrite: true, onUpdate: apply }); } });
  }

  function panels() { $$(".panel").forEach(p => { if (!p.hidden) G.from($(".panel-in", p), { autoAlpha: 0, y: 44, duration: 1, ease: "power3.out", scrollTrigger: { trigger: p, start: "top 78%", once: true } }); }); }

  function finale() {
    const sec = $("#finale"), hin = split($("#closingHindi"), "words");
    G.from(hin, { yPercent: 115, duration: 1.3, ease: "expo.out", stagger: .08, scrollTrigger: { trigger: sec, start: "top 60%", once: true } });
    G.from(["#finNames", "#finDate", "#shower", "#showerCount", ".to-top"], { autoAlpha: 0, y: 30, duration: .9, stagger: .12, scrollTrigger: { trigger: sec, start: "top 52%", once: true } });
    parallax("#sceneFin", sec, .25);
  }

  function chrome() {
    const secs = $$("[data-chapter]").filter(s => !s.hidden); let cur = -1;
    secs.forEach((s, i) => s.dataset.no = ROMAN[i]);
    const set = i => { if (i === cur) return; cur = i; const s = secs[i]; $("#hud").dataset.tone = s.dataset.hud || "paper"; $("#chapNo").textContent = s.dataset.no; $("#chapName").textContent = s.dataset.chapter;
      G.fromTo(["#chapNo", "#chapName"], { yPercent: 110, autoAlpha: 0 }, { yPercent: 0, autoAlpha: 1, duration: .55, stagger: .06, ease: "power3.out", overwrite: true }); };
    ST.create({ start: 0, end: "max", onUpdate: () => { let a = 0; secs.forEach((s, i) => { if (s.getBoundingClientRect().top <= innerHeight * .5) a = i; }); set(a); } });
    set(0);
    G.to("#progBar", { scaleX: 1, ease: "none", scrollTrigger: { start: 0, end: "max", scrub: .3 } });
  }

  function build() {
    cleanups.forEach(f => f()); cleanups = [];
    if (ctx) ctx.revert();
    countdown();
    if (!on) { diyas(); fitAll(); return; }
    ctx = G.context(() => { hero(); vows(); celebrate(); diyas(); marquee(); panels(); finale(); chrome(); }, document.body);
    ST.refresh();
  }

  /* ---------- gate ---------- */
  function gate() {
    const L = $("#loader"); if (!L) return;
    if (!on) { L.remove(); H.ambient && H.ambient(); return; }
    html.classList.add("lock");
    $("#loaderEmblem").innerHTML = ILL.mandalaSVG(120);
    const num = $("#loaderNum"), core = $(".loader-core", L), o = { v: 0 };
    G.timeline().to(o, { v: 100, duration: 2.1, ease: "power2.inOut", onUpdate: () => num.textContent = Math.round(o.v) })
      .add(() => { built.then(() => {
        const t = G.timeline({ onComplete: () => { L.remove(); html.classList.remove("lock"); ST.refresh(); } });
        t.to(core, { autoAlpha: 0, scale: 1.1, duration: .5, ease: "power2.in" })
         .to(".door.l", { xPercent: -101, duration: 1.5, ease: "expo.inOut" }, "<.25").to(".door.r", { xPercent: 101, duration: 1.5, ease: "expo.inOut" }, "<")
         .add(() => { heroTL && heroTL.play(0); H.ambient && H.ambient(); }, "-=1.05");
      }); });
  }

  /* ---------- cursor, magnet, shower ---------- */
  function cursor() {
    if (!fine || !on) return; const c = $("#cursor"), dot = $(".c-dot", c), ring = $(".c-ring", c), lab = $("#cursorLabel");
    html.classList.add("cursor-on");
    const dx = G.quickTo(dot, "x", { duration: .1, ease: "power3" }), dy = G.quickTo(dot, "y", { duration: .1, ease: "power3" }), rx = G.quickTo(ring, "x", { duration: .55, ease: "power3" }), ry = G.quickTo(ring, "y", { duration: .55, ease: "power3" });
    addEventListener("pointermove", e => { c.classList.add("show"); dx(e.clientX); dy(e.clientY); rx(e.clientX); ry(e.clientY); }, { passive: true });
    document.addEventListener("pointerover", e => { const t = e.target.closest && e.target.closest("a,button,[data-cursor],label,select,input"); if (t) { const l = t.dataset.cursor || ""; lab.textContent = l; c.classList.add("hov"); c.classList.toggle("nolabel", !l); } else c.classList.remove("hov"); });
    addEventListener("pointerdown", () => c.classList.add("down")); addEventListener("pointerup", () => c.classList.remove("down"));
    document.documentElement.addEventListener("mouseleave", () => c.classList.remove("show"));
  }
  function magnet() {
    if (!fine || !on) return;
    addEventListener("pointermove", e => { $$(".mag").forEach(el => { const r = el.getBoundingClientRect(), dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2), R = Math.max(r.width, r.height) * .9;
      if (Math.hypot(dx, dy) < R) { G.to(el, { x: dx * .28, y: dy * .28, duration: .4, ease: "power3.out", overwrite: "auto" }); el._m = 1; } else if (el._m) { G.to(el, { x: 0, y: 0, duration: .8, ease: "elastic.out(1,.4)", overwrite: "auto" }); el._m = 0; } }); }, { passive: true });
  }
  function wire() {
    const btn = $("#shower"), cnt = $("#showerCount"), fin = $("#finale");
    const fire = (x, y) => { shown++; cnt.textContent = `${shown} ${shown === 1 ? "blessing" : "blessings"} showered`; (H.shower || ((a, b) => FX.petals(a, b, { colors: ["#f59a1b", "#f7b733", "#e5701a"], size: [5, 9], speed: [.3, .7] })))(x, y, shown); };
    btn.addEventListener("click", e => { const r = btn.getBoundingClientRect(); fire(r.left + r.width / 2, r.top); if (on) G.fromTo(btn, { scale: .92 }, { scale: 1, duration: .8, ease: "elastic.out(1,.35)" }); });
    fin.addEventListener("click", e => { if (e.target.closest("button,a")) return; fire(e.clientX, e.clientY); });
    $("#mono").addEventListener("click", e => { e.preventDefault(); scrollTo({ top: 0, behavior: reduced ? "auto" : "smooth" }); });
    $$(".to-top").forEach(a => a.addEventListener("click", e => { e.preventDefault(); scrollTo({ top: 0, behavior: reduced ? "auto" : "smooth" }); }));
  }

  function init(h) {
    H = h || {};
    Object.entries(H.tones || {}).forEach(([id, t]) => { const s = document.getElementById(id); if (s) s.dataset.hud = t; });
    if (typeof FX !== "undefined" && $("#fx")) FX.init($("#fx"), H.fx || {});
    wire(); cursor(); magnet();
    const fonts = Promise.race([(document.fonts && document.fonts.ready) || Promise.resolve(), new Promise(r => setTimeout(r, 1500))]);
    built = fonts.then(() => { build(); ready = true; });
    if (on) ST.addEventListener("refreshInit", fitAll);
    gate();
    if (!on) built.then(() => { fitAll(); });
    addEventListener("resize", () => { if (!on) fitAll(); });
  }
  function refresh() {
    if (!ready) return; scrollTo(0, 0); build();
    if (on && heroTL) heroTL.progress(1);
    /* ScrollTrigger restores the previous scroll offset after a rebuild; put the guest back at the top */
    const top = () => { scrollTo(0, 0); if (on) ST.update(); };
    requestAnimationFrame(top); setTimeout(top, 120); setTimeout(top, 400);
  }

  return { init, refresh, split, fit };
})();
