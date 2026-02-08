import type { SongPublic } from "@/react/song/song-schema";

import isRecord from "@/shared/type-guards/isRecord";
import isString from "@/shared/type-guards/isString";
import { safeGet } from "@/shared/utils/safe";

type FindMissingSongsSlugsParams = Readonly<{
	songSlugs: readonly string[];
	activePublicSongIds: readonly string[];
	publicSongs: Readonly<Record<string, SongPublic>>;
}>;

/**
 * Find song slugs missing from the set of active public songs.
 *
 * This converts the provided list of active public song ids into their
 * corresponding `song_slug` values (when available), deduplicates them,
 * and then returns the subset of `songSlugs` that are not present among those
 * active slugs.
 *
 * The function is defensive: `publicSongs` may have missing or malformed
 * entries and `activePublicSongIds` may contain ids that don't exist in
 * `publicSongs`. Those entries are ignored rather than throwing.
 *
 * @param songSlugs - candidate slugs to check for absence in the active set
 * @param activePublicSongIds - IDs of public songs currently active in state
 * @param publicSongs - lookup from public song id -> SongPublic payload
 * @returns an array of slugs from `songSlugs` that are not currently active
 */
export default function findMissingSongSlugs({
	songSlugs,
	activePublicSongIds,
	publicSongs,
}: FindMissingSongsSlugsParams): readonly string[] {
	// Map each active public song id to its `song_slug` (if present) and build
	// a Set for O(1) membership checks and to deduplicate duplicate slugs.
	const activePublicSongSlugs = new Set(
		activePublicSongIds
			.map((id) => {
				// safeGet returns `undefined` when the id isn't present in the lookup.
				const song = safeGet(publicSongs, id);

				/**
				 * Return `song_slug` when `value` is a record and the field is a string.
				 *
				 * Defensive extractor: ignores missing or malformed payloads and
				 * returns `undefined` rather than throwing.
				 *
				 * @param value - unknown value to extract `song_slug` from
				 * @returns the `song_slug` string when present, otherwise `undefined`
				 */
				function getSongSlug(value: unknown): string | undefined {
					if (!isRecord(value)) {
						return undefined;
					}
					const { song_slug } = value;
					return isString(song_slug) ? song_slug : undefined;
				}

				return getSongSlug(song);
			})
			.filter((slug): slug is string => typeof slug === "string"),
	);

	// Preserve the original ordering of `songSlugs` while filtering out any
	// slugs that are already active (according to the Set above).
	return [...songSlugs].filter((slug) => !activePublicSongSlugs.has(slug));
}
