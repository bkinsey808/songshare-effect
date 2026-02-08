import { Effect } from "effect";

import { clientWarn } from "@/react/lib/utils/clientLogger";
import extractErrorMessage from "@/shared/error-message/extractErrorMessage";
import { apiEventLibraryAddPath } from "@/shared/paths";

import type { AddEventToLibraryRequest } from "../event-library-types";
import type { EventLibrarySlice } from "../slice/EventLibrarySlice.type";

import guardAsEventLibraryEntry from "../guards/guardAsEventLibraryEntry";

/**
 * Adds an event to the current user's event library. Validates the input,
 * performs a POST to the server, validates the server response, and updates
 * the local slice on success.
 *
 * @param request - Request object containing `event_id`.
 * @param get - Getter for the `EventLibrarySlice` used to read and mutate state.
 * @returns - An Effect that resolves when the operation completes or fails with an Error.
 */
export default function addEventToLibraryEffect(
	request: Readonly<AddEventToLibraryRequest>,
	get: () => EventLibrarySlice,
): Effect.Effect<void, Error> {
	return Effect.gen(function* addEventToLibraryGen($) {
		const { setEventLibraryError, isInEventLibrary, addEventLibraryEntry } = get();

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

		const input = request as AddEventToLibraryRequest;

		// Early exit if already in library
		const alreadyInLibrary = yield* $(Effect.sync(() => isInEventLibrary(input.event_id)));
		if (alreadyInLibrary) {
			yield* $(
				Effect.sync(() => {
					clientWarn("[addEventToLibrary] Event already in library:", input.event_id);
				}),
			);
			return;
		}

		// Perform POST
		const response = yield* $(
			Effect.tryPromise({
				try: () =>
					fetch(apiEventLibraryAddPath, {
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

		// Extract data from HTTP response wrapper
		let responseData: unknown = responseJson;
		if (typeof responseJson === "object" && responseJson !== null && "data" in responseJson) {
			responseData = (responseJson as Record<string, unknown>)["data"];
		}

		// Validate server response shape
		const output = yield* $(
			Effect.try({
				try: () => guardAsEventLibraryEntry(responseData, "server response"),
				catch: (err) => {
					const errMsg = extractErrorMessage(err, "Invalid server response");
					clientWarn("[addEventToLibrary] Validation failed. Response data:", responseData);
					return new Error(errMsg);
				},
			}),
		);

		// Update local store
		yield* $(
			Effect.sync(() => {
				addEventLibraryEntry(output);
			}),
		);
	}).pipe(
		Effect.tapError((err) =>
			Effect.sync(() => {
				const msg = extractErrorMessage(err, "Unknown error");
				clientWarn("[addEventToLibrary] Failed to add event to library:", msg);
				const { setEventLibraryError } = get();
				setEventLibraryError(msg);
			}),
		),
	);
}
