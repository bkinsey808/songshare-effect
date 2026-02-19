import { useNavigate } from "react-router-dom";

import EventPlaylistAccordion from "@/react/event/view/playlist-accordion/EventPlaylistAccordion";
import useEventView from "@/react/event/view/useEventView";
import Button from "@/react/lib/design-system/Button";
import DismissibleAlert from "@/react/lib/design-system/dismissible-alert/DismissibleAlert";
import useCurrentLang from "@/react/lib/language/useCurrentLang";
import buildPathWithLang from "@/shared/language/buildPathWithLang";
import { eventSlideShowPath, eventViewPath } from "@/shared/paths";

const MIN_PARTICIPANTS = 0;

/**
 * Displays event details including participants, active playlist, and event metadata.
 *
 * Fetches the event by slug from URL params using the app store and displays:
 * - Event name, description, and date
 * - List of participants with their roles
 * - Currently active playlist/song if any
 * - Owner information
 *
 * @returns Event view component or loading/error state
 */
export default function EventView(): React.ReactNode {
	const navigate = useNavigate();
	const lang = useCurrentLang();
	const {
		currentEvent,
		eventPublic,
		ownerUsername,
		participants = [],
		isEventLoading,
		eventError,
		isParticipant,
		isOwner,
		shouldShowActions,
		activeSongName,
		activeSlidePosition,
		activeSlideName,
		displayDate,
		actionLoading,
		actionError,
		actionSuccess,
		handleJoinEvent,
		handleLeaveEvent,
		clearActionError,
		clearActionSuccess,
	} = useEventView();

	if (isEventLoading) {
		return (
			<div className="flex items-center justify-center min-h-screen">
				<div className="text-center">
					<p className="text-gray-600">Loading event...</p>
				</div>
			</div>
		);
	}

	if (eventError !== undefined && eventError !== "") {
		return (
			<div className="flex items-center justify-center min-h-screen">
				<div className="text-center">
					<p className="text-red-600">{eventError}</p>
				</div>
			</div>
		);
	}

	if (currentEvent === undefined || eventPublic === undefined) {
		return (
			<div className="flex items-center justify-center min-h-screen">
				<div className="text-center">
					<p className="text-gray-600">Event not found</p>
				</div>
			</div>
		);
	}

	return (
		<div className="max-w-4xl mx-auto px-6 py-8">
			{/* Header */}
			<div className="mb-8">
				<h1 className="text-4xl font-bold mb-2">{eventPublic.event_name}</h1>
				{ownerUsername !== undefined && ownerUsername !== "" && (
					<p className="text-gray-600">Hosted by {ownerUsername}</p>
				)}
			</div>

			{/* Event Details */}
			<div className="mb-8 rounded-lg border border-gray-700 bg-gray-800 p-6">
				{eventPublic.event_description !== undefined && eventPublic.event_description !== "" && (
					<div className="mb-4">
						<h2 className="text-lg font-semibold mb-2">Description</h2>
						<p className="text-gray-300">{eventPublic.event_description}</p>
					</div>
				)}

				{displayDate !== undefined && (
					<div className="mb-4">
						<h2 className="text-lg font-semibold mb-2">Date</h2>
						<p className="text-gray-300">{displayDate}</p>
					</div>
				)}

				{eventPublic.public_notes !== undefined && eventPublic.public_notes !== "" && (
					<div className="mb-4">
						<h2 className="text-lg font-semibold mb-2">Notes</h2>
						<p className="text-gray-300">{eventPublic.public_notes}</p>
					</div>
				)}
			</div>

			{/* Alerts */}
			{actionError !== undefined && (
				<DismissibleAlert
					visible={actionError !== undefined}
					onDismiss={clearActionError}
					title="Error"
					variant="error"
				>
					{actionError}
				</DismissibleAlert>
			)}

			{actionSuccess !== undefined && (
				<DismissibleAlert
					visible={actionSuccess !== undefined}
					onDismiss={clearActionSuccess}
					title="Success"
					variant="success"
				>
					{actionSuccess}
				</DismissibleAlert>
			)}

			{/* Actions */}
			{shouldShowActions && (
				<div className="mb-8 flex gap-4">
					{isParticipant && !isOwner ? (
						<Button variant="danger" onClick={handleLeaveEvent} disabled={actionLoading}>
							{actionLoading ? "Leaving..." : "Leave Event"}
						</Button>
					) : (
						<Button variant="primary" onClick={handleJoinEvent} disabled={actionLoading}>
							{actionLoading ? "Joining..." : "Join Event"}
						</Button>
					)}
				</div>
			)}

			<div className="mb-8 flex">
				<Button
					variant="outlinePrimary"
					onClick={() => {
						void navigate(
							buildPathWithLang(
								`/${eventViewPath}/${eventPublic.event_slug}/${eventSlideShowPath}`,
								lang,
							),
						);
					}}
				>
					View Slide Show
				</Button>
			</div>

			{/* Active Media */}
			{((eventPublic.active_playlist_id !== null && eventPublic.active_playlist_id !== undefined) ||
				eventPublic.active_song_id !== null) && (
				<div className="mb-8">
					{eventPublic.active_playlist_id !== null &&
						eventPublic.active_playlist_id !== undefined && (
							<EventPlaylistAccordion playlistId={eventPublic.active_playlist_id} />
						)}
					{eventPublic.active_song_id !== null && eventPublic.active_song_id !== undefined && (
						<div className="mb-6 rounded-lg border border-blue-600 bg-blue-900/20 p-6">
							<h2 className="mb-2 text-lg font-semibold text-blue-200">Currently Playing Song</h2>
							<p className="text-blue-200">
								Song: <span className="font-medium">{activeSongName}</span>
							</p>
							{activeSlidePosition !== undefined && (
								<p className="text-blue-200">
									Current Slide Position: <span className="font-medium">{activeSlidePosition}</span>
								</p>
							)}
							{activeSlideName !== undefined && activeSlideName !== "" && (
								<p className="text-blue-200">
									Current Slide Name: <span className="font-medium">{activeSlideName}</span>
								</p>
							)}
						</div>
					)}
				</div>
			)}

			{/* Participants */}
			<div className="mb-8">
				<h2 className="text-lg font-semibold mb-4">Participants ({participants.length})</h2>
				{participants.length > MIN_PARTICIPANTS ? (
					<div className="space-y-2">
						{participants.map((participant) => (
							<div
								key={participant.user_id}
								className="flex items-center justify-between rounded border border-gray-700 bg-gray-800 px-4 py-3"
							>
								<span>
									{participant.username ??
										(participant.user_id === currentEvent.owner_id ? ownerUsername : undefined) ??
										"Unknown user"}
								</span>
								<span className="rounded bg-gray-700 px-3 py-1 text-sm text-gray-200">
									{participant.role}
								</span>
							</div>
						))}
					</div>
				) : (
					<p className="text-gray-600">No participants yet</p>
				)}
			</div>
		</div>
	);
}
