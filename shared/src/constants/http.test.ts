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
	const numericExportCases = [
		{ name: "HTTP_TEMP_REDIRECT", value: HTTP_TEMP_REDIRECT },
		{ name: "HTTP_NOT_FOUND", value: HTTP_NOT_FOUND },
		{ name: "HTTP_UNAUTHORIZED", value: HTTP_UNAUTHORIZED },
		{ name: "HTTP_BAD_REQUEST", value: HTTP_BAD_REQUEST },
		{ name: "HTTP_FORBIDDEN", value: HTTP_FORBIDDEN },
		{ name: "HTTP_OK", value: HTTP_OK },
		{ name: "HTTP_REDIRECT_LOWER", value: HTTP_REDIRECT_LOWER },
		{ name: "HTTP_REDIRECT_UPPER", value: HTTP_REDIRECT_UPPER },
		{ name: "MS_PER_SECOND", value: MS_PER_SECOND },
		{ name: "ONE_HOUR_SECONDS", value: ONE_HOUR_SECONDS },
	];

	it.each(numericExportCases)("exports $name as number", ({ value }) => {
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
