import { safeGet } from "@/shared/utils/safe";

import type { SongPublic } from "../../song-schema";

type FindMissingSongsSlugsParams = Readonly<{
	songSlugs: ReadonlyArray<string>;
	activePublicSongIds: ReadonlyArray<string>;
	publicSongs: Readonly<Record<string, SongPublic>>;
}>;

/**
 * Finds song slugs that are not already active in the current state.
 */
export function findMissingSongSlugs({
	songSlugs,
	activePublicSongIds,
	publicSongs,
}: FindMissingSongsSlugsParams): ReadonlyArray<string> {
	const activePublicSongSlugs = new Set(
		activePublicSongIds
			.map((id) => {
				const song = safeGet(publicSongs, id) as unknown;

				function getSongSlug(x: unknown): string | undefined {
					if (typeof x !== "object" || x === null) return undefined;
					// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-type-assertion
					const obj = x as Record<string, unknown>;
					if (
						Object.prototype.hasOwnProperty.call(obj, "song_slug") &&
						typeof obj["song_slug"] === "string"
					) {
						// eslint-disable-next-line @typescript-eslint/no-unsafe-return
						return obj["song_slug"];
					}
					return undefined;
				}

				return getSongSlug(song);
			})
			.filter((slug): slug is string => typeof slug === "string"),
	);

	return [...songSlugs].filter((slug) => !activePublicSongSlugs.has(slug));
}
