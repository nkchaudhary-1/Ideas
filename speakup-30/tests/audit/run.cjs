// Layout and accessibility audit. Drives every screen and dialog, with seeded history, and measures sideways scroll, hit
// targets (28px minimum), accessible names, text that wraps inside controls, corner radii (nothing rounder than 32px
// unless it is a capsule) and text contrast.
//   node tests/audit/run.cjs [--all] [--w=1600] [--h=950] [--phone] [--theme=dark|light] [--shots=/dir] [--only=a,b]
const path = require("path");
const fs = require("fs");
const { chromium, devices } = require("playwright");

const arg = (k, d) => {
  const a = process.argv.find((x) => x.startsWith(`--${k}=`));
  return a ? a.split("=")[1] : d;
};
const BASE = process.env.BASE_URL || "http://localhost:4173";
const ALL = process.argv.includes("--all");
const SHOTS = arg("shots", "");
const ONLY = arg("only", "") ? arg("only", "").split(",") : null;

const buildSeed = require("./load-seed.cjs")();

// Runs inside the page.
function probe() {
  const out = [];
  const vis = (el) => {
    const r = el.getBoundingClientRect();
    const cs = getComputedStyle(el);
    return r.width > 0 && r.height > 0 && cs.visibility !== "hidden" && cs.display !== "none" && !el.closest("[hidden],[aria-hidden=true]") && !el.classList.contains("sr-only");
  };
  const nameOf = (el) => {
    const lb = el.getAttribute("aria-labelledby");
    return (
      el.getAttribute("aria-label") ||
      (lb && document.getElementById(lb)?.innerText) ||
      (el.labels && el.labels[0]?.innerText) ||
      el.innerText ||
      el.getAttribute("title") ||
      el.getAttribute("placeholder") ||
      ""
    ).trim();
  };
  const desc = (el) => `${el.tagName.toLowerCase()}${el.dataset.testid ? `[${el.dataset.testid}]` : ""} “${(nameOf(el) || el.className.toString()).slice(0, 36)}”`;

  if (document.documentElement.scrollWidth > innerWidth + 1) out.push(["overflow", `page scrolls sideways: ${document.documentElement.scrollWidth} > ${innerWidth}`]);

  const targets = document.querySelectorAll('button,a[href],[role=button],[role=slider],[role=radio],[role=switch],input:not([type=hidden]):not([type=file]),select,textarea,summary');
  targets.forEach((el) => {
    if (!vis(el)) return;
    const r = el.getBoundingClientRect();
    const inline = el.tagName === "A" && getComputedStyle(el).display === "inline";
    if (!inline && Math.min(r.width, r.height) < 28) out.push(["target", `${desc(el)} is ${Math.round(r.width)}×${Math.round(r.height)}px`]);
    if (!nameOf(el) && !el.closest("label")) out.push(["name", `${desc(el)} has no accessible name`]);
  });
  document.querySelectorAll("button,a[class*=rounded-full]").forEach((el) => {
    if (!vis(el)) return;
    const r = el.getBoundingClientRect();
    if (r.height > 64 && el.innerText && el.innerText.trim().length < 40 && !el.closest("[data-testid=prompter]")) out.push(["wrap", `${desc(el)} wraps its text (${Math.round(r.height)}px tall)`]);
    if (el.scrollWidth > el.clientWidth + 1 && getComputedStyle(el).overflow !== "visible") out.push(["clip", `${desc(el)} clips its content`]);
  });

  // Corner radii: nothing rounder than 32px unless it is a capsule or circle.
  document.querySelectorAll("*").forEach((el) => {
    if (!vis(el) || el.closest("svg")) return;
    const cs = getComputedStyle(el);
    const r = el.getBoundingClientRect();
    for (const c of ["borderTopLeftRadius", "borderTopRightRadius", "borderBottomLeftRadius", "borderBottomRightRadius"]) {
      const v = parseFloat(cs[c]);
      if (v > 32.5 && v < Math.min(r.width, r.height) / 2 - 0.5 && v < 9000) {
        out.push(["radius", `${desc(el)} has a ${v}px corner (${Math.round(r.width)}×${Math.round(r.height)})`]);
        break;
      }
    }
  });

  // Contrast of text against what is really behind it.
  const parse = (s) => {
    const m = s.match(/rgba?\(([^)]+)\)/);
    if (!m) return null;
    const p = m[1].split(/[ ,/]+/).filter(Boolean).map(Number);
    return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 };
  };
  const over = (top, bottom) => ({ r: top.r * top.a + bottom.r * (1 - top.a), g: top.g * top.a + bottom.g * (1 - top.a), b: top.b * top.a + bottom.b * (1 - top.a), a: 1 });
  const lum = (c) => {
    const f = (v) => ((v /= 255) <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4));
    return 0.2126 * f(c.r) + 0.7152 * f(c.g) + 0.0722 * f(c.b);
  };
  const bgOf = (el) => {
    const chain = [];
    for (let e = el; e; e = e.parentElement) chain.unshift(e);
    let bg = { r: 255, g: 255, b: 255, a: 1 };
    for (const e of chain) {
      const c = parse(getComputedStyle(e).backgroundColor);
      if (c && c.a > 0) bg = over(c, bg);
    }
    return bg;
  };
  const seen = new Set();
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  let n;
  while ((n = walker.nextNode())) {
    const t = n.textContent.trim();
    const el = n.parentElement;
    if (!t || !el || !vis(el) || el.closest("[data-state=past],[data-state=future],script,style,[disabled],[aria-disabled=true]")) continue;
    if (el.closest("button:disabled")) continue;
    const cs = getComputedStyle(el);
    let op = 1;
    for (let e = el; e; e = e.parentElement) op *= parseFloat(getComputedStyle(e).opacity);
    const bg = bgOf(el);
    let fg = parse(cs.color);
    if (!fg) continue;
    fg = over({ ...fg, a: fg.a * op }, bg);
    const [L1, L2] = [lum(fg), lum(bg)].sort((a, b) => b - a);
    const ratio = (L1 + 0.05) / (L2 + 0.05);
    const size = parseFloat(cs.fontSize);
    const big = size >= 24 || (size >= 18.66 && parseInt(cs.fontWeight) >= 700);
    if (ratio < (big ? 3 : 4.5)) {
      const key = `${cs.color}|${Math.round(ratio * 10)}`;
      if (!seen.has(key)) {
        seen.add(key);
        out.push(["contrast", `“${t.slice(0, 30)}” is ${ratio.toFixed(2)}:1 (${size}px) in ${el.tagName.toLowerCase()}`]);
      }
    }
  }
  return out;
}

async function auditOne(browser, cfg) {
  const { w, h, phone, theme } = cfg;
  const tag = `${phone ? "phone" : "desktop"}-${w}x${h}-${theme}`;
  const ctx = await browser.newContext(
    phone
      ? { ...devices["iPhone 13"], viewport: { width: w, height: h }, permissions: ["microphone"] }
      : { viewport: { width: w, height: h }, permissions: ["microphone"] },
  );
  const page = await ctx.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push("pageerror " + e.message));
  page.on("console", (m) => m.type() === "error" && errors.push(m.text().slice(0, 160)));
  const findings = {};
  const record = async (name) => {
    if (ONLY && !ONLY.includes(name)) return;
    await page.waitForTimeout(350);
    findings[name] = await page.evaluate(`(${probe.toString()})()`);
    if (SHOTS) {
      fs.mkdirSync(SHOTS, { recursive: true });
      await page.screenshot({ path: path.join(SHOTS, `${tag}-${name}.png`), fullPage: false });
    }
  };
  const seedState = (state) => ctx.addInitScript((s) => localStorage.setItem("speakup30:v1", s), JSON.stringify(state));

  // First run, nothing saved.
  await ctx.addInitScript(() => {
    if (!localStorage.getItem("speakup30:v1")) localStorage.setItem("speakup30:v1", JSON.stringify({ settings: { theme: window.__THEME__ || "dark", countdown: false } }));
  });
  await page.addInitScript((t) => (window.__THEME__ = t), theme);
  await page.goto(BASE, { waitUntil: "networkidle" });
  await record("welcome");
  await page.evaluate(() => localStorage.clear());

  // From here on the app has history.
  const seed = buildSeed(Date.now(), theme);
  await ctx.addInitScript((s) => localStorage.getItem("speakup30:seeded") ? null : (localStorage.setItem("speakup30:v1", s), localStorage.setItem("speakup30:seeded", "1")), JSON.stringify(seed));
  await page.goto(BASE + "/?seeded=1#/", { waitUntil: "networkidle" });
  await page.waitForSelector("[data-testid=today-topic]");
  await record("dashboard");
  const go = async (hash, wait = "main") => {
    await page.evaluate((h) => (location.hash = h), hash);
    await page.waitForSelector(wait);
    await page.waitForTimeout(250);
  };
  await go("#/practice"); await record("practice-overview");
  await go("#/practice/4/run", "[data-testid=runner]"); await record("runner-warmup");
  await page.click("[data-testid=pause]"); await record("runner-paused"); await page.click("[data-testid=resume]");
  await page.click("[data-testid=skip-step]"); await page.waitForSelector("[data-testid=prompter]"); await record("runner-teleprompter");
  await page.click("[data-testid=prompter-settings]"); await record("prompter-settings"); await page.keyboard.press("Escape");
  await page.click("[data-testid=open-fill]"); await record("prompter-fill"); await page.keyboard.press("Escape");
  await page.click("[data-testid=skip-step]"); await page.waitForSelector("[data-testid=keyword-map]"); await record("runner-guided");
  await page.click("[data-testid=type-instead]");
  await page.fill("[aria-label='Type what you said']", "First I would look at the business context and the data. For example, on a listing page I would talk to a few shoppers. Because of that, I decided to test two options with real users. In short, I measure success with conversion.");
  await page.click("[data-testid=analyse-typed]"); await page.waitForSelector("[data-testid=report]");
  await page.getByText("Filler words", { exact: false }).first().click();
  await page.getByText("Answer structure").first().click();
  await record("runner-guided-report");
  await page.click("[data-testid=skip-step]"); await record("runner-challenge");
  await page.click("[data-testid=skip-step]"); await page.waitForSelector("textarea[id^=refl-]"); await record("runner-reflection");
  await go("#/teleprompter/8", "[data-testid=prompter]"); await record("teleprompter");
  await go("#/challenge"); await record("challenge");
  await go("#/analysis"); await record("analysis-list");
  await go("#/analysis/a1-1", "[data-testid=report]"); await record("analysis-detail");
  await go("#/progress"); await page.waitForSelector("figure svg"); await record("progress");
  await go("#/curriculum"); await record("curriculum");
  await go("#/curriculum/8", "[role=dialog]"); await record("curriculum-day");
  await go("#/settings"); await record("settings");
  await page.getByRole("button", { name: "Reset everything" }).click(); await record("settings-confirm");
  if (phone) {
    await page.keyboard.press("Escape");
    await go("#/");
    await page.getByRole("button", { name: "More" }).click(); await record("more-sheet");
  }
  await record("final");
  await ctx.close();
  return { tag, findings, errors };
}

(async () => {
  const configs = ALL
    ? [
        { w: 1600, h: 950, theme: "dark" },
        { w: 2200, h: 1100, theme: "dark" },
        { w: 1280, h: 800, theme: "light" },
        { w: 390, h: 844, phone: true, theme: "dark" },
        { w: 360, h: 740, phone: true, theme: "dark" },
        { w: 320, h: 740, phone: true, theme: "dark" },
        { w: 390, h: 844, phone: true, theme: "light" },
      ]
    : [{ w: +arg("w", process.argv.includes("--phone") ? 390 : 1600), h: +arg("h", process.argv.includes("--phone") ? 844 : 950), phone: process.argv.includes("--phone"), theme: arg("theme", "dark") }];
  const browser = await chromium.launch({ args: ["--use-fake-device-for-media-stream", "--use-fake-ui-for-media-stream"] });
  let total = 0;
  for (const cfg of configs) {
    const { tag, findings, errors } = await auditOne(browser, cfg);
    const lines = [];
    for (const [state, list] of Object.entries(findings)) for (const [kind, msg] of list) lines.push(`  [${kind}] ${state}: ${msg}`);
    errors.forEach((e) => lines.push(`  [console] ${e}`));
    total += lines.length;
    console.log(`${tag}: ${lines.length ? lines.length + " finding(s)" : "no findings"}`);
    lines.slice(0, 40).forEach((l) => console.log(l));
    if (lines.length > 40) console.log(`  … ${lines.length - 40} more`);
  }
  await browser.close();
  console.log(total ? `\n${total} finding(s) in total` : "\nAudit: no findings");
  process.exit(total ? 1 : 0);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
