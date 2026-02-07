import { ok, err } from "../../utils/result.ts";
import type { Result } from "../../utils/result.ts";
import { SYNC } from "../../utils/constants.ts";
import { exportAll, importAll } from "../storage/db.ts";
import {
  deriveVaultId,
  deriveVaultKey,
  encryptVault,
  decryptVault,
} from "./vault-crypto.ts";
import type { VaultData, EncryptedVault } from "./types.ts";

/**
 * Export all local data as a VaultData object.
 */
export async function exportVault(): Promise<Result<VaultData>> {
  const result = await exportAll();
  if (!result.ok) return result;
  return ok({
    version: SYNC.FORMAT_VERSION,
    exportedAt: Date.now(),
    feeds: result.value.feeds,
    articles: result.value.articles,
  });
}

/**
 * Replace all local data with the contents of a VaultData object.
 */
export async function importVault(vault: VaultData): Promise<Result<boolean>> {
  return importAll(vault.feeds, vault.articles);
}

/**
 * Encrypt local data and push it to the sync server.
 * Returns the server-reported timestamp on success.
 */
export async function pushVault(passphrase: string): Promise<Result<number>> {
  try {
    const [vaultIdResult, keyResult, vaultResult] = await Promise.all([
      deriveVaultId(passphrase),
      deriveVaultKey(passphrase),
      exportVault(),
    ]);
    if (!vaultIdResult.ok) return vaultIdResult;
    if (!keyResult.ok) return keyResult;
    if (!vaultResult.ok) return vaultResult;

    const encryptedResult = await encryptVault(
      keyResult.value,
      vaultResult.value,
    );
    if (!encryptedResult.ok) return encryptedResult;

    const response = await fetch("/api/sync", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        vaultId: vaultIdResult.value,
        vault: encryptedResult.value,
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      return err(`Sync push failed (${response.status}): ${text}`);
    }

    const data = await response.json();
    return ok(data.updatedAt ?? Date.now());
  } catch (e) {
    return err(`Sync push failed: ${(e as Error).message}`);
  }
}

/**
 * Delete the encrypted vault from the sync server.
 * Used when a user switches from sync to local-only.
 */
export async function deleteVault(
  passphrase: string,
): Promise<Result<boolean>> {
  try {
    const vaultIdResult = await deriveVaultId(passphrase);
    if (!vaultIdResult.ok) return vaultIdResult;

    const response = await fetch(`/api/sync?vaultId=${vaultIdResult.value}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      const text = await response.text();
      return err(`Vault deletion failed (${response.status}): ${text}`);
    }

    return ok(true);
  } catch (e) {
    return err(`Vault deletion failed: ${(e as Error).message}`);
  }
}

/**
 * Pull encrypted vault from the sync server and decrypt it.
 * Does NOT import into local DB — caller decides what to do with the data.
 */
export async function pullVault(
  passphrase: string,
): Promise<Result<VaultData>> {
  try {
    const [vaultIdResult, keyResult] = await Promise.all([
      deriveVaultId(passphrase),
      deriveVaultKey(passphrase),
    ]);
    if (!vaultIdResult.ok) return vaultIdResult;
    if (!keyResult.ok) return keyResult;

    const response = await fetch(`/api/sync?vaultId=${vaultIdResult.value}`);

    if (!response.ok) {
      const text = await response.text();
      return err(`Sync pull failed (${response.status}): ${text}`);
    }

    const data = await response.json();
    if (!data.vault) {
      return err("Server returned no vault data");
    }

    return decryptVault(keyResult.value, data.vault as EncryptedVault);
  } catch (e) {
    return err(`Sync pull failed: ${(e as Error).message}`);
  }
}

/**
 * Check if a vault exists on the server for the given passphrase.
 * Uses HEAD request to avoid downloading the entire vault.
 */
export async function checkVaultExists(
  passphrase: string,
): Promise<Result<boolean>> {
  try {
    const vaultIdResult = await deriveVaultId(passphrase);
    if (!vaultIdResult.ok) return vaultIdResult;

    const response = await fetch(`/api/sync?vaultId=${vaultIdResult.value}`, {
      method: "HEAD",
    });

    if (response.status === 404) {
      return ok(false);
    }

    if (!response.ok) {
      const text = await response.text();
      return err(`Check vault failed (${response.status}): ${text}`);
    }

    return ok(true);
  } catch (e) {
    return err(`Check vault failed: ${(e as Error).message}`);
  }
}

/**
 * Merge two vaults, deduplicating feeds by URL and articles by guid.
 * Local versions are preferred for duplicates.
 */
export function mergeVaults(
  localVault: VaultData,
  cloudVault: VaultData,
): Result<VaultData> {
  // Build map of local feeds by URL
  const localFeedsByUrl = new Map(localVault.feeds.map((f) => [f.url, f]));

  // Build feed ID remapping for cloud feeds that have a local equivalent
  const feedIdRemap = new Map<string, string>();

  // Merge feeds: all local + cloud feeds not in local
  const mergedFeeds = [...localVault.feeds];
  for (const cloudFeed of cloudVault.feeds) {
    const localFeed = localFeedsByUrl.get(cloudFeed.url);
    if (localFeed) {
      // Duplicate feed - map cloud feedId to local feedId
      feedIdRemap.set(cloudFeed.id, localFeed.id);
    } else {
      // New feed from cloud
      mergedFeeds.push(cloudFeed);
    }
  }

  // Build map of local articles by guid
  const localArticlesByGuid = new Map(
    localVault.articles.map((a) => [a.guid, a]),
  );

  // Merge articles: all local + cloud articles not in local (with feedId remapping)
  const mergedArticles = [...localVault.articles];
  for (const cloudArticle of cloudVault.articles) {
    if (!localArticlesByGuid.has(cloudArticle.guid)) {
      // Remap feedId if the feed was deduplicated
      const remappedFeedId =
        feedIdRemap.get(cloudArticle.feedId) ?? cloudArticle.feedId;
      mergedArticles.push({ ...cloudArticle, feedId: remappedFeedId });
    }
  }

  return ok({
    version: SYNC.FORMAT_VERSION,
    exportedAt: Date.now(),
    feeds: mergedFeeds,
    articles: mergedArticles,
  });
}
