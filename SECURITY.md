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
- Physical access attacks (if someone has your device, the passphrase in localStorage is accessible - this is documented)
- Denial of service (the app is client-side; there's no meaningful DoS vector)
- Issues in dependencies without a demonstrated exploit path in FeedZero

## Security Model

FeedZero's security model is documented in [docs/architecture.md](docs/architecture.md#privacy--threat-model). Key points:

### What We Protect Against

- **Server-side data access**: All user data is encrypted client-side before upload
- **XSS via feed content**: All HTML is sanitized through DOMPurify
- **SSRF via proxy**: Private IPs and metadata endpoints are blocked

### Known Limitations (Not Vulnerabilities)

These are documented trade-offs, not bugs:

1. **Passphrase in localStorage**: Stored in plaintext for session persistence. A browser extension or same-origin XSS could read it.

2. **Proxy sees feed URLs**: The CORS proxy must know which URLs to fetch. Self-hosting mitigates this.

3. **Index fields unencrypted**: Feed URLs, GUIDs, and timestamps are stored in plaintext in IndexedDB for query performance.

4. **Favicon requests bypass proxy**: Feed icons are loaded directly, exposing your IP to icon servers.

## Encryption Details

| Component | Algorithm | Parameters |
|-----------|-----------|------------|
| Local storage | AES-GCM-256 | 12-byte random IV per record |
| Key derivation | PBKDF2-SHA256 | 100,000 iterations |
| Cloud sync | AES-GCM-256 | 12-byte random IV per vault |
| Vault ID | PBKDF2-SHA256 | Different salt than encryption key |

See `src/core/storage/crypto.ts` and `src/core/sync/vault-crypto.ts` for implementation.

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
