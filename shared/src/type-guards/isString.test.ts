/* oxlint-disable id-length, no-magic-numbers */
import { describe, expect, it } from "vitest";

import isString from "./isString";

describe("isString", () => {
	it("identifies strings", () => {
		expect(isString("hello")).toBe(true);
		const notAString = 123;
		expect(isString(notAString)).toBe(false);
	});
});
