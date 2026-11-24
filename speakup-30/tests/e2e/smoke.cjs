// End-to-end smoke test: drives Day 1 as a real user would, with a fake microphone (Chromium's synthetic audio device).
//   npm run build && npm run preview &   then   node tests/e2e/smoke.cjs [--shots=/some/dir]
// Speech recognition is not available in headless Chromium, so this also proves the typed-transcript fallback.
const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");

const BASE = process.env.BASE_URL || "http://localhost:4173";
const shots = (process.argv.find((a) => a.startsWith("--shots=")) || "").split("=")[1];
let failures = 0;
const ok = (cond, msg) => {
  if (cond) console.log("  ✓", msg);
  else {
    failures++;
    console.log("  ✗", msg);
  }
};
const shot = async (page, name) => shots && (fs.mkdirSync(shots, { recursive: true }), page.screenshot({ path: path.join(shots, name + ".png") }));

const GOOD = `The way I approach a new design problem is to start with the business context. First I try to understand what the team wants to achieve and who the user is.
For example, on a listing page the problem might be that people leave after the second scroll. Because of that, I would look at the data and talk to a few shoppers before touching any screens.
Then I define what success looks like, explore two or three options, and test the strongest one with real users. I decided to keep the scope small so we could learn quickly.
Overall, that is how I move from a vague problem to a decision the team believes in.`;
const SECOND = `Um, so basically I think I would, like, start with the problem, you know, and then actually look at the data. Sorry, I kind of lose my words sometimes. Maybe we could try a few things and see what works for the users and the business.`;

(async () => {
  const browser = await chromium.launch({ args: ["--use-fake-device-for-media-stream", "--use-fake-ui-for-media-stream"] });
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, permissions: ["microphone"], acceptDownloads: true });
  const page = await ctx.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push("pageerror " + e.message));
  page.on("console", (m) => m.type() === "error" && errors.push(m.text().slice(0, 200)));
  // No countdown, so the test does not wait.
  await page.addInitScript(() => {
    if (!localStorage.getItem("speakup30:v1")) localStorage.setItem("speakup30:v1", JSON.stringify({ settings: { countdown: false, liveTranscript: true } }));
  });

  console.log("Welcome");
  await page.goto(BASE, { waitUntil: "networkidle" });
  ok(await page.getByText("Welcome to SpeakUp 30.").isVisible(), "welcome headline");
  ok(await page.getByText("30 days to become a more confident communicator.").isVisible(), "welcome tagline");
  ok(await page.getByText("This isn't about perfect English.").isVisible(), "welcome copy");
  await page.click("[data-testid=start-day-1]");
  await page.waitForSelector("[data-testid=runner]");
  ok((await page.textContent("[data-testid=phase-title]")) === "Vocal warm-up", "Day 1 starts with the vocal warm-up");

  console.log("Warm-up and pause / resume");
  await page.click("[data-testid=pause]");
  ok(await page.locator("[data-testid=paused]").isVisible(), "pausing shows the paused veil");
  await page.click("[data-testid=resume]");
  ok(!(await page.locator("[data-testid=paused]").isVisible()), "resuming hides it");
  for (let i = 0; i < 4; i++) await page.click("[data-testid=warmup-next]");
  await page.click("[data-testid=warmup-done]");
  ok((await page.textContent("[data-testid=phase-title]")) === "Teleprompter", "moves on to the teleprompter");

  console.log("Teleprompter");
  await page.waitForSelector("[data-testid=prompter]");
  await shot(page, "01-prompter");
  await page.click("[data-testid=open-fill]");
  await page.fill("#ph-name", "Neelesh");
  await page.keyboard.press("Escape");
  ok(await page.locator("[data-unit]", { hasText: "Neelesh" }).first().isVisible(), "a filled placeholder appears in the script");
  const active = async () => +(await page.locator("[data-unit][data-state=active]").first().getAttribute("data-unit"));
  const before = await active();
  await page.click("[data-testid=legend-start]");
  await page.waitForTimeout(600);
  await page.click("[data-testid=next]");
  ok((await active()) > before, "next sentence moves the highlight");
  await page.click("[data-testid=prev]");
  await page.click("[data-testid=play]"); // pause
  await page.keyboard.press("Space");
  await page.waitForTimeout(1500);
  const t = await page.textContent("[data-testid=prompter-timer]");
  ok(/0:0[1-9]|0:1/.test(t), `the session timer runs (${t.trim().slice(0, 12)})`);
  await page.keyboard.press("Space");
  await page.keyboard.press("f");
  await page.waitForTimeout(300);
  const box = await page.locator("[data-testid=prompter]").boundingBox();
  ok(box.width >= 1270 && box.height >= 890, "full screen fills the viewport");
  await shot(page, "02-prompter-fullscreen");
  await page.keyboard.press("Escape");
  await page.waitForTimeout(300);
  const box2 = await page.locator("[data-testid=prompter]").boundingBox();
  ok(box2.width < 1270, "Escape leaves full screen");
  await page.click("[data-testid=prompter-settings]");
  await page.getByRole("radio", { name: "Advanced" }).click();
  ok((await page.locator("[role=note]").count()) > 0, "cues still render in advanced mode as dots");
  await page.getByRole("radio", { name: "Beginner" }).click();
  await page.keyboard.press("Escape");
  await page.click("[data-testid=skip-step]");
  ok((await page.textContent("[data-testid=phase-title]")) === "Guided speaking", "skip moves on to guided speaking");

  console.log("Guided speaking: keywords only, real recording");
  ok(await page.locator("[data-testid=keyword-map]").isVisible(), "keyword map shown");
  const kw = await page.locator("[data-testid=keyword-map] li").allTextContents();
  ok(kw.every((k) => !/[.!?]$/.test(k)), "no full sentences in guided mode");
  await page.click("[data-testid=start-recording]");
  await page.getByText("Recording", { exact: true }).first().waitFor();
  ok(await page.getByRole("button", { name: "Stop recording", exact: true }).isVisible(), "recording status and stop button are visible");
  ok(await page.locator("[data-testid=pause]").isDisabled(), "the session clock cannot be paused mid-recording");
  await shot(page, "03-recording");
  await page.waitForTimeout(3500);
  await page.getByRole("button", { name: "Stop recording", exact: true }).click();
  await page.waitForSelector("[data-testid=transcript]");
  ok(await page.locator("[data-testid=audio-player]").isVisible(), "replay player appears for the real recording");
  await page.fill("[data-testid=transcript]", GOOD);
  await page.click("[data-testid=update-report]");
  await page.waitForSelector("[data-testid=report]");
  const readiness = await page.textContent("[data-testid=readiness]");
  ok(/\d+\s*\/10/.test(readiness), `readiness score is shown (${readiness.replace(/\s+/g, " ").trim().slice(0, 40)})`);
  const scores = await page.textContent("[data-testid=scores]");
  ok(/Clarity/.test(scores) && /Filler word control/.test(scores) && /Interview relevance/.test(scores), "score rows are present");
  ok(await page.getByText("What you did well").isVisible(), "what you did well");
  ok(await page.getByText("Improve next time").isVisible(), "improve next time");
  await shot(page, "04-report");
  console.log("Retry and compare");
  await page.click("[data-testid=retry]");
  await page.click("[data-testid=start-recording]");
  await page.waitForTimeout(3000);
  await page.getByRole("button", { name: "Stop recording", exact: true }).click();
  await page.waitForSelector("[data-testid=transcript]");
  await page.fill("[data-testid=transcript]", SECOND);
  await page.click("[data-testid=update-report]");
  await page.waitForSelector("[data-testid=compare]");
  ok(await page.locator("[data-testid=compare]").isVisible(), "previous and new attempt are compared");
  const fillers = await page.locator("summary, button").filter({ hasText: "Filler words" }).first();
  await fillers.click();
  ok(await page.getByText(/Hesitation sound|Used as a pause-filler|Repeated/).first().isVisible(), "filler findings explain why each was counted");
  await page.click("[data-testid=guided-done]");

  console.log("Challenge with typed answer and a follow-up chosen from the answer");
  ok((await page.textContent("[data-testid=phase-title]")) === "Challenge", "challenge step");
  await page.click("[data-testid=type-instead]");
  await page.fill("[aria-label='Type what you said']", "I'm a product designer with eight years of experience in e-commerce. I decided to focus on search because users could not find products. In short, that is what I bring to a team.");
  await page.click("[data-testid=analyse-typed]");
  await page.waitForSelector("[data-testid=report]");
  const q1 = await page.textContent("[data-testid=question]");
  await page.click("[data-testid=optional-followup]");
  await page.waitForTimeout(300);
  const q2 = await page.textContent("[data-testid=question]");
  ok(q1 !== q2 && q2.length > 10, `follow-up question is different: “${q2.slice(0, 60)}”`);
  ok(await page.getByText(/Why this question:/).isVisible(), "the reason for the follow-up is shown");
  await page.click("[data-testid=type-instead]");
  await page.fill("[aria-label='Type what you said']", "I would measure success with the conversion rate and the share of people who find a product quickly, and I would compare it with the baseline before launch.");
  await page.click("[data-testid=analyse-typed]");
  await page.click("[data-testid=run-complete]");

  console.log("Reflection and completion");
  ok((await page.textContent("[data-testid=phase-title]")) === "Reflection", "reflection step");
  const areas = page.locator("textarea[id^=refl-]");
  ok((await areas.count()) === 4, "four reflection questions");
  for (let i = 0; i < 4; i++) await areas.nth(i).fill(`Answer ${i + 1}`);
  await page.click("[data-testid=finish-session]");
  await page.waitForSelector("[data-testid=complete-title]");
  ok((await page.textContent("[data-testid=complete-title]")).includes("Day 1 complete"), "Day 1 complete screen");
  await shot(page, "05-complete");

  console.log("Dashboard and progress");
  await page.goto(BASE + "/#/", { waitUntil: "networkidle" });
  await page.waitForSelector("[data-testid=today-topic]");
  ok((await page.textContent("[data-testid=today-topic]")).includes("Walk me through your 8-year design journey"), "today's topic is now Day 2");
  ok(/1 day/.test(await page.textContent("main")), "streak counts the day");
  await shot(page, "06-dashboard");
  await page.goto(BASE + "/#/progress", { waitUntil: "networkidle" });
  ok((await page.locator("figure svg[role=img]").count()) >= 5, "trend charts render");
  ok(await page.getByText("Reflection journal").isVisible(), "reflection journal");
  await page.getByText("Day 1 · Tell me about yourself").first().click();
  ok(await page.getByText("Answer 1").isVisible(), "saved reflection is readable");
  await shot(page, "07-progress");

  console.log("Analysis list, persistence");
  await page.reload({ waitUntil: "networkidle" });
  await page.goto(BASE + "/#/analysis", { waitUntil: "networkidle" });
  ok((await page.locator("[data-testid=attempt-list] li").count()) >= 4, "all attempts are saved and listed after a reload");
  await page.fill("[data-testid=paste]", GOOD);
  await page.click("[data-testid=paste-analyse]");
  await page.waitForSelector("[data-testid=report]");
  ok(true, "a pasted transcript can be analysed");

  console.log("Settings: backup, delete, restore");
  await page.goto(BASE + "/#/settings", { waitUntil: "networkidle" });
  const [dl] = await Promise.all([page.waitForEvent("download"), page.click("[data-testid=export]")]);
  const file = await dl.path();
  const backup = JSON.parse(fs.readFileSync(file, "utf8"));
  ok(backup.app === "speakup-30" && backup.data.sessions.length === 1 && backup.data.attempts.length >= 4, "backup contains sessions and attempts");
  ok(backup.data.settings.ai.apiKey === "", "backup never contains the API key");
  await page.getByRole("button", { name: "Delete all transcripts" }).click();
  await page.click("[data-testid=confirm-delete]");
  await page.goto(BASE + "/#/analysis", { waitUntil: "networkidle" });
  ok((await page.getByText("Transcript deleted").count()) >= 4, "transcripts are deleted");
  await page.goto(BASE + "/#/settings", { waitUntil: "networkidle" });
  await page.setInputFiles("[data-testid=import-file]", file);
  await page.click("[data-testid=confirm-import]");
  await page.goto(BASE + "/#/analysis", { waitUntil: "networkidle" });
  ok((await page.getByText("Transcript deleted").count()) === 0, "restoring the backup brings transcripts back");

  console.log("Console");
  ok(errors.length === 0, "no console errors" + (errors.length ? ": " + errors.join(" | ") : ""));
  await browser.close();
  console.log(failures ? `\n${failures} check(s) failed` : "\nAll checks passed");
  process.exit(failures ? 1 : 0);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
