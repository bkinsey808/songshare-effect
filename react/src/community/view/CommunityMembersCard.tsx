import { useTranslation } from "react-i18next";

import type { CommunityUser } from "@/react/community/community-types";
import { ZERO } from "@/shared/constants/shared-constants";

type CommunityMembersCardProps = Readonly<{
	members: readonly CommunityUser[];
}>;

/**
 * Card displaying community members and pending invitations.
 *
 * Shows joined members and owners in the main list, and invited
 * users in a separate section.
 *
 * @returns React element for the members card
 */
/**
 * Card displaying community members with their avatars and roles.
 *
 * @param members - List of community members to display
 * @returns React element for the members card
 */
export default function CommunityMembersCard({ members }: CommunityMembersCardProps): ReactElement {
	const { t } = useTranslation();

	return (
		<section className="bg-gray-800 rounded-lg p-6 border border-gray-700 space-y-6">
			<div>
				<h2 className="text-2xl font-semibold text-white mb-4">
					{t("communityView.members", "Members")}
				</h2>
				<div className="space-y-3">
					{members
						.filter((member) => member.status === "joined" || member.role === "owner")
						.map((member) => (
							<div key={member.user_id} className="flex justify-between items-center text-gray-300">
								<span>
									{member.username !== undefined && member.username !== ""
										? member.username
										: member.user_id}
								</span>
								<span className="text-xs uppercase bg-gray-700 px-2 py-1 rounded">
									{member.role}
								</span>
							</div>
						))}
				</div>
			</div>
			<div>
				<h3 className="text-lg font-medium text-white mb-3">
					{t("communityView.pendingInvitations", "Pending Invitations")}
				</h3>
				<div className="space-y-3">
					{members
						.filter((member) => member.status === "invited")
						.map((member) => (
							<div key={member.user_id} className="flex justify-between items-center text-gray-300">
								<div className="flex items-center gap-2">
									<span>
										{member.username !== undefined && member.username !== ""
											? member.username
											: member.user_id}
									</span>
									<span className="text-[10px] bg-yellow-900/40 text-yellow-400 px-1.5 py-0.5 rounded border border-yellow-700/50 uppercase tracking-wider font-semibold">
										{t("communityView.invited", "Invited")}
									</span>
								</div>
								<span className="text-xs uppercase bg-gray-700 px-2 py-1 rounded">
									{member.role}
								</span>
							</div>
						))}
					{members.filter((member) => member.status === "invited").length === ZERO && (
						<p className="text-gray-500 text-sm italic">
							{t("communityView.noPendingInvitations", "No pending invitations.")}
						</p>
					)}
				</div>
			</div>
		</section>
	);
}
