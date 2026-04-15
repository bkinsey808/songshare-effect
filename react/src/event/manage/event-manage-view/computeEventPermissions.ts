import type { EventEntry } from "@/react/event/event-types";

type ComputeEventPermissionsProps = {
	readonly currentUserId: string | undefined;
	readonly ownerId: string | undefined;
	readonly participants: EventEntry["participants"];
};

type ComputeEventPermissionsReturn = {
	readonly isOwner: boolean;
	readonly isEventAdmin: boolean;
	readonly canManageEvent: boolean;
};

/**
 * Compute permissions for the current user in the context of an event.
 *
 * @param currentUserId - The id of the current user (or undefined)
 * @param ownerId - The id of the event owner (or undefined)
 * @param participants - The event participants array
 * @returns Object describing owner/admin/manage permissions
 */
export default function computeEventPermissions({
	currentUserId,
	ownerId,
	participants,
}: ComputeEventPermissionsProps): ComputeEventPermissionsReturn {
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
