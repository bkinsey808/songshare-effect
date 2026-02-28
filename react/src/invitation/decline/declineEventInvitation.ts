import { Effect } from "effect";

import extractErrorMessage from "@/shared/error-message/extractErrorMessage";
import { apiEventUserRemovePath } from "@/shared/paths";

import type { InvitationSlice } from "../slice/InvitationSlice.type";

/**
 * Declines an event invitation by calling the remove API.
 *
 * On success, removes the invitation from the local slice.
 *
 * @param eventId - id of the event invitation to decline
 * @param userId - id of the current user (required by event remove endpoint)
 * @param get - accessor for the invitation slice helpers
 * @returns effect that completes when the decline call finishes
 */
export default function declineEventInvitation(
	eventId: string,
	userId: string,
	get: () => InvitationSlice,
): Effect.Effect<void, Error> {
	return Effect.gen(function* declineEventInvitationGen($) {
		const { setInvitationError, setPendingEventInvitations, pendingEventInvitations } = get();
		setInvitationError(undefined);

		const response = yield* $(
			Effect.tryPromise({
				try: () =>
					fetch(apiEventUserRemovePath, {
						method: "POST",
						headers: { "Content-Type": "application/json" },
						body: JSON.stringify({ event_id: eventId, user_id: userId }),
						credentials: "include",
					}),
				catch: (err) => new Error(extractErrorMessage(err, "Network error")),
			}),
		);

		if (!response.ok) {
			const text = yield* $(
				Effect.tryPromise({
					try: () => response.text(),
					catch: () => new Error("Unknown error"),
				}),
			);
			return yield* $(
				Effect.fail(
					new Error(
						`Failed to decline event invitation: ${typeof text === "string" ? text : "Unknown error"}`,
					),
				),
			);
		}

		// Remove the declined invitation from the list
		const updated = pendingEventInvitations.filter((inv) => inv.event_id !== eventId);
		setPendingEventInvitations(updated);
	}).pipe(
		Effect.tapError((err) =>
			Effect.sync(() => {
				const { setInvitationError } = get();
				setInvitationError(err.message);
			}),
		),
	);
}
