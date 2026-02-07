import { Effect } from "effect";

import extractErrorMessage from "@/shared/error-message/extractErrorMessage";
import { apiEventSavePath } from "@/shared/paths";
import isRecord from "@/shared/type-guards/isRecord";

import type { SaveEventRequest } from "./event-types";
import type { EventSlice } from "./slice/event-slice";

import {
	EventSaveApiError,
	EventSaveInvalidResponseError,
	EventSaveNetworkError,
	type EventError,
} from "./event-errors";

/**
 * Save an event (create or update) by calling the API endpoint.
 * Returns the event_id of the saved event.
 *
 * @param request - The event data to save
 * @param get - Zustand slice getter used to access state and mutation helpers
 * @returns Effect that resolves with the event_id when save completes
 */
export default function saveEvent(
	request: Readonly<SaveEventRequest>,
	get: () => EventSlice,
): Effect.Effect<string, EventError> {
	return Effect.gen(function* saveEventGen($) {
		const { setEventSaving, setEventError } = get();

		yield* $(
			Effect.sync(() => {
				console.warn("[saveEvent] Starting save:", JSON.stringify(request));
				setEventSaving(true);
				setEventError(undefined);
			}),
		);

		const response = yield* $(
			Effect.tryPromise({
				try: () =>
					fetch(apiEventSavePath, {
						method: "POST",
						headers: { "Content-Type": "application/json" },
						body: JSON.stringify(request),
						credentials: "include",
					}),
				catch: (err) => new EventSaveNetworkError(`Network error: ${String(err)}`, err),
			}),
		);

		if (!response.ok) {
			const errorTextOrErr = yield* $(
				Effect.tryPromise({
					try: () => response.text(),
					catch: () => new EventSaveApiError("Unknown error", response.status),
				}),
			);
			const errorText =
				typeof errorTextOrErr === "string"
					? errorTextOrErr
					: extractErrorMessage(errorTextOrErr, "Unknown error");
			return yield* $(
				Effect.fail(new EventSaveApiError(`Failed to save event: ${errorText}`, response.status)),
			);
		}

		const responseData = yield* $(
			Effect.tryPromise({
				try: async () => {
					const json: unknown = await response.json();
					return json;
				},
				catch: (err) => new EventSaveInvalidResponseError(err),
			}),
		);

		if (
			!isRecord(responseData) ||
			!isRecord(responseData["data"]) ||
			typeof responseData["data"]["event_id"] !== "string"
		) {
			return yield* $(Effect.fail(new EventSaveInvalidResponseError(responseData)));
		}

		const eventId = responseData["data"]["event_id"];

		yield* $(
			Effect.sync(() => {
				console.warn("[saveEvent] Save complete, event_id:", eventId);
			}),
		);

		return eventId;
	}).pipe(
		Effect.tapError((err) =>
			Effect.sync(() => {
				const { setEventSaving, setEventError } = get();
				setEventSaving(false);
				const msg = extractErrorMessage(err, "Failed to save event");
				setEventError(msg);
				console.error("[saveEvent] Error:", err);
			}),
		),
		Effect.ensuring(
			Effect.sync(() => {
				const { setEventSaving } = get();
				setEventSaving(false);
			}),
		),
		// The pipeline returns an Effect whose inferred error type can include unknown.
		// Use a double-cast to align the type with the declared return type.
		// eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
	) as unknown as Effect.Effect<string, EventError>;
}
