# ADR 006: Sync Storage Adapter Pattern and Derived Key Storage

## Status
Accepted

## Context
The zero-knowledge sync feature needs server-side storage for encrypted vault blobs. The app must be self-hostable (not locked to Vercel). Users need their passphrase available across sessions on the same device.

## Decision

### Storage Adapter Pattern

All server-side storage uses a `SyncStorageAdapter` interface:

```typescript
interface SyncStorageAdapter {
  get(vaultId: string): Promise<Result<string | null>>;
  put(vaultId: string, data: string): Promise<Result<boolean>>;
}
```

Three implementations ship in Phase 1:

1. **Filesystem adapter** (default) — Stores vaults as `{DATA_DIR}/vaults/{vaultId}.json`. Zero config for self-hosters.
2. **Vercel Blob adapter** — Opt-in via `SYNC_STORAGE=vercel-blob` + `BLOB_READ_WRITE_TOKEN`. For Vercel deployments.
3. **Memory adapter** — Used by Vite dev server and unit tests.

`resolve-adapter.ts` reads `SYNC_STORAGE` env var and returns the correct adapter. Defaults to filesystem.

### Derived Key Storage

On first use (onboarding or recovery), all cryptographic keys are derived from the passphrase, exported as JWK, and stored in `localStorage` under `feedzero:derived-keys`. The raw passphrase is discarded from memory and never persisted. The storage mode (`local` or `sync`) is stored under `feedzero:storage-mode`.

Stored key material includes:
- `dbKeyJwk` — AES-GCM-256 key for IndexedDB encryption
- `hmacKeyJwk` — HMAC-SHA256 key for index field hashing
- `dbSalt` — Salt used for DB key derivation
- `vaultId` (sync users only) — Deterministic vault lookup key
- `vaultKeyJwk` (sync users only) — AES-GCM-256 key for vault encryption

Legacy users with stored passphrases (`feedzero:sync-passphrase`) are auto-migrated on first load: keys are derived, stored as JWK, and the passphrase is removed.

## Rationale

### Why adapters?
- The app targets open-source self-hosting. Requiring Vercel Blob or any specific vendor would limit adoption.
- Filesystem is the simplest default — works on VPS, Docker, local dev with zero configuration.
- The interface is minimal (2 methods) making new adapters trivial to add (S3, SQLite, etc.).

### Why derived keys instead of raw passphrase?
- The raw passphrase can derive everything: DB key, vault key, vault ID. Storing it in localStorage meant a single theft gave full access, including the ability to access the cloud vault from any device.
- Derived JWK keys can only decrypt local IndexedDB data. Stealing them does not reveal the passphrase and does not grant access to the cloud vault from another device.
- On page load, `openWithKeys()` imports JWKs directly — no passphrase derivation needed, so the passphrase is never in memory after onboarding/recovery.
- Local-only users derive keys from the default passphrase (`feedzero-default-key`) at onboarding time. The default passphrase is never stored.
- Legacy users with stored passphrases are auto-migrated transparently.

### Why Hono for the standalone server?
- 14kB, zero-dependency Web standard framework.
- Uses the same `Request/Response` API as our shared handlers — no translation layer needed.
- Runs on Node, Deno, Bun, Cloudflare Workers, and AWS Lambda.
- The app's API handlers were already written as pure `Request -> Response` functions, so Hono integration is trivial.

## Consequences

- Self-hosters get a working server with `npm run build && npm run serve` using filesystem storage.
- Vercel deployments work with `SYNC_STORAGE=vercel-blob` env var.
- Adding new storage backends (S3, Turso, etc.) requires only implementing the 2-method interface.
- Derived JWK keys in localStorage can decrypt local data if stolen, but cannot recover the passphrase or access the cloud vault from another device. This is a significant improvement over storing the raw passphrase.
