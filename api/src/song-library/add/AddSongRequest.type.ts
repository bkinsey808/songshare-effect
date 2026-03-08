/**
 * Request shape used by song-library add endpoints.
 *
 * Defined separately so the type can be imported without pulling in extraction
 * logic or other utilities. This follows the `*.type.ts` convention used in
 * the repo.
 */
export type AddSongRequest = {
	song_id: string;
	song_owner_id: string;
};
