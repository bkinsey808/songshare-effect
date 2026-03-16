import { Effect } from "effect";

import getSupabaseAuthToken from "@/react/lib/supabase/auth-token/getSupabaseAuthToken";
import getSupabaseClient from "@/react/lib/supabase/client/getSupabaseClient";
import callSelect from "@/react/lib/supabase/client/safe-query/callSelect";
import isRecord from "@/shared/type-guards/isRecord";

import isImageLibraryEntry from "../guards/isImageLibraryEntry";
import type { ImageLibraryEntry } from "../image-library-types";
import type { ImageLibrarySlice } from "../slice/ImageLibrarySlice.type";

/**
 * Fetches the current user's image library from Supabase and populates
 * the slice. Manages loading and error state on the slice.
 *
 * @param get - Getter for the `ImageLibrarySlice`.
 * @returns An Effect that resolves when fetching {return false;}fails with an Error.
 */
export default function fetchImageLibraryEffect(
	get: () => ImageLibrarySlice,
): Effect.Effect<void, Error> {
	return Effect.gen(function* fetchImageLibraryGen($) {
		const { setImageLibraryEntries, setImageLibraryLoading, setImageLibraryError } = get();

		yield* $(
			Effect.sync(() => {
				setImageLibraryLoading(true);
				setImageLibraryError(undefined);
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
					setImageLibraryLoading(false);
				}),
			);
			return yield* $(Effect.fail(new Error("No Supabase client available")));
		}

		const queryRes = yield* $(
			Effect.tryPromise({
				try: () =>
					callSelect(client, "image_library", {
						cols: "*, image_public(*)",
					}),
				catch: (error) => new Error(String(error)),
			}),
		);

		yield* $(
			Effect.sync(() => {
				setImageLibraryLoading(false);
			}),
		);

		if (!isRecord(queryRes)) {
			return yield* $(Effect.fail(new Error("Invalid response from Supabase")));
		}

		const rows: unknown[] = Array.isArray(queryRes["data"]) ? queryRes["data"] : [];

		const entriesArray = rows.filter((row): row is ImageLibraryEntry => isImageLibraryEntry(row));

		const entriesRecord: Record<string, ImageLibraryEntry> = Object.fromEntries(
			entriesArray.map((entry) => [entry.image_id, entry]),
		);

		yield* $(
			Effect.sync(() => {
				setImageLibraryEntries(entriesRecord);
			}),
		);
	});
}
