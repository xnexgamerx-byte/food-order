/**
 * Netlify build script:
 * 1. Builds the React frontend (Vite)
 * 2. Bundles the Express API into a Netlify serverless function (CJS)
 */

import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";
import { rm, mkdir } from "node:fs/promises";
import { build as esbuild } from "esbuild";
import pinoPlugin from "esbuild-plugin-pino";

globalThis.require = createRequire(import.meta.url);

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

// ── 1. Build the React frontend ───────────────────────────────────────────────
console.log("⚛️  Building frontend...");
execSync("pnpm --filter @workspace/food-order run build", {
  cwd: root,
  stdio: "inherit",
  env: { ...process.env, NODE_ENV: "production", BASE_PATH: "/" },
});

// ── 2. Bundle the Netlify API function (CJS for Lambda compatibility) ─────────
console.log("🔧 Bundling API function...");
const functionsOut = path.resolve(root, "netlify/functions");
await rm(functionsOut, { recursive: true, force: true });
await mkdir(functionsOut, { recursive: true });

await esbuild({
  entryPoints: { api: path.resolve(root, "netlify/src/api.ts") },
  platform: "node",
  target: "node20",
  bundle: true,
  format: "cjs",
  outdir: functionsOut,
  logLevel: "info",
  sourcemap: false,
  plugins: [pinoPlugin({ transports: ["pino-pretty"] })],
  banner: {
    js: `const __importMetaUrl = require("url").pathToFileURL(__filename).href;`,
  },
  define: {
    "import.meta.url": "__importMetaUrl",
  },
  nodePaths: [
    path.resolve(root, "node_modules"),
    path.resolve(root, "artifacts/api-server/node_modules"),
    path.resolve(root, "lib/db/node_modules"),
  ],
  external: [
    "*.node",
    "sharp",
    "better-sqlite3",
    "sqlite3",
    "canvas",
    "bcrypt",
    "argon2",
    "fsevents",
    "pg-native",
  ],
});

console.log("✅ Build complete!");
console.log("   Frontend → artifacts/food-order/dist/public");
console.log("   API function → netlify/functions/api.js");
