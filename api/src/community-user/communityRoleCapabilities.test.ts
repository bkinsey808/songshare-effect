import { describe, expect, it } from "vitest";

import makeNull from "@/shared/test-utils/makeNull.test-util";

import getCommunityRoleCapabilities from "./communityRoleCapabilities";

describe("getCommunityRoleCapabilities", () => {
	it("returns all capabilities true for owner", () => {
		const caps = getCommunityRoleCapabilities("owner");
		expect(caps).toStrictEqual({
			canManageMembers: true,
			canManageRoles: true,
			canUpdateCommunityAllFields: true,
			canManageEvents: true,
		});
	});

	it("returns all capabilities true for community_admin", () => {
		const caps = getCommunityRoleCapabilities("community_admin");
		expect(caps).toStrictEqual({
			canManageMembers: true,
			canManageRoles: true,
			canUpdateCommunityAllFields: true,
			canManageEvents: true,
		});
	});

	it("returns all capabilities false for member", () => {
		const caps = getCommunityRoleCapabilities("member");
		expect(caps).toStrictEqual({
			canManageMembers: false,
			canManageRoles: false,
			canUpdateCommunityAllFields: false,
			canManageEvents: false,
		});
	});

	it("returns all capabilities false for unknown role", () => {
		const caps = getCommunityRoleCapabilities("unknown");
		expect(caps).toStrictEqual({
			canManageMembers: false,
			canManageRoles: false,
			canUpdateCommunityAllFields: false,
			canManageEvents: false,
		});
	});

	it("returns all capabilities false for null", () => {
		const caps = getCommunityRoleCapabilities(makeNull());
		expect(caps).toStrictEqual({
			canManageMembers: false,
			canManageRoles: false,
			canUpdateCommunityAllFields: false,
			canManageEvents: false,
		});
	});

	it("returns all capabilities false for undefined", () => {
		const caps = getCommunityRoleCapabilities(undefined);
		expect(caps).toStrictEqual({
			canManageMembers: false,
			canManageRoles: false,
			canUpdateCommunityAllFields: false,
			canManageEvents: false,
		});
	});
});
