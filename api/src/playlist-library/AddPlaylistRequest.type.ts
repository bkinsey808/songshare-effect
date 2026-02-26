/**
 * Request shape used by playlist‑library add endpoints.
 *
 * Defined separately so the type can be imported without pulling in extraction
 * logic or other utilities. This follows the `*.type.ts` convention used in
 * the repo.
 */
export type AddPlaylistRequest = {
	playlist_id: string;
	playlist_owner_id: string;
};
