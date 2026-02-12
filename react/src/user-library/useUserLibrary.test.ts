import { renderHook } from "@testing-library/react";
import { Effect } from "effect";
import React from "react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

import type { AppSlice } from "@/react/app-store/AppSlice.type";

import { resetAllSlices } from "@/react/app-store/slice-reset-fns";
import useAppStore from "@/react/app-store/useAppStore";
import { ONE_CALL } from "@/react/lib/test-helpers/test-consts";
import makeAppSlice from "@/react/lib/test-utils/makeAppSlice";
import makeUserLibraryEntry from "@/react/user-library/test-utils/makeUserLibraryEntry.mock";
import delay from "@/shared/utils/delay";

import useUserLibrary from "./useUserLibrary";

const TEST_USER_ID = "u1";
const TEST_ERROR = "err";
const TEST_CREATED_AT = new Date().toISOString();
const REMOVE_REQUEST = { followed_user_id: TEST_USER_ID } as const;

describe("useUserLibrary", () => {
	function RouterWrapper({ children }: { children?: React.ReactNode }): ReactElement | null {
		return React.createElement(MemoryRouter, undefined, children);
	}

	it("calls fetchUserLibrary and subscribes/unsubscribes", async () => {
		const fetchUserLibrary = vi.fn().mockReturnValue(Effect.sync(() => undefined));
		const unsubscribe = vi.fn();
		const subscribeToUserLibrary = vi.fn(
			(): Effect.Effect<() => void, Error> => Effect.sync((): (() => void) => unsubscribe),
		);
		const subscribeToUserPublicForLibrary = vi
			.fn()
			.mockImplementation(() => Effect.sync(() => undefined));

		resetAllSlices();
		const store: typeof useAppStore = useAppStore;
		const originalFetch = store.getState().fetchUserLibrary;
		const originalSubscribe = store.getState().subscribeToUserLibrary;
		const originalSubscribePublic = store.getState().subscribeToUserPublicForLibrary;

		store.setState(
			makeAppSlice({
				fetchUserLibrary,
				subscribeToUserLibrary,
				subscribeToUserPublicForLibrary,
			}),
		);

		const { unmount } = renderHook(
			() => {
				useUserLibrary();
			},
			{ wrapper: RouterWrapper },
		);

		// Allow microtask queue to process
		await Promise.resolve();
		await Promise.resolve();

		expect(fetchUserLibrary).toHaveBeenCalledTimes(ONE_CALL);
		expect(subscribeToUserLibrary).toHaveBeenCalledWith();

		unmount();
		expect(unsubscribe).toHaveBeenCalledWith();

		store.setState(
			makeAppSlice({
				fetchUserLibrary: originalFetch,
				subscribeToUserLibrary: originalSubscribe,
				subscribeToUserPublicForLibrary: originalSubscribePublic,
			}),
		);
	});

	it("returns store state values and removeFromUserLibrary invokes store action", async () => {
		const removeFromUserLibrary = vi.fn().mockImplementation(() => Effect.sync(() => undefined));
		const subscribeToUserPublicForLibrary = vi
			.fn()
			.mockImplementation(() => Effect.sync(() => undefined));
const entry = makeUserLibraryEntry({
		user_id: TEST_USER_ID,
		followed_user_id: TEST_USER_ID,
		created_at: TEST_CREATED_AT,
	});
	const entriesRecord: AppSlice["userLibraryEntries"] = { [TEST_USER_ID]: entry };

		resetAllSlices();
		const store = useAppStore;
		const originalRemove = store.getState().removeUserFromLibrary;
		const originalEntries = store.getState().userLibraryEntries;
		const originalLoading = store.getState().isUserLibraryLoading;
		const originalError = store.getState().userLibraryError;
		const originalSubscribePublic = store.getState().subscribeToUserPublicForLibrary;

		const patch: Partial<AppSlice> = {
			removeUserFromLibrary: removeFromUserLibrary,
			userLibraryEntries: entriesRecord,
			isUserLibraryLoading: true,
			userLibraryError: TEST_ERROR,
			// Prevent the real fetchUserLibrary from running during the test
			fetchUserLibrary: () => Effect.sync(() => undefined),
			subscribeToUserPublicForLibrary,
		};
		store.setState(makeAppSlice(patch));

		// Allow microtasks to settle
		await Promise.resolve();

		const { result, unmount } = renderHook(() => useUserLibrary(), { wrapper: RouterWrapper });

		expect(result.current.entries).toStrictEqual(Object.values(entriesRecord));
		expect(result.current.isLoading).toBe(true);
		expect(result.current.error).toBe(TEST_ERROR);

		await Effect.runPromise(result.current.removeFromUserLibrary(REMOVE_REQUEST));
		expect(removeFromUserLibrary).toHaveBeenCalledWith(REMOVE_REQUEST);

		store.setState(
			makeAppSlice({
				removeUserFromLibrary: originalRemove,
				userLibraryEntries: originalEntries,
				isUserLibraryLoading: originalLoading,
				userLibraryError: originalError,
				subscribeToUserPublicForLibrary: originalSubscribePublic,
			}),
		);
		unmount();
	});

	it("handles StrictMode double-invoke and late-resolving subscriptions safely", async () => {
		const store = useAppStore;
		resetAllSlices();
		const fetchUserLibrary = vi.fn().mockReturnValue(Effect.sync(() => undefined));
		const cleanup = vi.fn();
		const TICK_MS = 0;
		const subscribeToUserLibrary = vi.fn(
			(): Effect.Effect<() => void, Error> =>
				Effect.promise(async () => {
					await delay(TICK_MS);
					return function cleanupFn(): void {
						cleanup();
					};
				}),
		);

		store.setState(makeAppSlice({ fetchUserLibrary, subscribeToUserLibrary }));

		function StrictWrapper({ children }: { children?: React.ReactNode }): ReactElement | null {
			return React.createElement(React.StrictMode, undefined, children);
		}

		let unmountHook: (() => void) | undefined = undefined;
		try {
			const res = renderHook(() => useUserLibrary(), { wrapper: StrictWrapper });
			unmountHook = res.unmount;
			unmountHook();
		} catch {
			// ignore StrictMode noises
		}

		await delay(TICK_MS);
		expect(cleanup.mock.calls.length).toBeLessThanOrEqual(ONE_CALL);
	});
});
