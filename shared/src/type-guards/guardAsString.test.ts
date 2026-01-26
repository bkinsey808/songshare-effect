/* oxlint-disable id-length, no-magic-numbers */
import { describe, expect, it } from "vitest";

import guardAsString from "./guardAsString";

describe("guardAsString", () => {
	it("returns the string when provided", () => {
		expect(guardAsString("ok")).toBe("ok");
	});

	it("falls back to default when not a string", () => {
		const notString = 123;
		expect(guardAsString(notString)).toBe("");
		expect(guardAsString(undefined, "fallback")).toBe("fallback");
	});
});
