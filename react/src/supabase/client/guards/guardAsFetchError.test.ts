import { describe, expect, it } from "vitest";

import guardAsFetchError from "./guardAsFetchError";

describe("guardAsFetchError", () => {
	it("returns true for object with message string property", () => {
		const error = { message: "Error message" };

		const result = guardAsFetchError(error);

		expect(result).toBe(true);
	});

	it("returns false when message is not a string", () => {
		expect(guardAsFetchError({ message: 123 })).toBe(false);
		expect(guardAsFetchError({ message: undefined })).toBe(false);
		// oxlint-disable-next-line unicorn/no-null
		expect(guardAsFetchError({ message: null })).toBe(false);
	});

	it("returns false for object without message property", () => {
		const error = { code: "ERROR_CODE" };

		const result = guardAsFetchError(error);

		expect(result).toBe(false);
	});

	it("returns false for non-record values", () => {
		expect(guardAsFetchError(undefined)).toBe(false);
		expect(guardAsFetchError("string")).toBe(false);
		expect(guardAsFetchError(false)).toBe(false);
		expect(guardAsFetchError([])).toBe(false);
	});
});
