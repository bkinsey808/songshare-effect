import { Effect } from "effect";

import extractErrorMessage from "@/shared/error-message/extractErrorMessage";
import { apiEventUserRemovePath } from "@/shared/paths";

import type { EventSlice } from "./slice/event-slice";

import {
	EventUserLeaveApiError,
	EventUserLeaveNetworkError,
	type EventError,
} from "./event-errors";

/**
 * Remove a user from an event by calling the API endpoint.
 *
 * @param eventId - The ID of the event to leave
 * @param userId - The ID of the user leaving the event
 * @param get - Zustand slice getter used to access state and mutation helpers
 * @returns Effect that completes when leave succeeds
 */
export default function leaveEvent(
	eventId: string,
	userId: string,
	get: () => EventSlice,
): Effect.Effect<void, EventError> {
	return Effect.gen(function* leaveEventGen($) {
		const { setEventError } = get();

		yield* $(
			Effect.sync(() => {
				console.warn("[leaveEvent] Starting leave for event:", eventId, "user:", userId);
				setEventError(undefined);
			}),
		);

		const response = yield* $(
			Effect.tryPromise({
				try: () =>
					fetch(apiEventUserRemovePath, {
						method: "POST",
						headers: { "Content-Type": "application/json" },
						body: JSON.stringify({ event_id: eventId, user_id: userId }),
						credentials: "include",
					}),
				catch: (err: unknown) =>
					new EventUserLeaveNetworkError(
						`Network error: ${String(err)}`,
						err instanceof Error ? err : undefined,
					),
			}),
		);

		if (!response.ok) {
			const errorText = yield* $(
				Effect.tryPromise({
					try: () => response.text(),
					catch: () => new EventUserLeaveApiError("Unknown error", response.status),
				}),
			);
			const msg =
				typeof errorText === "string" ? errorText : extractErrorMessage(errorText, "Unknown error");
			return yield* $(
				Effect.fail(new EventUserLeaveApiError(`Failed to leave event: ${msg}`, response.status)),
			);
		}

		yield* $(
			Effect.sync(() => {
				console.warn("[leaveEvent] Leave complete for event:", eventId);
			}),
		);

		return;
	}).pipe(
		Effect.tapError((err) =>
			Effect.sync(() => {
				const { setEventError } = get();
				const msg = extractErrorMessage(err, "Failed to leave event");
				setEventError(msg);
				console.error("[leaveEvent] Error:", err);
			}),
		),
		// eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
	) as unknown as Effect.Effect<void, EventError>;
}
