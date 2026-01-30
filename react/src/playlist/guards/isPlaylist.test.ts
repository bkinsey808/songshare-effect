import { describe, expect, it } from "vitest";

import isPlaylist from "./isPlaylist";

/**
 * Create a valid Playlist-like record for use in tests.
 *
 * The returned object includes the required fields that make the
 * `isPlaylist` type guard pass. Tests should copy and mutate this
 * fixture when checking invalid permutations to keep the base fixture
 * unchanged.
 *
 * @returns A shallow object shaped like a `Playlist` record.
 */
function makeValidPlaylist(): Record<string, unknown> {
	// Use values that satisfy the generated Effect schema (UUIDs, non-empty strings)
	return {
		playlist_id: "00000000-0000-0000-0000-000000000001",
		user_id: "00000000-0000-0000-0000-000000000002",
		private_notes: "notes",
		created_at: "2026-01-01T00:00:00Z",
		updated_at: "2026-01-02T00:00:00Z",
	};
}

describe("isPlaylist", () => {
	it("returns true for a valid Playlist record", () => {
		expect(isPlaylist(makeValidPlaylist())).toBe(true);
	});

	it("rejects minimal required fields without timestamps (schema is strict)", () => {
		const minimal = {
			playlist_id: "p1",
			user_id: "u1",
			private_notes: "notes",
		};
		// Schema requires timestamps and specific formats (UUID, non-empty strings)
		expect(isPlaylist(minimal)).toBe(false);
	});

	it("returns true for a schema-valid minimal record (schema guard)", () => {
		const minimalSchemaValid = {
			playlist_id: "00000000-0000-0000-0000-000000000003",
			user_id: "00000000-0000-0000-0000-000000000004",
			private_notes: "notes",
			created_at: "2026-01-01T00:00:00Z",
			updated_at: "2026-01-02T00:00:00Z",
		};
		expect(isPlaylist(minimalSchemaValid)).toBe(true);
	});

	it.each([
		["undefined", undefined],
		["empty object", {} as unknown],
		["playlist_id number", { ...makeValidPlaylist(), playlist_id: 123 } as unknown],
		[
			"playlist_id missing",
			((): Record<string, unknown> => {
				const obj = { ...makeValidPlaylist() } as Record<string, unknown>;
				delete obj["playlist_id"];
				return obj;
			})() as unknown,
		],
		["user_id undefined", { ...makeValidPlaylist(), user_id: undefined } as unknown],
		["user_id number", { ...makeValidPlaylist(), user_id: 123 } as unknown],
		[
			"private_notes missing",
			((): Record<string, unknown> => {
				const obj = { ...makeValidPlaylist() } as Record<string, unknown>;
				delete obj["private_notes"];
				return obj;
			})(),
		],
		["private_notes number", { ...makeValidPlaylist(), private_notes: 123 } as unknown],
		["non-record array", ["not", "a", "record"] as unknown],
	])("returns false for malformed record: %s", (_name, value) => {
		expect(isPlaylist(value)).toBe(false);
	});

	it("allows objects with extra unknown fields (Schema strips unknown properties)", () => {
		// The generated schema strips unknown properties and validates known fields,
		// so extra properties do not cause validation to fail.
		expect(isPlaylist({ ...makeValidPlaylist(), extra: true as unknown })).toBe(true);
	});

	it("rejects empty string for private_notes (non-empty constraint)", () => {
		// PlaylistSchema enforces NonEmptyString for `private_notes`
		expect(isPlaylist({ ...makeValidPlaylist(), private_notes: "" })).toBe(false);
	});
});
