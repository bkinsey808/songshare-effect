import isRecord from "@/shared/type-guards/isRecord";

import type { PendingEventInvitation } from "./slice/InvitationSlice.type";

/**
 * Maps event_user rows and event_public metadata into PendingEventInvitation array.
 *
 * @param userData - list of user-event association rows
 * @param publicData - list of event public metadata rows
 * @returns array of pending event invitations
 */
export default function mapEventInvitations(
	userData: unknown[],
	publicData: unknown[],
): PendingEventInvitation[] {
	const publicDataMap = new Map<string, { event_name: string; event_slug: string }>();
	for (const row of publicData) {
		if (isRecord(row)) {
			publicDataMap.set(String(row["event_id"]), {
				event_name: String(row["event_name"]),
				event_slug: String(row["event_slug"]),
			});
		}
	}

	const invitations: PendingEventInvitation[] = [];
	for (const row of userData) {
		if (isRecord(row)) {
			const eventId = String(row["event_id"]);
			const pub = publicDataMap.get(eventId);
			if (pub !== undefined) {
				invitations.push({
					event_id: eventId,
					event_name: pub.event_name,
					event_slug: pub.event_slug,
				});
			}
		}
	}
	return invitations;
}
