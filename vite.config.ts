/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// `host: true` binds to 0.0.0.0 so the dev server is reachable from CodeSandbox's preview.
export default defineConfig({
  plugins: [react()],
  server: { host: true, port: 5173 },
  preview: { host: true, port: 4173 },
  css: {
    preprocessorOptions: {
      // Bootstrap 5.3 still uses @import internally, which triggers noisy deprecation warnings.
      scss: {
        quietDeps: true,
        silenceDeprecations: ['import', 'global-builtin', 'color-functions', 'if-function'],
      },
    },
  },
  test: {
    environment: './src/test/jsdom-node-abort.ts',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    css: false,
  },
});
