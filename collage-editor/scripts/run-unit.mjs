// Bundles each tests/unit/*.test.ts with esbuild and runs it in Node: no test framework needed.
import { build } from "esbuild";
import { readdirSync, mkdirSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { join } from "node:path";
import { tmpdir } from "node:os";

const dir = new URL("../tests/unit/", import.meta.url).pathname;
const out = join(tmpdir(), "collage-unit");
mkdirSync(out, { recursive: true });
let failed = 0;
for (const f of readdirSync(dir).filter((n) => n.endsWith(".test.ts"))) {
  const outfile = join(out, f.replace(/\.ts$/, ".cjs"));
  await build({ entryPoints: [join(dir, f)], bundle: true, platform: "node", format: "cjs", outfile, logLevel: "error" });
  console.log(`\n── ${f}`);
  const r = spawnSync(process.execPath, [outfile], { stdio: "inherit" });
  if (r.status !== 0) failed++;
}
process.exit(failed ? 1 : 0);
