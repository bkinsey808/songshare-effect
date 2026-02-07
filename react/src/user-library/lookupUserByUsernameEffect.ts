import { Effect, Schema } from "effect";

import extractErrorMessage from "@/shared/error-message/extractErrorMessage";
import { apiUserLibraryLookupPath } from "@/shared/paths";

import { NetworkError, ParseError } from "./user-library-errors";

type LookupUserResponse = Readonly<{
	user_id: string;
	username: string;
}>;

// Response schemas
const LookupUserResponseSchema = Schema.Struct({
	user_id: Schema.String,
	username: Schema.String,
});

const ApiResponseSchema = Schema.Struct({
	data: LookupUserResponseSchema,
});

/**
 * Look up a user by username via the API.
 *
 * Makes a POST request with the username and validates the response structure.
 * Returns structured errors for network failures or invalid response format.
 *
 * @param username - Username to search for
 * @returns - Effect that resolves to user ID and username on success
 */
export default function lookupUserByUsernameEffect(
	username: string,
): Effect.Effect<LookupUserResponse, NetworkError | ParseError> {
	return Effect.gen(function* gen() {
		// Fetch from API
		const response = yield* Effect.tryPromise({
			try: () =>
				fetch(apiUserLibraryLookupPath, {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ username }),
				}),
			catch: (error) =>
				new NetworkError(
					`Failed to fetch user lookup: ${extractErrorMessage(error, String(error))}`,
				),
		});

		// Check HTTP status
		if (!response.ok) {
			let errorMessage = `Failed to lookup user: ${response.statusText}`;
			yield* Effect.tryPromise({
				try: async () => {
					const errorData = (await response.json()) as unknown;
					errorMessage = extractErrorMessage(errorData, errorMessage);
				},
				catch: () => {
					// Use default message if we can't parse error response
				},
			}).pipe(Effect.catchAll(() => Effect.void));

			yield* Effect.fail(new NetworkError(errorMessage, response.status));
		}

		// Parse response JSON
		const jsonData = yield* Effect.tryPromise({
			try: () => response.json() as Promise<unknown>,
			catch: (error) =>
				new ParseError(`Failed to parse response: ${extractErrorMessage(error, String(error))}`),
		});

		// Validate response structure
		const validated = yield* Schema.decodeUnknown(ApiResponseSchema)(jsonData).pipe(
			Effect.mapError(
				(error) =>
					new ParseError(`Invalid response format: ${extractErrorMessage(error, String(error))}`),
			),
		);

		return validated.data;
	});
}

export type { LookupUserResponse };
