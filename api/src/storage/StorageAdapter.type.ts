/** Options provided when uploading a file to storage */
export type StorageUploadOptions = {
	contentType: string;
	metadata?: Record<string, string>;
};

/**
 * Minimal storage interface that abstracts file upload and deletion.
 *
 * Implement this for each backend (R2, Supabase Storage, etc.) and
 * select the active implementation via `getStorageAdapter`.
 */
export type StorageAdapter = {
	upload: (key: string, data: ArrayBuffer, options: StorageUploadOptions) => Promise<void>;
	remove: (key: string) => Promise<void>;
};
