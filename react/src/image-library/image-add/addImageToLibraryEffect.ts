import { Effect } from "effect";

import extractErrorMessage from "@/shared/error-message/extractErrorMessage";
import { apiImageLibraryAddPath } from "@/shared/paths";

import guardAsImageLibraryEntry from "../guards/guardAsImageLibraryEntry";
import type { AddImageToLibraryRequest } from "../image-library-types";
import type { ImageLibrarySlice } from "../slice/ImageLibrarySlice.type";

/**
 * Adds an image to the current user's image library.
 *
 * @param request - Request object containing `image_id`.
 * @param get - Getter for the `ImageLibrarySlice`.
 * @returns An Effect that resolves when the operation completes or fails with an Error.
 */
export default function addImageToLibraryEffect(
	request: Readonly<AddImageToLibraryRequest>,
	get: () => ImageLibrarySlice,
): Effect.Effect<void, Error> {
	return Effect.gen(function* addImageGen($) {
		const { setImageLibraryError, isInImageLibrary, addImageLibraryEntry } = get();

		yield* $(Effect.sync(() => { setImageLibraryError(undefined); }));

		if (typeof (request as Record<string, unknown>)["image_id"] !== "string") {
			return yield* $(Effect.fail(new Error("Invalid request: image_id must be a string")));
		}

		const alreadyInLibrary = yield* $(Effect.sync(() => isInImageLibrary(request.image_id)));
		if (alreadyInLibrary) {
			return;
		}

		const response = yield* $(
			Effect.tryPromise({
				try: () =>
					fetch(apiImageLibraryAddPath, {
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
				Effect.fail(
					new Error(extractErrorMessage(json, `Server returned ${response.status}`)),
				),
			);
		}

		let responseData: unknown = json;
		if (typeof json === "object" && json !== null && "data" in json) {
			const { data } = json as { data: unknown };
			responseData = data;
		}

		const entry = yield* $(
			Effect.try({
				try: () => guardAsImageLibraryEntry(responseData, "server response"),
				catch: (err) => new Error(extractErrorMessage(err, "Invalid server response")),
			}),
		);

		yield* $(Effect.sync(() => { addImageLibraryEntry(entry); }));
	});
}
