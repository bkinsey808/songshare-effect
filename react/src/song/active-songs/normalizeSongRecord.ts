import { isSongKey } from "@/shared/song/songKeyOptions";
import isRecord from "@/shared/type-guards/isRecord";
import { MIN_STRING_LENGTH } from "./constants";
import getNormalizedTranslations from "./getNormalizedTranslations";
import makeEmptyFieldData from "./makeEmptyFieldData";
import normalizeSlides from "./normalizeSlides";

import { defaultLanguage } from "@/shared/language/supported-languages";

const MIN_SONG_NAME_LENGTH = 2;
const MAX_SONG_NAME_LENGTH = 100;



type NormalizedSongRecord = Readonly<{
	normalizedSong: Record<string, unknown>;
	minimalSong: Record<string, unknown>;
	absolutelyMinimalSong: Record<string, unknown>;
}>;

/**
 * Build normalized song records used by `processSong` fallback decoding paths.
 *
 * @param song - Raw song row from Supabase.
 * @param songId - Song id already verified by the caller.
 * @returns Normalized, minimal, and absolutely minimal song records.
 */
export default function normalizeSongRecord(
	song: Record<string, unknown>,
	songId: string,
): NormalizedSongRecord {
	const rawSlides = isRecord(song["slides"]) ? song["slides"] : {};
	const lyrics = typeof song["lyrics"] === "string" ? song["lyrics"] : defaultLanguage;
	const script = typeof song["script"] === "string" ? song["script"] : undefined;
	const translations = getNormalizedTranslations({
		song,
		rawSlides,
		lyrics,
		script,
	});
	const normalizedSlides = normalizeSlides({
		rawSlides,
		lyrics,
		script,
		translations,
	});
	const rawOrder = Array.isArray(song["slide_order"]) ? song["slide_order"] : Object.keys(normalizedSlides);
	const slideOrder = Array.isArray(rawOrder)
		? [...new Set([...rawOrder.map(String), ...Object.keys(normalizedSlides)])]
		: Object.keys(normalizedSlides);

	let userId = "";
	if (typeof song["user_id"] === "string") {
		userId = song["user_id"];
	} else if (typeof song["song_owner_id"] === "string") {
		userId = song["song_owner_id"];
	}

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
	/* oxlint-disable-next-line unicorn/no-null */
	const key = isSongKey(song["key"]) ? song["key"] : null;
	const scale = typeof song["scale"] === "string" ? song["scale"] : "";
	const createdAt =
		typeof song["created_at"] === "string" ? song["created_at"] : new Date().toISOString();
	const updatedAt =
		typeof song["updated_at"] === "string" ? song["updated_at"] : new Date().toISOString();

	const normalizedSong = {
		...song,
		song_name: typeof song["song_name"] === "string" ? song["song_name"] : "",
		song_slug: typeof song["song_slug"] === "string" ? song["song_slug"] : "",
		lyrics,
		...(script === undefined ? {} : { script }),
		translations,
		slide_order: slideOrder,
		slides: normalizedSlides,
		key,
		scale,
		user_id: userId,
		short_credit: typeof song["short_credit"] === "string" ? song["short_credit"] : "",
		long_credit: typeof song["long_credit"] === "string" ? song["long_credit"] : "",
		public_notes: typeof song["public_notes"] === "string" ? song["public_notes"] : "",
		created_at: createdAt,
		updated_at: updatedAt,
	};

	const minimalSong = {
		song_id: songId,
		song_name: songName,
		song_slug: songSlug,
		lyrics,
		...(script === undefined ? {} : { script }),
		translations,
		slide_order: slideOrder,
		slides: normalizedSlides,
		key,
		scale,
		user_id: userId,
		short_credit: shortCredit,
		long_credit: longCredit,
		public_notes: publicNotes,
		created_at: createdAt,
		updated_at: updatedAt,
	};

	const absolutelyMinimalSong = {
		song_id: songId,
		song_name: songName,
		song_slug: songSlug,
		lyrics,
		...(script === undefined ? {} : { script }),
		translations,
		slide_order: ["minimal-slide"],
		slides: {
			"minimal-slide": {
				slide_name: "Slide 1",
				field_data: makeEmptyFieldData({
					lyrics,
					script,
					translations,
				}),
			},
		},
		/* oxlint-disable-next-line unicorn/no-null */
		key: null,
		scale: "",
		user_id: userId,
		short_credit: shortCredit,
		long_credit: longCredit,
		public_notes: publicNotes,
		created_at: createdAt,
		updated_at: updatedAt,
	};

	return {
		normalizedSong,
		minimalSong,
		absolutelyMinimalSong,
	};
}
