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

// 3. page shell
const html = `<title>Collage Studio</title>
<style>
:root { color-scheme: dark; }
html, body { height: 100%; }
body { background: #181818; color: #ececec; margin: 0; }
${css}
#root { height: 100%; min-width: 980px; }
#small { display: none; }
@media (max-width: 900px) {
  #small { position: fixed; inset: 0; z-index: 200; display: flex; align-items: center; justify-content: center; padding: 24px max(16px, env(safe-area-inset-left, 0px)); background: #181818; text-align: center; }
  #small.off { display: none; }
  body { overflow: auto; }
}
#small div { max-width: 360px; font: 14px/1.5 Inter, system-ui, sans-serif; color: #c9c9c9; }
#small b { display: block; font-size: 16px; color: #f2f2f2; margin-bottom: 8px; }
#small button { margin-top: 16px; height: 32px; padding: 0 14px; border-radius: 6px; border: 1px solid #3a3a3a; background: #2c2c2c; color: #ececec; cursor: pointer; }
</style>
<div id="root"></div>
<div id="small"><div><b>Collage Studio is a desktop editor</b>The canvas, panels and slide strip need a window at least 980&nbsp;px wide. On a phone you can still look around, but editing is much easier on a laptop or tablet in landscape.<br><button type="button" onclick="document.getElementById('small').classList.add('off')">Open it anyway</button></div></div>
<script>${js}</script>
`;
writeFileSync(join(out, "index.html"), html);

// 4. static files the page fetches
cpSync(join(root, "public/fonts"), join(out, "fonts"), { recursive: true });
cpSync(join(root, "public/samples"), join(out, "samples"), { recursive: true });
console.log(`index.html ${(html.length / 1024).toFixed(0)} KB`);
