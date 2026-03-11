import { describe, expect, it } from "vitest";

import makeNull from "@/shared/test-utils/makeNull.test-util";

import isUserLibraryEntry from "./isUserLibraryEntry";

const VALID_ENTRY = {
	user_id: "owner-1",
	followed_user_id: "followed-1",
	created_at: "2024-01-01T00:00:00Z",
};

describe("isUserLibraryEntry", () => {
	it("returns true for valid entry", () => {
		expect(isUserLibraryEntry(VALID_ENTRY)).toBe(true);
	});

	it("returns false for non-record", () => {
		expect(isUserLibraryEntry(makeNull())).toBe(false);
		expect(isUserLibraryEntry(undefined)).toBe(false);
		expect(isUserLibraryEntry("string")).toBe(false);
	});

	it("returns false when required fields missing", () => {
		expect(isUserLibraryEntry({})).toBe(false);
		expect(isUserLibraryEntry({ user_id: "x" })).toBe(false);
		expect(isUserLibraryEntry({ user_id: "x", followed_user_id: "y" })).toBe(false);
	});

	it("returns false when field types are wrong", () => {
		expect(isUserLibraryEntry({ ...VALID_ENTRY, user_id: 123 })).toBe(false);
		expect(isUserLibraryEntry({ ...VALID_ENTRY, created_at: makeNull() })).toBe(false);
	});
});
