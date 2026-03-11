import { describe, expect, it } from "vitest";

import makeNull from "@/shared/test-utils/makeNull.test-util";

import isPlaylist from "./isPlaylist";

const VALID_UUID = "00000000-0000-4000-8000-000000000001";
const VALID_PLAYLIST = {
	playlist_id: VALID_UUID,
	user_id: VALID_UUID,
	created_at: "2026-01-01T00:00:00Z",
	updated_at: "2026-01-01T00:00:00Z",
	private_notes: "notes",
};
const INVALID_PRIMITIVE = 42;

describe("isPlaylist", () => {
	it("returns true for valid playlist object", () => {
		expect(isPlaylist(VALID_PLAYLIST)).toBe(true);
	});

	it("returns false for null", () => {
		expect(isPlaylist(makeNull())).toBe(false);
	});

	it("returns false for undefined", () => {
		expect(isPlaylist(undefined)).toBe(false);
	});

	it("returns false for primitive values", () => {
		expect(isPlaylist(INVALID_PRIMITIVE)).toBe(false);
		expect(isPlaylist("string")).toBe(false);
	});

	it("returns false for object missing required fields", () => {
		expect(isPlaylist({})).toBe(false);
		expect(isPlaylist({ playlist_id: VALID_UUID })).toBe(false);
	});

	it("returns false for object with invalid UUID format", () => {
		expect(
			isPlaylist({
				...VALID_PLAYLIST,
				playlist_id: "not-a-uuid",
			}),
		).toBe(false);
	});

	it("returns false for object with empty private_notes", () => {
		expect(
			isPlaylist({
				...VALID_PLAYLIST,
				private_notes: "",
			}),
		).toBe(false);
	});
});
