/** Prefix in storage keys that corresponds to the bucket name + separator */
const BUCKET_PREFIX = "images/";

/**
 * Strip the leading "images/" segment from a storage key to get the
 * path within the Supabase "images" bucket.
 *
 * @param key - Full storage key (e.g. "images/userId/imageId.jpg")
 * @returns Path within the bucket (e.g. "userId/imageId.jpg")
 */
export default function toStoragePath(key: string): string {
	return key.startsWith(BUCKET_PREFIX) ? key.slice(BUCKET_PREFIX.length) : key;
}
