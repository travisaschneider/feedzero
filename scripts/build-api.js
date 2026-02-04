/**
 * Bundles each api/*.ts serverless function into a self-contained api/*.js file,
 * then removes the .ts source files so Vercel uses only the pre-bundled output.
 *
 * Why: Vercel's Node.js builder compiles api/*.ts individually without bundling
 * imports from src/. If both .ts and .js exist, Vercel re-compiles the .ts and
 * OVERWRITES the .js. By removing .ts after bundling, Vercel finds only the
 * self-contained .js files.
 *
 * Source files are tracked in git; only the build step deletes them temporarily.
 * Output files (api/*.js) are gitignored build artifacts.
 */
import esbuild from "esbuild";
import { readdirSync, unlinkSync } from "fs";
import path from "path";

const apiDir = path.resolve("api");
const tsFiles = readdirSync(apiDir)
  .filter((f) => f.endsWith(".ts"))
  .map((f) => path.join(apiDir, f));

await esbuild.build({
  entryPoints: tsFiles,
  bundle: true,
  outdir: apiDir,
  format: "esm",
  platform: "node",
  target: "node20",
  external: ["@vercel/blob"],
});

// Remove .ts source files so Vercel doesn't re-compile them over the bundles
for (const file of tsFiles) {
  unlinkSync(file);
}

console.log(
  `Bundled ${tsFiles.length} API functions:`,
  tsFiles.map((f) => path.basename(f, ".ts") + ".js").join(", "),
);
