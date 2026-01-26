import { safeGet } from "@/shared/utils/safe";
import { isRecord, isString } from "@/shared/utils/typeGuards";

import { type SongPublic } from "../../song-schema";

type FindMissingSongsSlugsParams = Readonly<{
	songSlugs: readonly string[];
	activePublicSongIds: readonly string[];
	publicSongs: Readonly<Record<string, SongPublic>>;
}>;

/**
 * Finds song slugs that are not already active in the current state.
 */
export default function findMissingSongSlugs({
	songSlugs,
	activePublicSongIds,
	publicSongs,
}: FindMissingSongsSlugsParams): readonly string[] {
	const activePublicSongSlugs = new Set(
		activePublicSongIds
			.map((id) => {
				const song = safeGet(publicSongs, id);

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

	return [...songSlugs].filter((slug) => !activePublicSongSlugs.has(slug));
}
