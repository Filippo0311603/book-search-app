/// <reference types="vite/client" />

// `process.env.VITE_GOOGLE_BOOKS_API_KEY` comes from `define` in vite.config.ts: `vite build` replaces
// the expression in the bundle; the dev server leaves it in the source and its `/@vite/env` module
// creates a global `process.env` from `define` at runtime.
// Declared here instead of pulling in all of Node's `process` typings into browser code.
declare const process: { env: { readonly VITE_GOOGLE_BOOKS_API_KEY?: string } };
