import type { EventEntry } from "@/react/event/event-types";

type UseEventPermissionsProps = {
	readonly currentUserId: string | undefined;
	readonly ownerId: string | undefined;
	readonly participants: EventEntry["participants"];
};

type UseEventPermissionsReturn = {
	readonly isOwner: boolean;
	readonly isEventAdmin: boolean;
	readonly canManageEvent: boolean;
};

/**
 * Hook to calculate permissions for the current user in the context of an event.
 */
export default function useEventPermissions({
	currentUserId,
	ownerId,
	participants,
}: UseEventPermissionsProps): UseEventPermissionsReturn {
	const isOwner = currentUserId !== undefined && ownerId !== undefined && currentUserId === ownerId;

	const currentParticipant =
		currentUserId === undefined || participants === undefined
			? undefined
			: participants.find((participant) => participant.user_id === currentUserId);

	const isEventAdmin = currentParticipant?.role === "event_admin";
	const canManageEvent = isOwner || isEventAdmin;

	return {
		isOwner,
		isEventAdmin,
		canManageEvent,
	};
}
