import { describe, expect, it } from "vitest";

import guardAsPostgrestResponse from "./guardAsPostgrestResponse";

describe("guardAsPostgrestResponse", () => {
	it("returns true for object with error property", () => {
		const response = { error: { message: "Error message" } };

		const result = guardAsPostgrestResponse(response);

		expect(result).toBe(true);
	});

	it("returns true for object with data property", () => {
		const response = { data: [{ id: 1 }] };

		const result = guardAsPostgrestResponse(response);

		expect(result).toBe(true);
	});

	it("returns true for object with both error and data properties", () => {
		const response = { error: undefined, data: [] };

		const result = guardAsPostgrestResponse(response);

		expect(result).toBe(true);
	});

	it("returns false for object without error or data properties", () => {
		const response = { message: "No data or error" };

		const result = guardAsPostgrestResponse(response);

		expect(result).toBe(false);
	});

	it("returns false for non-record values", () => {
		// oxlint-disable-next-line unicorn/no-null
		expect(guardAsPostgrestResponse(null)).toBe(false);
		expect(guardAsPostgrestResponse(undefined)).toBe(false);
		expect(guardAsPostgrestResponse("string")).toBe(false);
		expect(guardAsPostgrestResponse(false)).toBe(false);
		expect(guardAsPostgrestResponse([])).toBe(false);
	});
});
