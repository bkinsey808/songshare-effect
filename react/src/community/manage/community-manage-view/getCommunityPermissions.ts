import type { CommunityEntry, CommunityUser } from "@/react/community/community-types";
import type { UserSessionData } from "@/shared/userSessionData";

type GetCommunityPermissionsProps = {
	readonly currentCommunity: CommunityEntry | undefined;
	readonly members: readonly CommunityUser[];
	readonly userSessionData: UserSessionData | undefined;
};

type GetCommunityPermissionsReturn = {
	/** True when the current session user owns the community. */
	readonly isOwner: boolean;
	/** True when the user is owner or has the `community_admin` role. */
	readonly canManage: boolean;
};

/**
 * Derives permission flags for the community management screen.
 *
 * @param currentCommunity - the community currently being managed
 * @param members - current member list for the community
 * @param userSessionData - the authenticated user session (may be undefined)
 * @returns permission flags consumed by the manage view
 */
export default function getCommunityPermissions({
	currentCommunity,
	members,
	userSessionData,
}: GetCommunityPermissionsProps): GetCommunityPermissionsReturn {
	const isOwner =
		userSessionData?.user !== undefined &&
		currentCommunity !== undefined &&
		userSessionData.user.user_id === currentCommunity.owner_id;

	const currentMember =
		userSessionData?.user === undefined
			? undefined
			: members.find((member) => member.user_id === userSessionData.user?.user_id);

	const canManage = isOwner || currentMember?.role === "community_admin";

	return { isOwner, canManage };
}
