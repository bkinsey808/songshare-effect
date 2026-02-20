import type { EventEntry } from "@/react/event/event-entry/EventEntry.type";

const participantStatuses = ["invited", "joined", "left", "kicked"] as const;

type ParticipantStatus = (typeof participantStatuses)[number];

type ParticipantStatusAction = "join" | "leave" | "kick" | "invite";

type ParticipantPermissions = {
	canViewFullEvent: boolean;
	canViewSlides: boolean;
	canJoin: boolean;
	canLeave: boolean;
};

const participantPermissionsByStatus: Record<ParticipantStatus, ParticipantPermissions> = {
	invited: {
		canViewFullEvent: false,
		canViewSlides: false,
		canJoin: true,
		canLeave: false,
	},
	joined: {
		canViewFullEvent: true,
		canViewSlides: true,
		canJoin: false,
		canLeave: true,
	},
	left: {
		canViewFullEvent: false,
		canViewSlides: false,
		canJoin: true,
		canLeave: false,
	},
	kicked: {
		canViewFullEvent: false,
		canViewSlides: false,
		canJoin: false,
		canLeave: false,
	},
};

const transitionTable: Record<
	ParticipantStatus,
	Partial<Record<ParticipantStatusAction, ParticipantStatus>>
> = {
	invited: {
		join: "joined",
		kick: "kicked",
	},
	joined: {
		leave: "left",
		kick: "kicked",
	},
	left: {
		join: "joined",
		kick: "kicked",
	},
	kicked: {},
};

/**
 * Returns UI permissions for a participant status.
 *
 * @param status - Participant status to evaluate
 * @returns Capability flags used for route and component gating
 */
function getParticipantPermissions(status: ParticipantStatus): ParticipantPermissions {
	return participantPermissionsByStatus[status];
}

/**
 * Applies a state transition action to the participant status.
 *
 * @param status - Current participant status
 * @param action - Transition action to apply
 * @returns Next status when allowed, otherwise the original status
 */
function transitionParticipantStatus(
	status: ParticipantStatus,
	action: ParticipantStatusAction,
): ParticipantStatus {
	const nextStatus = transitionTable[status][action];
	return nextStatus ?? status;
}

/**
 * Derives participant status for the current user from the event payload.
 *
 * Owners are always treated as joined for access control.
 *
 * @param currentEvent - Event currently loaded in view state
 * @param currentUserId - Current authenticated user id
 * @returns Participant status used by the view layer
 */
function deriveCurrentParticipantStatus(
	currentEvent: EventEntry | undefined,
	currentUserId: string | undefined,
): ParticipantStatus {
	if (currentEvent === undefined || currentUserId === undefined || currentUserId === "") {
		return "invited";
	}

	if (currentEvent.owner_id === currentUserId) {
		return "joined";
	}

	const participants = currentEvent.participants ?? [];
	const currentParticipant = participants.find(
		(participant) => participant.user_id === currentUserId,
	);

	if (currentParticipant === undefined) {
		return "invited";
	}

	if (currentParticipant.participantStatus !== undefined) {
		return currentParticipant.participantStatus;
	}

	if (currentParticipant.status === "invited" || currentParticipant.status === "joined") {
		return currentParticipant.status;
	}

	if (currentParticipant.status === "left") {
		return "left";
	}

	if (currentParticipant.status === "kicked") {
		return "kicked";
	}

	if (currentParticipant.role === "kicked") {
		return "kicked";
	}

	return "joined";
}

export {
	deriveCurrentParticipantStatus,
	getParticipantPermissions,
	participantStatuses,
	transitionParticipantStatus,
};
export type { ParticipantPermissions, ParticipantStatus, ParticipantStatusAction };
