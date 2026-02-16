import { describe, expect, it } from "vitest";

import isOriginAllowed from "./isOriginAllowed";

describe("isOriginAllowed", () => {
	it("returns false for missing/empty origin values", () => {
		expect(isOriginAllowed(undefined, {} as Record<string, string | undefined>)).toBe(false);
		expect(isOriginAllowed(undefined, {} as Record<string, string | undefined>)).toBe(false);
		expect(isOriginAllowed("", {} as Record<string, string | undefined>)).toBe(false);
	});

	it("returns true when normalized origin is present in ALLOWED_ORIGINS", () => {
		const env = { ALLOWED_ORIGINS: "https://example.com" } as Record<string, string | undefined>;
		expect(isOriginAllowed("https://example.com/", env)).toBe(true);
	});

	it("returns false when origin not in allowed list (wildcard ignored)", () => {
		const env = { ALLOWED_ORIGINS: "*" } as Record<string, string | undefined>;
		expect(isOriginAllowed("https://example.com/", env)).toBe(false);
	});
});
