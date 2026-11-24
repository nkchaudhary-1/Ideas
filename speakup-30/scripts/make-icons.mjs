// Renders the app icons from one SVG using the installed Chromium. Run: npm run icons
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
const require = createRequire(import.meta.url);
const { chromium } = require("playwright");

const out = fileURLToPath(new URL("../public/", import.meta.url));
// Full-bleed square: the bars sit inside the central 60% so the icon also works as a maskable icon.
const svg = (size) => `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 64 64">
  <rect width="64" height="64" fill="#0C0D10"/>
  <g fill="#C5F26B" transform="translate(32 32) scale(0.9) translate(-32 -32)">
    <rect x="14" y="26" width="6" height="12" rx="3"/><rect x="24" y="18" width="6" height="28" rx="3"/>
    <rect x="34" y="12" width="6" height="40" rx="3"/><rect x="44" y="22" width="6" height="20" rx="3"/>
  </g></svg>`;
const browser = await chromium.launch();
for (const [name, size] of [["icon-192.png", 192], ["icon-512.png", 512], ["apple-touch-icon.png", 180]]) {
  const page = await browser.newPage({ viewport: { width: size, height: size } });
  await page.setContent(`<body style="margin:0">${svg(size)}</body>`);
  await page.screenshot({ path: join(out, name) });
  await page.close();
}
await browser.close();
console.log("Icons written to public/");
