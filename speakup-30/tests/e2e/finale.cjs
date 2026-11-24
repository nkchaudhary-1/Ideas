// The advanced days: the Day 22 to 28 simulation, Day 29 (no script, plan in keywords) and Day 30 (the full interview).
// Seeds 28 completed days, then drives each flow with typed answers.
const { chromium } = require("playwright");
const buildSeed = require("../audit/load-seed.cjs")();

const BASE = process.env.BASE_URL || "http://localhost:4173";
let failures = 0;
const ok = (c, m) => (c ? console.log("  ✓", m) : (failures++, console.log("  ✗", m)));

const ANSWER = "First I would listen and learn. I would meet the product manager and the engineers, audit the product and the data, and agree two priorities. For example, I would deliver a small early win. Because of that the team would trust me. In short, listen, deliver, then lead, and I would measure the impact.";

async function typeAnswer(page, text = ANSWER) {
  await page.click("[data-testid=type-instead]");
  await page.fill("[aria-label='Type what you said']", text);
  await page.click("[data-testid=analyse-typed]");
  await page.waitForSelector("[data-testid=report]");
}
/** Answer a question and all its follow-ups, then press the final button. Returns how many answers were given. */
async function runThrough(page) {
  let n = 0;
  for (let guard = 0; guard < 6; guard++) {
    await typeAnswer(page);
    n++;
    const next = page.locator("[data-testid=next-followup]");
    if (await next.count()) await next.click();
    else break;
  }
  await page.click("[data-testid=run-complete]");
  return n;
}
const title = (page) => page.textContent("[data-testid=phase-title]");
const skip = async (page, n) => { for (let i = 0; i < n; i++) await page.click("[data-testid=skip-step]"); };

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await ctx.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => m.type() === "error" && errors.push(m.text().slice(0, 200)));
  await ctx.addInitScript((s) => localStorage.getItem("seeded") ? null : (localStorage.setItem("speakup30:v1", s), localStorage.setItem("seeded", "1")), JSON.stringify(buildSeed(Date.now(), "dark", 28)));
  await page.goto(BASE + "/?x=1#/", { waitUntil: "networkidle" });
  await page.waitForSelector("[data-testid=today-topic]");
  ok((await page.textContent("[data-testid=today-topic]")).includes("first 90 days"), "after 28 days the dashboard offers Day 29");

  console.log("Day 24: simulation");
  await page.goto(BASE + "/#/practice/24/run");
  await page.waitForSelector("[data-testid=runner]");
  await skip(page, 3);
  ok((await title(page)) === "Interview simulation", "simulation step (26-minute day)");
  ok(await page.getByText("Question 1 of 3").isVisible(), "three questions in a row");
  const answers = [];
  for (let q = 0; q < 3; q++) answers.push(await runThrough(page));
  ok(answers.every((n) => n === 2), "each question has one follow-up from the answer");
  ok((await title(page)) === "Reflection", "then the reflection");

  console.log("Day 29: no script, keywords and a model answer");
  await page.goto(BASE + "/#/practice/29/run");
  await page.waitForSelector("[data-testid=runner]");
  ok(await page.getByText("Step 1 of 4").isVisible(), "Day 29 has four steps");
  await skip(page, 1);
  ok((await title(page)) === "Guided preparation", "guided preparation first");
  const noScript = (await page.locator("[data-testid=prompter]").count()) === 0;
  ok(noScript, "no teleprompter on Day 29");
  await page.fill("[data-testid=prep-notes]", "30: listen, audit, meet PM\n60: align, ship\n90: lead, measure");
  await page.click("[data-testid=prep-done]");
  ok((await title(page)) === "Interview practice", "interview practice");
  ok(await page.getByText("Question 1 of 4").isVisible(), "four questions");
  await page.getByText("Show my keywords").click();
  ok(await page.getByText("30: listen, audit, meet PM").isVisible(), "your own keywords stay one tap away");
  for (let q = 0; q < 4; q++) await runThrough(page);
  ok((await title(page)) === "Feedback & reflection", "feedback and reflection");
  await page.getByText("Compare with a model answer").click();
  ok(await page.getByText("In the first thirty days my job is to listen and learn").isVisible(), "the model answer opens only now");
  await page.click("[data-testid=finish-session]");
  await page.waitForSelector("[data-testid=complete-title]");
  ok((await page.textContent("[data-testid=complete-title]")).includes("Day 29 complete"), "Day 29 completes");

  console.log("Day 30: the full interview");
  await page.goto(BASE + "/#/practice/30/run");
  await page.waitForSelector("[data-testid=runner]");
  ok(await page.getByText("Step 1 of 3").isVisible(), "Day 30 has three steps (30 minutes)");
  await skip(page, 1);
  ok((await title(page)) === "Full interview simulation", "full interview");
  const parts = await page.locator("ol[aria-label='Parts of the interview'] li").allTextContents();
  ok(parts.length === 10 && parts[0] === "Introduction" && parts[9] === "Unexpected questions", `ten parts, from ${parts[0]} to ${parts[9]}`);
  let given = 0;
  for (let i = 0; i < 10; i++) given += await runThrough(page);
  ok(given > 10, `follow-ups were asked in some parts (${given} answers in total)`);
  ok((await title(page)) === "Reflection & evaluation", "reflection and evaluation");
  ok(await page.getByText("Final evaluation").isVisible(), "final evaluation shown");
  await page.click("[data-testid=finish-session]");
  await page.waitForSelector("[data-testid=complete-title]");
  await page.goto(BASE + "/#/", { waitUntil: "networkidle" });
  ok((await page.textContent("[data-testid=today-topic]")).includes("finished all 30 days"), "the programme shows as complete");

  ok(errors.length === 0, "no console errors" + (errors.length ? ": " + errors.join(" | ") : ""));
  await browser.close();
  console.log(failures ? `\n${failures} check(s) failed` : "\nAll checks passed");
  process.exit(failures ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
