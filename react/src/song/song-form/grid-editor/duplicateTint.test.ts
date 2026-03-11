import { describe, expect, it } from "vitest";

import hashToHue from "./duplicateTint";

const HUE_MIN = 0;
const HUE_MAX = 360;

describe("hashToHue", () => {
	it("returns a number in [0, 360)", () => {
		const hue = hashToHue("abc");
		expect(hue).toBeGreaterThanOrEqual(HUE_MIN);
		expect(hue).toBeLessThan(HUE_MAX);
	});

	it("returns the same value for the same input", () => {
		expect(hashToHue("foo")).toBe(hashToHue("foo"));
		expect(hashToHue("bar")).toBe(hashToHue("bar"));
	});

	it("returns different values for different inputs", () => {
		expect(hashToHue("a")).not.toBe(hashToHue("b"));
	});

	it("returns 0 for empty string", () => {
		expect(hashToHue("")).toBe(HUE_MIN);
	});

	it("handles unicode code points", () => {
		const hue = hashToHue("日本語");
		expect(hue).toBeGreaterThanOrEqual(HUE_MIN);
		expect(hue).toBeLessThan(HUE_MAX);
	});
});
