import { Effect } from "effect";

import { clientWarn } from "@/react/utils/clientLogger";
import extractErrorMessage from "@/shared/error-message/extractErrorMessage";
import { apiUserLibraryAddPath } from "@/shared/paths";

import type { AddUserToLibraryRequest } from "../slice/user-library-types";
import type { UserLibrarySlice } from "../slice/UserLibrarySlice.type";

import guardAsUserLibraryEntry from "../guards/guardAsUserLibraryEntry";

/**
 * addUserToLibrary
 *
 * Adds a followed user to the current user's library. Validates the input,
 * performs a POST to the server, validates the server response, and updates
 * the local slice on success. Any network or validation errors are propagated
 * through the Effect error channel and also result in a local error being
 * set on the slice for UI display.
 *
 * @param request - Request object containing `followed_user_id`.
 * @param get - Getter for the `UserLibrarySlice` used to read and mutate state.
 * @returns - An Effect that resolves when the operation completes or fails
 *   with an Error.
 */
export default function addUserToLibraryEffect(
	request: Readonly<AddUserToLibraryRequest>,
	get: () => UserLibrarySlice,
): Effect.Effect<void, Error> {
	return Effect.gen(function* addUserToLibraryGen($) {
		const { setUserLibraryError, isInUserLibrary, addUserLibraryEntry } = get();

		// Clear previous errors
		yield* $(
			Effect.sync(() => {
				setUserLibraryError(undefined);
			}),
		);

		// Validate request shape
		if (
			typeof request !== "object" ||
			request === null ||
			typeof (request as Record<string, unknown>)["followed_user_id"] !== "string"
		) {
			return yield* $(Effect.fail(new Error("Invalid request: followed_user_id must be a string")));
		}

		const input = request as AddUserToLibraryRequest;

		// Early exit if already present
		const alreadyInLibrary = yield* $(Effect.sync(() => isInUserLibrary(input.followed_user_id)));
		if (alreadyInLibrary) {
			yield* $(
				Effect.sync(() => {
					clientWarn("[addUserToLibrary] User already in library:", input.followed_user_id);
				}),
			);
			return;
		}

		// Perform POST
		const response = yield* $(
			Effect.tryPromise({
				try: () =>
					fetch(apiUserLibraryAddPath, {
						method: "POST",
						headers: { "Content-Type": "application/json" },
						body: JSON.stringify({ followed_user_id: input.followed_user_id }),
					}),
				catch: (err) => new Error(extractErrorMessage(err, "Network error")),
			}),
		);

		const responseJson: unknown = yield* $(
			Effect.tryPromise({
				try: () => response.json(),
				catch: () => new Error("Invalid JSON body"),
			}),
		);

		if (!response.ok) {
			const errorMsg = extractErrorMessage(
				responseJson,
				`Server returned ${response.status}: ${response.statusText}`,
			);
			return yield* $(Effect.fail(new Error(errorMsg)));
		}

		// Extract data from HTTP response wrapper
		let responseData: unknown = responseJson;
		if (typeof responseJson === "object" && responseJson !== null && "data" in responseJson) {
			responseData = (responseJson as Record<string, unknown>)["data"];
		}

		// Validate server response shape
		const output = yield* $(
			Effect.try({
				try: () => guardAsUserLibraryEntry(responseData, "server response"),
				catch: (err) => {
					const errMsg = extractErrorMessage(err, "Invalid server response");
					clientWarn("[addUserToLibrary] Validation failed. Response data:", responseData);
					return new Error(errMsg);
				},
			}),
		);

		// Update local store
		yield* $(
			Effect.sync(() => {
				addUserLibraryEntry(output);
			}),
		);
	}).pipe(
		Effect.tapError((err) =>
			Effect.sync(() => {
				const msg = extractErrorMessage(err, "Unknown error");
				clientWarn("[addUserToLibrary] Failed to add user to library:", msg);
				const { setUserLibraryError } = get();
				setUserLibraryError(msg);
			}),
		),
	);
}
