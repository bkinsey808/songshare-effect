import { describe, expect, it } from "vitest";

import forceCast from "@/react/lib/test-utils/forceCast";

import isTagLibraryEntry from "./isTagLibraryEntry";

const NUMERIC_NON_OBJECT = 123;

describe("isTagLibraryEntry", () => {
	it("should return true for valid TagLibraryEntry", () => {
		const validEntry = {
			user_id: "123e4567-e89b-12d3-a456-426614174000",
			tag_slug: "rock",
		};
		expect(isTagLibraryEntry(validEntry)).toBe(true);
	});

	it("should return false if user_id is missing", () => {
		const invalid = { tag_slug: "rock" };
		expect(isTagLibraryEntry(invalid)).toBe(false);
	});

	it("should return false if tag_slug is missing", () => {
		const invalid = { user_id: "123e4567-e89b-12d3-a456-426614174000" };
		expect(isTagLibraryEntry(invalid)).toBe(false);
	});

	it("should return false if user_id is not a string", () => {
		const invalid = { user_id: 42, tag_slug: "rock" };
		expect(isTagLibraryEntry(invalid)).toBe(false);
	});

	it("should return false if tag_slug is not a string", () => {
		const invalid = {
			user_id: "123e4567-e89b-12d3-a456-426614174000",
			tag_slug: 99,
		};
		expect(isTagLibraryEntry(invalid)).toBe(false);
	});

	it("should return false if not an object", () => {
		expect(isTagLibraryEntry("not an object")).toBe(false);
		expect(isTagLibraryEntry(forceCast<unknown>(undefined))).toBe(false);
		expect(isTagLibraryEntry(undefined)).toBe(false);
		expect(isTagLibraryEntry(forceCast(NUMERIC_NON_OBJECT))).toBe(false);
	});

	it("should return true when extra fields are present", () => {
		const entry = {
			user_id: "123e4567-e89b-12d3-a456-426614174000",
			tag_slug: "jazz",
			extra_field: "ignored",
		};
		expect(isTagLibraryEntry(entry)).toBe(true);
	});
});
