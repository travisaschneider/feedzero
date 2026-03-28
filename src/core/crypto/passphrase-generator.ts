/**
 * Generates a cryptographically random passphrase using the EFF large wordlist.
 * Each word provides ~12.9 bits of entropy (log2(7776)).
 * Uses rejection sampling to eliminate modulo bias.
 * Wordlist is lazy-loaded to keep it out of the initial bundle.
 */
export async function generatePassphrase(wordCount = 4): Promise<string> {
  const { EFF_WORDLIST } = await import("./eff-wordlist");

  const words: string[] = [];
  const maxUnbiased = Math.floor(0x100000000 / EFF_WORDLIST.length) * EFF_WORDLIST.length;

  for (let i = 0; i < wordCount; i++) {
    let index: number;
    do {
      const buf = new Uint32Array(1);
      crypto.getRandomValues(buf);
      index = buf[0];
    } while (index >= maxUnbiased);

    words.push(EFF_WORDLIST[index % EFF_WORDLIST.length]);
  }

  return words.join(" ");
}
