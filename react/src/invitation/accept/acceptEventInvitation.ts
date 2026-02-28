import { Effect } from "effect";

import extractErrorMessage from "@/shared/error-message/extractErrorMessage";
import { apiEventUserJoinPath } from "@/shared/paths";

import type { InvitationSlice } from "../slice/InvitationSlice.type";

/**
 * Accepts an event invitation by calling the join API.
 *
 * On success, marks the invitation as accepted in the local slice so the UI
 * can display a "Visit event" link while awaiting the realtime update.
 *
 * @param eventId - id of the event invitation to accept
 * @param get - accessor for the invitation slice helpers
 * @returns effect that completes when the accept call finishes
 */
export default function acceptEventInvitation(
	eventId: string,
	get: () => InvitationSlice,
): Effect.Effect<void, Error> {
	return Effect.gen(function* acceptEventInvitationGen($) {
		const { setInvitationError, setPendingEventInvitations, pendingEventInvitations } = get();
		setInvitationError(undefined);

		const response = yield* $(
			Effect.tryPromise({
				try: () =>
					fetch(apiEventUserJoinPath, {
						method: "POST",
						headers: { "Content-Type": "application/json" },
						body: JSON.stringify({ event_id: eventId }),
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
						`Failed to accept event invitation: ${typeof text === "string" ? text : "Unknown error"}`,
					),
				),
			);
		}

		// Optimistically mark as accepted so UI can show the link immediately
		const updated = pendingEventInvitations.map((inv) =>
			inv.event_id === eventId ? Object.assign(inv, { accepted: true }) : inv,
		);
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
