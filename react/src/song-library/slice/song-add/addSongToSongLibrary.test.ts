import { Effect } from "effect";
import { describe, expect, it, vi } from "vitest";

import forceCast from "@/react/lib/test-utils/forceCast";
import { apiSongLibraryAddPath } from "@/shared/paths";

import type { SongLibrarySlice } from "../song-library-slice";
import type { AddSongToSongLibraryRequest } from "../song-library-types";

import addSongToSongLibrary from "./addSongToSongLibrary";

// Mock modules
vi.mock("@/react/utils/clientLogger");

// Test constants
const SONG_ID = "song-123";
const OWNER_ID = "owner-456";
const USER_ID = "user-789";
const CREATED_AT = "2024-01-01T00:00:00Z";
const ERROR_NETWORK = "Network error";
const ERROR_ALREADY_IN_LIBRARY = "Song already in library";
const ERROR_PARSE_FAILED = "Failed to parse";
const ERROR_PERMISSION_DENIED = "Permission denied";
const ERROR_SERVER_500 = "Internal Server Error";

const VALID_REQUEST: AddSongToSongLibraryRequest = {
	song_id: SONG_ID,
	song_owner_id: OWNER_ID,
};

const VALID_RESPONSE = {
	song_id: SONG_ID,
	song_owner_id: OWNER_ID,
	user_id: USER_ID,
	created_at: CREATED_AT,
};

function createMockSlice(overrides: Partial<SongLibrarySlice> = {}): SongLibrarySlice {
	return {
		songLibraryEntries: {},
		isSongLibraryLoading: false,
		songLibraryError: undefined,
		isInSongLibrary: vi.fn(() => false),
		setSongLibraryError: vi.fn(),
		addSongLibraryEntry: vi.fn(),
		removeSongLibraryEntry: vi.fn(),
		addSongToSongLibrary: () => Effect.sync(() => undefined),
		removeSongFromSongLibrary: () => Effect.sync(() => undefined),
		fetchSongLibrary: () => Effect.sync(() => undefined),
		getSongLibrarySongIds: vi.fn(() => []),
		subscribeToSongLibrary: vi.fn(
			(): Effect.Effect<() => void, Error> => Effect.sync(() => (): void => undefined),
		),
		subscribeToSongPublic: vi.fn(
			(_songIds: readonly string[]): Effect.Effect<() => void, Error> =>
				Effect.sync(() => (): void => undefined),
		),
		setSongLibraryEntries: vi.fn(),
		setSongLibraryLoading: vi.fn(),
		...overrides,
	};
}

describe("addSongToSongLibrary", () => {
	it("adds a song successfully and updates local state", async () => {
		const mockSlice = createMockSlice();
		const get = vi.fn(() => mockSlice);

		const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
			Response.json(VALID_RESPONSE, {
				status: 200,
				statusText: "OK",
			}),
		);

		await Effect.runPromise(addSongToSongLibrary(VALID_REQUEST, get));

		expect(mockSlice.setSongLibraryError).toHaveBeenCalledWith(undefined);
		expect(mockSlice.addSongLibraryEntry).toHaveBeenCalledWith(
			expect.objectContaining(VALID_RESPONSE),
		);
		expect(mockSlice.setSongLibraryError).not.toHaveBeenCalledWith(expect.stringMatching(/.+/));

		fetchSpy.mockRestore();
	});

	it("skips adding a song that is already in the library", async () => {
		const mockSlice = createMockSlice({
			isInSongLibrary: vi.fn(() => true),
		});
		const get = vi.fn(() => mockSlice);

		const fetchSpy = vi.spyOn(globalThis, "fetch");

		await Effect.runPromise(addSongToSongLibrary(VALID_REQUEST, get));

		expect(fetchSpy).not.toHaveBeenCalled();
		expect(mockSlice.addSongLibraryEntry).not.toHaveBeenCalled();

		fetchSpy.mockRestore();
	});

	it("throws when request validation fails", async () => {
		const mockSlice = createMockSlice();
		const get = vi.fn(() => mockSlice);

		const invalidRequest = forceCast<AddSongToSongLibraryRequest>({ song_id: SONG_ID }); // Missing song_owner_id

		await expect(Effect.runPromise(addSongToSongLibrary(invalidRequest, get))).rejects.toThrow(
			Error,
		);

		expect(mockSlice.setSongLibraryError).toHaveBeenCalledWith(expect.stringMatching(/.+/));
	});

	it("throws when fetch fails with network error", async () => {
		const mockSlice = createMockSlice();
		const get = vi.fn(() => mockSlice);

		const fetchSpy = vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error(ERROR_NETWORK));

		await expect(Effect.runPromise(addSongToSongLibrary(VALID_REQUEST, get))).rejects.toThrow(
			Error,
		);

		expect(mockSlice.setSongLibraryError).toHaveBeenCalledWith(
			expect.stringMatching(new RegExp(ERROR_NETWORK)),
		);

		fetchSpy.mockRestore();
	});

	it("throws when response status is not ok", async () => {
		const mockSlice = createMockSlice();
		const get = vi.fn(() => mockSlice);

		const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
			Response.json(
				{ error: ERROR_ALREADY_IN_LIBRARY },
				{
					status: 400,
					statusText: "Bad Request",
				},
			),
		);

		await expect(Effect.runPromise(addSongToSongLibrary(VALID_REQUEST, get))).rejects.toThrow(
			ERROR_ALREADY_IN_LIBRARY,
		);

		expect(mockSlice.setSongLibraryError).toHaveBeenCalledWith(
			expect.stringMatching(new RegExp(ERROR_ALREADY_IN_LIBRARY)),
		);

		fetchSpy.mockRestore();
	});

	it("throws when response.json() fails", async () => {
		const mockSlice = createMockSlice();
		const get = vi.fn(() => mockSlice);

		const mockResponse = {
			ok: true,
			status: 200,
			statusText: "OK",
			json: vi.fn().mockRejectedValue(new Error(ERROR_PARSE_FAILED)),
		};

		const fetchSpy = vi
			.spyOn(globalThis, "fetch")
			.mockResolvedValue(forceCast<Response>(mockResponse));

		await expect(Effect.runPromise(addSongToSongLibrary(VALID_REQUEST, get))).rejects.toThrow(
			Error,
		);

		expect(mockSlice.setSongLibraryError).toHaveBeenCalledWith(
			expect.stringMatching(/Invalid JSON/),
		);

		fetchSpy.mockRestore();
	});

	it("throws when server response validation fails", async () => {
		const mockSlice = createMockSlice();
		const get = vi.fn(() => mockSlice);

		const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
			Response.json(
				{
					song_id: "song-123",
					// Missing song_owner_id
				},
				{
					status: 200,
					statusText: "OK",
				},
			),
		);

		await expect(Effect.runPromise(addSongToSongLibrary(VALID_REQUEST, get))).rejects.toThrow(
			Error,
		);

		expect(mockSlice.setSongLibraryError).toHaveBeenCalledWith(
			expect.stringMatching(/invalid SongLibraryEntry/),
		);

		fetchSpy.mockRestore();
	});

	it("sends correct request to API endpoint", async () => {
		const mockSlice = createMockSlice();
		const get = vi.fn(() => mockSlice);

		const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
			Response.json(VALID_RESPONSE, {
				status: 200,
				statusText: "OK",
			}),
		);

		await Effect.runPromise(addSongToSongLibrary(VALID_REQUEST, get));

		expect(fetchSpy).toHaveBeenCalledWith(
			apiSongLibraryAddPath,
			expect.objectContaining({
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					song_id: VALID_REQUEST.song_id,
					song_owner_id: VALID_REQUEST.song_owner_id,
				}),
			}),
		);

		fetchSpy.mockRestore();
	});

	it("handles server error response with custom message", async () => {
		const mockSlice = createMockSlice();
		const get = vi.fn(() => mockSlice);

		const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
			Response.json(
				{ error: ERROR_PERMISSION_DENIED },
				{
					status: 403,
					statusText: "Forbidden",
				},
			),
		);

		await expect(Effect.runPromise(addSongToSongLibrary(VALID_REQUEST, get))).rejects.toThrow(
			ERROR_PERMISSION_DENIED,
		);

		fetchSpy.mockRestore();
	});

	it("handles server error response without custom message", async () => {
		const mockSlice = createMockSlice();
		const get = vi.fn(() => mockSlice);

		const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
			Response.json(
				{},
				{
					status: 500,
					statusText: ERROR_SERVER_500,
				},
			),
		);

		await expect(Effect.runPromise(addSongToSongLibrary(VALID_REQUEST, get))).rejects.toThrow(
			`Server returned 500: ${ERROR_SERVER_500}`,
		);

		fetchSpy.mockRestore();
	});
});
