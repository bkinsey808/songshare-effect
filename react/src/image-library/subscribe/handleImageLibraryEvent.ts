import { Effect } from "effect";

import extractNewRecord from "@/react/lib/supabase/subscription/extract/extractNewRecord";
import extractStringField from "@/react/lib/supabase/subscription/extract/extractStringField";
import isRealtimePayload from "@/react/lib/supabase/subscription/realtime/isRealtimePayload";

import isImageLibraryEntry from "../guards/isImageLibraryEntry";
import type { ImageLibrarySlice } from "../slice/ImageLibrarySlice.type";

/**
 * Handles realtime subscription events for the image_library table.
 *
 * @param payload - The realtime event payload
 * @param supabaseClient - Supabase client (unused, kept for interface parity)
 * @param get - Getter for the ImageLibrarySlice
 * @returns An Effect that completes after applying the change
 */
export default function handleImageLibraryEvent(
	payload: unknown,
	supabaseClient: unknown,
	get: () => ImageLibrarySlice,
): Effect.Effect<void, Error> {
	return Effect.gen(function* handleImageLibraryEventGen($) {
		void supabaseClient;

		const { addImageLibraryEntry, removeImageLibraryEntry } = get();

		if (!isRealtimePayload(payload)) {
			return;
		}

		const { eventType } = payload as Record<string, unknown>;

		if (eventType === "INSERT" || eventType === "UPDATE") {
			const newRecord = extractNewRecord(payload);
			if (newRecord === undefined) {
				return;
			}

			if (!isImageLibraryEntry(newRecord)) {
				console.warn("[handleImageLibraryEvent] Invalid entry:", newRecord);
				return;
			}

			yield* $(
				Effect.sync(() => {
					addImageLibraryEntry(newRecord);
				}),
			);
		} else if (eventType === "DELETE") {
			const imageId = extractStringField(
				(payload as Record<string, unknown>)["old"],
				"image_id",
			);
			if (imageId !== undefined) {
				yield* $(
					Effect.sync(() => {
						removeImageLibraryEntry(imageId);
					}),
				);
			}
		}
	});
}
