/*
  Helper utilities for mocking storage-related modules in tests.
  Test doubles are typed to satisfy consumers; minimal stubs use targeted
  assertions only where the full interface cannot be implemented.
*/
import type { R2Bucket } from "@cloudflare/workers-types";

import createFakeR2Object from "./createFakeR2Object.test-util";
import type { StorageAdapter } from "./StorageAdapter.type";

/**
 * A no-op storage adapter function for use in stubs.
 * @returns A promise that resolves immediately
 */
async function storageAdapterNoop(): Promise<void> {
	await Promise.resolve();
}

/**
 * Minimal StorageAdapter stub for tests. Used when only reference equality matters.
 * @returns A minimal storage adapter stub
 */
export function makeMinimalStorageAdapter(): StorageAdapter {
	return { upload: storageAdapterNoop, remove: storageAdapterNoop };
}

/**
 * Minimal R2 bucket stub for tests. Only put/delete are implemented.
 * @returns A minimal R2 bucket stub
 */
export function makeFakeR2Bucket(): R2Bucket {
	const stub: Pick<R2Bucket, "put" | "delete"> = {
		put: async () => {
			await Promise.resolve();
			return createFakeR2Object("");
		},
		delete: async () => {
			await Promise.resolve();
		},
	};
	/* oxlint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- test stub; only put/delete used; full R2Bucket impl not practical */
	return stub as unknown as R2Bucket;
}
