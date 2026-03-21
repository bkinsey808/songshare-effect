import { describe, expect, it } from "vitest";

import isImageTagRow from "./isImageTagRow";

const NULL_VALUE: unknown = JSON.parse("null") as unknown;
const NOT_A_NUMBER = 42;

describe("isImageTagRow", () => {
	it("should return true for a valid ImageTagRow", () => {
		expect(isImageTagRow({ image_id: "abc-123" })).toBe(true);
	});

	it("should return true when extra fields are present", () => {
		expect(isImageTagRow({ image_id: "abc-123", image_public: NULL_VALUE })).toBe(true);
	});

	it("should return false if image_id is missing", () => {
		expect(isImageTagRow({})).toBe(false);
	});

	it("should return false if image_id is not a string", () => {
		expect(isImageTagRow({ image_id: NOT_A_NUMBER })).toBe(false);
		expect(isImageTagRow({ image_id: NULL_VALUE })).toBe(false);
	});

	it("should return false for non-objects", () => {
		expect(isImageTagRow("not an object")).toBe(false);
		expect(isImageTagRow(NULL_VALUE)).toBe(false);
		expect(isImageTagRow(undefined)).toBe(false);
		expect(isImageTagRow(NOT_A_NUMBER)).toBe(false);
	});
});
