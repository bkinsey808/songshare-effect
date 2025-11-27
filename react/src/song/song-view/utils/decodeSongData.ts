import { Schema } from "effect";

import { type SongPublic, songPublicSchema } from "../../song-schema";

/**
 * Decodes and validates song data using Effect schema.
 * @param data - Raw song data array from Supabase (read-only)
 * @returns Record of validated songs indexed by song_id
 */
export function decodeSongData(
	data: ReadonlyArray<unknown>,
): Record<string, SongPublic> {
	if (!Array.isArray(data)) {
		console.error("[decodeSongData] Invalid data format:", data);
		return {};
	}

	const publicSongsToAdd: Record<string, SongPublic> = {};

	for (const song of data) {
		if (typeof song === "object" && song !== null) {
			// Read the song_id via an index access and guard its runtime type
			// Localized: runtime-checked index access; avoid unsafe member access lint.
			// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-type-assertion
			const maybeSongId = (song as Record<string, unknown>)["song_id"];

			// Only proceed if song_id is a string
			if (typeof maybeSongId === "string") {
				// Use Effect schema to safely decode the song data
				const decodeResult = Schema.decodeUnknownEither(songPublicSchema)(song);

				if (decodeResult._tag === "Right") {
					// Successfully decoded
					publicSongsToAdd[maybeSongId] = decodeResult.right;
				} else {
					// Failed to decode, log the error and skip this song
					console.warn(
						`[decodeSongData] Failed to decode song ${maybeSongId}:`,
						decodeResult.left,
					);
				}
			}
		}
	}

	console.warn("[decodeSongData] Decoded songs:", publicSongsToAdd);
	return publicSongsToAdd;
}
