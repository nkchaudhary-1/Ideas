// Downloads the curated font files (all SIL Open Font License, via @fontsource) into public/fonts.
// Run once; the files are committed so deployment has no external font dependency.
import { readFileSync, mkdirSync, existsSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";

const fonts = JSON.parse(readFileSync(new URL("../src/lib/font-data.json", import.meta.url), "utf8"));
const out = new URL("../public/fonts/", import.meta.url).pathname;
mkdirSync(out, { recursive: true });
const jobs = [];
for (const f of fonts)
  for (const sub of f.subsets)
    for (const style of ["normal", "italic"])
      for (const w of style === "normal" ? f.weights : f.italic) jobs.push({ f, sub, w, style });

const base = "https://cdn.jsdelivr.net/npm/@fontsource";
let ok = 0, miss = [];
async function run(j) {
  const name = `${j.f.id}-${j.sub}-${j.w}-${j.style}.woff2`;
  const dest = out + name;
  if (existsSync(dest)) { ok++; return; }
  try {
    const buf = execFileSync("curl", ["-sfL", "--max-time", "60", `${base}/${j.f.id}@5/files/${name}`], { maxBuffer: 1 << 26 });
    if (buf.length < 500) throw new Error("tiny");
    writeFileSync(dest, buf); ok++;
  } catch { miss.push(name); }
}
const queue = [...jobs];
await Promise.all(Array.from({ length: 8 }, async () => { for (let j; (j = queue.shift()); ) await run(j); }));
console.log(`fonts: ${ok}/${jobs.length} files`, miss.length ? `missing: ${miss.join(", ")}` : "");
writeFileSync(out + "manifest.json", JSON.stringify(Object.fromEntries(fonts.map(f => [f.id, f.subsets])), null, 0));
