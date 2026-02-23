import ActiveSongSelectionSection from "@/react/event/form/ActiveSongSelectionSection";
import PlaylistSearchInput from "@/react/event/playlist-search-input/PlaylistSearchInput";
import UserSearchInput from "@/react/event/user-search-input/UserSearchInput";
import Button from "@/react/lib/design-system/Button";

import useEventManageState from "./useEventManageView";

/**
 * Realtime event management page for owners and event admins.
 *
 * All actions are independent button actions (no form submit flow).
 *
 * @returns Management UI for playback and participant controls
 */
export default function EventManageView(): React.JSX.Element {
	const {
		currentEvent,
		eventPublic,
		participants = [],
		ownerId,
		ownerUsername,
		isEventLoading,
		eventError,
		canManageEvent,
		actionState,
		inviteUserIdInput,
		setInviteUserIdInput,
		activePlaylistIdForSelector,
		activeSongIdForSelector,
		activeSlidePositionForSelector,
		updateActivePlaylist,
		updateActiveSong,
		updateActiveSlidePosition,
		inviteParticipant,
		kickParticipant,
		goBackToEvent,
	} = useEventManageState();

	if (isEventLoading) {
		return (
			<div className="max-w-4xl mx-auto px-6 py-8 text-gray-300">Loading event manager...</div>
		);
	}

	if (eventError !== undefined && eventError !== "") {
		return <div className="max-w-4xl mx-auto px-6 py-8 text-red-400">{eventError}</div>;
	}

	if (currentEvent === undefined || eventPublic === undefined) {
		return <div className="max-w-4xl mx-auto px-6 py-8 text-gray-300">Event not found</div>;
	}
	if (!canManageEvent) {
		return (
			<div className="max-w-4xl mx-auto px-6 py-8">
				<h1 className="text-3xl font-bold mb-4">Event Manager</h1>
				<p className="text-red-400 mb-4">
					Only event owners and event admins can access this page.
				</p>
				<Button variant="outlineSecondary" onClick={goBackToEvent}>
					Back to Event
				</Button>
			</div>
		);
	}

	return (
		<div className="max-w-4xl mx-auto px-6 py-8 space-y-8">
			<div>
				<h1 className="text-3xl font-bold">Event Manager</h1>
				<p className="text-gray-400 mt-1">{eventPublic.event_name}</p>
				{ownerUsername !== undefined && ownerUsername !== "" && (
					<p className="text-gray-500 text-sm">Hosted by {ownerUsername}</p>
				)}
			</div>

			{actionState.error !== undefined && (
				<div className="rounded border border-red-700 bg-red-900/20 p-3 text-red-300">
					{actionState.error}
				</div>
			)}
			{actionState.success !== undefined && (
				<div className="rounded border border-green-700 bg-green-900/20 p-3 text-green-300">
					{actionState.success}
				</div>
			)}

			<section className="rounded-lg border border-gray-700 bg-gray-800 p-6 space-y-4">
				<h2 className="text-xl font-semibold">Active Playback</h2>
				<p className="text-sm text-gray-400">Selections save automatically.</p>

				<div className="grid grid-cols-1 gap-4">
					<PlaylistSearchInput
						activePlaylistId={activePlaylistIdForSelector}
						onSelect={(playlistId) => {
							if (playlistId !== (activePlaylistIdForSelector ?? "")) {
								updateActivePlaylist(playlistId);
							}
						}}
						label="Active Playlist"
						placeholder="Search playlists..."
					/>

					<ActiveSongSelectionSection
						activePlaylistId={activePlaylistIdForSelector}
						activeSongId={activeSongIdForSelector}
						activeSlidePosition={activeSlidePositionForSelector}
						onSelectActiveSong={(songId) => {
							if (songId !== (activeSongIdForSelector ?? "")) {
								updateActiveSong(songId);
							}
						}}
						onSelectActiveSlidePosition={(slidePosition) => {
							if (slidePosition !== activeSlidePositionForSelector) {
								updateActiveSlidePosition(slidePosition);
							}
						}}
					/>
				</div>
			</section>

			<section className="rounded-lg border border-gray-700 bg-gray-800 p-6 space-y-4">
				<h2 className="text-xl font-semibold">Participants</h2>
				<div className="flex gap-2">
					<UserSearchInput
						activeUserId={inviteUserIdInput}
						onSelect={setInviteUserIdInput}
						disabled={actionState.loadingKey === "invite"}
					/>
					<Button
						variant="secondary"
						disabled={
							actionState.loadingKey === "invite" ||
							inviteUserIdInput === undefined ||
							inviteUserIdInput.trim() === ""
						}
						onClick={() => {
							const userId = inviteUserIdInput?.trim() ?? "";
							if (userId === "") {
								return;
							}
							inviteParticipant(userId);
						}}
					>
						{actionState.loadingKey === "invite" ? "Inviting..." : "Invite Participant"}
					</Button>
				</div>
				<div className="space-y-2">
					{participants.map((participant) => {
						const isTargetOwner = participant.role === "owner";
						const canKickParticipant = !isTargetOwner;
						const rowLabel =
							participant.username ??
							(participant.user_id === ownerId ? ownerUsername : undefined) ??
							participant.user_id;

						return (
							<div
								key={participant.user_id}
								className="flex items-center justify-between rounded border border-gray-700 bg-gray-900 px-4 py-3"
							>
								<div>
									<p className="text-white">{rowLabel}</p>
									<p className="text-xs text-gray-400">
										role: {participant.role} · status: {participant.status}
									</p>
								</div>
								<Button
									variant="outlineDanger"
									disabled={
										!canKickParticipant || actionState.loadingKey === `kick:${participant.user_id}`
									}
									onClick={() => {
										if (!canKickParticipant) {
											return;
										}
										kickParticipant(participant.user_id);
									}}
								>
									{actionState.loadingKey === `kick:${participant.user_id}` ? "Kicking..." : "Kick"}
								</Button>
							</div>
						);
					})}
				</div>
			</section>

			<div>
				<Button variant="outlineSecondary" onClick={goBackToEvent}>
					Back to Event
				</Button>
			</div>
		</div>
	);
}
