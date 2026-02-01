import { Schema } from "effect";

import { type SongPublic, songPublicSchema } from "@/react/song/song-schema";
import isRecord from "@/shared/type-guards/isRecord";
import isString from "@/shared/type-guards/isString";

/**
 * Decodes and validates song data using Effect schema.
 * @param data - Raw song data array from Supabase (read-only)
 * @returns Record of validated songs indexed by song_id
 */
export default function decodeSongData(data: readonly unknown[]): Record<string, SongPublic> {
	if (!Array.isArray(data)) {
		console.error("[decodeSongData] Invalid data format:", data);
		return {};
	}

	const publicSongsToAdd: Record<string, SongPublic> = {};

	for (const song of data) {
		if (isRecord(song)) {
			// Safely extract song_id using runtime guards
			const { song_id: maybeSongId } = song;

			// Only proceed if song_id is a string
			if (isString(maybeSongId)) {
				// Use Effect schema to safely decode the song data
				const decodeResult = Schema.decodeUnknownEither(songPublicSchema)(song);

				if (decodeResult._tag === "Right") {
					// Successfully decoded
					publicSongsToAdd[maybeSongId] = decodeResult.right;
				} else {
					// Failed to decode, log the error and skip this song
					console.warn(`[decodeSongData] Failed to decode song ${maybeSongId}:`, decodeResult.left);
				}
			}
		}
	}

	console.warn("[decodeSongData] Decoded songs:", publicSongsToAdd);
	return publicSongsToAdd;
}
