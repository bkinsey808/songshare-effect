import { describe, expect, it } from "vitest";

import makeNull from "@/shared/test-utils/makeNull.test-util";

import isTokenResponse from "./isTokenResponse";

const VALID_RESPONSE = {
	access_token: "tok-123",
	token_type: "Bearer",
	expires_in: 3600,
};

describe("isTokenResponse", () => {
	it("returns true for valid token response", () => {
		expect(isTokenResponse(VALID_RESPONSE)).toBe(true);
	});

	it("returns false for non-record input", () => {
		expect(isTokenResponse(makeNull())).toBe(false);
		expect(isTokenResponse(undefined)).toBe(false);
		expect(isTokenResponse("string")).toBe(false);
	});

	it("returns false when required fields are missing", () => {
		expect(isTokenResponse({})).toBe(false);
		expect(isTokenResponse({ access_token: "x" })).toBe(false);
		expect(isTokenResponse({ access_token: "x", token_type: "Bearer" })).toBe(false);
	});

	it("returns false when field types are wrong", () => {
		expect(
			isTokenResponse({
				...VALID_RESPONSE,
				access_token: 123,
			}),
		).toBe(false);
		expect(
			isTokenResponse({
				...VALID_RESPONSE,
				expires_in: "3600",
			}),
		).toBe(false);
	});
});
