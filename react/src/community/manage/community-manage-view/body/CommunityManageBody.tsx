import type { CommunityEntry } from "@/react/community/community-types";
import Button from "@/react/lib/design-system/Button";
import UserSearchInput from "@/react/user-search-input/UserSearchInput";
import { ZERO } from "@/shared/constants/shared-constants";

import EventSearchInput from "./event-search-input/EventSearchInput";
import EventRow from "./EventRow";
import MemberRow from "./MemberRow";
import useCommunityManageBody from "./useCommunityManageBody";

type CommunityManageBodyProps = Readonly<{
	currentCommunity: CommunityEntry;
}>;

/**
 * Main content sections for community manager (members, events, songs, playlists, share requests).
 */
export default function CommunityManageBody({
	currentCommunity,
}: CommunityManageBodyProps): ReactElement {
	const {
		members,
		communityEvents,
		communitySongs = [],
		communityPlaylists = [],
		communityShareRequests = [],
		availableSongOptions = [],
		availablePlaylistOptions = [],
		actionState,
		inviteUserIdInput,
		setInviteUserIdInput,
		onInviteClick,
		addEventIdInput,
		setAddEventIdInput,
		onAddEventClick,
		addSongIdInput,
		setAddSongIdInput,
		onAddSongClick,
		onRemoveSongClick,
		addPlaylistIdInput,
		setAddPlaylistIdInput,
		onAddPlaylistClick,
		onRemovePlaylistClick,
		onReviewShareRequestClick,
		onRemoveEventClick,
		onSetActiveEventClick,
		activeEventId,
		onKickClick,
		onBackClick,
		onDismissInviteAlert,
	} = useCommunityManageBody(currentCommunity);

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
							excludeUserIds={members
								.filter((member) => member.status === "joined" || member.status === "invited")
								.map((member) => member.user_id)}
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
						className={`px-4 py-2 rounded border text-sm flex items-center justify-between gap-2 ${
							actionState.error === undefined
								? "bg-green-900/20 text-green-400 border-green-700"
								: "bg-red-900/20 text-red-400 border-red-700"
						}`}
					>
						<span>
							{actionState.error === undefined || actionState.error === ""
								? actionState.success
								: actionState.error}
						</span>
						<button
							type="button"
							onClick={onDismissInviteAlert}
							aria-label="Close"
							className="shrink-0 text-current opacity-70 hover:opacity-100 transition-opacity"
						>
							×
						</button>
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
						<label
							htmlFor="community-manage-add-event-input"
							className="text-sm font-medium text-white mb-2 block"
						>
							Add Event from Library
						</label>
						<EventSearchInput
							id="community-manage-add-event-input"
							activeEventId={addEventIdInput}
							onSelect={setAddEventIdInput}
							disabled={actionState.loadingKey === "add-event"}
							excludeEventIds={communityEvents.map((ev) => ev.event_id)}
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
					{communityEvents
						.toSorted((evA, evB) => (evB.created_at ?? "").localeCompare(evA.created_at ?? ""))
						.map((event) => (
							<EventRow
								key={event.event_id}
								event={event}
								onRemove={onRemoveEventClick}
								activeEventId={activeEventId}
								onSetActive={onSetActiveEventClick}
							/>
						))}
					{communityEvents.length === ZERO && (
						<div className="text-gray-400">
							<p>Events associated with this community will appear here.</p>
						</div>
					)}
				</div>
			</section>

			<section className="grid grid-cols-1 gap-8 md:grid-cols-2">
				<div className="bg-gray-800 rounded-lg border border-gray-700 p-6 space-y-4">
					<h2 className="text-2xl font-semibold text-white">Manage Songs</h2>
					<div className="flex gap-2">
						<select
							className="flex-1 rounded border border-gray-600 bg-gray-900 px-3 py-2 text-sm text-white"
							value={addSongIdInput ?? ""}
							onChange={(event) => {
								setAddSongIdInput(event.target.value);
							}}
						>
							<option value="">Add Song from Library</option>
							{availableSongOptions
								.filter((song) => !communitySongs.some((entry) => entry.song_id === song.song_id))
								.map((song) => (
									<option key={song.song_id} value={song.song_id}>
										{song.song_name ?? song.song_id}
									</option>
								))}
						</select>
						<Button
							variant="secondary"
							disabled={addSongIdInput === undefined || addSongIdInput === ""}
							onClick={onAddSongClick}
						>
							Add Song
						</Button>
					</div>
					<div className="space-y-2">
						{communitySongs.length === ZERO && (
							<p className="text-sm text-gray-400">No community songs yet.</p>
						)}
						{communitySongs.map((song) => (
							<div
								key={song.song_id}
								className="flex items-center justify-between rounded border border-gray-700 bg-gray-900 px-4 py-3"
							>
								<div>
									<p className="text-white">{song.song_name ?? song.song_id}</p>
									{song.song_slug !== undefined && song.song_slug !== "" && (
										<p className="text-xs text-gray-400">slug: {song.song_slug}</p>
									)}
								</div>
								<Button
									variant="outlineDanger"
									size="compact"
									onClick={() => {
										onRemoveSongClick(song.song_id);
									}}
								>
									Remove
								</Button>
							</div>
						))}
					</div>
				</div>
				<div className="bg-gray-800 rounded-lg border border-gray-700 p-6 space-y-4">
					<h2 className="text-2xl font-semibold text-white">Manage Playlists</h2>
					<div className="flex gap-2">
						<select
							className="flex-1 rounded border border-gray-600 bg-gray-900 px-3 py-2 text-sm text-white"
							value={addPlaylistIdInput ?? ""}
							onChange={(event) => {
								setAddPlaylistIdInput(event.target.value);
							}}
						>
							<option value="">Add Playlist from Library</option>
							{availablePlaylistOptions
								.filter(
									(playlist) =>
										!communityPlaylists.some((entry) => entry.playlist_id === playlist.playlist_id),
								)
								.map((playlist) => (
									<option key={playlist.playlist_id} value={playlist.playlist_id}>
										{playlist.playlist_name ?? playlist.playlist_id}
									</option>
								))}
						</select>
						<Button
							variant="secondary"
							disabled={addPlaylistIdInput === undefined || addPlaylistIdInput === ""}
							onClick={onAddPlaylistClick}
						>
							Add Playlist
						</Button>
					</div>
					<div className="space-y-2">
						{communityPlaylists.length === ZERO && (
							<p className="text-sm text-gray-400">No community playlists yet.</p>
						)}
						{communityPlaylists.map((playlist) => (
							<div
								key={playlist.playlist_id}
								className="flex items-center justify-between rounded border border-gray-700 bg-gray-900 px-4 py-3"
							>
								<div>
									<p className="text-white">{playlist.playlist_name ?? playlist.playlist_id}</p>
									{playlist.playlist_slug !== undefined && playlist.playlist_slug !== "" && (
										<p className="text-xs text-gray-400">slug: {playlist.playlist_slug}</p>
									)}
								</div>
								<Button
									variant="outlineDanger"
									size="compact"
									onClick={() => {
										onRemovePlaylistClick(playlist.playlist_id);
									}}
								>
									Remove
								</Button>
							</div>
						))}
					</div>
				</div>
			</section>

			<section className="bg-gray-800 rounded-lg border border-gray-700 p-6 space-y-4">
				<h2 className="text-2xl font-semibold text-white">Share Requests</h2>
				<div className="space-y-3">
					{communityShareRequests.filter((request) => request.status === "pending").length ===
						ZERO && <p className="text-sm text-gray-400">No pending share requests.</p>}
					{communityShareRequests
						.filter((request) => request.status === "pending")
						.map((request) => (
							<div
								key={request.request_id}
								className="rounded border border-gray-700 bg-gray-900 px-4 py-3"
							>
								<div className="flex items-start justify-between gap-3">
									<div>
										<p className="text-white">
											{request.sender_username ?? request.sender_user_id} shared a{" "}
											{request.shared_item_type}
										</p>
										<p className="text-xs text-gray-400">
											{request.shared_item_name ?? request.shared_item_id}
										</p>
										{request.message !== undefined &&
											request.message !== null &&
											request.message !== "" && (
												<p className="mt-2 text-sm text-gray-300">{request.message}</p>
											)}
									</div>
									<div className="flex gap-2">
										<Button
											variant="secondary"
											size="compact"
											onClick={() => {
												onReviewShareRequestClick(request.request_id, "accepted");
											}}
										>
											Accept
										</Button>
										<Button
											variant="outlineDanger"
											size="compact"
											onClick={() => {
												onReviewShareRequestClick(request.request_id, "rejected");
											}}
										>
											Reject
										</Button>
									</div>
								</div>
							</div>
						))}
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
