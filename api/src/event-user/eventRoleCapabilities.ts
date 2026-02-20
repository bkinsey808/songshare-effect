const eventAssignableRoles = ["participant", "event_admin", "event_playlist_admin"] as const;

type EventAssignableRole = (typeof eventAssignableRoles)[number];

type EventRole = EventAssignableRole | "owner";

type CanonicalEventRole = "owner" | "event_admin" | "event_playlist_admin" | "participant";

type EventRoleCapabilities = {
	canManageParticipants: boolean;
	canManageRoles: boolean;
	canUpdateEventAllFields: boolean;
	canUpdateEventPlaybackFields: boolean;
};

/**
 * Normalizes legacy and current event role values into canonical roles.
 *
 * @param role - Raw role value from persistence
 * @returns Canonical role when recognized
 */
function normalizeEventRole(role: unknown): CanonicalEventRole | undefined {
	if (role === "owner") {
		return "owner";
	}
	if (role === "event_admin") {
		return "event_admin";
	}
	if (role === "event_playlist_admin") {
		return "event_playlist_admin";
	}
	if (role === "participant") {
		return "participant";
	}
	return undefined;
}

/**
 * Returns permissions for the provided event role.
 *
 * @param role - Raw role value from the event membership row
 * @returns Capability flags used by API authorization checks
 */
function getEventRoleCapabilities(role: unknown): EventRoleCapabilities {
	const canonicalRole = normalizeEventRole(role);
	if (canonicalRole === "owner") {
		return {
			canManageParticipants: true,
			canManageRoles: true,
			canUpdateEventAllFields: true,
			canUpdateEventPlaybackFields: true,
		};
	}
	if (canonicalRole === "event_admin") {
		return {
			canManageParticipants: true,
			canManageRoles: true,
			canUpdateEventAllFields: true,
			canUpdateEventPlaybackFields: true,
		};
	}
	if (canonicalRole === "event_playlist_admin") {
		return {
			canManageParticipants: false,
			canManageRoles: false,
			canUpdateEventAllFields: false,
			canUpdateEventPlaybackFields: true,
		};
	}
	return {
		canManageParticipants: false,
		canManageRoles: false,
		canUpdateEventAllFields: false,
		canUpdateEventPlaybackFields: false,
	};
}

export { eventAssignableRoles, getEventRoleCapabilities, normalizeEventRole };
export type { CanonicalEventRole, EventAssignableRole, EventRole, EventRoleCapabilities };
