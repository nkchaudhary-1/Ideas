// Bundles SpeakUp 30 into one self-contained page for the Artifact viewer: inline JS and CSS, fonts from Google Fonts.
// The viewer's sandbox has no microphone and blocks other hosts, so this build uses the viewer's dictation tool for
// speech and leaves out the optional AI review (see src/lib/env.ts). Output: dist-artifact/index.html. Run: npm run artifact
import { build } from "esbuild";
import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const out = join(root, "dist-artifact");
rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });

// 1. CSS: Tailwind, without the bundled font files (the page loads Geist from Google Fonts instead).
const source = readFileSync(join(root, "src/index.css"), "utf8").replace(/@import "@fontsource[^"]*";\n/g, "");
writeFileSync(join(out, "_in.css"), source);
execFileSync("npx", ["tailwindcss", "-c", "tailwind.config.ts", "-i", join(out, "_in.css"), "-o", join(out, "app.css"), "--minify"], { cwd: root, stdio: "inherit" });
const css = readFileSync(join(out, "app.css"), "utf8").replace(/@font-face\{[^}]*\}/g, "");

// 2. JS
const result = await build({
  entryPoints: [join(root, "src/main.tsx")],
  bundle: true, write: false, minify: true, format: "iife", target: "es2022", platform: "browser",
  define: { "process.env.NODE_ENV": '"production"', "import.meta.env.VITE_ARTIFACT": '"1"', "import.meta.env.PROD": "true" },
  jsx: "automatic", loader: { ".css": "empty" }, alias: { "@anthropic-ai/sdk": join(root, "scripts/empty-sdk.mjs") }, legalComments: "none", logLevel: "warning",
  tsconfig: join(root, "tsconfig.json"),
});
const js = result.outputFiles[0].text.replace(/<\/script/gi, "<\\/script").replace(/<!--/g, "<\\!--");
if (/anthropic-dangerous-direct-browser-access/.test(js)) throw new Error("The Anthropic SDK leaked into the artifact bundle.");

// 3. The page. The viewer wraps it in its own document, so there is no <html>, <head> or <body> here.
const html = `<title>SpeakUp 30</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Geist:wght@300..700&family=Geist+Mono:wght@400..600&display=swap">
<style>
${css}
</style>
<div id="root"></div>
<script>
// Saved theme before first paint. Dark is the default.
try { var s = JSON.parse(localStorage.getItem("speakup30:v1") || "{}"); var t = (s.settings && s.settings.theme) || "dark"; if (t === "system") t = matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark"; document.documentElement.dataset.theme = t; } catch (e) { document.documentElement.dataset.theme = "dark"; }
</script>
<script>${js}</script>
`;
writeFileSync(join(out, "index.html"), html);
console.log(`dist-artifact/index.html ${(html.length / 1024).toFixed(0)} KB (JS ${(js.length / 1024).toFixed(0)} KB, CSS ${(css.length / 1024).toFixed(0)} KB)`);
