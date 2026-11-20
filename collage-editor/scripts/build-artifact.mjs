// Bundles the editor into one self-contained HTML page (inline JS + CSS) plus the static files it fetches
// (fonts/, samples/). Output: dist-artifact/. Run: npm run artifact
import { build } from "esbuild";
import { execFileSync } from "node:child_process";
import { cpSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const out = join(root, "dist-artifact");
rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });

// 1. CSS: Tailwind, minus the @font-face rules (the app loads fonts itself, see src/artifact/main.tsx)
const cssFile = join(out, "app.css");
execFileSync("npx", ["tailwindcss", "-i", "src/app/globals.css", "-o", cssFile, "--minify"], { cwd: root, stdio: "inherit" });
const css = readFileSync(cssFile, "utf8").replace(/@font-face\{[^}]*\}/g, "");

// 2. JS
const result = await build({
  entryPoints: [join(root, "src/artifact/main.tsx")],
  bundle: true, write: false, minify: true, format: "iife", target: "es2020", platform: "browser",
  define: { "process.env.NODE_ENV": '"production"' },
  jsx: "automatic", loader: { ".json": "json" }, legalComments: "none", logLevel: "warning",
  tsconfig: join(root, "tsconfig.json"),
});
const js = result.outputFiles[0].text.replace(/<\/script/gi, "<\\/script").replace(/<!--/g, "<\\!--");

// 3. page shell: the editor adapts to phones itself (compact layout below 900px), so there is no "desktop only" notice
const html = `<title>Collage Studio</title>
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<style>
${css}
html, body { height: 100%; height: 100dvh; margin: 0; }
#root { height: 100%; }
</style>
<div id="root"></div>
<script>${js}</script>
`;
writeFileSync(join(out, "index.html"), html);

// 4. static files the page fetches
cpSync(join(root, "public/fonts"), join(out, "fonts"), { recursive: true });
cpSync(join(root, "public/samples"), join(out, "samples"), { recursive: true });
console.log(`index.html ${(html.length / 1024).toFixed(0)} KB`);
