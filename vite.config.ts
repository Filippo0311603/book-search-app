/// <reference types="vitest/config" />
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// `host: true` binds to 0.0.0.0 so the dev server is reachable from CodeSandbox's preview.
export default defineConfig(({ mode }) => {
  // The API key is read as `process.env.VITE_GOOGLE_BOOKS_API_KEY` in the source (the only form
  // that also works in CodeSandbox's browser bundler, where `import.meta.env` is a syntax
  // error). Vite does not define `process.env` itself, so `define` provides it: `vite build` replaces
  // the expression in the bundle, while the dev server keeps it in the source and its
  // `/@vite/env` module creates a global `process.env` from `define` at runtime.
  const env = loadEnv(mode, process.cwd(), 'VITE_');

  return {
    plugins: [react()],
    define: {
      'process.env.VITE_GOOGLE_BOOKS_API_KEY': JSON.stringify(env.VITE_GOOGLE_BOOKS_API_KEY ?? ''),
    },
    server: { host: true, port: 5173 },
    preview: { host: true, port: 4173 },
    test: {
      environment: './src/test/jsdom-node-abort.ts',
      globals: true,
      setupFiles: ['./src/test/setup.ts'],
      css: false,
    },
  };
});
