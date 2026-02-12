import { Effect } from "effect";
import { describe, expect, it, vi } from "vitest";

import type { SupabaseClientLike } from "@/react/lib/supabase/client/SupabaseClientLike";

import getSupabaseAuthToken from "@/react/lib/supabase/auth-token/getSupabaseAuthToken";
import getSupabaseClient from "@/react/lib/supabase/client/getSupabaseClient";
import createMinimalSupabaseClient from "@/react/lib/supabase/client/test-utils/createMinimalSupabaseClient.mock";
import { ONE_CALL, TEST_AUTH_TOKEN } from "@/react/lib/test-helpers/test-consts";
import spyImport from "@/react/lib/test-utils/spy-import/spyImport";

import type { SongLibrarySlice } from "./song-library-slice";

import fetchSongLibrary from "./fetchSongLibrary";
import makeSongLibrarySlice from "./makeSongLibrarySlice.mock";

// Auto-mock auth/client modules so we can configure mocks in each test
vi.mock("@/react/lib/supabase/auth-token/getSupabaseAuthToken");
vi.mock("@/react/lib/supabase/client/getSupabaseClient");

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
	const base = createMinimalSupabaseClient();

	function from(table: string): ReturnType<typeof base.from> {
		if (table === "song_library") {
			return { select: vi.fn().mockResolvedValue({ data: songLibrary, error: undefined }) };
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

		return base.from(table);
	}

	return {
		...base,
		from,
	};
}

describe("fetchSongLibrary", () => {
	it("fetches and enriches entries when data is present", async () => {
		const get = makeSongLibrarySlice();
		const slice = get();
		function getMock(): SongLibrarySlice {
			return slice;
		}
		// Configure mocked auth/token and client modules
		const getSupabaseAuthTokenMock = await spyImport(
			"@/react/lib/supabase/auth-token/getSupabaseAuthToken",
		);
		getSupabaseAuthTokenMock.mockResolvedValue?.(TEST_AUTH_TOKEN);
		const getSupabaseClientMock = await spyImport("@/react/lib/supabase/client/getSupabaseClient");
		getSupabaseClientMock.mockReturnValue(createMockClient());
		await Effect.runPromise(fetchSongLibrary(getMock));

		expect(slice.setSongLibraryLoading).toHaveBeenCalledWith(true);
		expect(slice.setSongLibraryEntries).toHaveBeenCalledTimes(ONE_CALL);

		// Build expected object to avoid computed property in expect call
		const expectedEntries: Record<string, unknown> = {};
		expectedEntries[TEST_SONG_ID] = expect.objectContaining({
			owner_username: TEST_OWNER_USERNAME,
			song_name: TEST_SONG_NAME,
			song_slug: TEST_SONG_SLUG,
		});

		expect(slice.setSongLibraryEntries).toHaveBeenCalledWith(
			expect.objectContaining(expectedEntries),
		);
		// ensures loading is cleared in finally
		expect(slice.setSongLibraryLoading).toHaveBeenLastCalledWith(false);

		// Reset mocked implementations for next tests
		vi.mocked(getSupabaseAuthToken).mockReset();
		vi.mocked(getSupabaseClient).mockReset();
		// Reset spies created by test-time helpers
		vi.resetAllMocks();
	});

	it("handles empty song_library gracefully", async () => {
		const get = makeSongLibrarySlice();
		const slice = get();
		function getMock(): SongLibrarySlice {
			return slice;
		}

		const getSupabaseClientMock = await spyImport("@/react/lib/supabase/client/getSupabaseClient");
		getSupabaseClientMock.mockReturnValue(createMockClient({ songLibrary: [] }));

		await Effect.runPromise(fetchSongLibrary(getMock));

		expect(slice.setSongLibraryEntries).toHaveBeenCalledWith({});
		expect(slice.setSongLibraryLoading).toHaveBeenLastCalledWith(false);

		vi.mocked(getSupabaseClient).mockReset();
	});

	it("throws when no supabase client available and cleans up loading flag", async () => {
		const get = makeSongLibrarySlice();
		const slice = get();
		function getMock(): SongLibrarySlice {
			return slice;
		}

		vi.mocked(getSupabaseClient).mockReturnValue(undefined);

		await expect(Effect.runPromise(fetchSongLibrary(getMock))).rejects.toThrow(
			"No Supabase client available",
		);
		expect(slice.setSongLibraryLoading).toHaveBeenCalledWith(true);
		expect(slice.setSongLibraryLoading).toHaveBeenLastCalledWith(false);

		vi.mocked(getSupabaseClient).mockReset();
	});
});
