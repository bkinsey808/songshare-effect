import { Effect } from "effect";

import extractErrorMessage from "@/shared/error-message/extractErrorMessage";
import { apiImageLibraryRemovePath } from "@/shared/paths";

import type { RemoveImageFromLibraryRequest } from "../image-library-types";
import type { ImageLibrarySlice } from "../slice/ImageLibrarySlice.type";

/**
 * Removes an image from the current user's image library.
 *
 * @param request - Request object containing `image_id`.
 * @param get - Getter for the `ImageLibrarySlice`.
 * @returns An Effect that resolves when the operation completes or fails with an Error.
 */
export default function removeImageFromLibraryEffect(
	request: Readonly<RemoveImageFromLibraryRequest>,
	get: () => ImageLibrarySlice,
): Effect.Effect<void, Error> {
	return Effect.gen(function* removeImageGen($) {
		const { setImageLibraryError, removeImageLibraryEntry } = get();

		yield* $(
			Effect.sync(() => {
				setImageLibraryError(undefined);
			}),
		);

		const response = yield* $(
			Effect.tryPromise({
				try: () =>
					fetch(apiImageLibraryRemovePath, {
						method: "POST",
						headers: { "Content-Type": "application/json" },
						body: JSON.stringify({ image_id: request.image_id }),
					}),
				catch: (err) => new Error(extractErrorMessage(err, "Network error")),
			}),
		);

		const json: unknown = yield* $(
			Effect.tryPromise({
				try: () => response.json() as Promise<unknown>,
				catch: () => new Error("Invalid JSON body"),
			}),
		);

		if (!response.ok) {
			return yield* $(
				Effect.fail(new Error(extractErrorMessage(json, `Server returned ${response.status}`))),
			);
		}

		yield* $(
			Effect.sync(() => {
				removeImageLibraryEntry(request.image_id);
			}),
		);
	});
}
