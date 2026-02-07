import { Effect } from "effect";
import { useEffect } from "react";

import useAppStore from "@/react/app-store/useAppStore";
import Button from "@/react/design-system/Button";
import DismissibleAlert from "@/react/design-system/dismissible-alert/DismissibleAlert";
import EventPlaylistAccordion from "@/react/event/view/EventPlaylistAccordion";
import useEventView from "@/react/event/view/useEventView";
import { utcTimestampToClientLocalDate } from "@/shared/utils/formatEventDate";

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
function EventView(): React.ReactNode {
	const {
		currentEvent,
		isEventLoading,
		eventError,
		isParticipant,
		currentUserId,
		actionLoading,
		actionError,
		actionSuccess,
		handleJoinEvent,
		handleLeaveEvent,
		clearActionError,
		clearActionSuccess,
	} = useEventView();

	// Fetch playlist if there's an active one
	const fetchPlaylistById = useAppStore((state) => state.fetchPlaylistById);

	useEffect(() => {
		if (
			currentEvent?.public?.active_playlist_id !== null &&
			currentEvent?.public?.active_playlist_id !== undefined
		) {
			void Effect.runPromise(fetchPlaylistById(currentEvent.public.active_playlist_id));
		}
	}, [currentEvent?.public?.active_playlist_id, fetchPlaylistById]);

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

	if (currentEvent === undefined || currentEvent.public === undefined) {
		return (
			<div className="flex items-center justify-center min-h-screen">
				<div className="text-center">
					<p className="text-gray-600">Event not found</p>
				</div>
			</div>
		);
	}

	const { public: eventPublic, owner_username, participants = [] } = currentEvent;
	const displayDate =
		eventPublic.event_date !== undefined && eventPublic.event_date !== ""
			? utcTimestampToClientLocalDate(eventPublic.event_date)
			: undefined;

	return (
		<div className="max-w-4xl mx-auto px-6 py-8">
			{/* Header */}
			<div className="mb-8">
				<h1 className="text-4xl font-bold mb-2">{eventPublic.event_name}</h1>
				{owner_username !== undefined && owner_username !== "" && (
					<p className="text-gray-600">Hosted by {owner_username}</p>
				)}
			</div>

			{/* Event Details */}
			<div className="bg-gray-50 rounded-lg p-6 mb-8">
				{eventPublic.event_description !== undefined && eventPublic.event_description !== "" && (
					<div className="mb-4">
						<h2 className="text-lg font-semibold mb-2">Description</h2>
						<p className="text-gray-700">{eventPublic.event_description}</p>
					</div>
				)}

				{displayDate !== undefined && (
					<div className="mb-4">
						<h2 className="text-lg font-semibold mb-2">Date</h2>
						<p className="text-gray-700">{displayDate}</p>
					</div>
				)}

				{eventPublic.public_notes !== undefined && eventPublic.public_notes !== "" && (
					<div className="mb-4">
						<h2 className="text-lg font-semibold mb-2">Notes</h2>
						<p className="text-gray-700">{eventPublic.public_notes}</p>
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
			{currentUserId !== undefined && (
				<div className="mb-8 flex gap-4">
					{isParticipant ? (
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

			{/* Active Media */}
			{(eventPublic.active_playlist_id !== null || eventPublic.active_song_id !== null) && (
				<div className="mb-8">
					{eventPublic.active_playlist_id !== null &&
						eventPublic.active_playlist_id !== undefined && (
							<EventPlaylistAccordion playlistId={eventPublic.active_playlist_id} />
						)}
					{eventPublic.active_song_id !== null && (
						<div className="mb-6 rounded-lg border border-gray-600 bg-blue-50 p-6">
							<h2 className="mb-2 text-lg font-semibold text-gray-700">Currently Playing Song</h2>
							<p className="text-gray-700">
								Song: <span className="font-medium">{eventPublic.active_song_id}</span>
							</p>
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
								className="flex items-center justify-between bg-gray-100 rounded px-4 py-3"
							>
								<span>{participant.user_id}</span>
								<span className="text-sm bg-gray-200 rounded px-3 py-1">{participant.role}</span>
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

export default EventView;
