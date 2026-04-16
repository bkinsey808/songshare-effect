import { useTranslation } from "react-i18next";

import type { CommunityEntry } from "@/react/community/community-types";
import Button from "@/react/lib/design-system/Button";
import ShareButton from "@/react/lib/design-system/share-button/ShareButton";
import type { UserSessionData } from "@/shared/userSessionData";

type CommunityViewHeaderProps = Readonly<{
	currentCommunity: CommunityEntry;
	userSession: UserSessionData | undefined;
	isMember: boolean | undefined;
	isOwner: boolean | undefined;
	isJoinLoading: boolean;
	isLeaveLoading: boolean;
	canManage: boolean | undefined;
	canEdit: boolean | undefined;
	onJoinClick: () => void;
	onLeaveClick: () => void;
	onManageClick: () => void;
	onEditClick: () => void;
	onRefreshCommunity: () => void;
}>;

/**
 * Header section for the community view with title, description, and action buttons.
 *
 * Shows Share, Join/Leave, Edit, and Manage based on permissions.
 *
 * @param currentCommunity - the community being viewed
 * @param userSession - current user session data when signed in
 * @param isMember - whether the current user is a member of the community
 * @param isOwner - whether the current user is the owner of the community
 * @param isJoinLoading - true when a join request is inflight
 * @param isLeaveLoading - true when a leave request is inflight
 * @param canManage - whether the current user has manage permissions
 * @param canEdit - whether the current user has edit permissions
 * @param onJoinClick - callback when user clicks Join
 * @param onLeaveClick - callback when user clicks Leave
 * @param onManageClick - callback when user clicks Manage
 * @param onEditClick - callback when user clicks Edit
 * @param onRefreshCommunity - callback to refresh community data
 * @returns React element for the community view header
 */
export default function CommunityViewHeader({
	currentCommunity,
	userSession,
	isMember,
	isOwner,
	isJoinLoading,
	isLeaveLoading,
	canManage,
	canEdit,
	onJoinClick,
	onLeaveClick,
	onManageClick,
	onEditClick,
	onRefreshCommunity,
}: CommunityViewHeaderProps): ReactElement {
	const { t } = useTranslation();

	return (
		<div className="flex flex-col gap-4 md:flex-row md:justify-between md:items-start">
			<div>
				<h1 className="text-4xl font-bold text-white">{currentCommunity.community_name}</h1>
				<p className="text-gray-400 mt-2">{currentCommunity.description}</p>
			</div>
			<div className="flex flex-wrap gap-2">
				<ShareButton
					itemType="community"
					itemId={currentCommunity.community_id}
					itemName={currentCommunity.community_name}
					onShareSuccess={onRefreshCommunity}
				/>
				{userSession !== undefined && isMember === false && (
					<Button variant="primary" onClick={onJoinClick} disabled={isJoinLoading}>
						{isJoinLoading
							? t("communityView.joining", "Joining...")
							: t("communityView.join", "Join Community")}
					</Button>
				)}
				{canEdit === true && (
					<Button variant="secondary" onClick={onEditClick}>
						{t("communityView.edit", "Edit")}
					</Button>
				)}
				{canManage === true && (
					<Button variant="secondary" onClick={onManageClick}>
						{t("communityView.manage", "Manage")}
					</Button>
				)}
				{isMember === true && (
					<div className="flex items-center gap-2">
						<div className="bg-green-900/20 text-green-400 px-4 py-2 rounded-lg border border-green-700">
							{t("communityView.isMember", "Member")}
						</div>
						{isOwner === false && (
							<Button variant="outlineDanger" onClick={onLeaveClick} disabled={isLeaveLoading}>
								{isLeaveLoading
									? t("communityView.leaving", "Leaving...")
									: t("communityView.leave", "Leave Community")}
							</Button>
						)}
					</div>
				)}
			</div>
		</div>
	);
}
