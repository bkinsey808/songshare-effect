import { Effect } from "effect";

import extractErrorMessage from "@/shared/error-message/extractErrorMessage";
import { apiUserLibraryRemovePath } from "@/shared/paths";

import type { UserLibrarySlice } from "./user-library-slice";
import type { RemoveUserFromLibraryRequest } from "./user-library-types";

export default function removeUserFromLibrary(
	request: Readonly<RemoveUserFromLibraryRequest>,
	get: () => UserLibrarySlice,
): Effect.Effect<void, Error> {
	return Effect.gen(function* removeUserFromLibraryGen($) {
		const { setUserLibraryError, removeUserLibraryEntry } = get();

		yield* $(
			Effect.sync(() => {
				setUserLibraryError(undefined);
			}),
		);

		const response = yield* $(
			Effect.tryPromise({
				try: () =>
					fetch(apiUserLibraryRemovePath, {
						method: "POST",
						headers: { "Content-Type": "application/json" },
						body: JSON.stringify({ followed_user_id: request.followed_user_id }),
					}),
				catch: (err) => new Error(extractErrorMessage(err, "Network error")),
			}),
		);

		if (!response.ok) {
			return yield* $(
				Effect.fail(new Error(`Server returned ${response.status}: ${response.statusText}`)),
			);
		}

		// Optimistically update local store
		yield* $(
			Effect.sync(() => {
				removeUserLibraryEntry(request.followed_user_id);
			}),
		);
	});
}
