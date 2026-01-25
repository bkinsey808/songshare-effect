/* eslint-disable import/first */
import { Effect } from "effect";
import { describe, expect, it, vi } from "vitest";

// Mock the supabase client factory before importing the module under test
vi.mock("@/react/supabase/client/getSupabaseClientWithAuth");

import { REALTIME_SUBSCRIBE_STATES } from "@supabase/supabase-js";
import assert from "node:assert";
import { setTimeout as delay } from "node:timers/promises";

import type { SupabaseClientLike } from "@/react/supabase/client/SupabaseClientLike";

import getSupabaseClientWithAuth from "@/react/supabase/client/getSupabaseClientWithAuth";

import type { SongSubscribeSlice } from "./song-slice";

import subscribeToActivePublicSongs from "./subscribeToActivePublicSongs";

const MACROTASK_DELAY = 0;
async function flushPromises(): Promise<void> {
	// Allow microtasks to run then yield a macrotask tick for any scheduled timers.
	await Promise.resolve();
	await Promise.resolve();
	await delay(MACROTASK_DELAY);
}

function makeGetWithActiveIds(ids: readonly string[]): SongSubscribeSlice {
	return {
		privateSongs: {},
		publicSongs: {},
		activePrivateSongIds: [],
		activePublicSongIds: ids,
		addOrUpdatePrivateSongs: () => undefined,
		addOrUpdatePublicSongs: () => undefined,
		addActivePrivateSongIds: (_songIds: readonly string[]) => Effect.sync(() => undefined),
		addActivePublicSongIds: (_songIds: readonly string[]) => Effect.sync(() => undefined),
		addActivePrivateSongSlugs: async (): Promise<void> => {
			await Promise.resolve();
		},
		addActivePublicSongSlugs: async (): Promise<void> => {
			await Promise.resolve();
		},
		removeActivePrivateSongIds: (_songIds: readonly string[]) => undefined,
		removeActivePublicSongIds: (_songIds: readonly string[]) => undefined,
		removeSongsFromCache: (_songIds: readonly string[]) => undefined,
		subscribeToActivePrivateSongs: () => undefined,
		subscribeToActivePublicSongs: () => undefined,
		getSongBySlug: () => undefined,
	};
}

function noopHandler(_payload: unknown): void {
	/* noop */
}

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

		const mockClient: SupabaseClientLike = {
			from: (_table: string) => ({
				select: vi.fn().mockResolvedValue({ data: [], error: undefined }),
			}),
			channel: () => mockChannel,
			removeChannel: removeChannelSpy,
			auth: { getUser: vi.fn().mockResolvedValue({ data: {}, error: undefined }) },
		} as const;

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

		const mockClient: SupabaseClientLike = {
			from: (_table: string) => ({
				select: vi.fn().mockResolvedValue({ data: [], error: undefined }),
			}),
			channel: () => mockChannel,
			removeChannel: removeChannelSpy,
			auth: { getUser: vi.fn().mockResolvedValue({ data: {}, error: undefined }) },
		} as const;

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
