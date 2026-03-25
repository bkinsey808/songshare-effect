import { describe, expect, it } from "vitest";

import {
	HTTP_BAD_REQUEST,
	HTTP_FORBIDDEN,
	HTTP_NOT_FOUND,
	HTTP_OK,
	HTTP_REDIRECT_LOWER,
	HTTP_REDIRECT_UPPER,
	HTTP_TEMP_REDIRECT,
	HTTP_UNAUTHORIZED,
	MS_PER_SECOND,
	ONE_HOUR_SECONDS,
	SIGNIN_RETRY_DELAYS_MS,
} from "./http";
import { ZERO } from "./shared-constants";

describe("http constants", () => {
	it.each([
		["HTTP_TEMP_REDIRECT", HTTP_TEMP_REDIRECT],
		["HTTP_NOT_FOUND", HTTP_NOT_FOUND],
		["HTTP_UNAUTHORIZED", HTTP_UNAUTHORIZED],
		["HTTP_BAD_REQUEST", HTTP_BAD_REQUEST],
		["HTTP_FORBIDDEN", HTTP_FORBIDDEN],
		["HTTP_OK", HTTP_OK],
		["HTTP_REDIRECT_LOWER", HTTP_REDIRECT_LOWER],
		["HTTP_REDIRECT_UPPER", HTTP_REDIRECT_UPPER],
		["MS_PER_SECOND", MS_PER_SECOND],
		["ONE_HOUR_SECONDS", ONE_HOUR_SECONDS],
	] as const)("exports %s as number", (_name, value) => {
		// Assert
		expect(value).toBeDefined();
		expect(typeof value).toBe("number");
	});

	it("signin retry delays ms is non-empty number array", () => {
		// Assert
		expect(SIGNIN_RETRY_DELAYS_MS).toBeDefined();
		expect(Array.isArray(SIGNIN_RETRY_DELAYS_MS)).toBe(true);
		expect(SIGNIN_RETRY_DELAYS_MS.length).toBeGreaterThan(ZERO);
		expect(SIGNIN_RETRY_DELAYS_MS.every((num) => typeof num === "number")).toBe(true);
	});
});
