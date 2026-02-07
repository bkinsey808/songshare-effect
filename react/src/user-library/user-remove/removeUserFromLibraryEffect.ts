import { Effect } from "effect";

import extractErrorMessage from "@/shared/error-message/extractErrorMessage";
import { apiUserLibraryRemovePath } from "@/shared/paths";

import type { RemoveUserFromLibraryRequest } from "../slice/user-library-types";
import type { UserLibrarySlice } from "../slice/UserLibrarySlice.type";

/**
 * Removes a followed user by sending a removal request to the server and
 * optimistically updating the local slice. On non-2xx responses the Effect
 * fails with an Error.
 *
 * @param request - Request with `followed_user_id` to remove.
 * @param get - Getter for the `UserLibrarySlice` used to mutate state.
 * @returns - An Effect that resolves when the operation completes, or fails
 *   with an Error on network/server errors.
 */
export default function removeUserFromLibraryEffect(
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
