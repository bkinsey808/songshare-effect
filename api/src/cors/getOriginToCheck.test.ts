import { describe, expect, it } from "vitest";

import makeCtx from "@/api/test-utils/makeCtx.mock";

import getOriginToCheck from "./getOriginToCheck";

describe("getOriginToCheck", () => {
	it("returns normalized Origin header when present", () => {
		const ctx = makeCtx({ headers: { Origin: "  https://example.com/  " } });
		expect(getOriginToCheck(ctx)).toBe("https://example.com");
	});

	it("derives origin from Referer when Origin is absent", () => {
		const ctx = makeCtx({ headers: { Referer: "https://sub.test/path?x=1" } });
		expect(getOriginToCheck(ctx)).toBe("https://sub.test");
	});

	it("returns empty string for invalid Referer URL", () => {
		const ctx = makeCtx({ headers: { Referer: "not-a-url" } });
		expect(getOriginToCheck(ctx)).toBe("");
	});

	it("returns empty string when neither Origin nor Referer is present", () => {
		const ctx = makeCtx({ headers: {} });
		expect(getOriginToCheck(ctx)).toBe("");
	});
});
