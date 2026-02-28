import type { CommunityUser } from "@/react/community/community-types";

import Button from "@/react/lib/design-system/Button";

export type MemberRowProps = {
	readonly member: CommunityUser;
	readonly onKick: (userId: string) => void;
};

/**
 * Row component representing a single member within the community manager.
 *
 * Shows name, role/status, and renders a kick/cancel button when allowed.
 *
 * @param member - the community user being displayed
 * @param onKick - callback invoked when kick button is pressed
 * @returns JSX element for the row
 */
export default function MemberRow({ member, onKick }: MemberRowProps): ReactElement {
	function handleKickClick(): void {
		onKick(member.user_id);
	}

	return (
		<div className="flex justify-between items-center bg-gray-900 px-4 py-3 rounded border border-gray-700">
			<div>
				<p className="text-white">
					{member.username !== undefined && member.username !== ""
						? member.username
						: member.user_id}
				</p>
				<p className="text-xs text-gray-400">
					role: {member.role} · status: {member.status}
				</p>
			</div>
			{member.role !== "owner" && (
				<Button variant="outlineDanger" onClick={handleKickClick}>
					{member.status === "invited" ? "Cancel Invite" : "Kick"}
				</Button>
			)}
		</div>
	);
}
