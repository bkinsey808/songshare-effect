import { describe, expect, it } from "vitest";

import decodeUnknownSyncOrThrow from "@/shared/validation/decodeUnknownSyncOrThrow";

import { communityFormSchema, communityUserAddSchema } from "./communitySchemas";

describe("communitySchemas", () => {
	describe("communityFormSchema", () => {
		it("decodes valid form data", () => {
			// Arrange
			const input = { name: "Test Community", slug: "test-community" } as unknown;

			// Act
			const result = decodeUnknownSyncOrThrow(communityFormSchema, input);

			// Assert
			expect(result.name).toBe("Test Community");
			expect(result.slug).toBe("test-community");
		});

		it("accepts optional fields", () => {
			// Arrange
			const input = {
				name: "My Community",
				slug: "my-community",
				description: "A test",
				is_public: true,
			} as unknown;

			// Act
			const result = decodeUnknownSyncOrThrow(communityFormSchema, input);

			// Assert
			expect(result.description).toBe("A test");
			expect(result.is_public).toBe(true);
		});

		it("throws when name is too short", () => {
			// Arrange
			const input = { name: "x", slug: "valid-slug" } as unknown;

			// Assert (action is inside the assertion)
			expect(() => decodeUnknownSyncOrThrow(communityFormSchema, input)).toThrow(/length|min/i);
		});

		it("throws when slug has invalid characters", () => {
			// Arrange
			const input = { name: "Valid Name", slug: "invalid_slug" } as unknown;

			// Assert (action is inside the assertion)
			expect(() => decodeUnknownSyncOrThrow(communityFormSchema, input)).toThrow(
				/lowercase|slug|pattern/i,
			);
		});
	});

	describe("communityUserAddSchema", () => {
		it("decodes valid add-user data", () => {
			// Arrange
			const communityId = "11111111-1111-1111-1111-111111111111";
			const userId = "22222222-2222-2222-2222-222222222222";
			const input = { community_id: communityId, user_id: userId, role: "member" } as unknown;

			// Act
			const result = decodeUnknownSyncOrThrow(communityUserAddSchema, input);

			// Assert
			expect(result.community_id).toBe(communityId);
			expect(result.user_id).toBe(userId);
			expect(result.role).toBe("member");
		});

		// Shared Arrange: common IDs used by the row cases
		const COMMUNITY_ID = "11111111-1111-1111-1111-111111111111";
		const USER_ID = "22222222-2222-2222-2222-222222222222";

		it.each([{ role: "owner" }, { role: "community_admin" }, { role: "member" }])(
			"decodes input and preserves role $role as a valid community role in the decoded output",
			({ role }) => {
				// Act
				const input = {
					community_id: COMMUNITY_ID,
					user_id: USER_ID,
					role,
				} as unknown;

				const result = decodeUnknownSyncOrThrow(communityUserAddSchema, input);

				// Assert
				expect(result.role).toBe(role);
			},
		);

		it("throws when role is invalid", () => {
			// Arrange
			const input = {
				community_id: COMMUNITY_ID,
				user_id: USER_ID,
				role: "invalid_role",
			} as unknown;

			// Assert (action is inside the assertion)
			expect(() => decodeUnknownSyncOrThrow(communityUserAddSchema, input)).toThrow(
				/role|literal/i,
			);
		});
	});
});
