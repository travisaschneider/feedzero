/**
 * Replaces each api/*.ts with a self-contained esbuild bundle (keeping .ts extension).
 *
 * Why: Vercel discovers api/*.ts pre-build and expects them post-build. If we delete
 * them, Vercel errors with "File not found". If we output .js alongside .ts, Vercel
 * re-compiles .ts and overwrites .js. By replacing .ts content with the bundled output
 * (all dependencies inlined, no external imports), Vercel compiles them trivially.
 *
 * The original .ts source is tracked in git. This script only modifies the build
 * working copy — git source is not affected.
 */
import esbuild from "esbuild";
import {
  readdirSync,
  readFileSync,
  writeFileSync,
  mkdtempSync,
  rmSync,
} from "fs";
import { tmpdir } from "os";
import path from "path";

const apiDir = path.resolve("api");
const tsFiles = readdirSync(apiDir)
  .filter((f) => f.endsWith(".ts"))
  .map((f) => path.join(apiDir, f));

if (tsFiles.length === 0) {
  throw new Error("No api/*.ts files found to bundle.");
}

// Bundle to a temp directory to avoid overwriting source mid-build
const tempOut = mkdtempSync(path.join(tmpdir(), "feedzero-api-"));

try {
  await esbuild.build({
    entryPoints: tsFiles,
    bundle: true,
    outdir: tempOut,
    format: "esm",
    platform: "node",
    target: "node20",
    external: ["@vercel/blob"],
  });

  // Validate bundled output before overwriting source
  for (const tsFile of tsFiles) {
    const baseName = path.basename(tsFile, ".ts");
    const bundledPath = path.join(tempOut, baseName + ".js");
    const bundledContent = readFileSync(bundledPath, "utf-8");

    if (!bundledContent || bundledContent.length === 0) {
      throw new Error(`Empty bundle output for ${baseName}.js`);
    }
    if (bundledContent.includes("../src/")) {
      throw new Error(
        `Bundle for ${baseName}.js contains unbundled ../src/ imports`,
      );
    }
  }

  // Overwrite api/*.ts with bundled .js content (Vercel expects .ts extension)
  for (const tsFile of tsFiles) {
    const baseName = path.basename(tsFile, ".ts");
    const bundledContent = readFileSync(
      path.join(tempOut, baseName + ".js"),
      "utf-8",
    );
    writeFileSync(tsFile, bundledContent);
  }

  console.log(
    `Bundled ${tsFiles.length} API functions (in-place):`,
    tsFiles.map((f) => path.basename(f)).join(", "),
  );
} finally {
  // Clean up temp directory regardless of success or failure
  rmSync(tempOut, { recursive: true, force: true });
}
