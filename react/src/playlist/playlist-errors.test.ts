import { describe, expect, it } from "vitest";

import {
	InvalidPlaylistDataError,
	NoSupabaseClientError,
	PlaylistNotFoundError,
	PlaylistSaveApiError,
	PlaylistSaveInvalidResponseError,
	PlaylistSaveNetworkError,
	QueryError,
} from "./playlist-errors";

const TEST_SLUG = "my-playlist";
const TEST_MESSAGE = "query failed";
const STATUS_500 = 500;

describe("playlist-errors", () => {
	it("playlistNotFoundError includes slug and message", () => {
		const err = new PlaylistNotFoundError(TEST_SLUG);
		expect(err._tag).toBe("PlaylistNotFoundError");
		expect(err.slug).toBe(TEST_SLUG);
		expect(err.message).toContain(TEST_SLUG);
	});

	it("noSupabaseClientError has expected message", () => {
		const err = new NoSupabaseClientError();
		expect(err._tag).toBe("NoSupabaseClientError");
		expect(err.message).toBe("No Supabase client available");
	});

	it("invalidPlaylistDataError has expected message", () => {
		const err = new InvalidPlaylistDataError();
		expect(err._tag).toBe("InvalidPlaylistDataError");
		expect(err.message).toBe("Invalid playlist_public data");
	});

	it("queryError includes cause when provided", () => {
		const cause = new Error("underlying");
		const err = new QueryError(TEST_MESSAGE, cause);
		expect(err._tag).toBe("QueryError");
		expect(err.message).toBe(TEST_MESSAGE);
		expect(err.cause).toBe(cause);
	});

	it("playlistSaveApiError includes status when provided", () => {
		const err = new PlaylistSaveApiError(TEST_MESSAGE, STATUS_500);
		expect(err._tag).toBe("PlaylistSaveApiError");
		expect(err.status).toBe(STATUS_500);
	});

	it("playlistSaveNetworkError extends PlaylistSaveError", () => {
		const err = new PlaylistSaveNetworkError(TEST_MESSAGE);
		expect(err._tag).toBe("PlaylistSaveNetworkError");
		expect(err.message).toBe(TEST_MESSAGE);
	});

	it("playlistSaveInvalidResponseError has default message", () => {
		const cause = {};
		const err = new PlaylistSaveInvalidResponseError(cause);
		expect(err._tag).toBe("PlaylistSaveInvalidResponseError");
		expect(err.message).toBe("Invalid response from save API");
		expect(err.cause).toBe(cause);
	});
});
