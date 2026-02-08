import { Effect } from "effect";

import { clientWarn } from "@/react/lib/utils/clientLogger";
import extractErrorMessage from "@/shared/error-message/extractErrorMessage";
import { apiEventLibraryRemovePath } from "@/shared/paths";

import type { RemoveEventFromLibraryRequest } from "../event-library-types";
import type { EventLibrarySlice } from "../slice/EventLibrarySlice.type";

/**
 * Removes an event from the current user's event library. Validates the input,
 * performs a POST to the server, and updates the local slice on success.
 *
 * @param request - Request object containing `event_id`.
 * @param get - Getter for the `EventLibrarySlice` used to read and mutate state.
 * @returns - An Effect that resolves when the operation completes or fails with an Error.
 */
export default function removeEventFromLibraryEffect(
	request: Readonly<RemoveEventFromLibraryRequest>,
	get: () => EventLibrarySlice,
): Effect.Effect<void, Error> {
	return Effect.gen(function* removeEventFromLibraryGen($) {
		const { setEventLibraryError, removeEventLibraryEntry } = get();

		// Clear previous errors
		yield* $(
			Effect.sync(() => {
				setEventLibraryError(undefined);
			}),
		);

		// Validate request shape
		if (
			typeof request !== "object" ||
			request === null ||
			typeof (request as Record<string, unknown>)["event_id"] !== "string"
		) {
			return yield* $(Effect.fail(new Error("Invalid request: event_id must be a string")));
		}

		const input = request as RemoveEventFromLibraryRequest;

		// Perform POST
		const response = yield* $(
			Effect.tryPromise({
				try: () =>
					fetch(apiEventLibraryRemovePath, {
						method: "POST",
						headers: { "Content-Type": "application/json" },
						body: JSON.stringify({ event_id: input.event_id }),
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

		// Check for success flag in response
		if (typeof responseJson !== "object" || responseJson === null || !("success" in responseJson)) {
			return yield* $(Effect.fail(new Error("Invalid server response: missing success flag")));
		}

		if (typeof (responseJson as Record<string, unknown>)["success"] !== "boolean") {
			return yield* $(Effect.fail(new Error("Invalid server response: success must be boolean")));
		}

		// Update local store
		yield* $(
			Effect.sync(() => {
				removeEventLibraryEntry(input.event_id);
			}),
		);
	}).pipe(
		Effect.tapError((err) =>
			Effect.sync(() => {
				const msg = extractErrorMessage(err, "Unknown error");
				clientWarn("[removeEventFromLibrary] Failed to remove event from library:", msg);
				const { setEventLibraryError } = get();
				setEventLibraryError(msg);
			}),
		),
	);
}
