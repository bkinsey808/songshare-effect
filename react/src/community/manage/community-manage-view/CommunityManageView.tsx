import Button from "@/react/lib/design-system/Button";

import CommunityManageBody from "./body/CommunityManageBody";
import useCommunityManageView from "./useCommunityManageView";

/**
 * Main UI for community owners/admins to invite members and manage events.
 *
 * Handles loading/error states and conditionally renders forms/actions
 * based on permissions and current state returned by the corresponding hook.
 *
 * @returns React element for the manage view
 */
export default function CommunityManageView(): ReactElement {
	const { currentCommunity, isCommunityLoading, communityError, canManage, onBackClick } =
		useCommunityManageView();

	if (isCommunityLoading) {
		return <div className="max-w-4xl mx-auto px-6 py-8 text-gray-300">Loading manager...</div>;
	}

	if (currentCommunity === undefined) {
		if (communityError !== undefined && communityError !== "") {
			return <div className="max-w-4xl mx-auto px-6 py-8 text-red-400">{communityError}</div>;
		}
		return <div className="max-w-4xl mx-auto px-6 py-8 text-gray-300">Community not found</div>;
	}

	if (!canManage) {
		return (
			<div className="max-w-4xl mx-auto px-6 py-8">
				<h1 className="text-3xl font-bold mb-4 text-white">Community Manager</h1>
				<p className="text-red-400 mb-6">Only owners and admins can access this page.</p>
				<Button variant="outlineSecondary" onClick={onBackClick}>
					Back to Community
				</Button>
			</div>
		);
	}

	return <CommunityManageBody currentCommunity={currentCommunity} />;
}
