import { Effect } from "effect";

import type lookupUserByUsername from "../lookupUserByUsername";
import type { NetworkError, ParseError } from "../user-library-errors";

type CreateAddUserEffectParams = Readonly<{
	username: string;
	lookupUserByUsername: typeof lookupUserByUsername;
	addUserToLibrary: (params: { readonly followed_user_id: string }) => Effect.Effect<void, Error>;
	t: (key: string, defaultValue: string) => string;
}>;

/**
 * Add a user to the library by looking them up first and then adding them.
 *
 * Trims the username, looks it up via API, and adds the found user to the library.
 * Returns structured validation and network errors.
 *
 * @param username - Username to search for and add
 * @param lookupUserByUsername - Effect factory for user lookup
 * @param addUserToLibrary - Effect factory for adding user to library
 * @param t - Translation function for error messages
 * @returns - Effect that completes on success or fails with error message
 */
export default function createAddUserEffect(
	params: CreateAddUserEffectParams,
): Effect.Effect<void, Error> {
	const { username, lookupUserByUsername: lookup, addUserToLibrary, t } = params;

	return Effect.gen(function* gen() {
		// Validate username
		const trimmedUsername = username.trim();

		if (trimmedUsername === "") {
			yield* Effect.fail(new Error(t("addUserForm.emptyUsername", "Please enter a username")));
		}

		// Look up user
		const user = yield* lookup(trimmedUsername).pipe(
			Effect.mapError((error: NetworkError | ParseError) => {
				const baseErrorMessage = error.message;
				// Append username if not already in the message
				const errorMessage =
					baseErrorMessage.includes(trimmedUsername) ||
					baseErrorMessage.includes(`"${trimmedUsername}"`)
						? baseErrorMessage
						: `${baseErrorMessage} "${trimmedUsername}"`;
				return new Error(errorMessage);
			}),
		);

		// Add user to library
		yield* addUserToLibrary({ followed_user_id: user.user_id });
	});
}
