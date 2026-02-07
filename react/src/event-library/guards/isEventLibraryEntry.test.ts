import { describe, expect, it } from "vitest";

import isEventLibraryEntry from "./isEventLibraryEntry";

describe("isEventLibraryEntry", () => {
	it("should return true for valid EventLibraryEntry", () => {
		const validEntry = {
			user_id: "123e4567-e89b-12d3-a456-426614174000",
			event_id: "223e4567-e89b-12d3-a456-426614174000",
			event_owner_id: "323e4567-e89b-12d3-a456-426614174000",
			created_at: "2025-02-07T00:00:00Z",
		};
		expect(isEventLibraryEntry(validEntry)).toBe(true);
	});

	it("should return false if user_id is missing", () => {
		const invalid = {
			event_id: "223e4567-e89b-12d3-a456-426614174000",
			event_owner_id: "323e4567-e89b-12d3-a456-426614174000",
			created_at: "2025-02-07T00:00:00Z",
		};
		expect(isEventLibraryEntry(invalid)).toBe(false);
	});

	it("should return false if event_id is not a string", () => {
		const invalid = {
			user_id: "123e4567-e89b-12d3-a456-426614174000",
			event_id: 123,
			event_owner_id: "323e4567-e89b-12d3-a456-426614174000",
			created_at: "2025-02-07T00:00:00Z",
		};
		expect(isEventLibraryEntry(invalid)).toBe(false);
	});

	it("should return false if not an object", () => {
		expect(isEventLibraryEntry("not an object")).toBe(false);
		expect(isEventLibraryEntry(undefined)).toBe(false);
		expect(isEventLibraryEntry(undefined)).toBe(false);
	});
});
