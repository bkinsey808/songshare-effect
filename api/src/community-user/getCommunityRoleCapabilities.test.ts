import { describe, expect, it } from "vitest";

import getCommunityRoleCapabilities from "./getCommunityRoleCapabilities";

// This test suite simply exercises the small utility that maps a raw community
// role value to a set of capabilities.  The logic is intentionally trivial, but
// having a dedicated spec guards against regressions and clarifies the expected
// permission set for each recognized role.

describe("getCommunityRoleCapabilities", () => {
	it("grants all permissions to owner", () => {
		const caps = getCommunityRoleCapabilities("owner");
		expect(caps).toStrictEqual({
			canManageMembers: true,
			canManageRoles: true,
			canUpdateCommunityAllFields: true,
			canManageEvents: true,
		});
	});

	it("grants all permissions to community_admin", () => {
		const caps = getCommunityRoleCapabilities("community_admin");
		expect(caps).toStrictEqual({
			canManageMembers: true,
			canManageRoles: true,
			canUpdateCommunityAllFields: true,
			canManageEvents: true,
		});
	});

	it("returns no permissions for member", () => {
		const caps = getCommunityRoleCapabilities("member");
		expect(caps).toStrictEqual({
			canManageMembers: false,
			canManageRoles: false,
			canUpdateCommunityAllFields: false,
			canManageEvents: false,
		});
	});

	it("returns no permissions for unrecognized values", () => {
		expect(getCommunityRoleCapabilities(undefined)).toStrictEqual({
			canManageMembers: false,
			canManageRoles: false,
			canUpdateCommunityAllFields: false,
			canManageEvents: false,
		});
		expect(getCommunityRoleCapabilities("foo")).toStrictEqual({
			canManageMembers: false,
			canManageRoles: false,
			canUpdateCommunityAllFields: false,
			canManageEvents: false,
		});
	});
});
