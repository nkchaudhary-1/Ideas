/* Assembles each template with the shared markup, config and renderer.
   dist/        full HTML pages for hosting (Vercel serves this folder)
   artifacts/   the same pages without the document wrapper, for claude.ai artifact previews */
const fs = require("fs"), path = require("path");
const root = __dirname;
const read = f => fs.readFileSync(path.join(root, f), "utf8");
const markup = read("markup.html"), config = read("config.js"), render = read("render.js"), ill = read("illustrations.js"), fx = read("fx.js"), exp = read("experience.js"), base = read("base.css");
const templates = fs.readdirSync(path.join(root, "templates")).filter(f => f.endsWith(".html")).map(f => f.replace(".html",""));
fs.mkdirSync(path.join(root, "dist"), { recursive: true });
fs.mkdirSync(path.join(root, "artifacts"), { recursive: true });

for (const name of templates) {
  const src = read(`templates/${name}.html`);
  const [head0, rest = ""] = src.split("<!--DECOR-->");
  const head = head0.replace("<style>", `<style>\n${base}\n</style>\n<style>`);
  const [decor, script = ""] = rest.split("<!--SCRIPT-->");
  const CDN = `<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js"></script>\n<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/ScrollTrigger.min.js"></script>\n<script>document.documentElement.classList.add(window.gsap&&window.ScrollTrigger&&!matchMedia("(prefers-reduced-motion: reduce)").matches?"fx-on":"fx-off")</script>`;
  const body = `${CDN}\n${decor.trim()}\n${markup}\n<script>\n${config}\n</script>\n<script>\n${ill}\n</script>\n<script>\n${fx}\n</script>\n<script>\n${render}\n</script>\n<script>\n${exp}\n</script>\n${script.trim()}\n`;
  fs.writeFileSync(path.join(root, "artifacts", `${name}.html`), `${head.trim()}\n${body}`);
  const fullHead = head.replace(/<meta name="claude:viewport-fit-sides"[^>]*>\n?/, "").trim();
  fs.mkdirSync(path.join(root, "dist", name), { recursive: true });
  fs.writeFileSync(path.join(root, "dist", name, "index.html"),
    `<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n<meta name="description" content="Wedding invitation">\n<style>[hidden]{display:none!important}</style>\n${fullHead}\n</head>\n<body>\n${body}</body>\n</html>\n`);
}
const links = templates.map(t => `<li><a href="/${t}/#groom">${t} · groom's side</a> <a href="/${t}/#bride">${t} · bride's side</a></li>`).join("\n");
fs.writeFileSync(path.join(root, "dist", "index.html"),
  `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Wedding invite templates</title><style>body{font-family:system-ui,sans-serif;max-width:520px;margin:48px auto;padding:0 16px;line-height:1.6}a{display:inline-block;margin:4px 8px 4px 0}</style></head><body><h1>Wedding invite templates</h1><ul>\n${links}\n</ul></body></html>\n`);
console.log("built:", templates.join(", "));
