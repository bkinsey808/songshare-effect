import { Schema } from "effect";
import { describe, expect, it } from "vitest";

import { OauthUserDataSchema } from "./oauthUserData";

describe("oauthUserData", () => {
	describe("oauth user data schema", () => {
		it("decodes valid object with required email", () => {
			// Act
			const decoded = Schema.decodeSync(OauthUserDataSchema)({
				email: "user@example.com",
			});
			// Assert
			expect(decoded.email).toBe("user@example.com");
			expect(decoded.sub).toBeUndefined();
			expect(decoded.name).toBeUndefined();
		});

		it("decodes object with all fields", () => {
			// Act
			const input = {
				sub: "sub-123",
				id: "id-456",
				email: "test@test.com",
				name: "Test User",
			};
			const decoded = Schema.decodeSync(OauthUserDataSchema)(input);
			// Assert
			expect(decoded).toStrictEqual(input);
		});

		it("rejects when email is missing", () => {
			// Act
			const result = Schema.decodeUnknownEither(OauthUserDataSchema)({});
			// Assert
			expect(result._tag).toBe("Left");
		});

		it("rejects when email is not a string", () => {
			// Act
			const invalidEmail = 42;
			const result = Schema.decodeUnknownEither(OauthUserDataSchema)({
				email: invalidEmail,
			});
			// Assert
			expect(result._tag).toBe("Left");
		});
	});
});
