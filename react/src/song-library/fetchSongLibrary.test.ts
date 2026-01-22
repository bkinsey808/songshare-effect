import { describe, expect, it, vi } from "vitest";

import type { SupabaseClientLike } from "@/react/supabase/client/SupabaseClientLike";

import getSupabaseAuthToken from "@/react/supabase/auth-token/getSupabaseAuthToken";
import getSupabaseClient from "@/react/supabase/client/getSupabaseClient";
import { ONE_CALL, TEST_AUTH_TOKEN } from "@/react/test-helpers/test-consts";

import type { SongLibrarySlice } from "./song-library-slice";
import type { SongLibraryEntry } from "./song-library-types";

import fetchSongLibrary from "./fetchSongLibrary";

// Auto-mock auth/client modules so we can configure mocks in each test
vi.mock("@/react/supabase/auth-token/getSupabaseAuthToken");
vi.mock("@/react/supabase/client/getSupabaseClient");

const TEST_USER_ID = "user-1";
const TEST_SONG_ID = "song-1";
const TEST_OWNER_ID = "owner-1";
const TEST_SONG_NAME = "My Song";
const TEST_SONG_SLUG = "my-song";
const TEST_OWNER_USERNAME = "owner_user";

const mockSongLibraryRow = {
	user_id: TEST_USER_ID,
	song_id: TEST_SONG_ID,
	song_owner_id: TEST_OWNER_ID,
	created_at: "2020-01-01T00:00:00.000Z",
};

const mockSongPublicRow = {
	song_id: TEST_SONG_ID,
	song_name: TEST_SONG_NAME,
	song_slug: TEST_SONG_SLUG,
};

const mockOwnerRow = {
	user_id: TEST_OWNER_ID,
	username: TEST_OWNER_USERNAME,
};

function createMockClient({
	songLibrary = [mockSongLibraryRow],
	songPublic = [mockSongPublicRow],
	owners = [mockOwnerRow],
}: {
	songLibrary?: unknown[];
	songPublic?: unknown[];
	owners?: unknown[];
} = {}): SupabaseClientLike {
	const channelLike: {
		on: (event: string, opts: unknown, handler: (payload: unknown) => void) => typeof channelLike;
		subscribe: (cb: (status: string, err?: unknown) => void) => unknown;
	} = {
		on: (_event: string, _opts: unknown, _handler: (payload: unknown) => void) => channelLike,
		subscribe: (_cb: (status: string, err?: unknown) => void) => ({}),
	};

	return {
		from: (table: string) => {
			if (table === "song_library") {
				return {
					select: vi.fn().mockResolvedValue({ data: songLibrary, error: undefined }),
				};
			}

			if (table === "song_public") {
				return {
					select: vi.fn().mockReturnValue({
						in: vi.fn().mockResolvedValue({ data: songPublic, error: undefined }),
					}),
				};
			}

			if (table === "user_public") {
				return {
					select: vi
						.fn()
						.mockReturnValue({ in: vi.fn().mockResolvedValue({ data: owners, error: undefined }) }),
				};
			}

			return { select: vi.fn().mockResolvedValue({ data: [], error: undefined }) };
		},
		channel: (_name: string) => channelLike,
		removeChannel: (_channel: unknown) => undefined,
		auth: { getUser: vi.fn().mockResolvedValue({ data: {}, error: undefined }) },
	};
}

describe("fetchSongLibrary", () => {
	it("fetches and enriches entries when data is present", async () => {
		const setSongLibraryEntries = vi.fn<(entries: Record<string, SongLibraryEntry>) => void>();
		const setSongLibraryLoading = vi.fn<(value: boolean) => void>();
		const setSongLibraryError = vi.fn<(err: unknown) => void>();
		function getMock(): SongLibrarySlice {
			const slice: SongLibrarySlice = {
				songLibraryEntries: {},
				isSongLibraryLoading: false,
				songLibraryError: undefined,
				setSongLibraryError,
				isInSongLibrary: () => false,
				addSongLibraryEntry: () => undefined,
				removeSongLibraryEntry: () => undefined,
				addSongToSongLibrary: async () => {
					await Promise.resolve();
				},
				removeSongFromSongLibrary: async () => {
					await Promise.resolve();
				},
				getSongLibrarySongIds: () => [],
				fetchSongLibrary: async () => {
					await Promise.resolve();
				},
				subscribeToSongLibrary: () => undefined,
				setSongLibraryEntries,
				setSongLibraryLoading,
			};
			return slice;
		}

		// Configure mocked auth/token and client modules
		vi.mocked(getSupabaseAuthToken).mockResolvedValue(TEST_AUTH_TOKEN);
		vi.mocked(getSupabaseClient).mockReturnValue(createMockClient());

		await fetchSongLibrary(getMock);

		expect(setSongLibraryLoading).toHaveBeenCalledWith(true);
		expect(setSongLibraryEntries).toHaveBeenCalledTimes(ONE_CALL);

		// Build expected object to avoid computed property in expect call
		const expectedEntries: Record<string, unknown> = {};
		expectedEntries[TEST_SONG_ID] = expect.objectContaining({
			owner_username: TEST_OWNER_USERNAME,
			song_name: TEST_SONG_NAME,
			song_slug: TEST_SONG_SLUG,
		});

		expect(setSongLibraryEntries).toHaveBeenCalledWith(expect.objectContaining(expectedEntries));
		// ensures loading is cleared in finally
		expect(setSongLibraryLoading).toHaveBeenLastCalledWith(false);

		// Reset mocked implementations for next tests
		vi.mocked(getSupabaseAuthToken).mockReset();
		vi.mocked(getSupabaseClient).mockReset();
	});

	it("handles empty song_library gracefully", async () => {
		const setSongLibraryEntries = vi.fn<(entries: Record<string, SongLibraryEntry>) => void>();
		const setSongLibraryLoading = vi.fn<(value: boolean) => void>();
		const setSongLibraryError = vi.fn<(err: unknown) => void>();
		function getMock(): SongLibrarySlice {
			const slice: SongLibrarySlice = {
				songLibraryEntries: {},
				isSongLibraryLoading: false,
				songLibraryError: undefined,
				setSongLibraryError,
				isInSongLibrary: () => false,
				addSongLibraryEntry: () => undefined,
				removeSongLibraryEntry: () => undefined,
				addSongToSongLibrary: async () => {
					await Promise.resolve();
				},
				removeSongFromSongLibrary: async () => {
					await Promise.resolve();
				},
				getSongLibrarySongIds: () => [],
				fetchSongLibrary: async () => {
					await Promise.resolve();
				},
				subscribeToSongLibrary: () => undefined,
				setSongLibraryEntries,
				setSongLibraryLoading,
			};
			return slice;
		}

		vi.mocked(getSupabaseClient).mockReturnValue(createMockClient({ songLibrary: [] }));

		await fetchSongLibrary(getMock);

		expect(setSongLibraryEntries).toHaveBeenCalledWith({});
		expect(setSongLibraryLoading).toHaveBeenLastCalledWith(false);

		vi.mocked(getSupabaseClient).mockReset();
	});

	it("throws when no supabase client available and cleans up loading flag", async () => {
		const setSongLibraryEntries = vi.fn<(entries: Record<string, SongLibraryEntry>) => void>();
		const setSongLibraryLoading = vi.fn<(value: boolean) => void>();
		const setSongLibraryError = vi.fn<(err: unknown) => void>();
		function getMock(): SongLibrarySlice {
			const slice: SongLibrarySlice = {
				songLibraryEntries: {},
				isSongLibraryLoading: false,
				songLibraryError: undefined,
				setSongLibraryError,
				isInSongLibrary: () => false,
				addSongLibraryEntry: () => undefined,
				removeSongLibraryEntry: () => undefined,
				addSongToSongLibrary: async () => {
					await Promise.resolve();
				},
				removeSongFromSongLibrary: async () => {
					await Promise.resolve();
				},
				getSongLibrarySongIds: () => [],
				fetchSongLibrary: async () => {
					await Promise.resolve();
				},
				subscribeToSongLibrary: () => undefined,
				setSongLibraryEntries,
				setSongLibraryLoading,
			};
			return slice;
		}

		vi.mocked(getSupabaseClient).mockReturnValue(undefined);

		await expect(fetchSongLibrary(getMock)).rejects.toThrow("No Supabase client available");
		expect(setSongLibraryLoading).toHaveBeenCalledWith(true);
		expect(setSongLibraryLoading).toHaveBeenLastCalledWith(false);

		vi.mocked(getSupabaseClient).mockReset();
	});
});
