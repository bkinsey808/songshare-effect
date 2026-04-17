import { Schema } from "effect";

import { type SongPublic, songPublicSchema } from "@/react/song/song-schema";
import isRecord from "@/shared/type-guards/isRecord";
import isString from "@/shared/type-guards/isString";
import normalizeSongRecord from "./normalizeSongRecord";

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

	/**
	 * Attempt to normalize a raw song record through progressively smaller
	 * normalization strategies and decode it using the `songPublicSchema`.
	 *
	 * This helper tries `normalizedSong`, then `minimalSong`, then
	 * `absolutelyMinimalSong` — returning the first candidate that
	 * successfully decodes. Errors during normalization are caught and
	 * logged to aid debugging of malformed imports.
	 *
	 * @param songToNormalize - Raw song record that failed initial schema validation
	 * @param songId - The `song_id` associated with the record (used for logs)
	 * @returns Decoded `SongPublic` when successful, otherwise `undefined`
	 */
	function tryDecodeWithNormalization(songToNormalize: Record<string, unknown>, songId: string): SongPublic | undefined {
		try {
			const normalized = normalizeSongRecord(songToNormalize, songId);
			const candidates = [
				normalized.normalizedSong,
				normalized.minimalSong,
				normalized.absolutelyMinimalSong,
			];

			for (const candidate of candidates) {
				const decoded = Schema.decodeUnknownEither(songPublicSchema)(candidate);
				if (decoded._tag === "Right") {
					return decoded.right;
				}
			}

			return undefined;
		} catch (error) {
			console.error(`[decodeSongData] Error normalizing song ${songId}:`, error);
			return undefined;
		}
	}

	for (const song of data) {
		const processed = (function processSingleSong(value: unknown): { id: string; song: SongPublic } | undefined {
			if (!isRecord(value)) {
				return undefined;
			}
			const { song_id: maybeSongId } = value;
			if (!isString(maybeSongId)) {
				return undefined;
			}

			const decodeResult = Schema.decodeUnknownEither(songPublicSchema)(value);
			if (decodeResult._tag === "Right") {
				return { id: maybeSongId, song: decodeResult.right };
			}

			const normalizedDecoded = tryDecodeWithNormalization(value, maybeSongId);
			if (normalizedDecoded === undefined) {
				console.warn(`[decodeSongData] Failed to decode song ${maybeSongId} after normalization.`);
				return undefined;
			}

			return { id: maybeSongId, song: normalizedDecoded };
		})(song);

		if (processed !== undefined) {
			publicSongsToAdd[processed.id] = processed.song;
		}
	}

	console.warn("[decodeSongData] Decoded songs:", publicSongsToAdd);
	return publicSongsToAdd;
}
