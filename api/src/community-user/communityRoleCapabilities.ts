const communityAssignableRoles = ["member", "community_admin"] as const;

type CommunityAssignableRole = (typeof communityAssignableRoles)[number];

type CommunityRole = CommunityAssignableRole | "owner";

type CanonicalCommunityRole = "owner" | "community_admin" | "member";

type CommunityRoleCapabilities = {
	canManageMembers: boolean;
	canManageRoles: boolean;
	canUpdateCommunityAllFields: boolean;
	canManageEvents: boolean;
};

/**
 * Normalizes community role values into canonical roles.
 *
 * @param role - Raw role value from persistence
 * @returns Canonical role when recognized
 */
function normalizeCommunityRole(role: unknown): CanonicalCommunityRole | undefined {
	if (role === "owner") {
		return "owner";
	}
	if (role === "community_admin") {
		return "community_admin";
	}
	if (role === "member") {
		return "member";
	}
	return undefined;
}

/**
 * Returns permissions for the provided community role.
 *
 * @param role - Raw role value from the community membership row
 * @returns Capability flags used by API authorization checks
 */
function getCommunityRoleCapabilities(role: unknown): CommunityRoleCapabilities {
	const canonicalRole = normalizeCommunityRole(role);
	if (canonicalRole === "owner") {
		return {
			canManageMembers: true,
			canManageRoles: true,
			canUpdateCommunityAllFields: true,
			canManageEvents: true,
		};
	}
	if (canonicalRole === "community_admin") {
		return {
			canManageMembers: true,
			canManageRoles: true,
			canUpdateCommunityAllFields: true,
			canManageEvents: true,
		};
	}
	return {
		canManageMembers: false,
		canManageRoles: false,
		canUpdateCommunityAllFields: false,
		canManageEvents: false,
	};
}

export { communityAssignableRoles, getCommunityRoleCapabilities, normalizeCommunityRole };
export type {
	CanonicalCommunityRole,
	CommunityAssignableRole,
	CommunityRole,
	CommunityRoleCapabilities,
};
