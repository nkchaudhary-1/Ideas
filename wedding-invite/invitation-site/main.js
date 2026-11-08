/* Scroll reveals, light parallax and the details strip. No dependencies. */
(() => {
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const screens = [...document.querySelectorAll(".screen")];

  /* a screen "turns on" once a good part of it is in view; its reveals then play with their own delays */
  if (reduced || !("IntersectionObserver" in window)) screens.forEach(s => s.classList.add("on"));
  else {
    const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add("on"); io.unobserve(e.target); } }), { threshold: .28 });
    screens.forEach(s => io.observe(s));
  }

  /* parallax: images drift a little against the scroll. Values are fractions of the screen width. */
  if (!reduced) {
    const items = [...document.querySelectorAll("[data-par]")].map(el => ({ el, k: parseFloat(el.dataset.par), s: el.closest(".screen") }));
    let ticking = false;
    const run = () => {
      ticking = false; const vh = innerHeight;
      for (const it of items) {
        const r = it.s.getBoundingClientRect(); if (r.bottom < -50 || r.top > vh + 50) continue;
        const p = Math.max(-1, Math.min(1, (r.top + r.height / 2 - vh / 2) / (vh / 2 + r.height / 2)));
        it.el.style.translate = `0 ${(p * it.k * r.width).toFixed(1)}px`;
      }
    };
    const req = () => { if (!ticking) { ticking = true; requestAnimationFrame(run); } };
    addEventListener("scroll", req, { passive: true }); addEventListener("resize", req); run();
  }

  /* countdown to 9:00 PM IST on 11 December 2026 */
  const target = new Date("2026-12-11T21:00:00+05:30").getTime(), box = document.getElementById("count");
  const tick = () => {
    const ms = target - Date.now();
    if (ms > 0) { const d = Math.floor(ms / 864e5), h = Math.floor(ms % 864e5 / 36e5); box.textContent = d >= 1 ? `${d} ${d === 1 ? "day" : "days"} to go` : `${h} ${h === 1 ? "hour" : "hours"} to go`; }
    else if (ms > -864e5) box.textContent = "Today is the day";
    else box.textContent = "With love and blessings";
  };
  tick(); setInterval(tick, 60000);
})();
