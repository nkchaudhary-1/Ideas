import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";

// ARTIFACT=1 builds the single-file variant (images embedded as data: URIs) – see scripts/build_artifact.py
const artifact = process.env.ARTIFACT === "1";

export default defineConfig({
  plugins: [react()],
  base: artifact ? "./" : "/",
  publicDir: artifact ? false : "public",
  resolve: artifact
    ? { alias: [{ find: /^\.\/artworks\.json$/, replacement: fileURLToPath(new URL("./artifact/artworks.json", import.meta.url)) }] }
    : {},
  build: {
    target: "es2022",
    chunkSizeWarningLimit: 12000,
    outDir: artifact ? "dist-artifact" : "dist",
    assetsInlineLimit: artifact ? 100_000_000 : 4096,
  },
});
