import { Effect } from "effect";

import extractErrorMessage from "@/shared/error-message/extractErrorMessage";
import { apiEventUserJoinPath } from "@/shared/paths";

import type { EventSlice } from "./slice/event-slice";

import { EventUserJoinApiError, EventUserJoinNetworkError, type EventError } from "./event-errors";

/**
 * Join the current user to an event by calling the API endpoint.
 *
 * @param eventId - The ID of the event to join
 * @param get - Zustand slice getter used to access state and mutation helpers
 * @returns Effect that completes when join succeeds
 */
export default function joinEvent(
	eventId: string,
	get: () => EventSlice,
): Effect.Effect<void, EventError> {
	return Effect.gen(function* joinEventGen($) {
		const { setEventError } = get();

		yield* $(
			Effect.sync(() => {
				console.warn("[joinEvent] Starting join for event:", eventId);
				setEventError(undefined);
			}),
		);

		const response = yield* $(
			Effect.tryPromise({
				try: () =>
					fetch(apiEventUserJoinPath, {
						method: "POST",
						headers: { "Content-Type": "application/json" },
						body: JSON.stringify({ event_id: eventId }),
						credentials: "include",
					}),
				catch: (err: unknown) =>
					new EventUserJoinNetworkError(
						`Network error: ${String(err)}`,
						err instanceof Error ? err : undefined,
					),
			}),
		);

		if (!response.ok) {
			const errorText = yield* $(
				Effect.tryPromise({
					try: () => response.text(),
					catch: () => new EventUserJoinApiError("Unknown error", response.status),
				}),
			);
			const msg =
				typeof errorText === "string" ? errorText : extractErrorMessage(errorText, "Unknown error");
			return yield* $(
				Effect.fail(new EventUserJoinApiError(`Failed to join event: ${msg}`, response.status)),
			);
		}

		yield* $(
			Effect.sync(() => {
				console.warn("[joinEvent] Join complete for event:", eventId);
			}),
		);

		return;
	}).pipe(
		Effect.tapError((err) =>
			Effect.sync(() => {
				const { setEventError } = get();
				const msg = extractErrorMessage(err, "Failed to join event");
				setEventError(msg);
				console.error("[joinEvent] Error:", err);
			}),
		),
		// eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
	) as unknown as Effect.Effect<void, EventError>;
}
