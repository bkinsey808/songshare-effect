import { describe, expect, it } from "vitest";

import { NOT_FOUND, ONE, THREE, TWO, ZERO } from "./shared-constants";

describe("shared-constants", () => {
	it.each([
		["ZERO", ZERO],
		["ONE", ONE],
		["TWO", TWO],
		["THREE", THREE],
		["NOT_FOUND", NOT_FOUND],
	] as const)("exports %s", (_name, value) => {
		expect(value).toBeDefined();
		expect(typeof value).toBe("number");
	});
});
