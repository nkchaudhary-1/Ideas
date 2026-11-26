import { defineConfig } from 'vitest/config';

// Relative base so the built `dist/` folder can be dropped on any path or CDN.
export default defineConfig({
  base: './',
  build: { target: 'es2022', sourcemap: false },
  test: { include: ['tests/unit/**/*.test.ts'] },
});
