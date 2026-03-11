import { describe, expect, it } from "vitest";

import { SCROLL_HYSTERESIS, SCROLL_THRESHOLD } from "./navigation-constants";

describe("navigation-constants", () => {
	it.each([
		["SCROLL_THRESHOLD", SCROLL_THRESHOLD],
		["SCROLL_HYSTERESIS", SCROLL_HYSTERESIS],
	] as const)("exports %s as number", (_name, value) => {
		expect(value).toBeDefined();
		expect(typeof value).toBe("number");
	});
});
