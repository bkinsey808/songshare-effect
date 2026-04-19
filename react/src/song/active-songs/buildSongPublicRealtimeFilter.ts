/**
 * Build the PostgREST filter used for `song_public` realtime subscriptions.
 *
 * Realtime filters accept PostgREST syntax. For UUID ids we should pass raw
 * values like `song_id=eq.<uuid>` or `song_id=in.(<uuid1>,<uuid2>)` without
 * wrapping the ids in single quotes, otherwise the filter can subscribe but
 * fail to match actual row updates.
 *
 * @param activePublicSongIds - Active public song ids to watch
 * @returns Realtime filter string for `song_id`
 */
export default function buildSongPublicRealtimeFilter(
	activePublicSongIds: readonly string[],
): string {
	const SINGLE_ACTIVE_PUBLIC_SONG_ID = 1;
	const FIRST_ACTIVE_PUBLIC_SONG_ID_INDEX = 0;
	if (activePublicSongIds.length === SINGLE_ACTIVE_PUBLIC_SONG_ID) {
		return `song_id=eq.${activePublicSongIds[FIRST_ACTIVE_PUBLIC_SONG_ID_INDEX]}`;
	}

	return `song_id=in.(${activePublicSongIds.join(",")})`;
}
