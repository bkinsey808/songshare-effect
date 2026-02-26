/**
 * Shape passed around by the playlist‑library remove endpoints.
 *
 * Defined in its own file so the type can be referenced independently of the
 * extraction logic. This matches conventions used elsewhere with `*.type.ts`
 * for standalone interfaces or type aliases.
 */
export type RemovePlaylistRequest = {
	playlist_id: string;
};
