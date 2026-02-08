import { describe, it, expect } from "vitest";

import isValidTimeFormat from "./isValidTimeFormat";

describe("isValidTimeFormat", () => {
	it("valid times are accepted", () => {
		expect(isValidTimeFormat("23:59")).toBe(true);
		expect(isValidTimeFormat("00:00")).toBe(true);
	});

	it("invalid times are rejected", () => {
		expect(isValidTimeFormat("24:00")).toBe(false);
		expect(isValidTimeFormat("12:60")).toBe(false);
		expect(isValidTimeFormat("9:05")).toBe(false);
	});
});
