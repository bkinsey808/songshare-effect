import { REALTIME_SUBSCRIBE_STATES } from "@supabase/supabase-js";
import assert from "node:assert";
import { setTimeout as delay } from "node:timers/promises";
import { describe, expect, it, vi } from "vitest";

import type {
	RealtimeChannelLike,
	SupabaseClientLike,
} from "@/react/lib/supabase/client/SupabaseClientLike";

import createMinimalSupabaseClient from "@/react/lib/supabase/client/createMinimalSupabaseClient.test-util";
import getSupabaseClientWithAuth from "@/react/lib/supabase/client/getSupabaseClientWithAuth";
import asNull from "@/react/lib/test-utils/asNull";
import forceCast from "@/react/lib/test-utils/forceCast";

import type { SongSubscribeSlice } from "../song-slice/song-slice";

import makeSongSubscribeSlice from "../song-slice/makeSongSubscribeSlice.mock";
import subscribeToActivePublicSongs from "./subscribeToActivePublicSongs";

// Mock the supabase client factory before importing the module under test
vi.mock("@/react/lib/supabase/client/getSupabaseClientWithAuth");

const MACROTASK_DELAY = 0;
/**
 * Advance microtasks and a macrotask tick so tests can observe async effects
 * that are scheduled to run on the next micro/macro tick (subscriptions, timers, etc.).
 */
async function flushPromises(): Promise<void> {
	await Promise.resolve();
	await Promise.resolve();
	await delay(MACROTASK_DELAY);
}

/**
 * Minimal `SongSubscribeSlice` factory used in tests.
 * It provides just the fields and stubbed methods that `subscribeToActivePublicSongs`
 * interacts with so tests can focus on subscription behavior.
 *
 * @param ids - active public song ids to seed the slice with
 * @returns SongSubscribeSlice test stub
 */
function makeGetWithActiveIds(ids: readonly string[]): SongSubscribeSlice {
	const get = makeSongSubscribeSlice({ initialActivePublicSongIds: ids });
	return get();
}

/** No-op handler used to initialize handler vars in tests. */
function noopHandler(_payload: unknown): void {
	/* noop */
}

/**
 * Type guard that verifies a value is a `set` updater function that transforms
 * the current `SongSubscribeSlice` into a partial update.
 */
function isUpdater(
	value: unknown,
): value is (state: Readonly<SongSubscribeSlice>) => Partial<Readonly<SongSubscribeSlice>> {
	return typeof value === "function";
}

describe("subscribeToActivePublicSongs", () => {
	it("calls addOrUpdatePublicSongs for INSERT and UPDATE when payload includes valid SongPublic", async () => {
		let capturedHandler: (payload: unknown) => void = noopHandler;
		const removeChannelSpy = vi.fn();

		const mockChannel = {
			on: (_event: string, _opts: unknown, handler: (payload: unknown) => void) => {
				capturedHandler = handler;
				return mockChannel;
			},
			subscribe: (cb?: (status: string, err: unknown) => void) => {
				cb?.(String(REALTIME_SUBSCRIBE_STATES.SUBSCRIBED), undefined);
			},
		} as const;

		// Use shared helper for consistent, typed minimal client
		const mockClient: SupabaseClientLike = createMinimalSupabaseClient();
		mockClient.channel = (): RealtimeChannelLike => mockChannel;
		mockClient.removeChannel = removeChannelSpy;

		vi.mocked(getSupabaseClientWithAuth).mockResolvedValue(mockClient);

		const addOrUpdatePublicSongs = vi.fn();
		function get(): SongSubscribeSlice {
			const state = makeGetWithActiveIds(["abc"]);
			state.addOrUpdatePublicSongs = addOrUpdatePublicSongs;
			return state;
		}

		const set: (
			partial:
				| Partial<Readonly<SongSubscribeSlice>>
				| ((state: Readonly<SongSubscribeSlice>) => Partial<Readonly<SongSubscribeSlice>>),
		) => void = vi.fn();

		const start = subscribeToActivePublicSongs(set, get);
		const cleanup = start();

		await flushPromises();

		expect(typeof capturedHandler).toBe("function");

		// Simulate INSERT
		const newSong = { song_id: "abc", song_slug: "slug-abc", title: "Title" };
		capturedHandler?.({ eventType: "INSERT", new: newSong });

		expect(addOrUpdatePublicSongs).toHaveBeenCalledWith({ abc: newSong });

		// Simulate UPDATE
		const updatedSong = { song_id: "abc", song_slug: "slug-abc", title: "Updated" };
		capturedHandler?.({ eventType: "UPDATE", new: updatedSong });

		expect(addOrUpdatePublicSongs).toHaveBeenCalledWith({ abc: updatedSong });

		// Ensure cleanup removes channel and was called with the channel object
		cleanup?.();
		expect(removeChannelSpy).toHaveBeenCalledWith(expect.any(Object));
	});

	it("ignores payloads that are not SongPublic and handles DELETE via set updater", async () => {
		let channelHandler: (payload: unknown) => void = noopHandler;
		const removeChannelSpy = vi.fn();

		const mockChannel = {
			on: (_event: string, _opts: unknown, handler: (payload: unknown) => void) => {
				channelHandler = handler;
				return mockChannel;
			},
			subscribe: (cb?: (status: string, err: unknown) => void) => {
				cb?.(String(REALTIME_SUBSCRIBE_STATES.SUBSCRIBED), undefined);
			},
		} as const;

		const mockClient: SupabaseClientLike = createMinimalSupabaseClient();
		mockClient.from = (_table: string): ReturnType<typeof mockClient.from> => ({
			select: vi.fn().mockResolvedValue({ data: [], error: undefined }),
		});
		mockClient.channel = (): RealtimeChannelLike => mockChannel;
		mockClient.removeChannel = removeChannelSpy;
		vi.spyOn(mockClient.auth, "getUser").mockResolvedValue(
			forceCast({
				data: { user: asNull() },
				error: asNull(),
			}),
		);

		vi.mocked(getSupabaseClientWithAuth).mockResolvedValue(mockClient);

		const addOrUpdatePublicSongs = vi.fn();
		function get(): SongSubscribeSlice {
			const state = makeGetWithActiveIds(["abc"]);
			state.addOrUpdatePublicSongs = addOrUpdatePublicSongs;
			return state;
		}

		const songPublic = {
			song_id: "abc",
			song_name: "Test",
			song_slug: "slug-abc",
			fields: ["lyrics" as const],
			slide_order: [],
			slides: {},
			key: "",
			scale: "",
			user_id: "user-1",
			short_credit: "",
			long_credit: "",
			public_notes: "",
			created_at: "2026-01-01T00:00:00Z",
			updated_at: "2026-01-01T00:00:00Z",
		} as const;
		// `fullState` models the pre-delete state (song present) so the DELETE
		// handler's updater can be applied and validated against this state.
		const fullState: Readonly<SongSubscribeSlice> = {
			...makeGetWithActiveIds(["abc"]),
			publicSongs: { abc: songPublic },
			activePublicSongIds: ["abc"],
		};

		const set =
			vi.fn<
				(
					partial:
						| Partial<Readonly<SongSubscribeSlice>>
						| ((state: Readonly<SongSubscribeSlice>) => Partial<Readonly<SongSubscribeSlice>>),
				) => void
			>();

		const start = subscribeToActivePublicSongs(set, get);
		start();

		await flushPromises();

		// Non-SongPublic new should be ignored
		channelHandler({
			eventType: "INSERT",
			new: { not_song: true },
		});
		expect(addOrUpdatePublicSongs).not.toHaveBeenCalled();

		// DELETE should call set updater which removes the song id from publicSongs and activePublicSongIds
		channelHandler({
			eventType: "DELETE",
			old: songPublic,
		});

		const ARG_INDEX = 0;
		const hasFunctionArg = set.mock.calls.some(
			(call) => typeof (call as unknown[])[ARG_INDEX] === "function",
		);
		expect(hasFunctionArg).toBe(true);
		const callWithFnArg = set.mock.calls.find(
			(call) => typeof (call as unknown[])[ARG_INDEX] === "function",
		)?.[ARG_INDEX];
		assert.ok(isUpdater(callWithFnArg), "expected set to be called with an updater function");
		const updater = callWithFnArg;
		const partial = updater(fullState);
		expect(partial.publicSongs).toStrictEqual({});
		expect(partial.activePublicSongIds).toStrictEqual([]);
	});
});
