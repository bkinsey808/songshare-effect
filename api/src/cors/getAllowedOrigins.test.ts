import { describe, expect, it } from "vitest";

import { ZERO } from "@/shared/constants/shared-constants";

import getAllowedOrigins from "./getAllowedOrigins";

describe("getAllowedOrigins", () => {
	it("parses, normalizes and filters entries (ignores '*' and empty items)", () => {
		const envLike = {
			ALLOWED_ORIGINS: "  https://example.com/, , *, https://sub.test///,http://localhost:5173/",
		} as unknown;

		const result = getAllowedOrigins(envLike);

		expect(result).toStrictEqual([
			"https://example.com",
			"https://sub.test",
			"http://localhost:5173",
		]);
	});

	it("falls back to default dev origins when ALLOWED_ORIGINS is missing or invalid", () => {
		// missing
		const missing = getAllowedOrigins(undefined);
		expect(missing.length).toBeGreaterThan(ZERO);
		expect(missing).toContain("http://localhost:5173");

		// present but only wildcard / empty
		const onlyWildcard = getAllowedOrigins({ ALLOWED_ORIGINS: "*,,  " } as unknown);
		expect(onlyWildcard.length).toBeGreaterThan(ZERO);
		expect(onlyWildcard).toContain("http://localhost:5173");
	});
});
