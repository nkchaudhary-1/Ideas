// Static design-rule lint (see /CLAUDE.md): corner radii, the 4px grid, and a few touch rules. Exits non-zero on a finding.
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../../", import.meta.url));
const files = [];
(function walk(dir) {
  for (const f of readdirSync(dir)) {
    const p = join(dir, f);
    if (statSync(p).isDirectory()) walk(p);
    else if (/\.(tsx?|css)$/.test(f)) files.push(p);
  }
})(join(root, "src"));

const SPACING = "p|px|py|pt|pb|pl|pr|m|mx|my|mt|mb|ml|mr|gap|gap-x|gap-y|space-x|space-y|w|h|min-w|min-h|max-w|max-h|top|left|right|bottom|inset|inset-x|inset-y|size|translate-x|translate-y";
const RULES = [
  { name: "default Tailwind radius (use rounded-card, rounded-big, rounded-in-N, rounded or rounded-full)", re: /\brounded(-[trbl]{1,2})?-(md|lg|xl|2xl|3xl)\b/ },
  { name: "raw radius in a class (use the radius tokens)", re: /\brounded(-[trbl]{1,2})?-\[/ },
  { name: "raw px radius in CSS", re: /border-radius:\s*\d+px/, only: /\.css$/ },
  { name: "half-step spacing (6, 10 and 14px are off the 4px grid)", re: new RegExp(`(?<![\\w-])(${SPACING})-(1|2|3|4|5|6|7|8|9)\\.5(?![\\d])`) },
  { name: "100vh (use dvh so phone browser bars do not clip the page)", re: /\b100vh\b/ },
  { name: "hover-only reveal (touch has no hover)", re: /group-hover:(opacity|visible|block|flex)/ },
  { name: "mouse events (use pointer events)", re: /\bon(MouseDown|MouseUp|MouseMove)=/ },
];

let findings = 0;
for (const f of files) {
  const lines = readFileSync(f, "utf8").split("\n");
  lines.forEach((line, i) => {
    for (const r of RULES) {
      if (r.only && !r.only.test(f)) continue;
      if (r.re.test(line)) {
        findings++;
        console.log(`${relative(root, f)}:${i + 1}  ${r.name}\n    ${line.trim().slice(0, 140)}`);
      }
    }
  });
}
console.log(findings ? `\n${findings} lint finding(s)` : "Design lint: no findings");
process.exit(findings ? 1 : 0);
