import { Schema } from "effect";
import { describe, expect, it } from "vitest";

import {
	normalizeCommunityRole,
	isCommunityRole,
	communityRoleSchema,
} from "./normalizeCommunityRole";

const BOGUS_NUMBER = 999;

describe("community role utilities", () => {
	it("returns same string for known roles", () => {
		expect(normalizeCommunityRole("owner")).toBe("owner");
		expect(normalizeCommunityRole("community_admin")).toBe("community_admin");
		expect(normalizeCommunityRole("member")).toBe("member");
	});

	it("guard matches normalize/decoding", () => {
		const valid: unknown[] = ["owner", "community_admin", "member"];
		for (const value of valid) {
			expect(isCommunityRole(value)).toBe(true);
			// decoding via schema should succeed
			expect(Schema.decodeUnknownEither(communityRoleSchema)(value)._tag).toBe("Right");
		}
	});

	it("returns undefined for unrecognized values", () => {
		const bad: unknown[] = [undefined, BOGUS_NUMBER, "", "random", {}];
		for (const item of bad) {
			expect(normalizeCommunityRole(item)).toBeUndefined();
			expect(isCommunityRole(item)).toBe(false);
		}
	});
});
