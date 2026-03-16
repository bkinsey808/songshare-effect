import { Effect } from "effect";
import { describe, expect, it, vi } from "vitest";

import getSupabaseAuthToken from "@/react/lib/supabase/auth-token/getSupabaseAuthToken";
import getSupabaseClient from "@/react/lib/supabase/client/getSupabaseClient";
import callSelect from "@/react/lib/supabase/client/safe-query/callSelect";
import forceCast from "@/react/lib/test-utils/forceCast";
import type { SongSubscribeSlice } from "@/react/song/song-slice/song-slice";

import addActivePublicSongIds from "./addActivePublicSongIds";
import expectAddOrUpdatePublicSongsCalledWithS1 from "./addActivePublicSongIds.test-util";

vi.mock("@/react/lib/supabase/auth-token/getSupabaseAuthToken");
vi.mock("@/react/lib/supabase/client/getSupabaseClient");
vi.mock("@/react/lib/supabase/client/safe-query/callSelect");

function makeSetGet(subscribeUnsubscribe?: () => void): {
	set: ReturnType<typeof vi.fn>;
	get: () => SongSubscribeSlice;
	state: SongSubscribeSlice;
	setCalls: unknown[];
} {
	const setCalls: unknown[] = [];
	const set = vi.fn((partial: unknown) => {
		setCalls.push(partial);
	});
	const state = forceCast<SongSubscribeSlice>({
		activePublicSongIds: [] as string[],
		activePublicSongsUnsubscribe: undefined as (() => void) | undefined,
		subscribeToActivePublicSongs: vi.fn(() => subscribeUnsubscribe ?? ((): void => undefined)),
		addOrUpdatePublicSongs: vi.fn(),
	});
	const get = vi.fn((): SongSubscribeSlice => state);
	return { set, get, state, setCalls };
}

describe("addActivePublicSongIds", () => {
	it("updates activePublicSongIds and subscribes", async () => {
		vi.mocked(getSupabaseAuthToken).mockResolvedValue("token");
		vi.mocked(getSupabaseClient).mockReturnValue(forceCast({}));
		vi.mocked(callSelect).mockResolvedValue(
			forceCast({ data: [{ song_id: "s1", song_slug: "slug" }], error: undefined }),
		);

		const { set, get, state } = makeSetGet();

		const addFn = addActivePublicSongIds(forceCast(set), get);

		await Effect.runPromise(addFn(["s1"]));

		expect(set).toHaveBeenCalledWith(expect.any(Function));
		expectAddOrUpdatePublicSongsCalledWithS1(vi.mocked(state.addOrUpdatePublicSongs));
	});

	it("completes without error when no auth token", async () => {
		vi.clearAllMocks();
		vi.mocked(getSupabaseAuthToken).mockResolvedValue(undefined);
		const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => undefined);

		const { set, get } = makeSetGet();
		const addFn = addActivePublicSongIds(forceCast(set), get);

		await Effect.runPromise(addFn(["s1"]));

		expect(vi.mocked(callSelect)).not.toHaveBeenCalled();
		warnSpy.mockRestore();
	});

	it("completes without error when Supabase client is undefined", async () => {
		vi.clearAllMocks();
		vi.mocked(getSupabaseAuthToken).mockResolvedValue("token");
		vi.mocked(getSupabaseClient).mockReturnValue(undefined);
		const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => undefined);

		const { set, get } = makeSetGet();
		const addFn = addActivePublicSongIds(forceCast(set), get);

		await Effect.runPromise(addFn(["s1"]));

		expect(vi.mocked(callSelect)).not.toHaveBeenCalled();
		warnSpy.mockRestore();
	});
});
