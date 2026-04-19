import type { SongPublic } from "@/react/song/song-schema";

import type { SongSubscribeSlice } from "../song-slice/song-slice";

/**
 * Return cached public songs for requested slugs that are not yet in the
 * active realtime set.
 *
 * This lets slug-based pages promote already-fetched songs into the active
 * subscription list instead of skipping realtime when the song is cached but
 * inactive after a reload or route transition.
 *
 * @param state - Current song subscription slice state
 * @param songSlugs - Requested song slugs to activate
 * @returns Cached public songs keyed by `song_id`
 */
export default function getCachedPublicSongsToActivate(
	state: SongSubscribeSlice,
	songSlugs: readonly string[],
): Readonly<Record<string, SongPublic>> {
	const requestedSongSlugs = new Set(songSlugs);
	const activeSongIds = new Set(state.activePublicSongIds);

	return Object.fromEntries(
		Object.entries(state.publicSongs).filter(
			([songId, song]) => requestedSongSlugs.has(song.song_slug) && !activeSongIds.has(songId),
		),
	);
}
