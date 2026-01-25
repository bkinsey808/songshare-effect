import { describe, expect, it, vi } from "vitest";

import validateVisitorToken from "./validateVisitorToken";

describe("validateVisitorToken", () => {
	it("returns false for non-string and logs a warning", () => {
		const spy = vi.spyOn(console, "warn").mockImplementation(() => undefined);
		const NON_STRING = 123;
		expect(validateVisitorToken(undefined)).toBe(false);
		expect(validateVisitorToken(NON_STRING as unknown)).toBe(false);
		expect(spy).toHaveBeenCalledWith(expect.anything());
		spy.mockRestore();
	});

	it("returns true for strings", () => {
		expect(validateVisitorToken("token")).toBe(true);
	});
});
