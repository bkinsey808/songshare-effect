import { Schema } from "effect";

import { songPublicSchema, type SongPublic } from "@/react/song/song-schema";
import isRecord from "@/shared/type-guards/isRecord";

/**
 * Normalize and decode a raw song object and add it to the output map.
 * This helper mirrors the previous inline implementation used by
 * `addActivePublicSongIds` and accepts `out` as `Record<string, SongPublic>`
 * so callers can accumulate strongly-typed song records for the store.
 *
 * @param song - Raw song value (from Supabase row)
 * @param out - Mutable map updated with decoded/normalized song values keyed by song_id
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
		// Normalize the raw song so missing slide fields become empty strings
		const rawSlides = isRecord(song["slides"]) ? song["slides"] : {};
		const rawFields = Array.isArray(song["fields"])
			? song["fields" as keyof typeof song]
			: undefined;

		// Determine allowed fields (fall back to defaults)
		const rawFieldsArray = Array.isArray(rawFields)
			? rawFields.filter((value): value is string => typeof value === "string")
			: ["lyrics", "script", "enTranslation"];

		// Required fields for slide field_data
		const allRequiredFields = ["lyrics", "script", "enTranslation"] as const;
		const normalizedSlides: Record<
			string,
			{ slide_name: string; field_data: Record<string, string> }
		> = {};
		for (const key of Object.keys(rawSlides)) {
			const slide = isRecord(rawSlides[key]) ? rawSlides[key] : {};
			const rawFieldData = isRecord(slide["field_data"]) ? slide["field_data"] : {};
			const field_data: Record<string, string> = {};
			for (const field of allRequiredFields) {
				field_data[field] = typeof rawFieldData[field] === "string" ? rawFieldData[field] : "";
			}
			normalizedSlides[key] = {
				slide_name: typeof slide["slide_name"] === "string" ? slide["slide_name"] : "",
				field_data,
			};
		}

		// Ensure slide_order contains all slide keys (preserving incoming order when present)
		const rawOrder = Array.isArray(song["slide_order"])
			? song["slide_order"]
			: Object.keys(normalizedSlides);
		const slideOrder = Array.isArray(rawOrder)
			? [...new Set([...rawOrder.map(String), ...Object.keys(normalizedSlides)])]
			: Object.keys(normalizedSlides);

		// Ensure fields contains all required fields
		const normalizedFields = [...new Set([...rawFieldsArray, ...allRequiredFields])];

		let userId = "";
		if (typeof song["user_id"] === "string") {
			userId = song["user_id"];
		} else if (typeof song["song_owner_id"] === "string") {
			userId = song["song_owner_id"];
		}

		const normalizedSong = {
			...song,
			song_name: typeof song["song_name"] === "string" ? song["song_name"] : "",
			song_slug: typeof song["song_slug"] === "string" ? song["song_slug"] : "",
			fields: normalizedFields,
			slide_order: slideOrder,
			slides: normalizedSlides,
			key: typeof song["key"] === "string" ? song["key"] : "",
			scale: typeof song["scale"] === "string" ? song["scale"] : "",
			user_id: userId,
			short_credit: typeof song["short_credit"] === "string" ? song["short_credit"] : "",
			long_credit: typeof song["long_credit"] === "string" ? song["long_credit"] : "",
			public_notes: typeof song["public_notes"] === "string" ? song["public_notes"] : "",
			created_at:
				typeof song["created_at"] === "string" ? song["created_at"] : new Date().toISOString(),
			updated_at:
				typeof song["updated_at"] === "string" ? song["updated_at"] : new Date().toISOString(),
		};

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
			const MIN_SONG_NAME_LENGTH = 2;
			const MAX_SONG_NAME_LENGTH = 100;
			const MIN_STRING_LENGTH = 0;
			let songName = typeof song["song_name"] === "string" ? song["song_name"].trim() : "";
			if (
				songName.length < MIN_SONG_NAME_LENGTH ||
				songName.length > MAX_SONG_NAME_LENGTH ||
				/\s{2}/.test(songName)
			) {
				songName =
					songName.length > MIN_STRING_LENGTH && songName.length <= MAX_SONG_NAME_LENGTH
						? songName.trim().replaceAll(/\s{2,}/g, " ")
						: "Untitled Song";
			}

			let songSlug = typeof song["song_slug"] === "string" ? song["song_slug"] : "";
			if (
				!/^[a-z0-9-]+$/.test(songSlug) ||
				songSlug.startsWith("-") ||
				songSlug.endsWith("-") ||
				songSlug.includes("--")
			) {
				songSlug =
					songName
						.toLowerCase()
						.replaceAll(/[^a-z0-9]+/g, "-")
						.replaceAll(/^-+|-+$/g, "")
						.replaceAll(/-{2,}/g, "-") || "untitled";
			}

			const shortCredit = typeof song["short_credit"] === "string" ? song["short_credit"] : "";
			const longCredit = typeof song["long_credit"] === "string" ? song["long_credit"] : "";
			const publicNotes = typeof song["public_notes"] === "string" ? song["public_notes"] : "";
			const userId2 = typeof song["user_id"] === "string" ? song["user_id"] : "";
			const key = typeof song["key"] === "string" ? song["key"] : "";
			const scale = typeof song["scale"] === "string" ? song["scale"] : "";
			const createdAt =
				typeof song["created_at"] === "string" ? song["created_at"] : new Date().toISOString();
			const updatedAt =
				typeof song["updated_at"] === "string" ? song["updated_at"] : new Date().toISOString();

			const minimalSong = {
				song_id: id,
				song_name: songName,
				song_slug: songSlug,
				fields: normalizedFields,
				slide_order: slideOrder,
				slides: normalizedSlides,
				key,
				scale,
				user_id: userId2,
				short_credit: shortCredit,
				long_credit: longCredit,
				public_notes: publicNotes,
				created_at: createdAt,
				updated_at: updatedAt,
			};

			let minimalDecodeResult = Schema.decodeUnknownEither(songPublicSchema)(minimalSong);
			if (minimalDecodeResult._tag === "Right") {
				console.warn(`[addActivePublicSongIds] Created minimal song for ${id} with basic fields`);
				out[id] = minimalDecodeResult.right;
				return;
			}

			const allRequiredFields2 = ["lyrics", "script", "enTranslation"] as const;
			const minimalFieldData: Record<string, string> = {};
			for (const field of allRequiredFields2) {
				minimalFieldData[field] = "";
			}

			const absolutelyMinimalSong = {
				song_id: id,
				song_name: songName,
				song_slug: songSlug,
				fields: ["lyrics", "script", "enTranslation"],
				slide_order: ["minimal-slide"],
				slides: {
					"minimal-slide": {
						slide_name: "Slide 1",
						field_data: minimalFieldData,
					},
				},
				key: "",
				scale: "",
				user_id: userId2,
				short_credit: shortCredit,
				long_credit: longCredit,
				public_notes: publicNotes,
				created_at: createdAt,
				updated_at: updatedAt,
			};

			minimalDecodeResult = Schema.decodeUnknownEither(songPublicSchema)(absolutelyMinimalSong);
			if (minimalDecodeResult._tag === "Right") {
				console.warn(
					`[addActivePublicSongIds] Created absolutely minimal song for ${id} with basic fields`,
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
