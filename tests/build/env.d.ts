/** Type declarations for Node.js APIs used by build-contract tests. */
declare module "node:child_process" {
  export function execSync(
    command: string,
    options?: { stdio?: "pipe" | "inherit" | "ignore" },
  ): Buffer;
}

declare module "node:fs" {
  export function existsSync(path: string): boolean;
  export function readFileSync(path: string, encoding: string): string;
  export function readdirSync(path: string): string[];
}

declare module "node:path" {
  export function resolve(...paths: string[]): string;
  export function join(...paths: string[]): string;
}
