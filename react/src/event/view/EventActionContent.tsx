import Button from "@/react/lib/design-system/Button";

type EventActionContentProps = {
	canJoin: boolean;
	canLeave: boolean;
	isParticipant: boolean;
	isOwner: boolean;
	actionLoading: boolean;
	participantStatus: string | undefined;
	handleJoinEvent: () => void;
	handleLeaveEvent: () => void;
};

/**
 * Renders the primary join/leave action area for the event view.
 *
 * @returns Action UI for the current viewer's event participation state
 */
export default function EventActionContent({
	canJoin,
	canLeave,
	isParticipant,
	isOwner,
	actionLoading,
	participantStatus,
	handleJoinEvent,
	handleLeaveEvent,
}: EventActionContentProps): React.ReactNode {
	if (canLeave && isParticipant && !isOwner) {
		return (
			<Button variant="danger" onClick={handleLeaveEvent} disabled={actionLoading}>
				{actionLoading ? "Leaving..." : "Leave Event"}
			</Button>
		);
	}

	if (canJoin) {
		return (
			<Button variant="primary" onClick={handleJoinEvent} disabled={actionLoading}>
				{actionLoading ? "Joining..." : "Join Event"}
			</Button>
		);
	}

	return (
		<p className="text-sm text-gray-400">
			{participantStatus === "kicked"
				? "You have been removed from this event and cannot rejoin."
				: "You cannot join this event."}
		</p>
	);
}
