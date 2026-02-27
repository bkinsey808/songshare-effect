import { normalizeCommunityRole } from "./normalizeCommunityRole";

type CommunityRoleCapabilities = {
	canManageMembers: boolean;
	canManageRoles: boolean;
	canUpdateCommunityAllFields: boolean;
	canManageEvents: boolean;
};

/**
 * Returns permissions for the provided community role.
 *
 * @param role - Raw role value from the community membership row
 * @returns Capability flags used by API authorization checks
 */
export default function getCommunityRoleCapabilities(role: unknown): CommunityRoleCapabilities {
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
