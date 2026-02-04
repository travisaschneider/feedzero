import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { execSync } from "node:child_process";
import { existsSync, unlinkSync, readdirSync } from "node:fs";
import { resolve, join } from "node:path";
import { SUPPORTED_METHODS } from "@/core/sync/sync-handler";

const apiDir = resolve("api");

describe("API bundle contract", () => {
  beforeAll(() => {
    // Restore .ts source files from git before building (build script deletes them)
    execSync("git checkout -- api/", { stdio: "pipe" });
    execSync("node scripts/build-api.js", { stdio: "pipe" });
  });

  afterAll(() => {
    // Clean up .js bundles and restore .ts source files
    const jsFiles = readdirSync(apiDir).filter((f: string) =>
      f.endsWith(".js"),
    );
    for (const file of jsFiles) {
      unlinkSync(join(apiDir, file));
    }
    execSync("git checkout -- api/", { stdio: "pipe" });
  });

  it("produces a .js bundle for each .ts source file and removes .ts files", () => {
    expect(existsSync(join(apiDir, "feed.js"))).toBe(true);
    expect(existsSync(join(apiDir, "page.js"))).toBe(true);
    expect(existsSync(join(apiDir, "sync.js"))).toBe(true);

    // .ts files should have been removed by the build script
    expect(existsSync(join(apiDir, "feed.ts"))).toBe(false);
    expect(existsSync(join(apiDir, "page.ts"))).toBe(false);
    expect(existsSync(join(apiDir, "sync.ts"))).toBe(false);
  });

  it("feed.js exports GET", async () => {
    const mod = await import(join(apiDir, "feed.js"));
    expect(typeof mod.GET).toBe("function");
  });

  it("page.js exports GET", async () => {
    const mod = await import(join(apiDir, "page.js"));
    expect(typeof mod.GET).toBe("function");
  });

  it("sync.js exports every supported method", async () => {
    const mod = await import(join(apiDir, "sync.js"));
    for (const method of SUPPORTED_METHODS) {
      expect(typeof mod[method], `sync.js missing export for ${method}`).toBe(
        "function",
      );
    }
  });

  it("bundled feed handler returns a response", async () => {
    const mod = await import(join(apiDir, "feed.js"));
    const req = new Request("http://localhost/api/feed");
    const res = await mod.GET(req);
    expect(res).toBeInstanceOf(Response);
    expect(res.status).toBe(400);
  });
});
