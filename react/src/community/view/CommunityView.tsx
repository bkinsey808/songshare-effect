import { useTranslation } from "react-i18next";

import Button from "@/react/lib/design-system/Button";

import useCommunityView from "./useCommunityView";

export default function CommunityView(): ReactElement {
	const { t } = useTranslation();
	const {
		currentCommunity,
		members,
		isCommunityLoading,
		communityError,
		isMember,
		canManage,
		canEdit,
		onJoinClick,
		onManageClick,
		onEditClick,
		userSession,
	} = useCommunityView();

	if (isCommunityLoading) {
		return <div className="max-w-4xl mx-auto px-6 py-8 text-gray-300">Loading community...</div>;
	}

	if (communityError !== undefined && communityError !== "") {
		return <div className="max-w-4xl mx-auto px-6 py-8 text-red-400">{communityError}</div>;
	}

	if (currentCommunity === undefined) {
		return <div className="max-w-4xl mx-auto px-6 py-8 text-gray-300">Community not found</div>;
	}

	return (
		<div className="max-w-4xl mx-auto px-6 py-8 space-y-8">
			<div className="flex justify-between items-start">
				<div>
					<h1 className="text-4xl font-bold text-white">{currentCommunity.name}</h1>
					<p className="text-gray-400 mt-2">{currentCommunity.description}</p>
				</div>
				<div className="flex gap-2">
					{userSession !== undefined && isMember === false && (
						<Button variant="primary" onClick={onJoinClick}>
							{t("communityView.join", "Join Community")}
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
						<div className="bg-green-900/20 text-green-400 px-4 py-2 rounded-lg border border-green-700">
							{t("communityView.isMember", "Member")}
						</div>
					)}
				</div>
			</div>

			<div className="grid grid-cols-1 md:grid-cols-2 gap-8">
				<section className="bg-gray-800 rounded-lg p-6 border border-gray-700">
					<h2 className="text-2xl font-semibold text-white mb-4">
						{t("communityView.members", "Members")}
					</h2>
					<div className="space-y-3">
						{members
							.filter(
								(member) =>
									member.status === "joined" ||
									member.role === "owner" ||
									member.status === "invited",
							)
							.map((member) => (
								<div key={member.user_id} className="flex justify-between items-center text-gray-300">
									<div className="flex items-center gap-2">
										<span>
											{member.username !== undefined && member.username !== ""
												? member.username
												: member.user_id}
										</span>
										{member.status === "invited" && (
											<span className="text-[10px] bg-yellow-900/40 text-yellow-400 px-1.5 py-0.5 rounded border border-yellow-700/50 uppercase tracking-wider font-semibold">
												Invited
											</span>
										)}
									</div>
									<span className="text-xs uppercase bg-gray-700 px-2 py-1 rounded">
										{member.role}
									</span>
								</div>
							))}
					</div>
				</section>

				<section className="bg-gray-800 rounded-lg p-6 border border-gray-700">
					<h2 className="text-2xl font-semibold text-white mb-4">
						{t("communityView.events", "Events")}
					</h2>
					<div className="space-y-3 text-gray-400">
						{/* Events would be listed here */}
						<p>{t("communityView.noEvents", "No events found for this community")}</p>
					</div>
				</section>
			</div>

			{currentCommunity.public_notes !== undefined && currentCommunity.public_notes !== "" && (
				<section className="bg-gray-800 rounded-lg p-6 border border-gray-700">
					<h2 className="text-2xl font-semibold text-white mb-4">
						{t("communityView.notes", "Community Notes")}
					</h2>
					<div className="text-gray-300 whitespace-pre-wrap">{currentCommunity.public_notes}</div>
				</section>
			)}
		</div>
	);
}
