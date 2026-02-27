import { ZERO } from "@/shared/constants/shared-constants";
import Button from "@/react/lib/design-system/Button";
import UserSearchInput from "@/react/user-search-input/UserSearchInput";

import EventRow from "./EventRow";
import EventSearchInput from "./EventSearchInput";
import MemberRow from "./MemberRow";
import useCommunityManageView from "./useCommunityManageView";

export default function CommunityManageView(): ReactElement {
	const {
		currentCommunity,
		members,
		communityEvents,
		isCommunityLoading,
		communityError,
		canManage,
		actionState,
		inviteUserIdInput,
		setInviteUserIdInput,
		onInviteClick,
		addEventIdInput,
		setAddEventIdInput,
		onAddEventClick,
		onRemoveEventClick,
		onKickClick,
		onBackClick,
	} = useCommunityManageView();

	if (isCommunityLoading) {
		return <div className="max-w-4xl mx-auto px-6 py-8 text-gray-300">Loading manager...</div>;
	}

	if (currentCommunity === undefined) {
		if (communityError !== undefined && communityError !== "") {
			return <div className="max-w-4xl mx-auto px-6 py-8 text-red-400">{communityError}</div>;
		}
		return <div className="max-w-4xl mx-auto px-6 py-8 text-gray-300">Community not found</div>;
	}

	if (canManage !== true) {
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

	return (
		<div className="max-w-4xl mx-auto px-6 py-8 space-y-8">
			<div>
				<h1 className="text-4xl font-bold text-white">Community Manager</h1>
				<p className="text-gray-400 mt-2">{currentCommunity.name}</p>
			</div>

			<section className="bg-gray-800 rounded-lg p-6 border border-gray-700 space-y-4">
				<h2 className="text-2xl font-semibold text-white mb-4">Manage Members</h2>

				<div className="flex gap-2 items-end mb-6">
					<div className="flex-1">
						<UserSearchInput
							label="Invite from your library"
							activeUserId={inviteUserIdInput}
							onSelect={setInviteUserIdInput}
							disabled={actionState.loadingKey === "invite"}
						/>
					</div>
					<Button
						variant="secondary"
						disabled={
							inviteUserIdInput === undefined ||
							inviteUserIdInput === "" ||
							actionState.loadingKey === "invite"
						}
						onClick={onInviteClick}
					>
						{actionState.loadingKey === "invite" ? "Inviting..." : "Invite Member"}
					</Button>
				</div>

				{(actionState.errorKey === "invite" || actionState.successKey === "invite") && (
					<div
						className={`px-4 py-2 rounded border text-sm ${
							actionState.error === undefined
								? "bg-green-900/20 text-green-400 border-green-700"
								: "bg-red-900/20 text-red-400 border-red-700"
						}`}
					>
						{actionState.error === undefined || actionState.error === ""
							? actionState.success
							: actionState.error}
					</div>
				)}

				<div className="space-y-6">
					<div>
						<h3 className="text-lg font-medium text-white mb-3">Active Members</h3>
						<div className="space-y-3">
							{members
								.filter((member) => member.status === "joined" || member.role === "owner")
								.map((member) => (
									<MemberRow key={member.user_id} member={member} onKick={onKickClick} />
								))}
						</div>
					</div>

					<div>
						<h3 className="text-lg font-medium text-white mb-3">Pending Invitations</h3>
						<div className="space-y-3">
							{members
								.filter((member) => member.status === "invited")
								.map((member) => (
									<MemberRow key={member.user_id} member={member} onKick={onKickClick} />
								))}
							{members.filter((member) => member.status === "invited").length === ZERO && (
								<p className="text-gray-500 text-sm italic">No pending invitations.</p>
							)}
						</div>
					</div>
				</div>
			</section>

			<section className="bg-gray-800 rounded-lg p-6 border border-gray-700 space-y-4">
				<h2 className="text-2xl font-semibold text-white mb-4">Manage Events</h2>

				<div className="flex gap-2 items-end mb-6">
					<div className="flex-1">
						<label htmlFor="community-manage-add-event-input" className="text-sm font-medium text-white mb-2 block">
							Add Event from Library
						</label>
						<EventSearchInput
							id="community-manage-add-event-input"
							activeEventId={addEventIdInput}
							onSelect={setAddEventIdInput}
							disabled={actionState.loadingKey === "add-event"}
						/>
					</div>
					<Button
						variant="secondary"
						disabled={
							addEventIdInput === undefined ||
							addEventIdInput === "" ||
							actionState.loadingKey === "add-event"
						}
						onClick={onAddEventClick}
					>
						{actionState.loadingKey === "add-event" ? "Adding..." : "Add Event"}
					</Button>
				</div>

				{(actionState.errorKey === "add-event" || actionState.successKey === "add-event") && (
					<div
						className={`px-4 py-2 rounded border text-sm ${
							actionState.error === undefined
								? "bg-green-900/20 text-green-400 border-green-700"
								: "bg-red-900/20 text-red-400 border-red-700"
						}`}
					>
						{actionState.error === undefined || actionState.error === ""
							? actionState.success
							: actionState.error}
					</div>
				)}

				<div className="space-y-3">
					{communityEvents.map((event) => (
						<EventRow key={event.event_id} event={event} onRemove={onRemoveEventClick} />
					))}
					{communityEvents.length === ZERO && (
						<div className="text-gray-400">
							<p>Events associated with this community will appear here.</p>
						</div>
					)}
				</div>
			</section>

			<div>
				<Button variant="outlineSecondary" onClick={onBackClick}>
					Back to Community
				</Button>
			</div>
		</div>
	);
}
