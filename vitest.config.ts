import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    environment: 'jsdom',
    // .tsx too: the component harness (src/test/setup.ts) renders primitives
    // and the verify box. The source-text guards in page-shape.test.ts skip
    // *.test.tsx files, so a test may spell a banned class without tripping one.
    include: ['src/**/*.test.{ts,tsx}'],
    setupFiles: ['./src/test/setup.ts'],
    globals: true,
  },
  esbuild: { jsx: 'automatic' },
});
