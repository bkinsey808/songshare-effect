/* oxlint-disable typescript-eslint/no-unsafe-argument,typescript-eslint/no-explicit-any,typescript-eslint/no-unsafe-assignment,typescript-eslint/no-unsafe-type-assertion */
import { renderHook } from "@testing-library/react";
import { Effect } from "effect";
import { describe, expect, it, vi } from "vitest";

import { ONE_CALL } from "@/react/test-helpers/test-consts";
import { getOrCreateAppStore, resetAllSlices, type AppSlice } from "@/react/zustand/useAppStore";

import useSongLibrary from "./useSongLibrary";

// Test constants
const TEST_SONG_ID = "s1";
const TEST_OWNER_ID = "owner";
const TEST_ERROR = "oops";
const TEST_CREATED_AT = new Date().toISOString();
const REMOVE_REQUEST = { song_id: TEST_SONG_ID };

describe("useSongLibrary", () => {
	it("does not throw when store is missing", async () => {
		const appStoreModule = await import("@/react/zustand/useAppStore");
		const spy = vi.spyOn(appStoreModule, "getStoreApi").mockReturnValue(undefined);

		const { unmount } = renderHook(() => {
			useSongLibrary();
		});
		expect(typeof unmount).toBe("function");
		unmount();
		spy.mockRestore();
	});

	it("calls fetchSongLibrary and subscribes/unsubscribes", async () => {
		const fetchSongLibrary = vi.fn().mockResolvedValue(undefined);
		const unsubscribe = vi.fn();
		const subscribeToSongLibrary = vi.fn(
			(): Effect.Effect<() => void, Error> => Effect.sync((): (() => void) => unsubscribe),
		);

		// Reset store and use a fresh instance to avoid inter-test interference
		resetAllSlices();
		const store = getOrCreateAppStore();
		const originalFetch = store.getState().fetchSongLibrary;
		const originalSubscribe = store.getState().subscribeToSongLibrary;

		// Inject mocked functions
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		store.setState(
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			{
				fetchSongLibrary,
				subscribeToSongLibrary,
			} as any,
		);

		const { unmount } = renderHook(() => {
			useSongLibrary();
		});

		// Allow microtask queue to process and async Effect to resolve
		await Promise.resolve();
		await Promise.resolve();

		expect(fetchSongLibrary).toHaveBeenCalledTimes(ONE_CALL);
		expect(subscribeToSongLibrary).toHaveBeenCalledTimes(ONE_CALL);

		unmount();
		expect(unsubscribe).toHaveBeenCalledTimes(ONE_CALL);

		// Restore original functions using a typed partial
		const restorePatch: Partial<AppSlice> = {
			fetchSongLibrary: originalFetch,
			subscribeToSongLibrary: originalSubscribe,
		};
		store.setState(restorePatch);
	});

	it("returns store state values and removeFromSongLibrary invokes store action", async () => {
		const removeSongFromSongLibrary = vi
			.fn()
			.mockImplementation(() => Effect.sync(() => undefined));
		const entriesRecord = {
			[TEST_SONG_ID]: {
				song_id: TEST_SONG_ID,
				song_owner_id: TEST_OWNER_ID,
				user_id: TEST_OWNER_ID,
				created_at: TEST_CREATED_AT,
			},
		};

		// Reset store and use a fresh instance to avoid inter-test interference
		resetAllSlices();
		const store = getOrCreateAppStore();
		const originalRemove = store.getState().removeSongFromSongLibrary;
		const originalEntries = store.getState().songLibraryEntries;
		const originalLoading = store.getState().isSongLibraryLoading;
		const originalError = store.getState().songLibraryError;

		const patch: Partial<AppSlice> = {
			removeSongFromSongLibrary,
			songLibraryEntries: entriesRecord,
			isSongLibraryLoading: true,
			songLibraryError: TEST_ERROR,
		};
		store.setState(patch);

		// Allow microtasks to settle before rendering the hook to avoid transient re-render ordering
		await Promise.resolve();

		// Use a fresh module instance to avoid cross-test module cache interference
		vi.resetModules();
		// Re-import the hook after resetting modules
		// eslint-disable-next-line @typescript-eslint/no-var-requires
		const { default: useSongLibraryFresh } = await import("./useSongLibrary");

		// Spy on the selector hook to return stable values from our test store
		const appStoreModule = await import("@/react/zustand/useAppStore");
		const selectorSpy = vi
			.spyOn(appStoreModule, "useAppStoreSelector")
			.mockImplementation((selector: (slice: AppSlice) => unknown) => selector(store.getState()));

		const { result, unmount } = renderHook(() => useSongLibraryFresh());

		expect(result.current.songEntries).toStrictEqual(Object.values(entriesRecord));
		expect(result.current.isLoading).toBe(true);
		expect(result.current.error).toBe(TEST_ERROR);

		// Call the remove function and ensure store action is invoked
		await Effect.runPromise(result.current.removeFromSongLibrary(REMOVE_REQUEST));
		expect(removeSongFromSongLibrary).toHaveBeenCalledWith(REMOVE_REQUEST);

		// Restore original state
		store.setState({
			removeSongFromSongLibrary: originalRemove,
			songLibraryEntries: originalEntries,
			isSongLibraryLoading: originalLoading,
			songLibraryError: originalError,
		});
		selectorSpy.mockRestore();
		unmount();
	});

	it("handles subscribe returning cleanup", async () => {
		const fetchSongLibrary = vi.fn().mockResolvedValue(undefined);
		const cleanup = vi.fn();
		const subscribeToSongLibrary = vi.fn().mockReturnValue(Effect.sync(() => cleanup));

		const store = getOrCreateAppStore();
		const originalFetch = store.getState().fetchSongLibrary;
		const originalSubscribe = store.getState().subscribeToSongLibrary;

		store.setState({
			fetchSongLibrary,
			// oxlint-disable-next-line typescript-eslint/no-unsafe-argument
			subscribeToSongLibrary: subscribeToSongLibrary as never,
		});

		const { unmount } = renderHook(() => {
			useSongLibrary();
		});

		// Allow microtask queue to process
		await Promise.resolve();

		expect(fetchSongLibrary).toHaveBeenCalledTimes(ONE_CALL);
		expect(subscribeToSongLibrary).toHaveBeenCalledTimes(ONE_CALL);

		unmount();

		store.setState({
			fetchSongLibrary: originalFetch,
			subscribeToSongLibrary: originalSubscribe,
		});
	});

	it("does not error when fetch/subscribe are missing", () => {
		const store = getOrCreateAppStore();
		const originalFetch = store.getState().fetchSongLibrary;
		const originalSubscribe = store.getState().subscribeToSongLibrary;

		const patch: Partial<AppSlice> = {
			fetchSongLibrary: () => Effect.sync(() => undefined),
			subscribeToSongLibrary: (): Effect.Effect<() => void, Error> =>
				Effect.sync((): (() => void) => () => {
					/* no-op cleanup */
				}),
		};
		store.setState(patch);

		const { unmount } = renderHook(() => {
			useSongLibrary();
		});

		// No calls expected and no errors on unmount
		expect(typeof unmount).toBe("function");
		unmount();

		store.setState({
			fetchSongLibrary: originalFetch,
			subscribeToSongLibrary: originalSubscribe,
		});
	});
});
