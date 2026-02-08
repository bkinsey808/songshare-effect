// Mock registrations will be applied after imports to (1) satisfy import/first
// and (2) still allow per-test mock configuration inside the tests.
import { Effect } from "effect";
import { setTimeout as delay } from "node:timers/promises";
import { describe, expect, it, vi } from "vitest";

import type { SupabaseClientLike } from "@/react/lib/supabase/client/SupabaseClientLike";

import getSupabaseAuthToken from "@/react/lib/supabase/auth-token/getSupabaseAuthToken";
import getSupabaseClient from "@/react/lib/supabase/client/getSupabaseClient";
import createMinimalSupabaseClient from "@/react/lib/supabase/client/test-utils/createMinimalSupabaseClient.mock";

import type { SongSubscribeSlice } from "../song-slice/song-slice";

import subscribeToActivePrivateSongs from "./subscribeToActivePrivateSongs";

// Register mocks for auth tokens and client modules (top-level registration is
// fine because `subscribeToActivePrivateSongs` performs its work inside an
// async IIFE and will use the mocked functions at call-time).
vi.mock("@/react/supabase/auth-token/getSupabaseAuthToken");
vi.mock("@/react/supabase/client/getSupabaseClient");

/**
 * createMinimalClient
 *
 * Returns a minimal Supabase-like client used in tests. All network-facing
 * methods are stubbed so tests remain synchronous and deterministic.
 *
 * @returns a `SupabaseClientLike` with stubbed methods
 */
function createMinimalClient(): SupabaseClientLike {
	return createMinimalSupabaseClient();
}

/** Delay used by `flushPromises` to yield a macrotask tick; `0` is sufficient for tests */
const MACROTASK_DELAY = 0;

/**
 * flushPromises
 *
 * Advances the JS microtask and macrotask queues to allow the async IIFE
 * inside the subscription factory to start and complete any scheduled work.
 * Waiting two microtask ticks then a macrotask avoids flakiness in tests.
 */
async function flushPromises(): Promise<void> {
	// Let microtasks complete then yield to a macrotask in case the async IIFE
	// schedules work that requires an additional tick.
	// First microtask tick: allow the async IIFE to start and schedule its inner microtasks.
	await Promise.resolve();
	// Second microtask tick: run microtasks that the IIFE scheduled (avoids flakiness).
	await Promise.resolve();
	// Finally yield a macrotask tick for any timers or macrotask-scheduled work.
	await delay(MACROTASK_DELAY);
}

/**
 * makeGetWithActiveIds
 *
 * Produces a minimal `SongSubscribeSlice` with the given `activePrivateSongIds`.
 * All mutating helpers are implemented as no-ops or synchronous Effects so
 * unit tests can exercise subscription-related control flow without side effects.
 *
 * @param ids - active private song ids to include in the returned slice
 * @returns a minimal `SongSubscribeSlice` suitable for tests
 */
function makeGetWithActiveIds(ids: readonly string[]): SongSubscribeSlice {
	return {
		privateSongs: {},
		publicSongs: {},
		activePrivateSongIds: ids,
		activePublicSongIds: [],
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

// Ensures the factory returns a no-op unsubscribe, warns correctly when there
// is no Supabase client or no active IDs, and logs errors when token fetching fails.
describe("subscribeToActivePrivateSongs", () => {
	it("returns an unsubscribe function and warns when no Supabase client is available", async () => {
		const warnSpy = vi
			.spyOn(console, "warn")
			.mockImplementation((..._args: unknown[]) => undefined);

		vi.mocked(getSupabaseAuthToken).mockResolvedValue("token");
		vi.mocked(getSupabaseClient).mockReturnValue(undefined);

		const set = vi.fn();
		function get(): SongSubscribeSlice {
			return makeGetWithActiveIds(["song-1"]);
		}

		const factory = subscribeToActivePrivateSongs(set, get);
		const unsub = factory();

		expect(typeof unsub).toBe("function");

		await flushPromises();

		expect(warnSpy).toHaveBeenCalledWith("[subscribeToActivePrivateSongs] No Supabase client");

		// unsubscribe function should be defined (no-op)
		expect(unsub).toBeDefined();

		warnSpy.mockRestore();
		vi.mocked(getSupabaseAuthToken).mockReset();
		vi.mocked(getSupabaseClient).mockReset();
	});

	it("warns and skips subscription when there are no active private song ids", async () => {
		const warnSpy = vi
			.spyOn(console, "warn")
			.mockImplementation((..._args: unknown[]) => undefined);

		vi.mocked(getSupabaseAuthToken).mockResolvedValue("token");
		vi.mocked(getSupabaseClient).mockReturnValue(createMinimalClient());

		const set = vi.fn();
		function get(): SongSubscribeSlice {
			return makeGetWithActiveIds([]);
		}

		const factory = subscribeToActivePrivateSongs(set, get);
		factory();

		await flushPromises();

		expect(warnSpy).toHaveBeenCalledWith(
			"[subscribeToActivePrivateSongs] No activeSongIds, skipping subscription",
		);

		warnSpy.mockRestore();
		vi.mocked(getSupabaseAuthToken).mockReset();
		vi.mocked(getSupabaseClient).mockReset();
	});

	it("warns that realtime subscription is disabled when there are active private song ids", async () => {
		const warnSpy = vi
			.spyOn(console, "warn")
			.mockImplementation((..._args: unknown[]) => undefined);

		vi.mocked(getSupabaseAuthToken).mockResolvedValue("token");
		vi.mocked(getSupabaseClient).mockReturnValue(createMinimalClient());

		const set = vi.fn();
		function get(): SongSubscribeSlice {
			return makeGetWithActiveIds(["song-1"]);
		}

		const factory = subscribeToActivePrivateSongs(set, get);
		factory();

		await flushPromises();

		expect(warnSpy).toHaveBeenCalledWith(
			"[subscribeToActivePrivateSongs] Realtime subscription disabled - song table only contains private_notes",
		);

		warnSpy.mockRestore();
		vi.mocked(getSupabaseAuthToken).mockReset();
		vi.mocked(getSupabaseClient).mockReset();
	});

	it("logs an error if getting the auth token fails", async () => {
		const errorSpy = vi
			.spyOn(console, "error")
			.mockImplementation((..._args: unknown[]) => undefined);

		const err = new Error("auth-fail");

		vi.mocked(getSupabaseAuthToken).mockRejectedValue(err);
		vi.mocked(getSupabaseClient).mockReturnValue(createMinimalClient());

		const set = vi.fn();
		function get(): SongSubscribeSlice {
			return makeGetWithActiveIds(["song-1"]);
		}

		const factory = subscribeToActivePrivateSongs(set, get);
		factory();
		await flushPromises();

		expect(errorSpy).toHaveBeenCalledWith(
			expect.any(String),
			expect.objectContaining({ message: "auth-fail" }),
		);

		errorSpy.mockRestore();
		vi.mocked(getSupabaseAuthToken).mockReset();
	});
});
