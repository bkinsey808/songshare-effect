import isRecord from "@/shared/type-guards/isRecord";

import type { PendingCommunityInvitation } from "./slice/InvitationSlice.type";

/**
 * Maps community_user rows and community_public metadata into PendingCommunityInvitation array.
 *
 * @param userData - list of user-community association rows
 * @param publicData - list of community public metadata rows
 * @returns array of pending community invitations
 */
export default function mapCommunityInvitations(
	userData: unknown[],
	publicData: unknown[],
): PendingCommunityInvitation[] {
	const publicDataMap = new Map<string, { community_name: string; community_slug: string }>();
	for (const row of publicData) {
		if (isRecord(row)) {
			publicDataMap.set(String(row["community_id"]), {
				community_name: String(row["community_name"]),
				community_slug: String(row["community_slug"]),
			});
		}
	}

	const invitations: PendingCommunityInvitation[] = [];
	for (const row of userData) {
		if (isRecord(row)) {
			const communityId = String(row["community_id"]);
			const pub = publicDataMap.get(communityId);
			if (pub !== undefined) {
				invitations.push({
					community_id: communityId,
					community_name: pub.community_name,
					community_slug: pub.community_slug,
				});
			}
		}
	}
	return invitations;
}
