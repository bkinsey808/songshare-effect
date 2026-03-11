import { describe, expect, it } from "vitest";

import decodeUnknownSyncOrThrow from "@/shared/validation/decodeUnknownSyncOrThrow";

import { RegisterDataSchema } from "./registerData";

describe("registerData", () => {
	describe("registerDataSchema", () => {
		it("decodes valid register data", () => {
			const input = {
				oauthUserData: { email: "alice@example.com", name: "Alice" },
				oauthState: {
					csrf: "csrf-123",
					lang: "en",
					provider: "google",
				},
			} as unknown;

			const result = decodeUnknownSyncOrThrow(RegisterDataSchema, input);

			expect(result.oauthUserData.email).toBe("alice@example.com");
			expect(result.oauthState.csrf).toBe("csrf-123");
			expect(result.oauthState.lang).toBe("en");
			expect(result.oauthState.provider).toBe("google");
		});

		it("throws when oauthUserData email is missing", () => {
			const input = {
				oauthUserData: { name: "Alice" },
				oauthState: { csrf: "x", lang: "en", provider: "google" },
			} as unknown;

			expect(() => decodeUnknownSyncOrThrow(RegisterDataSchema, input)).toThrow(
				/email|required|decode/i,
			);
		});

		it("throws when oauthState provider is invalid", () => {
			const input = {
				oauthUserData: { email: "a@b.com" },
				oauthState: { csrf: "x", lang: "en", provider: "invalid" },
			} as unknown;

			expect(() => decodeUnknownSyncOrThrow(RegisterDataSchema, input)).toThrow(
				/provider|literal|decode/i,
			);
		});
	});
});
