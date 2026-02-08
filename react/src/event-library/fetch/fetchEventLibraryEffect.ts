import { Effect } from "effect";

import getSupabaseAuthToken from "@/react/lib/supabase/auth-token/getSupabaseAuthToken";
import getSupabaseClient from "@/react/lib/supabase/client/getSupabaseClient";
import callSelect from "@/react/lib/supabase/client/safe-query/callSelect";
import isRecord from "@/shared/type-guards/isRecord";

import type { EventLibraryEntry } from "../event-library-types";
import type { EventLibrarySlice } from "../slice/EventLibrarySlice.type";

import isEventLibraryEntry from "../guards/isEventLibraryEntry";

/**
 * Fetches the current user's event library from Supabase
 * and populates the slice with validated entries. Manages
 * loading and error state on the slice.
 *
 * @param get - Getter for the `EventLibrarySlice` used to set state.
 * @returns - An Effect that resolves when fetching and setting complete or fails with an Error.
 */
export default function fetchEventLibraryEffect(
	get: () => EventLibrarySlice,
): Effect.Effect<void, Error> {
	return Effect.gen(function* fetchEventLibraryGen($) {
		const { setEventLibraryEntries, setEventLibraryLoading, setEventLibraryError } = get();

		yield* $(
			Effect.sync(() => {
				console.warn("[fetchEventLibrary] Starting fetch...");
				setEventLibraryLoading(true);
				setEventLibraryError(undefined);
			}),
		);

		const userToken = yield* $(
			Effect.tryPromise({
				try: () => getSupabaseAuthToken(),
				catch: (err) => new Error(String(err)),
			}),
		);

		const client = getSupabaseClient(userToken);
		if (!client) {
			return yield* $(Effect.fail(new Error("No Supabase client available")));
		}

		const libraryQueryRes = yield* $(
			Effect.tryPromise({
				try: async () => {
					const res = await callSelect(client, "event_library", { cols: "*" });
					console.warn("[fetchEventLibrary] Query result:", JSON.stringify(res));
					return res;
				},
				catch: (err) => new Error(String(err)),
			}),
		);

		if (!isRecord(libraryQueryRes)) {
			return yield* $(
				Effect.fail(new Error("Invalid response from Supabase fetching event_library")),
			);
		}

		const libraryData: unknown[] = Array.isArray(libraryQueryRes["data"])
			? libraryQueryRes["data"]
			: [];

		const filteredEntriesArray = libraryData.filter(
			(entry: unknown): entry is EventLibraryEntry => {
				const isValid = isEventLibraryEntry(entry);
				if (!isValid) {
					console.warn("[fetchEventLibrary] Row failed type guard:", JSON.stringify(entry));
				}
				return isValid;
			},
		);

		const entriesRecord: Record<string, EventLibraryEntry> = Object.fromEntries(
			filteredEntriesArray.map((entry) => [entry.event_id, entry]),
		);

		yield* $(
			Effect.sync(() => {
				setEventLibraryEntries(entriesRecord);
				setEventLibraryLoading(false);
				console.warn("[fetchEventLibrary] Loaded", filteredEntriesArray.length, "events");
			}),
		);
	});
}
