import { Effect } from "effect";

import extractErrorMessage from "@/shared/error-message/extractErrorMessage";
import { apiTagLibraryRemovePath } from "@/shared/paths";

import fetchTagEffect from "./fetchTagEffect";
import type { TagLibrarySlice } from "./slice/TagLibrarySlice.type";

/**
 * Calls the tag library remove API endpoint and, on success, removes the tag
 * from the local slice state.
 *
 * @param get - Getter for the `TagLibrarySlice`.
 * @param tagSlug - The slug of the tag to remove from the library.
 * @returns An Effect that resolves when the tag is removed, or fails with an Error.
 */
export default function removeTagFromLibraryEffect(
	get: () => TagLibrarySlice,
	tagSlug: string,
): Effect.Effect<void, Error> {
	return Effect.gen(function* removeTagFromLibraryGen($) {
		const response = yield* $(fetchTagEffect(apiTagLibraryRemovePath, { tag_slug: tagSlug }));

		if (!response.ok) {
			const body: unknown = yield* $(
				Effect.promise(() => response.json().catch(() => undefined) as Promise<unknown>),
			);
			const message = extractErrorMessage(body, `Failed to remove tag (${response.status.toString()})`);
			return yield* $(Effect.fail(new Error(message)));
		}

		yield* $(
			Effect.sync(() => {
				get().removeTagLibraryEntry(tagSlug);
			}),
		);
	});
}
