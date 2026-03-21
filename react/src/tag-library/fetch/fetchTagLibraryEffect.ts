import { Effect } from "effect";

import getSupabaseAuthToken from "@/react/lib/supabase/auth-token/getSupabaseAuthToken";
import getSupabaseClient from "@/react/lib/supabase/client/getSupabaseClient";
import callSelect from "@/react/lib/supabase/client/safe-query/callSelect";
import isRecord from "@/shared/type-guards/isRecord";

import type { TagLibraryEntry } from "../slice/TagLibraryEntry.type";
import type { TagLibrarySlice } from "../slice/TagLibrarySlice.type";
import isTagLibraryEntry from "./isTagLibraryEntry";

/**
 * Fetches the current user's tag library from Supabase and populates
 * the slice. Manages loading and error state on the slice.
 *
 * @param get - Getter for the `TagLibrarySlice`.
 * @returns An Effect that resolves when fetching completes, or fails with an Error.
 */
export default function fetchTagLibraryEffect(
	get: () => TagLibrarySlice,
): Effect.Effect<void, Error> {
	return Effect.gen(function* fetchTagLibraryGen($) {
		const { setTagLibraryEntries, setTagLibraryLoading, setTagLibraryError } = get();

		yield* $(
			Effect.sync(() => {
				setTagLibraryLoading(true);
				setTagLibraryError(undefined);
			}),
		);

		const userToken = yield* $(
			Effect.tryPromise({
				try: () => getSupabaseAuthToken(),
				catch: (error) => new Error(String(error)),
			}),
		);

		const client = getSupabaseClient(userToken);
		if (!client) {
			yield* $(
				Effect.sync(() => {
					setTagLibraryLoading(false);
				}),
			);
			return yield* $(Effect.fail(new Error("No Supabase client available")));
		}

		const queryResult = yield* $(
			Effect.tryPromise({
				try: () =>
					callSelect<TagLibraryEntry>(client, "tag_library", {
						cols: "user_id, tag_slug",
						order: "tag_slug",
					}),
				catch: (error) => new Error(String(error)),
			}),
		);

		yield* $(
			Effect.sync(() => {
				setTagLibraryLoading(false);
			}),
		);

		if (!isRecord(queryResult)) {
			return yield* $(Effect.fail(new Error("Invalid response from Supabase")));
		}

		const rows: unknown[] = Array.isArray(queryResult["data"]) ? queryResult["data"] : [];

		const entriesArray = rows.filter((row): row is TagLibraryEntry => isTagLibraryEntry(row));

		const entriesRecord: Record<string, TagLibraryEntry> = Object.fromEntries(
			entriesArray.map((entry) => [entry.tag_slug, entry]),
		);

		yield* $(
			Effect.sync(() => {
				setTagLibraryEntries(entriesRecord);
			}),
		);
	});
}
