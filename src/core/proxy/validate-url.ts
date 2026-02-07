import { ok, err, type Result } from "../../utils/result.ts";

const BLOCKED_HOSTNAMES = new Set([
  "localhost",
  "127.0.0.1",
  "::1",
  "0.0.0.0",
  "169.254.169.254",
]);

const BLOCKED_PREFIXES = ["10.", "192.168."];

/** Checks if hostname is in the 172.16.0.0/12 range (172.16.x.x – 172.31.x.x). */
function isPrivate172(hostname: string): boolean {
  const match = hostname.match(/^172\.(\d+)\./);
  if (!match) return false;
  const octet = parseInt(match[1], 10);
  return octet >= 16 && octet <= 31;
}

/**
 * Validates a URL for proxying: checks for presence, allowed protocols,
 * and blocks internal/private addresses (SSRF protection).
 */
export function validateProxyUrl(url: string | null | undefined): Result<URL> {
  if (!url) {
    return err("Missing url parameter");
  }

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return err("Invalid URL");
  }

  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
    return err("Only http and https URLs are allowed");
  }

  const hostname = parsed.hostname.replace(/^\[|\]$/g, "");
  if (
    BLOCKED_HOSTNAMES.has(hostname) ||
    BLOCKED_PREFIXES.some((prefix) => hostname.startsWith(prefix)) ||
    isPrivate172(hostname)
  ) {
    return err("Access to internal addresses is blocked");
  }

  return ok(parsed);
}
