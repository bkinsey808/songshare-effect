import { Effect } from "effect";
import { describe, expect, it, vi } from "vitest";

import forceCast from "@/react/lib/test-utils/forceCast";
import { apiSongLibraryRemovePath } from "@/shared/paths";

import type { RemoveSongFromSongLibraryRequest } from "../song-library-types";

import makeSongLibrarySlice from "../makeSongLibrarySlice.mock";
import removeSongFromSongLibrary from "./removeSongFromLibrary";

const SONG_ID = "song-123";
const FIRST_CALL_INDEX = 1;
const VALID_REQUEST: RemoveSongFromSongLibraryRequest = {
	song_id: SONG_ID,
};

describe("removeSongFromSongLibrary", () => {
	it("removes a song successfully and updates local state", async () => {
		vi.resetAllMocks();
		vi.stubGlobal(
			"fetch",
			vi.fn().mockResolvedValue(Response.json({ success: true }, { status: 200 })),
		);

		const baseGet = makeSongLibrarySlice();
		const mockSlice = { ...baseGet(), isInSongLibrary: vi.fn(() => true) };
		const get = vi.fn(() => mockSlice);

		await Effect.runPromise(removeSongFromSongLibrary(VALID_REQUEST, get));

		expect(mockSlice.setSongLibraryError).toHaveBeenCalledWith(undefined);
		expect(mockSlice.removeSongLibraryEntry).toHaveBeenCalledWith(SONG_ID);
		expect(globalThis.fetch).toHaveBeenCalledWith(
			apiSongLibraryRemovePath,
			expect.objectContaining({
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ song_id: SONG_ID }),
			}),
		);
	});

	it("skips removing a song that is not in the library", async () => {
		vi.resetAllMocks();
		const fetchSpy = vi.fn();
		vi.stubGlobal("fetch", fetchSpy);

		const baseGet = makeSongLibrarySlice();
		const mockSlice = { ...baseGet(), isInSongLibrary: vi.fn(() => false) };
		const get = vi.fn(() => mockSlice);

		await Effect.runPromise(removeSongFromSongLibrary(VALID_REQUEST, get));

		expect(mockSlice.removeSongLibraryEntry).not.toHaveBeenCalled();
		expect(fetchSpy).not.toHaveBeenCalled();
	});

	it("throws when request validation fails", async () => {
		vi.resetAllMocks();
		const baseGet = makeSongLibrarySlice();
		const mockSlice = { ...baseGet(), isInSongLibrary: vi.fn(() => true) };
		const get = vi.fn(() => mockSlice);

		const invalidRequest = forceCast<RemoveSongFromSongLibraryRequest>({ song_id: undefined });

		await expect(Effect.runPromise(removeSongFromSongLibrary(invalidRequest, get))).rejects.toThrow(
			Error,
		);

		expect(mockSlice.setSongLibraryError).toHaveBeenLastCalledWith(
			expect.stringMatching(/Invalid|Failed/),
		);
	});

	it("throws when network fails", async () => {
		vi.resetAllMocks();
		vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("Network error")));

		const baseGet = makeSongLibrarySlice();
		const mockSlice = { ...baseGet(), isInSongLibrary: vi.fn(() => true) };
		const get = vi.fn(() => mockSlice);

		await expect(Effect.runPromise(removeSongFromSongLibrary(VALID_REQUEST, get))).rejects.toThrow(
			Error,
		);

		expect(mockSlice.setSongLibraryError).toHaveBeenLastCalledWith(
			expect.stringMatching(/Network|Failed/),
		);
	});

	it("throws when API returns non-ok response", async () => {
		vi.resetAllMocks();
		vi.stubGlobal(
			"fetch",
			vi.fn().mockResolvedValue(
				Response.json({ message: "Permission denied" }, { status: 403, statusText: "Forbidden" }),
			),
		);

		const baseGet = makeSongLibrarySlice();
		const mockSlice = { ...baseGet(), isInSongLibrary: vi.fn(() => true) };
		const get = vi.fn(() => mockSlice);

		await expect(Effect.runPromise(removeSongFromSongLibrary(VALID_REQUEST, get))).rejects.toThrow(
			Error,
		);

		expect(mockSlice.setSongLibraryError).toHaveBeenCalledWith(
			expect.stringMatching(/Permission denied|Server returned/),
		);
	});

	it("throws when server response missing success flag", async () => {
		vi.resetAllMocks();
		vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({}, { status: 200 })));

		const baseGet = makeSongLibrarySlice();
		const mockSlice = { ...baseGet(), isInSongLibrary: vi.fn(() => true) };
		const get = vi.fn(() => mockSlice);

		await expect(Effect.runPromise(removeSongFromSongLibrary(VALID_REQUEST, get))).rejects.toThrow(
			/Invalid server response: missing success flag/,
		);

		expect(mockSlice.setSongLibraryError).toHaveBeenLastCalledWith(
			expect.stringMatching(/Invalid server response|Failed/),
		);
	});

	it("throws when success is not boolean", async () => {
		vi.resetAllMocks();
		vi.stubGlobal(
			"fetch",
			vi.fn().mockResolvedValue(Response.json({ success: "yes" }, { status: 200 })),
		);

		const baseGet = makeSongLibrarySlice();
		const mockSlice = { ...baseGet(), isInSongLibrary: vi.fn(() => true) };
		const get = vi.fn(() => mockSlice);

		await expect(Effect.runPromise(removeSongFromSongLibrary(VALID_REQUEST, get))).rejects.toThrow(
			/Invalid server response: success must be boolean/,
		);
	});

	it("clears previous errors before operation", async () => {
		vi.resetAllMocks();
		vi.stubGlobal(
			"fetch",
			vi.fn().mockResolvedValue(Response.json({ success: true }, { status: 200 })),
		);

		const baseGet = makeSongLibrarySlice();
		const mockSlice = { ...baseGet(), isInSongLibrary: vi.fn(() => true), songLibraryError: "Previous error" };
		const get = vi.fn(() => mockSlice);

		await Effect.runPromise(removeSongFromSongLibrary(VALID_REQUEST, get));

		expect(mockSlice.setSongLibraryError).toHaveBeenNthCalledWith(FIRST_CALL_INDEX, undefined);
	});

	it("removes from local state after successful API response", async () => {
		vi.resetAllMocks();
		vi.stubGlobal(
			"fetch",
			vi.fn().mockResolvedValue(Response.json({ success: true }, { status: 200 })),
		);

		const baseGet = makeSongLibrarySlice();
		const mockSlice = { ...baseGet(), isInSongLibrary: vi.fn(() => true) };
		const get = vi.fn(() => mockSlice);

		await Effect.runPromise(removeSongFromSongLibrary(VALID_REQUEST, get));

		expect(mockSlice.removeSongLibraryEntry).toHaveBeenCalledWith(SONG_ID);
	});

	it("sends correct request to API", async () => {
		vi.resetAllMocks();
		const fetchSpy = vi.fn().mockResolvedValue(Response.json({ success: true }, { status: 200 }));
		vi.stubGlobal("fetch", fetchSpy);

		const baseGet = makeSongLibrarySlice();
		const mockSlice = { ...baseGet(), isInSongLibrary: vi.fn(() => true) };
		const get = vi.fn(() => mockSlice);

		await Effect.runPromise(removeSongFromSongLibrary(VALID_REQUEST, get));

		expect(fetchSpy).toHaveBeenCalledWith(
			apiSongLibraryRemovePath,
			expect.objectContaining({
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ song_id: SONG_ID }),
			}),
		);
	});
});
