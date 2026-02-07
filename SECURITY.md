# Security Policy

## Reporting a Vulnerability

If you discover a security vulnerability in FeedZero, please report it responsibly:

1. **Do not** open a public GitHub issue
2. Email the maintainers directly (see repository owner's profile for contact info)
3. Include:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)

We aim to respond within 48 hours and will work with you to understand and address the issue.

## Scope

The following are in scope for security reports:

| Area | Examples |
|------|----------|
| **Cryptographic issues** | Weak key derivation, IV reuse, encryption bypass |
| **XSS vulnerabilities** | Bypassing DOMPurify sanitization, script injection via feeds |
| **SSRF in proxy** | Bypassing private IP blocking, accessing internal resources |
| **Data leakage** | Unintended data exposure to server, logging of sensitive data |
| **Authentication bypass** | Accessing another user's encrypted vault |

The following are **out of scope**:

- Social engineering attacks
- Physical access attacks (if someone has your device, derived keys in localStorage can decrypt local data — but cannot recover the passphrase or access the cloud vault)
- Denial of service (the app is client-side; there's no meaningful DoS vector)
- Issues in dependencies without a demonstrated exploit path in FeedZero

## Security Model

FeedZero's security model is documented in [docs/architecture.md](docs/architecture.md#privacy--threat-model). Key points:

### What We Protect Against

- **Server-side data access**: All user data is encrypted client-side before upload
- **XSS via feed content**: All HTML is sanitized through DOMPurify; Content Security Policy headers restrict script/style sources
- **SSRF via proxy**: Private IPs (including full 172.16-31.x range) and metadata endpoints are blocked
- **Passphrase theft**: Raw passphrase never persisted — only derived JWK key material stored in localStorage
- **Feed URL logging**: Proxy uses POST with JSON body; URLs never appear in query strings or server logs
- **IP leakage via favicons**: Favicons proxied through the CORS proxy, not loaded directly from publishers
- **Timing analysis**: Sync push includes 0-30s random jitter; vault payloads padded to power-of-2 sizes
- **IndexedDB metadata leakage**: Index fields HMAC-SHA256 hashed — deterministic for queries, non-reversible
- **User-Agent fingerprinting**: Fixed `User-Agent: FeedZero/1.0` on all outbound proxy requests

### Known Limitations (Not Vulnerabilities)

These are documented trade-offs, not bugs:

1. **Derived keys in localStorage**: JWK key material can decrypt local IndexedDB data if stolen. However, stolen keys cannot recover the passphrase or access the cloud vault from another device.

2. **Proxy sees feed URLs**: The CORS proxy must know which URLs to fetch. Self-hosting mitigates this.

3. **No forward secrecy**: If the passphrase is compromised, all historical data encrypted with it is exposed.

4. **4-word passphrase entropy**: 51.7 bits is strong against online attacks but potentially vulnerable to offline brute-force if an attacker obtains the encrypted vault.

## Encryption Details

| Component | Algorithm | Parameters |
|-----------|-----------|------------|
| Local storage | AES-GCM-256 | 12-byte random IV per record |
| Index hashing | HMAC-SHA256 | Dedicated key derived from passphrase |
| Key derivation | PBKDF2-SHA256 | 100,000 iterations |
| Key storage | JWK export | Derived keys persisted, passphrase discarded |
| Cloud sync | AES-GCM-256 | 12-byte random IV per vault |
| Vault ID | PBKDF2-SHA256 | Different salt than encryption key |

See `src/core/storage/crypto.ts`, `src/core/storage/key-material.ts`, and `src/core/sync/vault-crypto.ts` for implementation.

## Dependencies

We use production-grade libraries for security-critical operations:

| Operation | Library | Rationale |
|-----------|---------|-----------|
| HTML sanitization | DOMPurify | Industry standard, actively maintained |
| Encryption | Web Crypto API | Browser-native, hardware-accelerated |
| IndexedDB | Dexie.js | Mature wrapper, does not affect security model |

We do not use hand-rolled cryptography or custom sanitizers.

## Updates

This policy may be updated as the project evolves. Check the commit history for changes.
