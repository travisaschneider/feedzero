/**
 * Bundles each api/*.ts serverless function into a self-contained api/*.js file.
 *
 * Vercel's Node.js builder compiles api/*.ts individually without bundling
 * imports from src/. This script uses esbuild to produce self-contained .js
 * bundles with all dependencies inlined. Vercel prefers .js over .ts when
 * both exist in the api/ directory.
 *
 * Output files (api/*.js) are gitignored build artifacts.
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
  format: "esm",
  platform: "node",
  target: "node20",
  external: ["@vercel/blob"],
});

console.log(
  `Bundled ${entryPoints.length} API functions:`,
  entryPoints.map((f) => path.basename(f, ".ts") + ".js").join(", "),
);
