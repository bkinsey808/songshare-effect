import { Schema } from "effect";

import { songPublicSchema, type SongPublic } from "@/react/song/song-schema";
import isRecord from "@/shared/type-guards/isRecord";

import normalizeSongRecord from "./normalizeSongRecord";

/**
 * Normalize and decode a raw song object and add it to the output map.
 * This helper mirrors the previous inline implementation used by
 * `addActivePublicSongIds` and accepts `out` as `Record<string, SongPublic>`
 * so callers can accumulate strongly-typed song records for the store.
 *
 * @param song - Raw song value (from Supabase row)
 * @param out - Mutable map updated with decoded/normalized song values keyed by song_id
 * @returns void
 */
export default function processSong(song: unknown, out: Record<string, SongPublic>): void {
	if (!isRecord(song)) {
		return;
	}

	const id = song["song_id"];
	if (typeof id !== "string") {
		return;
	}

	// Try a strict decode first
	let decodeResult = Schema.decodeUnknownEither(songPublicSchema)(song);

	if (decodeResult._tag === "Right") {
		out[id] = decodeResult.right;
		return;
	}

	// Strict decode failed — log and attempt a lenient normalization pass
	console.warn(`[addActivePublicSongIds] Failed to decode song ${id}:`, decodeResult.left);

	try {
		const { normalizedSong, minimalSong, absolutelyMinimalSong } = normalizeSongRecord(song, id);

		decodeResult = Schema.decodeUnknownEither(songPublicSchema)(normalizedSong);
		if (decodeResult._tag === "Right") {
			console.warn(`[addActivePublicSongIds] Normalized and decoded song ${id} successfully`);
			out[id] = decodeResult.right;
			return;
		}

		console.warn(
			`[addActivePublicSongIds] Normalized decode also failed for ${id}:`,
			decodeResult.left,
		);

		// Attempt minimal fallbacks (kept concise here — match previous behavior)
		try {
			let minimalDecodeResult = Schema.decodeUnknownEither(songPublicSchema)(minimalSong);
			if (minimalDecodeResult._tag === "Right") {
				console.warn(`[addActivePublicSongIds] Created minimal song for ${id} with normalized slides`);
				out[id] = minimalDecodeResult.right;
				return;
			}

			minimalDecodeResult = Schema.decodeUnknownEither(songPublicSchema)(absolutelyMinimalSong);
			if (minimalDecodeResult._tag === "Right") {
				console.warn(
					`[addActivePublicSongIds] Created absolutely minimal song for ${id} with normalized slides`,
				);
				out[id] = minimalDecodeResult.right;
				return;
			}
			console.warn(
				`[addActivePublicSongIds] Even absolutely minimal song decode failed for ${id}:`,
				minimalDecodeResult.left,
			);
		} catch (error) {
			console.error(`[addActivePublicSongIds] Error creating minimal song for ${id}:`, error);
		}
	} catch (error) {
		console.error(`[addActivePublicSongIds] Error while normalizing song ${id}:`, error);
	}
}
