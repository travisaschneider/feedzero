import { EFF_WORDLIST } from "./eff-wordlist";

/**
 * Generates a cryptographically random passphrase using the EFF large wordlist.
 * Each word provides ~12.9 bits of entropy (log2(7776)).
 */
export function generatePassphrase(wordCount = 4): string {
  const indices = new Uint32Array(wordCount);
  crypto.getRandomValues(indices);
  const words = Array.from(indices, (n) => EFF_WORDLIST[n % EFF_WORDLIST.length]);
  return words.join(" ");
}
