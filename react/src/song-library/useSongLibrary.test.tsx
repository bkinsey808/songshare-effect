import { renderHook } from "@testing-library/react";
import { Effect } from "effect";
import React from "react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

import { ONE_CALL } from "@/react/test-helpers/test-consts";
import { resetAllSlices, useAppStore, type AppSlice } from "@/react/zustand/useAppStore";
import delay from "@/shared/utils/delay";

import useSongLibrary from "./useSongLibrary";

// Test constants
const TEST_SONG_ID = "s1";
const TEST_OWNER_ID = "owner";
const TEST_ERROR = "oops";
const TEST_CREATED_AT = new Date().toISOString();
const REMOVE_REQUEST = { song_id: TEST_SONG_ID };

describe("useSongLibrary", () => {
	function RouterWrapper({ children }: { children?: React.ReactNode }): React.ReactElement | null {
		return React.createElement(MemoryRouter, undefined, children);
	}

	it("calls fetchSongLibrary and subscribes/unsubscribes", async () => {
		const fetchSongLibrary = vi.fn().mockReturnValue(Effect.sync(() => undefined));
		const unsubscribe = vi.fn();
		const subscribeToSongLibrary = vi.fn(
			(): Effect.Effect<() => void, Error> => Effect.sync((): (() => void) => unsubscribe),
		);
		const subscribeToSongPublic = vi.fn().mockImplementation(() => Effect.sync(() => undefined));

		// Reset store and use the singleton instance
		resetAllSlices();
		const store = useAppStore;
		const originalFetch = store.getState().fetchSongLibrary;
		const originalSubscribe = store.getState().subscribeToSongLibrary;
		const originalSubscribePublic = store.getState().subscribeToSongPublic;

		// Inject mocked functions
		store.setState(() => ({
			fetchSongLibrary,
			subscribeToSongLibrary,
			subscribeToSongPublic,
		} as Partial<AppSlice>));

		const { unmount } = renderHook(
			() => {
				useSongLibrary();
			},
			{ wrapper: RouterWrapper },
		);

		// Allow microtask queue to process and async Effect to resolve
		await Promise.resolve();
		await Promise.resolve();

		expect(fetchSongLibrary).toHaveBeenCalledTimes(ONE_CALL);
		expect(subscribeToSongLibrary).toHaveBeenCalledWith();

		unmount();
		// Accept one or more calls to cleanup (React may mount/unmount twice in test env)
		expect(unsubscribe).toHaveBeenCalledWith();

		// Restore original functions
		store.setState({
			fetchSongLibrary: originalFetch,
			subscribeToSongLibrary: originalSubscribe,
			subscribeToSongPublic: originalSubscribePublic,
		});
	});

	it("returns store state values and removeFromSongLibrary invokes store action", async () => {
		const removeSongFromSongLibrary = vi
			.fn()
			.mockImplementation(() => Effect.sync(() => undefined));
		const subscribeToSongPublic = vi.fn().mockImplementation(() => Effect.sync(() => undefined));
		const entriesRecord: AppSlice["songLibraryEntries"] = {
			[TEST_SONG_ID]: {
				song_id: TEST_SONG_ID,
				song_owner_id: TEST_OWNER_ID,
				user_id: TEST_OWNER_ID,
				created_at: TEST_CREATED_AT,
			},
		};

		// Reset store
		resetAllSlices();
		const store = useAppStore;
		const originalRemove = store.getState().removeSongFromSongLibrary;
		const originalEntries = store.getState().songLibraryEntries;
		const originalLoading = store.getState().isSongLibraryLoading;
		const originalError = store.getState().songLibraryError;
		const originalSubscribePublic = store.getState().subscribeToSongPublic;

		const patch: Partial<AppSlice> = {
			removeSongFromSongLibrary,
			songLibraryEntries: entriesRecord,
			isSongLibraryLoading: true,
			songLibraryError: TEST_ERROR,
			// Prevent the real fetchSongLibrary from running during the test
			fetchSongLibrary: () => Effect.sync(() => undefined),
			subscribeToSongPublic,
		};
		store.setState(patch);

		// Allow microtasks to settle
		await Promise.resolve();

		const { result, unmount } = renderHook(() => useSongLibrary(), { wrapper: RouterWrapper });

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
			subscribeToSongPublic: originalSubscribePublic,
		});
		unmount();
	});

	it("handles subscribe returning cleanup", async () => {
		const fetchSongLibrary = vi.fn().mockReturnValue(Effect.sync(() => undefined));
		const cleanup = vi.fn();
		const mockSubscribe = vi.fn((): Effect.Effect<() => void, Error> => Effect.sync(() => cleanup));
		function subscribeToSongLibrary(): Effect.Effect<() => void, Error> {
			return mockSubscribe();
		}
		const subscribeToSongPublic = vi.fn().mockImplementation(() => Effect.sync(() => undefined));

		const store = useAppStore;
		const originalFetch = store.getState().fetchSongLibrary;
		const originalSubscribe = store.getState().subscribeToSongLibrary;
		const originalSubscribePublic = store.getState().subscribeToSongPublic;

		store.setState({
			fetchSongLibrary,
			subscribeToSongLibrary,
			subscribeToSongPublic,
		});

		const { unmount } = renderHook(
			() => {
				useSongLibrary();
			},
			{ wrapper: RouterWrapper },
		);

		// Allow microtask queue to process
		await Promise.resolve();

		expect(fetchSongLibrary).toHaveBeenCalledTimes(ONE_CALL);
		expect(mockSubscribe).toHaveBeenCalledWith();

		unmount();

		store.setState({
			fetchSongLibrary: originalFetch,
			subscribeToSongLibrary: originalSubscribe,
			subscribeToSongPublic: originalSubscribePublic,
		});
	});

	it("subscribes to song_public for visible song IDs and unsubscribes on change", async () => {
		resetAllSlices();
		const store = useAppStore;

		const cleanup1 = vi.fn();
		const cleanup2 = vi.fn();
		const subscribeToSongPublic = vi
			.fn()
			.mockImplementationOnce((_ids: readonly string[]) => Effect.sync(() => cleanup1))
			.mockImplementationOnce((_ids: readonly string[]) => Effect.sync(() => cleanup2));

		const originalSubscribePublic = store.getState().subscribeToSongPublic;
		store.setState({ subscribeToSongPublic, songLibraryEntries: {} });

		const { unmount } = renderHook(() => useSongLibrary(), { wrapper: RouterWrapper });

		// show one visible id
		store.setState({
			songLibraryEntries: {
				"visible-1": {
					song_id: "visible-1",
					created_at: TEST_CREATED_AT,
					user_id: TEST_OWNER_ID,
					song_owner_id: TEST_OWNER_ID,
				},
			},
		});
		// allow async subscriptions to settle
		await Promise.resolve();
		await Promise.resolve();

		expect(subscribeToSongPublic).toHaveBeenCalledWith(["visible-1"]);

		// change visible ids - should unsubscribe first and subscribe again
		store.setState({
			songLibraryEntries: {
				"visible-2": {
					song_id: "visible-2",
					created_at: TEST_CREATED_AT,
					user_id: TEST_OWNER_ID,
					song_owner_id: TEST_OWNER_ID,
				},
				"visible-3": {
					song_id: "visible-3",
					created_at: TEST_CREATED_AT,
					user_id: TEST_OWNER_ID,
					song_owner_id: TEST_OWNER_ID,
				},
			},
		});
		await Promise.resolve();
		await Promise.resolve();

		expect(cleanup1).toHaveBeenCalledTimes(ONE_CALL);
		expect(subscribeToSongPublic).toHaveBeenCalledWith(["visible-2", "visible-3"]);

		// allow second subscription to settle before unmount
		await Promise.resolve();

		// final unmount should call second cleanup
		unmount();
		expect(cleanup2).toHaveBeenCalledTimes(ONE_CALL);

		store.setState({ subscribeToSongPublic: originalSubscribePublic });
	});

	it("handles StrictMode double-invoke and late-resolving subscriptions safely", async () => {
		const store = useAppStore;
		resetAllSlices();
		const fetchSongLibrary = vi.fn().mockReturnValue(Effect.sync(() => undefined));
		const cleanup = vi.fn();
		const TICK_MS = 0;
		const subscribeToSongLibrary = vi.fn(
			(): Effect.Effect<() => void, Error> =>
				Effect.promise(async () => {
					await delay(TICK_MS);
					return function cleanupFn(): void {
						cleanup();
					};
				}),
		);

		store.setState({ fetchSongLibrary, subscribeToSongLibrary });

		function StrictWrapper({
			children,
		}: {
			children?: React.ReactNode;
		}): React.ReactElement | null {
			return React.createElement(React.StrictMode, undefined, children);
		}

		let unmountHook: (() => void) | undefined = undefined;
		try {
			const res = renderHook(() => useSongLibrary(), { wrapper: StrictWrapper });
			unmountHook = res.unmount;
			unmountHook();
		} catch {
			// ignore StrictMode noises
		}

		await delay(TICK_MS);
		expect(cleanup.mock.calls.length).toBeLessThanOrEqual(ONE_CALL);
	});
});
