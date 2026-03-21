import type { R2Bucket } from "@cloudflare/workers-types";

import type { StorageAdapter, StorageUploadOptions } from "./StorageAdapter.type";

/**
 * Creates a StorageAdapter backed by Cloudflare R2.
 *
 * Requires `BUCKET` to be bound in wrangler.toml and `STORAGE_BACKEND = "r2"`.
 *
 * @param bucket - The bound R2Bucket instance from the Worker environment.
 * @returns A StorageAdapter that reads and writes to R2.
 */
export default function createR2Adapter(bucket: Pick<R2Bucket, "put" | "delete">): StorageAdapter {
	return {
		/**
		 * @param key - object key
		 * @param data - file data
		 * @param contentType - the MIME type of the file
		 * @param metadata - optional custom metadata
		 * @returns promise
		 */
		async upload(
			key: string,
			data: ArrayBuffer,
			{ contentType, metadata }: StorageUploadOptions,
		): Promise<void> {
			await bucket.put(key, data, {
				httpMetadata: { contentType },
				...(metadata === undefined ? {} : { customMetadata: metadata }),
			});
		},
		/**
		 * @param key - object key
		 * @returns promise
		 */
		async remove(key: string): Promise<void> {
			await bucket.delete(key);
		},
	};
}
