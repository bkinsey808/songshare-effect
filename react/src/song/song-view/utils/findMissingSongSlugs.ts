import type { SongPublic } from "../../song-schema";
import { safeGet } from "@/shared/utils/safe";

/**
 * Finds song slugs that are not already active in the current state.
 */
export function findMissingSongSlugs({
	songSlugs,
	activePublicSongIds,
	publicSongs,
}: {
	songSlugs: string[];
	activePublicSongIds: string[];
	publicSongs: Record<string, SongPublic>;
}): string[] {
	const activePublicSongSlugs = new Set(
		activePublicSongIds
			.map((id) => {
				const song = safeGet(publicSongs, id) as unknown;
				return typeof song === "object" && song !== null && "song_slug" in song
					? (song as { song_slug?: string }).song_slug
					: undefined;
			})
			.filter((slug): slug is string => typeof slug === "string"),
	);

	return songSlugs.filter((slug) => !activePublicSongSlugs.has(slug));
}
