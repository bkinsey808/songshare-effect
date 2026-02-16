import { describe, expect, it } from "vitest";

import normalizeOrigin from "./normalizeOrigin";

describe("normalizeOrigin", () => {
	it("trims whitespace and removes trailing slashes", () => {
		expect(normalizeOrigin("  https://example.com/ ")).toBe("https://example.com");
		expect(normalizeOrigin("https://example.com///")).toBe("https://example.com");
	});

	it("returns the same origin when there are no trailing slashes or extra space", () => {
		expect(normalizeOrigin("https://sub.test")).toBe("https://sub.test");
	});
});
