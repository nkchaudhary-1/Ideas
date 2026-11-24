// Bundles each tests/unit/*.test.ts with esbuild and runs it in Node: no test framework needed.
import { build } from "esbuild";
import { readdirSync, mkdirSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const dir = join(root, "tests/unit");
const out = join(tmpdir(), "speakup-unit");
mkdirSync(out, { recursive: true });
let failed = 0;
for (const f of readdirSync(dir).filter((n) => n.endsWith(".test.ts"))) {
  const outfile = join(out, f.replace(/\.ts$/, ".cjs"));
  await build({ entryPoints: [join(dir, f)], bundle: true, platform: "node", format: "cjs", outfile, logLevel: "error", alias: { "@": join(root, "src") } });
  console.log(`\n── ${f}`);
  const r = spawnSync(process.execPath, [outfile], { stdio: "inherit" });
  if (r.status !== 0) failed++;
}
process.exit(failed ? 1 : 0);
