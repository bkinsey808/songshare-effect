import { Schema } from "effect";
import { describe, expect, it } from "vitest";

import { OauthUserDataSchema } from "./oauthUserData";

describe("oauthUserData", () => {
	describe("oauth user data schema", () => {
		it("decodes valid object with required email", () => {
			const decoded = Schema.decodeSync(OauthUserDataSchema)({
				email: "user@example.com",
			});
			expect(decoded.email).toBe("user@example.com");
			expect(decoded.sub).toBeUndefined();
			expect(decoded.name).toBeUndefined();
		});

		it("decodes object with all fields", () => {
			const input = {
				sub: "sub-123",
				id: "id-456",
				email: "test@test.com",
				name: "Test User",
			};
			const decoded = Schema.decodeSync(OauthUserDataSchema)(input);
			expect(decoded).toStrictEqual(input);
		});

		it("rejects when email is missing", () => {
			const result = Schema.decodeUnknownEither(OauthUserDataSchema)({});
			expect(result._tag).toBe("Left");
		});

		it("rejects when email is not a string", () => {
			const invalidEmail = 42;
			const result = Schema.decodeUnknownEither(OauthUserDataSchema)({
				email: invalidEmail,
			});
			expect(result._tag).toBe("Left");
		});
	});
});
