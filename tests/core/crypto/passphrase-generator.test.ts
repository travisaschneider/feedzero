import { describe, it, expect } from "vitest";
import { generatePassphrase } from "@/core/crypto/passphrase-generator";
import { EFF_WORDLIST } from "@/core/crypto/eff-wordlist";

describe("generatePassphrase", () => {
  it("generates 4 words by default", () => {
    const passphrase = generatePassphrase();
    const words = passphrase.split(" ");
    expect(words).toHaveLength(4);
  });

  it("generates the specified number of words", () => {
    const passphrase = generatePassphrase(6);
    const words = passphrase.split(" ");
    expect(words).toHaveLength(6);
  });

  it("uses only words from the EFF wordlist", () => {
    const passphrase = generatePassphrase();
    const words = passphrase.split(" ");
    const wordlistSet = new Set(EFF_WORDLIST);
    for (const word of words) {
      expect(wordlistSet.has(word)).toBe(true);
    }
  });

  it("uses only lowercase words", () => {
    const passphrase = generatePassphrase();
    expect(passphrase).toBe(passphrase.toLowerCase());
  });

  it("produces different passphrases on consecutive calls", () => {
    const results = new Set<string>();
    for (let i = 0; i < 10; i++) {
      results.add(generatePassphrase());
    }
    expect(results.size).toBeGreaterThan(1);
  });

  it("words are separated by single spaces", () => {
    const passphrase = generatePassphrase();
    expect(passphrase).not.toMatch(/  /);
    expect(passphrase).not.toMatch(/^ /);
    expect(passphrase).not.toMatch(/ $/);
  });
});

describe("EFF_WORDLIST", () => {
  it("contains 7776 words", () => {
    expect(EFF_WORDLIST).toHaveLength(7776);
  });

  it("contains only lowercase words", () => {
    for (const word of EFF_WORDLIST) {
      expect(word).toBe(word.toLowerCase());
    }
  });

  it("contains no duplicates", () => {
    const unique = new Set(EFF_WORDLIST);
    expect(unique.size).toBe(EFF_WORDLIST.length);
  });
});
