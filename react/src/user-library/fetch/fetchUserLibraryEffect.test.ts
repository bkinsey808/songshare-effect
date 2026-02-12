import { Effect } from "effect";
import { describe, expect, it, vi } from "vitest";

import type { PostgrestResponse } from "@/react/lib/supabase/client/SupabaseClientLike";

import getSupabaseAuthToken from "@/react/lib/supabase/auth-token/getSupabaseAuthToken";
import getSupabaseClient from "@/react/lib/supabase/client/getSupabaseClient";
import createMinimalSupabaseClient from "@/react/lib/supabase/client/test-utils/createMinimalSupabaseClient.mock";
import asPostgrestResponse from "@/react/lib/test-utils/asPostgrestResponse";
import spyImport from "@/react/lib/test-utils/spy-import/spyImport";
import makeUserPublic from "@/react/playlist/test-utils/makeUserPublic.mock";

import makeUserLibrarySlice from "../slice/makeUserLibrarySlice.mock";
import makeUserLibraryEntry from "../test-utils/makeUserLibraryEntry.mock";
import fetchUserLibrary from "./fetchUserLibraryEffect";

vi.mock("@/react/lib/supabase/auth-token/getSupabaseAuthToken");
vi.mock("@/react/lib/supabase/client/getSupabaseClient");
vi.mock("@/react/lib/supabase/client/safe-query/callSelect");

const TEST_TOKEN = "token-1";
const TEST_USER_ID = "user-1";
const TEST_FOLLOWED_ID = "followed-1";
const TEST_USERNAME = "owner_user";

const minimalClient = createMinimalSupabaseClient();

describe("fetchUserLibraryEffect", () => {
	it("fetches and applies entries when data present", async () => {
		vi.resetAllMocks();
		vi.mocked(getSupabaseAuthToken).mockResolvedValue(TEST_TOKEN);
		vi.mocked(getSupabaseClient).mockReturnValue(minimalClient);

		const libRow = makeUserLibraryEntry({
			user_id: TEST_USER_ID,
			followed_user_id: TEST_FOLLOWED_ID,
		});
		const ownerRow = makeUserPublic({ user_id: TEST_FOLLOWED_ID, username: TEST_USERNAME });

		const callSelectMock = await spyImport("@/react/lib/supabase/client/safe-query/callSelect");
		callSelectMock
			.mockResolvedValueOnce({ data: [libRow] } as PostgrestResponse)
			.mockResolvedValueOnce({ data: [ownerRow] } as PostgrestResponse);

		const get = makeUserLibrarySlice();
		const slice = get();

		await expect(Effect.runPromise(fetchUserLibrary(get))).resolves.toBeUndefined();

		expect(slice.setUserLibraryLoading).toHaveBeenCalledWith(true);

		const expected: Record<string, unknown> = {};
		expected[TEST_FOLLOWED_ID] = expect.objectContaining({ owner_username: TEST_USERNAME });
		expect(slice.setUserLibraryEntries).toHaveBeenCalledWith(expect.objectContaining(expected));
		expect(slice.setUserLibraryLoading).toHaveBeenLastCalledWith(false);

		vi.mocked(getSupabaseAuthToken).mockReset();
		vi.mocked(getSupabaseClient).mockReset();
	});

	it("handles empty user_library gracefully", async () => {
		vi.resetAllMocks();
		const getSupabaseAuthTokenMock = await spyImport(
			"@/react/lib/supabase/auth-token/getSupabaseAuthToken",
		);
		getSupabaseAuthTokenMock.mockResolvedValue?.(TEST_TOKEN);
		const getSupabaseClientMock = await spyImport("@/react/lib/supabase/client/getSupabaseClient");
		getSupabaseClientMock.mockReturnValue?.(minimalClient);

		/* eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- test-time spy */
		const callSelectMock = await spyImport("@/react/lib/supabase/client/safe-query/callSelect");
		callSelectMock.mockResolvedValueOnce({ data: [] } as PostgrestResponse);
		callSelectMock.mockResolvedValueOnce({ data: [] } as PostgrestResponse);

		const get = makeUserLibrarySlice();
		const slice = get();
		await Effect.runPromise(fetchUserLibrary(get));

		expect(slice.setUserLibraryEntries).toHaveBeenCalledWith({});
		expect(slice.setUserLibraryLoading).toHaveBeenLastCalledWith(false);

		vi.mocked(getSupabaseAuthToken).mockReset();
		vi.mocked(getSupabaseClient).mockReset();
	});

	it("throws when no supabase client available and cleans up loading flag", async () => {
		vi.resetAllMocks();
		const getSupabaseAuthTokenMock = await spyImport(
			"@/react/lib/supabase/auth-token/getSupabaseAuthToken",
		);
		getSupabaseAuthTokenMock.mockResolvedValue(TEST_TOKEN);
		const getSupabaseClientMock = await spyImport("@/react/lib/supabase/client/getSupabaseClient");
		getSupabaseClientMock.mockReturnValue?.(undefined);

		const get = makeUserLibrarySlice();
		const slice = get();

		await expect(Effect.runPromise(fetchUserLibrary(get))).rejects.toThrow(
			"No Supabase client available",
		);
		expect(slice.setUserLibraryLoading).toHaveBeenCalledWith(true);
		expect(slice.setUserLibraryLoading).toHaveBeenLastCalledWith(false);

		vi.mocked(getSupabaseAuthToken).mockReset();
		vi.mocked(getSupabaseClient).mockReset();
	});

	it("maps invalid library response to error and sets error state", async () => {
		vi.resetAllMocks();
		const getSupabaseAuthTokenMock = await spyImport(
			"@/react/lib/supabase/auth-token/getSupabaseAuthToken",
		);
		getSupabaseAuthTokenMock.mockResolvedValue(TEST_TOKEN);
		const getSupabaseClientMock = await spyImport("@/react/lib/supabase/client/getSupabaseClient");
		getSupabaseClientMock.mockReturnValue(minimalClient);

		const callSelectMock = await spyImport("@/react/lib/supabase/client/safe-query/callSelect");
		callSelectMock.mockResolvedValueOnce(asPostgrestResponse(undefined));

		const get = makeUserLibrarySlice();
		const slice = get();

		await expect(Effect.runPromise(fetchUserLibrary(get))).rejects.toThrow(
			/Invalid response from Supabase fetching user_library/,
		);

		expect(slice.setUserLibraryError).toHaveBeenCalledWith(expect.anything());
		expect(slice.setUserLibraryLoading).toHaveBeenLastCalledWith(false);
	});

	it("maps invalid owner response to error and sets error state", async () => {
		vi.resetAllMocks();
		const getSupabaseAuthTokenMock = await spyImport(
			"@/react/lib/supabase/auth-token/getSupabaseAuthToken",
		);
		getSupabaseAuthTokenMock.mockResolvedValue(TEST_TOKEN);
		const getSupabaseClientMock = await spyImport("@/react/lib/supabase/client/getSupabaseClient");
		getSupabaseClientMock.mockReturnValue(minimalClient);

		const libRow = {
			user_id: TEST_USER_ID,
			followed_user_id: TEST_FOLLOWED_ID,
			created_at: "2020-01-01T00:00:00.000Z",
		};

		const callSelectMock = await spyImport("@/react/lib/supabase/client/safe-query/callSelect");
		callSelectMock
			.mockResolvedValueOnce(asPostgrestResponse({ data: [libRow] }))
			.mockResolvedValueOnce(asPostgrestResponse(undefined));
		const get = makeUserLibrarySlice();
		const slice = get();

		await expect(Effect.runPromise(fetchUserLibrary(get))).rejects.toThrow(
			/Invalid response from Supabase fetching user_public/,
		);

		expect(slice.setUserLibraryError).toHaveBeenCalledWith(expect.anything());
		expect(slice.setUserLibraryLoading).toHaveBeenLastCalledWith(false);
	});
});
