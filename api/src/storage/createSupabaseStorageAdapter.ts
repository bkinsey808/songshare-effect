import type { SupabaseClient } from "@supabase/supabase-js";

import type { StorageAdapter, StorageUploadOptions } from "./StorageAdapter.type";
import toStoragePath from "./toStoragePath";

/** Supabase Storage bucket that holds all uploaded images */
const IMAGES_BUCKET = "images";

/**
 * Creates a StorageAdapter backed by Supabase Storage.
 *
 * The Supabase "images" bucket must exist and be public before use.
 * Run `npm run supabase:migrate` to apply the migration that creates it.
 *
 * @param supabase - An authenticated Supabase client (service key recommended).
 * @returns A StorageAdapter that reads and writes to Supabase Storage.
 */
export default function createSupabaseStorageAdapter(supabase: SupabaseClient): StorageAdapter {
	return {
		/**
		 * @param key - the destination path
		 * @param data - the binary data to upload
		 * @param options - upload options (contentType, etc.)
		 * @returns promise that resolves on success
		 */
		async upload(key: string, data: ArrayBuffer, options: StorageUploadOptions): Promise<void> {
			const path = toStoragePath(key);
			const { error } = await supabase.storage
				.from(IMAGES_BUCKET)
				.upload(path, data, { contentType: options.contentType, upsert: false });
			if (error !== null) {
				throw new Error(error.message);
			}
		},
		/**
		 * @param key - the path to remove
		 * @returns promise that resolves on success
		 */
		async remove(key: string): Promise<void> {
			const path = toStoragePath(key);
			const { error: removeError } = await supabase.storage.from(IMAGES_BUCKET).remove([path]);
			if (removeError !== null) {
				throw new Error(removeError.message);
			}
		},
	};
}
