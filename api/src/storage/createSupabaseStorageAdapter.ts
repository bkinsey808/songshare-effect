import type { SupabaseClient } from "@supabase/supabase-js";

import type { StorageAdapter, StorageUploadOptions } from "./StorageAdapter.type";

/** Supabase Storage bucket that holds all uploaded images */
const IMAGES_BUCKET = "images";

/** Prefix in storage keys that corresponds to the bucket name + separator */
const BUCKET_PREFIX = "images/";

/**
 * Strip the leading "images/" segment from a storage key to get the
 * path within the Supabase "images" bucket.
 *
 * @param key - Full storage key (e.g. "images/userId/imageId.jpg")
 * @returns Path within the bucket (e.g. "userId/imageId.jpg")
 */
function toStoragePath(key: string): string {
	return key.startsWith(BUCKET_PREFIX) ? key.slice(BUCKET_PREFIX.length) : key;
}

/**
 * Creates a StorageAdapter backed by Supabase Storage.
 *
 * The Supabase "images" bucket must exist and be public before use.
 * Run `npm run supabase:migrate` to apply the migration that creates it.
 *
 * @param supabase - An authenticated Supabase client (service key recommended).
 * @returns A StorageAdapter that reads and writes to Supabase Storage.
 */
export default function createSupabaseStorageAdapter(
	supabase: SupabaseClient,
): StorageAdapter {
	return {
		async upload(key: string, data: ArrayBuffer, options: StorageUploadOptions): Promise<void> {
			const path = toStoragePath(key);
			const { error } = await supabase.storage
				.from(IMAGES_BUCKET)
				.upload(path, data, { contentType: options.contentType, upsert: false });
			if (error !== null) {
				throw new Error(error.message);
			}
		},
		async remove(key: string): Promise<void> {
			const path = toStoragePath(key);
			const { error: removeError } = await supabase.storage
				.from(IMAGES_BUCKET)
				.remove([path]);
			if (removeError !== null) {
				throw new Error(removeError.message);
			}
		},
	};
}
