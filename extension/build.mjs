/**
 * Bundles the Chrome extension TypeScript sources into loadable JS files.
 * Output is written in-place inside `extension/` so you can load the folder
 * unpacked in chrome://extensions.
 *
 * Usage:
 *   node extension/build.mjs            # one-shot build
 *   node extension/build.mjs --watch    # rebuild on change
 */

import * as esbuild from "esbuild";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const watch = process.argv.includes("--watch");

// socket.io-client was written for a browser environment.
// These defines keep it happy inside a service worker where `window` is absent.
const define = {
  "process.env.NODE_ENV": '"production"',
  "global": "globalThis",
};

const banner = {
  // Polyfill `window` so any library code that checks `typeof window` still
  // works inside the service-worker sandbox.
  js: "var window = globalThis;",
};

const shared = {
  bundle: true,
  sourcemap: false,
  target: "chrome120",
  format: /** @type {"esm"} */ ("esm"),
  define,
};

const configs = [
  {
    ...shared,
    entryPoints: [join(__dirname, "popup.ts")],
    outfile: join(__dirname, "popup.js"),
  },
  {
    ...shared,
    banner,
    entryPoints: [join(__dirname, "background.ts")],
    outfile: join(__dirname, "background.js"),
  },
  {
    ...shared,
    format: /** @type {"iife"} */ ("iife"),
    entryPoints: [join(__dirname, "content.ts")],
    outfile: join(__dirname, "content.js"),
  },
];

if (watch) {
  const contexts = await Promise.all(configs.map((c) => esbuild.context(c)));
  await Promise.all(contexts.map((ctx) => ctx.watch()));
  console.log("[snipio extension] Watching for changes…");
} else {
  await Promise.all(configs.map((c) => esbuild.build(c)));
  console.log("[snipio extension] Build complete — load extension/ in chrome://extensions");
}
