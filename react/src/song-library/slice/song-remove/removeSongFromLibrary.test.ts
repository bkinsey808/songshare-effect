import { Effect } from "effect";
import { describe, expect, it, vi } from "vitest";

import forceCast from "@/react/lib/test-utils/forceCast";
import spyImport from "@/react/lib/test-utils/spy-import/spyImport";

import type { SongLibrarySlice } from "../song-library-slice";
import type { RemoveSongFromSongLibraryRequest } from "../song-library-types";

import removeSongFromSongLibrary from "./removeSongFromLibrary";
const unsafeAs = forceCast;

type TestSpy = {
	mockResolvedValue: (val: unknown) => void;
	mockRejectedValue: (err: unknown) => void;
	mockReturnValue: (val: unknown) => void;
};

// Mock modules
vi.mock("@/react/utils/clientLogger");
vi.mock("@/react/lib/supabase/auth-token/getSupabaseAuthToken");
vi.mock("@/react/lib/supabase/client/getSupabaseClient");

// Test constants
const SONG_ID = "song-123";
const ERROR_AUTH_FAILED = "Failed to get auth token";
const ERROR_NO_CLIENT = "No Supabase client available";
const ERROR_INVALID_REQUEST = "Invalid request to removeSongFromSongLibrary: missing song_id";

const VALID_REQUEST: RemoveSongFromSongLibraryRequest = {
	song_id: SONG_ID,
};

function createMockSlice(overrides: Partial<SongLibrarySlice> = {}): SongLibrarySlice {
	const baseSlice: SongLibrarySlice = {
		songLibraryEntries: {},
		isSongLibraryLoading: false,
		songLibraryError: undefined,
		isInSongLibrary: vi.fn(() => true),
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
	};
	return { ...baseSlice, ...overrides };
}

describe("removeSongFromSongLibrary", () => {
	it("removes a song successfully and updates local state", async () => {
		const mockSlice = createMockSlice();
		const get = vi.fn(() => mockSlice);

		const getSupabaseAuthTokenModule =
			await import("@/react/lib/supabase/auth-token/getSupabaseAuthToken");
		const mockGetSupabaseAuthToken = forceCast<TestSpy>(
			vi.spyOn(getSupabaseAuthTokenModule, "default"),
		);
		mockGetSupabaseAuthToken.mockResolvedValue("test-token");

		const mockDeleteEq = vi.fn().mockResolvedValue({});
		const getSupabaseClientModule = await import("@/react/lib/supabase/client/getSupabaseClient");

		const mockGetSupabaseClient = forceCast<TestSpy>(vi.spyOn(getSupabaseClientModule, "default"));
		mockGetSupabaseClient.mockReturnValue(
			forceCast<ReturnType<typeof getSupabaseClientModule.default>>({
				from: vi.fn().mockReturnValue({
					delete: vi.fn().mockReturnValue({
						eq: mockDeleteEq,
					}),
				}),
			}),
		);

		await Effect.runPromise(removeSongFromSongLibrary(VALID_REQUEST, get));

		expect(mockSlice.setSongLibraryError).toHaveBeenCalledWith(undefined);
		expect(mockSlice.removeSongLibraryEntry).toHaveBeenCalledWith(SONG_ID);
		expect(mockDeleteEq).toHaveBeenCalledWith("song_id", SONG_ID);
	});

	it("skips removing a song that is not in the library", async () => {
		const mockSlice = createMockSlice({
			isInSongLibrary: vi.fn(() => false),
		});
		const get = vi.fn(() => mockSlice);

		await Effect.runPromise(removeSongFromSongLibrary(VALID_REQUEST, get));

		expect(mockSlice.removeSongLibraryEntry).not.toHaveBeenCalled();
	});

	it("throws when request validation fails", async () => {
		const mockSlice = createMockSlice();
		const get = vi.fn(() => mockSlice);

		const invalidRequest = forceCast<RemoveSongFromSongLibraryRequest>({}); // Missing song_id

		await expect(Effect.runPromise(removeSongFromSongLibrary(invalidRequest, get))).rejects.toThrow(
			Error,
		);

		expect(mockSlice.setSongLibraryError).toHaveBeenCalledWith(
			expect.stringMatching(new RegExp(ERROR_INVALID_REQUEST)),
		);
	});

	it("throws when auth token fetch fails", async () => {
		const mockSlice = createMockSlice();
		const get = vi.fn(() => mockSlice);

		const mockGetSupabaseAuthToken = forceCast<TestSpy>(
			await spyImport("@/react/lib/supabase/auth-token/getSupabaseAuthToken"),
		);
		mockGetSupabaseAuthToken.mockRejectedValue(new Error(ERROR_AUTH_FAILED));

		await expect(Effect.runPromise(removeSongFromSongLibrary(VALID_REQUEST, get))).rejects.toThrow(
			Error,
		);

		expect(mockSlice.setSongLibraryError).toHaveBeenCalledWith(
			expect.stringMatching(new RegExp(ERROR_AUTH_FAILED)),
		);
	});

	it("throws when no Supabase client available", async () => {
		const mockSlice = createMockSlice();
		const get = vi.fn(() => mockSlice);

		const mockGetSupabaseAuthToken = forceCast<TestSpy>(
			await spyImport("@/react/lib/supabase/auth-token/getSupabaseAuthToken"),
		);
		mockGetSupabaseAuthToken.mockResolvedValue("test-token");

		const mockGetSupabaseClient = forceCast<TestSpy>(
			await spyImport("@/react/lib/supabase/client/getSupabaseClient"),
		);
		mockGetSupabaseClient.mockReturnValue(undefined);

		await expect(Effect.runPromise(removeSongFromSongLibrary(VALID_REQUEST, get))).rejects.toThrow(
			Error,
		);

		expect(mockSlice.setSongLibraryError).toHaveBeenCalledWith(
			expect.stringMatching(new RegExp(ERROR_NO_CLIENT)),
		);
	});

	it("throws when delete fails with server error", async () => {
		const mockSlice = createMockSlice();
		const get = vi.fn(() => mockSlice);

		const getSupabaseAuthTokenModule =
			await import("@/react/lib/supabase/auth-token/getSupabaseAuthToken");
		vi.mocked(getSupabaseAuthTokenModule.default).mockResolvedValue("test-token");

		const serverError = "Permission denied";
		const mockDeleteEq = vi.fn().mockResolvedValue({
			error: serverError,
		});
		const getSupabaseClientModule = await import("@/react/lib/supabase/client/getSupabaseClient");
		vi.mocked(getSupabaseClientModule.default).mockReturnValue(
			forceCast<ReturnType<typeof getSupabaseClientModule.default>>({
				from: vi.fn().mockReturnValue({
					delete: vi.fn().mockReturnValue({
						eq: mockDeleteEq,
					}),
				}),
			}),
		);

		await expect(Effect.runPromise(removeSongFromSongLibrary(VALID_REQUEST, get))).rejects.toThrow(
			Error,
		);

		expect(mockSlice.setSongLibraryError).toHaveBeenCalledWith(expect.stringMatching(/.+/));
	});

	it("sends correct delete request to Supabase", async () => {
		const mockSlice = createMockSlice();
		const get = vi.fn(() => mockSlice);

		const getSupabaseAuthTokenModule =
			await import("@/react/lib/supabase/auth-token/getSupabaseAuthToken");
		vi.mocked(getSupabaseAuthTokenModule.default).mockResolvedValue("test-token");

		const mockDeleteEq = vi.fn().mockResolvedValue({});
		const mockDelete = vi.fn().mockReturnValue({
			eq: mockDeleteEq,
		});
		const mockFrom = vi.fn().mockReturnValue({
			delete: mockDelete,
		});

		const getSupabaseClientModule = await import("@/react/lib/supabase/client/getSupabaseClient");
		vi.mocked(getSupabaseClientModule.default).mockReturnValue(
			forceCast<ReturnType<typeof getSupabaseClientModule.default>>({
				from: mockFrom,
			}),
		);

		await Effect.runPromise(removeSongFromSongLibrary(VALID_REQUEST, get));

		expect(mockFrom).toHaveBeenCalledWith("song_library");
		expect(mockDelete).toHaveBeenCalledWith();
		expect(mockDeleteEq).toHaveBeenCalledWith("song_id", SONG_ID);
	});

	it("clears previous errors before operation", async () => {
		const mockSlice = createMockSlice({
			songLibraryError: "Previous error",
		});
		const get = vi.fn(() => mockSlice);

		const getSupabaseAuthTokenModule =
			await import("@/react/lib/supabase/auth-token/getSupabaseAuthToken");
		vi.mocked(getSupabaseAuthTokenModule.default).mockResolvedValue("test-token");

		const mockDeleteEq = vi.fn().mockResolvedValue({});
		const getSupabaseClientModule = await import("@/react/lib/supabase/client/getSupabaseClient");
		vi.mocked(getSupabaseClientModule.default).mockReturnValue(
			unsafeAs<ReturnType<typeof getSupabaseClientModule.default>>({
				from: vi.fn().mockReturnValue({
					delete: vi.fn().mockReturnValue({
						eq: mockDeleteEq,
					}),
				}),
			}),
		);

		await Effect.runPromise(removeSongFromSongLibrary(VALID_REQUEST, get));

		// Verify first call cleared error
		const callIndex = 0;
		const { mock: setSongLibraryErrorMock } = vi.mocked(mockSlice.setSongLibraryError);
		expect(setSongLibraryErrorMock.calls[callIndex]).toStrictEqual([undefined]);
	});

	it("handles invalid Supabase client response", async () => {
		const mockSlice = createMockSlice();
		const get = vi.fn(() => mockSlice);

		const getSupabaseAuthTokenModule =
			await import("@/react/lib/supabase/auth-token/getSupabaseAuthToken");
		vi.mocked(getSupabaseAuthTokenModule.default).mockResolvedValue("test-token");

		// Return invalid response (not a record with error property)
		const mockDeleteEq = vi.fn().mockResolvedValue(undefined);
		const getSupabaseClientModule = await import("@/react/lib/supabase/client/getSupabaseClient");
		vi.mocked(getSupabaseClientModule.default).mockReturnValue(
			unsafeAs<ReturnType<typeof getSupabaseClientModule.default>>({
				from: vi.fn().mockReturnValue({
					delete: vi.fn().mockReturnValue({
						eq: mockDeleteEq,
					}),
				}),
			}),
		);

		await expect(Effect.runPromise(removeSongFromSongLibrary(VALID_REQUEST, get))).rejects.toThrow(
			Error,
		);

		expect(mockSlice.setSongLibraryError).toHaveBeenCalledWith(
			expect.stringMatching(/Invalid response/),
		);
	});

	it("removes from local state after successful delete", async () => {
		const mockSlice = createMockSlice();
		const get = vi.fn(() => mockSlice);

		const getSupabaseAuthTokenModule =
			await import("@/react/lib/supabase/auth-token/getSupabaseAuthToken");
		vi.mocked(getSupabaseAuthTokenModule.default).mockResolvedValue("test-token");

		const mockDeleteEq = vi.fn().mockResolvedValue({});
		const getSupabaseClientModule = await import("@/react/lib/supabase/client/getSupabaseClient");
		vi.mocked(getSupabaseClientModule.default).mockReturnValue(
			unsafeAs<ReturnType<typeof getSupabaseClientModule.default>>({
				from: vi.fn().mockReturnValue({
					delete: vi.fn().mockReturnValue({
						eq: mockDeleteEq,
					}),
				}),
			}),
		);

		await Effect.runPromise(removeSongFromSongLibrary(VALID_REQUEST, get));

		expect(mockSlice.removeSongLibraryEntry).toHaveBeenCalledWith(SONG_ID);
	});
});
