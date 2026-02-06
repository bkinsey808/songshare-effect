import { Effect } from "effect";

import isRealtimePayload from "@/react/supabase/subscription/realtime/isRealtimePayload";
import isRecord from "@/shared/type-guards/isRecord";

import type { UserLibrarySlice } from "../slice/UserLibrarySlice.type";

/**
 * handleUserPublicSubscribeEvent
 *
 * Processes realtime events for the `user_public` subscription. Handles
 * UPDATE events to sync username changes to the user library entries.
 * Non-realtime payloads are ignored.
 *
 * @param payload - Raw realtime payload from Supabase.
 * @param get - Getter for the UserLibrarySlice.
 * @returns - An Effect that completes after applying the change locally.
 */
export default function handleUserPublicSubscribeEvent(
	payload: unknown,
	get: () => UserLibrarySlice,
): Effect.Effect<void, Error> {
	return Effect.gen(function* handleEventGen($) {
		if (!isRealtimePayload(payload)) {
			return;
		}

		const { eventType, new: newRecord } = payload;

		// Only handle UPDATE events where username changed
		if (eventType !== "UPDATE" || !isRecord(newRecord)) {
			return;
		}

		const updatedUserId = newRecord["user_id"];
		const updatedUsername = newRecord["username"];

		if (typeof updatedUserId !== "string" || typeof updatedUsername !== "string") {
			return;
		}

		yield* $(
			Effect.sync(() => {
				const { userLibraryEntries, setUserLibraryEntries } = get();
				const entry = userLibraryEntries[updatedUserId];

				// Only update if this user is in our library
				if (entry === undefined) {
					return;
				}

				// Update the entry with the new username
				const updatedEntry = {
					...entry,
					owner_username: updatedUsername,
				};

				setUserLibraryEntries({
					...userLibraryEntries,
					[updatedUserId]: updatedEntry,
				});
			}),
		);
	});
}
