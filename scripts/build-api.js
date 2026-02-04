/**
 * Bundles each api/*.ts serverless function into a self-contained .mjs file.
 *
 * Vercel's Node.js builder does NOT bundle imports from src/ — it compiles
 * each api/*.ts file individually. This script uses esbuild to inline all
 * dependencies so the output files are self-contained and work in any
 * serverless runtime (Vercel, Cloudflare, plain Node.js).
 *
 * Output files (api/*.mjs) are gitignored build artifacts.
 * Vercel prefers .mjs over .ts for ESM projects.
 */
import esbuild from "esbuild";
import { readdirSync } from "fs";
import path from "path";

const apiDir = path.resolve("api");
const entryPoints = readdirSync(apiDir)
  .filter((f) => f.endsWith(".ts"))
  .map((f) => path.join(apiDir, f));

await esbuild.build({
  entryPoints,
  bundle: true,
  outdir: apiDir,
  outExtension: { ".js": ".mjs" },
  format: "esm",
  platform: "node",
  target: "node20",
  external: ["@vercel/blob"],
});

console.log(
  `Bundled ${entryPoints.length} API functions:`,
  entryPoints.map((f) => path.basename(f, ".ts") + ".mjs").join(", "),
);
