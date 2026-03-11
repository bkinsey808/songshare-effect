import { describe, expect, it } from "vitest";

import decodeUnknownSyncOrThrow from "@/shared/validation/decodeUnknownSyncOrThrow";

import { communityFormSchema, communityUserAddSchema } from "./communitySchemas";

describe("communitySchemas", () => {
	describe("communityFormSchema", () => {
		it("decodes valid form data", () => {
			const input = { name: "Test Community", slug: "test-community" } as unknown;

			const result = decodeUnknownSyncOrThrow(communityFormSchema, input);

			expect(result.name).toBe("Test Community");
			expect(result.slug).toBe("test-community");
		});

		it("accepts optional fields", () => {
			const input = {
				name: "My Community",
				slug: "my-community",
				description: "A test",
				is_public: true,
			} as unknown;

			const result = decodeUnknownSyncOrThrow(communityFormSchema, input);

			expect(result.description).toBe("A test");
			expect(result.is_public).toBe(true);
		});

		it("throws when name is too short", () => {
			const input = { name: "x", slug: "valid-slug" } as unknown;

			expect(() => decodeUnknownSyncOrThrow(communityFormSchema, input)).toThrow(/length|min/i);
		});

		it("throws when slug has invalid characters", () => {
			const input = { name: "Valid Name", slug: "invalid_slug" } as unknown;

			expect(() => decodeUnknownSyncOrThrow(communityFormSchema, input)).toThrow(
				/lowercase|slug|pattern/i,
			);
		});
	});

	describe("communityUserAddSchema", () => {
		it("decodes valid add-user data", () => {
			const communityId = "11111111-1111-1111-1111-111111111111";
			const userId = "22222222-2222-2222-2222-222222222222";
			const input = { community_id: communityId, user_id: userId, role: "member" } as unknown;

			const result = decodeUnknownSyncOrThrow(communityUserAddSchema, input);

			expect(result.community_id).toBe(communityId);
			expect(result.user_id).toBe(userId);
			expect(result.role).toBe("member");
		});

		it("accepts valid roles", () => {
			const validRoles = ["owner", "community_admin", "member"] as const;

			for (const role of validRoles) {
				const input = {
					community_id: "11111111-1111-1111-1111-111111111111",
					user_id: "22222222-2222-2222-2222-222222222222",
					role,
				} as unknown;

				const result = decodeUnknownSyncOrThrow(communityUserAddSchema, input);
				expect(result.role).toBe(role);
			}
		});

		it("throws when role is invalid", () => {
			const input = {
				community_id: "11111111-1111-1111-1111-111111111111",
				user_id: "22222222-2222-2222-2222-222222222222",
				role: "invalid_role",
			} as unknown;

			expect(() => decodeUnknownSyncOrThrow(communityUserAddSchema, input)).toThrow(/role|literal/i);
		});
	});
});
