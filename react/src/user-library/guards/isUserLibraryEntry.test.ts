import { describe, expect, it } from "vitest";

import isUserLibraryEntry from "./isUserLibraryEntry";

describe("isUserLibraryEntry", () => {
	it("returns true for valid entry", () => {
		expect(
			isUserLibraryEntry({ user_id: "u1", followed_user_id: "f1", created_at: "2020-01-01" }),
		).toBe(true);
	});

	it("returns false for missing or malformed fields", () => {
		expect(isUserLibraryEntry({})).toBe(false);
		expect(isUserLibraryEntry({ user_id: "u1" })).toBe(false);
		expect(isUserLibraryEntry({ followed_user_id: "f1" })).toBe(false);
		expect(isUserLibraryEntry({ user_id: 1, followed_user_id: "f1", created_at: "x" })).toBe(false);
	});
});
