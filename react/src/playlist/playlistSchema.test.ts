import { describe, expect, it } from "vitest";

import decodeUnknownSyncOrThrow from "@/shared/validation/decodeUnknownSyncOrThrow";

import { PlaylistFormField, playlistFormFields, playlistFormSchema } from "./playlistSchema";

describe("playlistSchema", () => {
	describe("playlistFormField", () => {
		it("has expected keys matching playlistFormFields", () => {
			for (const key of playlistFormFields) {
				expect(PlaylistFormField[key]).toBe(key);
			}
		});
	});

	describe("playlistFormSchema", () => {
		it("decodes valid form data", () => {
			const input = {
				playlist_name: "My Playlist",
				playlist_slug: "my-playlist",
				song_order: ["id-1", "id-2"],
			} as unknown;

			const result = decodeUnknownSyncOrThrow(playlistFormSchema, input);

			expect(result.playlist_name).toBe("My Playlist");
			expect(result.playlist_slug).toBe("my-playlist");
			expect(result.song_order).toStrictEqual(["id-1", "id-2"]);
		});

		it("accepts optional playlist_id and notes", () => {
			const input = {
				playlist_id: "pid-123",
				playlist_name: "Test",
				playlist_slug: "test-slug",
				public_notes: "Public",
				private_notes: "Private",
				song_order: [],
			} as unknown;

			const result = decodeUnknownSyncOrThrow(playlistFormSchema, input);

			expect(result.playlist_id).toBe("pid-123");
			expect(result.public_notes).toBe("Public");
			expect(result.private_notes).toBe("Private");
		});

		it("throws when required name is missing", () => {
			const input = { playlist_slug: "slug", song_order: [] } as unknown;

			expect(() => decodeUnknownSyncOrThrow(playlistFormSchema, input)).toThrow(
				/playlist_name|required|decode/i,
			);
		});

		it("throws when song_order is not an array", () => {
			const input = {
				playlist_name: "Name",
				playlist_slug: "slug",
				song_order: "not-an-array",
			} as unknown;

			expect(() => decodeUnknownSyncOrThrow(playlistFormSchema, input)).toThrow(/array|expected/i);
		});
	});
});
