import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { execSync } from "node:child_process";
import { existsSync, unlinkSync, readdirSync } from "node:fs";
import { resolve, join } from "node:path";
import { SUPPORTED_METHODS } from "@/core/sync/sync-handler";

const apiDir = resolve("api");
const bundledFiles = () =>
  readdirSync(apiDir).filter((f: string) => f.endsWith(".mjs"));

describe("API bundle contract", () => {
  beforeAll(() => {
    execSync("node scripts/build-api.js", { stdio: "pipe" });
  });

  afterAll(() => {
    for (const file of bundledFiles()) {
      unlinkSync(join(apiDir, file));
    }
  });

  it("produces a .mjs bundle for each .ts source file", () => {
    const tsFiles = readdirSync(apiDir)
      .filter((f: string) => f.endsWith(".ts"))
      .map((f: string) => f.replace(".ts", ".mjs"));

    for (const expected of tsFiles) {
      expect(
        existsSync(join(apiDir, expected)),
        `Missing bundle: ${expected}`,
      ).toBe(true);
    }
  });

  it("feed.mjs exports GET", async () => {
    const mod = await import(join(apiDir, "feed.mjs"));
    expect(typeof mod.GET).toBe("function");
  });

  it("page.mjs exports GET", async () => {
    const mod = await import(join(apiDir, "page.mjs"));
    expect(typeof mod.GET).toBe("function");
  });

  it("sync.mjs exports every supported method", async () => {
    const mod = await import(join(apiDir, "sync.mjs"));
    for (const method of SUPPORTED_METHODS) {
      expect(typeof mod[method], `sync.mjs missing export for ${method}`).toBe(
        "function",
      );
    }
  });

  it("bundled feed handler returns a response", async () => {
    const mod = await import(join(apiDir, "feed.mjs"));
    const req = new Request("http://localhost/api/feed");
    const res = await mod.GET(req);
    expect(res).toBeInstanceOf(Response);
    expect(res.status).toBe(400);
  });
});
