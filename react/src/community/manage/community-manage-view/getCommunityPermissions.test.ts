import { describe, expect, it } from "vitest";

import type { CommunityEntry, CommunityUser } from "@/react/community/community-types";
import type { UserSessionData } from "@/shared/userSessionData";

import forceCast from "@/react/lib/test-utils/forceCast";

import getCommunityPermissions from "./getCommunityPermissions";

/* ── Named constants ─────────────────────────────────────────────── */

const COMMUNITY_ID = "c1";
const OWNER_ID = "owner1";
const USER_ID = "u1";
const JOINED_AT = "2024-01-01T00:00:00.000Z";

/* ── Module-level fixture data (real domain types) ───────────────── */

/** Session for the community owner. */
const ownerSession: UserSessionData = forceCast<UserSessionData>({
	user: { user_id: OWNER_ID, email: "owner@example.com" },
});

/** Session for a regular (non-owner) user. */
const regularSession: UserSessionData = forceCast<UserSessionData>({
	user: { user_id: USER_ID, email: "u1@example.com" },
});

/** Community owned by OWNER_ID. */
const ownedCommunity: CommunityEntry = {
	community_id: COMMUNITY_ID,
	owner_id: OWNER_ID,
	name: "Test Community",
	slug: "test-community",
	description: forceCast<string | null>(undefined),
	is_public: true,
	public_notes: forceCast<string | null>(undefined),
	created_at: JOINED_AT,
	updated_at: JOINED_AT,
};

/** Community owned by USER_ID (used when user is both owner and admin). */
const userOwnedCommunity: CommunityEntry = {
	...ownedCommunity,
	owner_id: USER_ID,
};

/** A regular member (no admin role). */
const regularMember: CommunityUser = {
	community_id: COMMUNITY_ID,
	user_id: USER_ID,
	role: "member",
	status: "joined",
	joined_at: JOINED_AT,
};

/** A community admin. */
const adminMember: CommunityUser = {
	...regularMember,
	role: "community_admin",
};

/* ── Tests ───────────────────────────────────────────────────────── */

describe("getCommunityPermissions", () => {
	it("should return false for both flags when there is no user session", () => {
		const result = getCommunityPermissions({
			currentCommunity: ownedCommunity,
			members: [],
			userSessionData: undefined,
		});

		expect(result.isOwner).toBe(false);
		expect(result.canManage).toBe(false);
	});

	it("should return false for both flags when user is neither owner nor admin", () => {
		const result = getCommunityPermissions({
			currentCommunity: ownedCommunity,
			members: [regularMember],
			userSessionData: regularSession,
		});

		expect(result.isOwner).toBe(false);
		expect(result.canManage).toBe(false);
	});

	it("should set isOwner and canManage to true when user is the community owner", () => {
		const result = getCommunityPermissions({
			currentCommunity: ownedCommunity,
			members: [],
			userSessionData: ownerSession,
		});

		expect(result.isOwner).toBe(true);
		expect(result.canManage).toBe(true);
	});

	it("should set canManage to true when user has community_admin role", () => {
		const result = getCommunityPermissions({
			currentCommunity: ownedCommunity,
			members: [adminMember],
			userSessionData: regularSession,
		});

		expect(result.isOwner).toBe(false);
		expect(result.canManage).toBe(true);
	});

	it("should set both flags to true when user is owner and also an admin member", () => {
		const result = getCommunityPermissions({
			currentCommunity: userOwnedCommunity,
			members: [adminMember],
			userSessionData: regularSession,
		});

		expect(result.isOwner).toBe(true);
		expect(result.canManage).toBe(true);
	});

	it("should set canManage to true when currentCommunity is undefined but user is admin", () => {
		const result = getCommunityPermissions({
			currentCommunity: undefined,
			members: [adminMember],
			userSessionData: regularSession,
		});

		expect(result.isOwner).toBe(false);
		expect(result.canManage).toBe(true);
	});
});
