import type { Environment } from 'vitest/environments';
import { builtinEnvironments } from 'vitest/environments';

/**
 * jsdom replaces AbortController/AbortSignal with its own classes, which Node's built-in
 * `Request` (used by fetchBaseQuery and MSW) rejects. This environment is the stock jsdom one
 * with Node's native implementations put back, so request cancellation works in tests.
 */
const environment: Environment = {
  name: 'jsdom-node-abort',
  transformMode: 'web',
  async setup(global, options) {
    const NodeAbortController = global.AbortController;
    const NodeAbortSignal = global.AbortSignal;
    const { teardown } = await builtinEnvironments.jsdom.setup(global, options);
    global.AbortController = NodeAbortController;
    global.AbortSignal = NodeAbortSignal;
    return { teardown };
  },
};

export default environment;
