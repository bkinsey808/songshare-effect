import { Effect, Schema } from "effect";

import type { ReadonlyDeep } from "@/shared/types/deep-readonly";

import getSupabaseAuthToken from "@/react/supabase/auth-token/getSupabaseAuthToken";
import getSupabaseClient from "@/react/supabase/client/getSupabaseClient";
import callSelect from "@/react/supabase/client/safe-query/callSelect";
import isRecord from "@/shared/type-guards/isRecord";

import type { SongSubscribeSlice } from "../song-slice";

import { type SongPublic, songPublicSchema } from "../../song-schema";

export default function addActivePublicSongIds(
	set: (
		partial:
			| Partial<ReadonlyDeep<SongSubscribeSlice>>
			| ((state: ReadonlyDeep<SongSubscribeSlice>) => Partial<ReadonlyDeep<SongSubscribeSlice>>),
	) => void,
	get: () => SongSubscribeSlice,
) {
	return (songIds: readonly string[]): Effect.Effect<void, Error> => {
		// Prefer the global store API when available so we can read the full
		// `AppSlice` shape without unsafe assertions. Fall back to the local
		// `get()` accessor when the store API is not yet available.
		const sliceState = get();

		// Compute the previous active IDs from the slice state.
		const prevActiveIds: readonly string[] = sliceState.activePublicSongIds;

		const newActivePublicSongIds: readonly string[] = [...new Set([...prevActiveIds, ...songIds])];

		// Update activeSongIds and resubscribe.
		set((prev) => {
			if (typeof prev.activePublicSongsUnsubscribe === "function") {
				prev.activePublicSongsUnsubscribe();
			}
			return { activePublicSongIds: newActivePublicSongIds };
		});

		// Subscribe after activeSongIds is updated in Zustand
		set((): Partial<ReadonlyDeep<SongSubscribeSlice>> => {
			const storeForOps = sliceState;
			const activePublicSongsUnsubscribe = storeForOps.subscribeToActivePublicSongs();
			return {
				activePublicSongsUnsubscribe: activePublicSongsUnsubscribe ?? (() => undefined),
			};
		});

		// helper function lives at the function body root to avoid nested declaration rules
		function processSong(song: unknown, out: Record<string, SongPublic>): void {
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

				// CRITICAL: The schema requires ALL three fields ("lyrics", "script", "enTranslation")
				// to be present in field_data, regardless of what's in the fields array.
				// The Record schema with Literal keys requires all literal values to be present.
				const allRequiredFields = ["lyrics", "script", "enTranslation"] as const;
				const normalizedSlides: Record<
					string,
					{ slide_name: string; field_data: Record<string, string> }
				> = {};
				for (const key of Object.keys(rawSlides)) {
					const slide = isRecord(rawSlides[key]) ? rawSlides[key] : {};
					const rawFieldData = isRecord(slide["field_data"]) ? slide["field_data"] : {};
					const field_data: Record<string, string> = {};
					// Ensure ALL three required fields are present in field_data
					// This is required by the schema validation (Record with Literal keys requires all literals)
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

				// CRITICAL: The fields array must include all fields that are in field_data
				// Since field_data always has all three fields, fields must include all three
				const normalizedFields = [...new Set([...rawFieldsArray, ...allRequiredFields])];

				// Prefer an explicit variable for user_id instead of a nested ternary
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

				// Even if decode fails, create a minimal valid song with basic fields
				// so the form can still populate song_name, song_slug, etc.
				// This is a fallback for when the song data has validation issues
				try {
					// Extract and validate song_name (must be 2-100 chars, trimmed, no consecutive spaces)
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
					// Extract and validate song_slug (must match slug format)
					let songSlug = typeof song["song_slug"] === "string" ? song["song_slug"] : "";
					if (
						!/^[a-z0-9-]+$/.test(songSlug) ||
						songSlug.startsWith("-") ||
						songSlug.endsWith("-") ||
						songSlug.includes("--")
					) {
						// Generate a valid slug from song_name if slug is invalid
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
					const userId = typeof song["user_id"] === "string" ? song["user_id"] : "";
					const key = typeof song["key"] === "string" ? song["key"] : "";
					const scale = typeof song["scale"] === "string" ? song["scale"] : "";
					const createdAt =
						typeof song["created_at"] === "string" ? song["created_at"] : new Date().toISOString();
					const updatedAt =
						typeof song["updated_at"] === "string" ? song["updated_at"] : new Date().toISOString();

					// Create a minimal valid song with normalized slides
					// The normalization above should have fixed the field_data issue,
					// but if decode still fails, try with the normalized data
					const minimalSong: {
						song_id: string;
						song_name: string;
						song_slug: string;
						fields: readonly string[];
						slide_order: readonly string[];
						slides: Record<string, { slide_name: string; field_data: Record<string, string> }>;
						key: string;
						scale: string;
						user_id: string;
						short_credit: string;
						long_credit: string;
						public_notes: string;
						created_at: string;
						updated_at: string;
					} = {
						song_id: id,
						song_name: songName,
						song_slug: songSlug,
						fields: normalizedFields,
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

					// Try to decode the minimal song (it should pass since we normalized it)
					let minimalDecodeResult = Schema.decodeUnknownEither(songPublicSchema)(minimalSong);
					if (minimalDecodeResult._tag === "Right") {
						console.warn(
							`[addActivePublicSongIds] Created minimal song for ${id} with basic fields`,
						);
						out[id] = minimalDecodeResult.right;
						return;
					}

					// If that still fails, create an absolutely minimal song with one empty slide
					// CRITICAL: The schema requires ALL three fields ("lyrics", "script", "enTranslation")
					// to be present in field_data, regardless of what's in the fields array
					const allRequiredFields = ["lyrics", "script", "enTranslation"] as const;
					const minimalFieldData: Record<string, string> = {};
					for (const field of allRequiredFields) {
						minimalFieldData[field] = "";
					}

					console.warn(
						`[addActivePublicSongIds] Normalized song decode failed, trying absolutely minimal song for ${id}`,
					);
					const absolutelyMinimalSong: {
						song_id: string;
						song_name: string;
						song_slug: string;
						fields: readonly ["lyrics", "script", "enTranslation"];
						slide_order: readonly ["minimal-slide"];
						slides: Record<string, { slide_name: string; field_data: Record<string, string> }>;
						key: string;
						scale: string;
						user_id: string;
						short_credit: string;
						long_credit: string;
						public_notes: string;
						created_at: string;
						updated_at: string;
					} = {
						song_id: id,
						song_name: songName,
						song_slug: songSlug,
						// Use all required fields to satisfy schema validation
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
						user_id: userId,
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
		} // end processSong

		// Return Effect that completes when fetch finishes
		return Effect.gen(function* addActivePublicSongIdsGen($) {
			// Get authentication token (handles both user and visitor tokens automatically)
			const authToken = yield* $(
				Effect.tryPromise({
					try: () => getSupabaseAuthToken(),
					catch: (err) => new Error(`Failed to get auth token: ${String(err)}`),
				}),
			);

			if (typeof authToken !== "string") {
				console.warn("[addActivePublicSongIds] No auth token found. Cannot fetch songs.");
				return;
			}

			const supabase = getSupabaseClient(authToken);
			if (supabase === undefined) {
				console.warn("[addActivePublicSongIds] Supabase client not initialized.");
				return;
			}

			console.warn("[addActivePublicSongIds] Fetching active songs:", newActivePublicSongIds);

			const songQueryRes = yield* $(
				Effect.tryPromise({
					try: () =>
						callSelect(supabase, "song_public", {
							cols: "*",
							in: { col: "song_id", vals: [...newActivePublicSongIds] },
						}),
					catch: (err) => new Error(`Failed to fetch songs: ${String(err)}`),
				}),
			);

			if (!isRecord(songQueryRes)) {
				console.error("[addActivePublicSongIds] Supabase fetch error:", songQueryRes);
				return;
			}

			const data = Array.isArray(songQueryRes["data"]) ? songQueryRes["data"] : [];
			// Simple validation using Effect schema
			if (Array.isArray(data)) {
				const publicSongsToAdd: Record<string, SongPublic> = {};

				for (const song of data) {
					processSong(song, publicSongsToAdd);
				}

				console.warn("[addActiveSongIds] Updating store with songs:", publicSongsToAdd);
				yield* $(
					Effect.sync(() => {
						const storeForOps = sliceState;
						storeForOps.addOrUpdatePublicSongs(publicSongsToAdd);
					}),
				);
			} else {
				console.error("[addActivePublicSongIds] Invalid data format:", data);
			}
		});
	};
}
