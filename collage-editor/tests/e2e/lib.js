// Shared helpers for the browser tests. Run the app first (`npm run dev -- -p 3100`), then e.g. `node tests/e2e/edit-batch.js`.
// Needs Playwright (`npm i -D playwright` or a global install); set BASE_URL to test another port.
const { chromium } = require('playwright');
const path = require('path');
exports.S = path.resolve(__dirname, '../../public/samples') + '/';
exports.T = path.resolve(__dirname, '../fixtures') + '/';
exports.open = async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1600, height: 950 }, acceptDownloads: true });
  const page = await ctx.newPage();
  const logs = [];
  page.on('console', (m) => { if (['error', 'warning'].includes(m.type())) logs.push(`[${m.type()}] ${m.text()}`); });
  page.on('pageerror', (e) => logs.push(`[pageerror] ${e.message}`));
  await page.goto(process.env.BASE_URL || 'http://localhost:3100', { waitUntil: 'networkidle' });
  return { browser, ctx, page, logs };
};
exports.settle = (page, ms = 450) => page.waitForTimeout(ms);
