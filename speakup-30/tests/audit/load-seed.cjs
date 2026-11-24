// Bundles tests/audit/seed.ts with the real analysis code and returns buildSeed(). Shared by the audit and the e2e tests.
const path = require("path");
const esbuild = require("esbuild");

module.exports = function loadSeed() {
  const out = esbuild.buildSync({ entryPoints: [path.join(__dirname, "seed.ts")], bundle: true, platform: "node", format: "cjs", write: false, alias: { "@": path.resolve(__dirname, "../../src") }, logLevel: "error" });
  const mod = { exports: {} };
  new Function("module", "exports", "require", out.outputFiles[0].text)(mod, mod.exports, require);
  return mod.exports.buildSeed;
};
