import { Schema } from "effect";

import { type SongPublic, songPublicSchema } from "../../song-schema";

/**
 * Decodes and validates song data using Effect schema.
 * @param data - Raw song data array from Supabase
 * @returns Record of validated songs indexed by song_id
 */
export function decodeSongData(data: unknown[]): Record<string, SongPublic> {
	if (!Array.isArray(data)) {
		console.error("[decodeSongData] Invalid data format:", data);
		return {};
	}

	const publicSongsToAdd: Record<string, SongPublic> = {};

	for (const song of data) {
		if (
			typeof song === "object" &&
			song !== null &&
			"song_id" in song &&
			typeof song.song_id === "string"
		) {
			// Use Effect schema to safely decode the song data
			const decodeResult = Schema.decodeUnknownEither(songPublicSchema)(song);

			if (decodeResult._tag === "Right") {
				// Successfully decoded
				publicSongsToAdd[song.song_id] = decodeResult.right;
			} else {
				// Failed to decode, log the error and skip this song
				console.warn(
					`[decodeSongData] Failed to decode song ${song.song_id}:`,
					decodeResult.left,
				);
			}
		}
	}

	console.warn("[decodeSongData] Decoded songs:", publicSongsToAdd);
	return publicSongsToAdd;
}
