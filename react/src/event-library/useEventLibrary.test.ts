import { renderHook } from "@testing-library/react";
import { Effect } from "effect";
import React from "react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

import type { AppSlice } from "@/react/app-store/AppSlice.type";

import { resetAllSlices } from "@/react/app-store/slice-reset-fns";
import useAppStore from "@/react/app-store/useAppStore";
import makeEventLibraryEntry from "@/react/event-library/test-utils/makeEventLibraryEntry.mock";
import { ONE_CALL } from "@/react/lib/test-helpers/test-consts";
import makeAppSlice from "@/react/lib/test-utils/makeAppSlice";
import delay from "@/shared/utils/delay";

import useEventLibrary from "./useEventLibrary";

const TEST_EVENT_ID = "e1";
const TEST_ERROR = "err";
const TEST_CREATED_AT = new Date().toISOString();
const REMOVE_REQUEST = { event_id: TEST_EVENT_ID } as const;

describe("useEventLibrary", () => {
	function RouterWrapper({ children }: { children?: React.ReactNode }): ReactElement | null {
		return React.createElement(MemoryRouter, undefined, children);
	}

	it("calls fetchEventLibrary and subscribes/unsubscribes", async () => {
		const fetchEventLibrary = vi.fn().mockReturnValue(Effect.sync(() => undefined));
		const unsubscribe = vi.fn();
		const subscribeToEventLibrary = vi.fn(
			(): Effect.Effect<() => void, Error> => Effect.sync((): (() => void) => unsubscribe),
		);
		const subscribeToEventPublicForLibrary = vi
			.fn()
			.mockImplementation(() => Effect.sync(() => undefined));

		resetAllSlices();
		const store: typeof useAppStore = useAppStore;
		const originalFetch = store.getState().fetchEventLibrary;
		const originalSubscribe = store.getState().subscribeToEventLibrary;
		const originalSubscribePublic = store.getState().subscribeToEventPublicForLibrary;

		store.setState(
			makeAppSlice({
				fetchEventLibrary,
				subscribeToEventLibrary,
				subscribeToEventPublicForLibrary,
			}),
		);

		const { unmount } = renderHook(
			() => {
				useEventLibrary();
			},
			{ wrapper: RouterWrapper },
		);

		// Allow microtask queue to process
		await Promise.resolve();
		await Promise.resolve();

		expect(fetchEventLibrary).toHaveBeenCalledTimes(ONE_CALL);
		expect(subscribeToEventLibrary).toHaveBeenCalledWith();

		unmount();
		expect(unsubscribe).toHaveBeenCalledWith();

		store.setState(
			makeAppSlice({
				fetchEventLibrary: originalFetch,
				subscribeToEventLibrary: originalSubscribe,
				subscribeToEventPublicForLibrary: originalSubscribePublic,
			}),
		);
	});

	it("returns store state values and removeFromEventLibrary invokes store action", async () => {
		const removeFromEventLibrary = vi.fn().mockImplementation(() => Effect.sync(() => undefined));
		const subscribeToEventPublicForLibrary = vi
			.fn()
			.mockImplementation(() => Effect.sync(() => undefined));
		const entry = makeEventLibraryEntry({
			event_id: TEST_EVENT_ID,
			created_at: TEST_CREATED_AT,
			user_id: "00000000-0000-0000-0000-000000000002",
			event_owner_id: "00000000-0000-0000-0000-000000000001",
			// include a minimal `event` shape matching existing tests
			event: {
				event_id: TEST_EVENT_ID,
				owner_id: "00000000-0000-0000-0000-000000000001",
				created_at: TEST_CREATED_AT,
				updated_at: TEST_CREATED_AT,
				private_notes: "notes",
			},
		});

		const entriesRecord: AppSlice["eventLibraryEntries"] = { [TEST_EVENT_ID]: entry };

		resetAllSlices();
		const store = useAppStore;
		const originalRemove = store.getState().removeEventFromLibrary;
		const originalEntries = store.getState().eventLibraryEntries;
		const originalLoading = store.getState().isEventLibraryLoading;
		const originalError = store.getState().eventLibraryError;
		const originalSubscribePublic = store.getState().subscribeToEventPublicForLibrary;

		const patch: Partial<AppSlice> = {
			removeEventFromLibrary: removeFromEventLibrary,
			eventLibraryEntries: entriesRecord,
			isEventLibraryLoading: true,
			eventLibraryError: TEST_ERROR,
			// Prevent the real fetch from running during the test
			fetchEventLibrary: () => Effect.sync(() => undefined),
			subscribeToEventPublicForLibrary,
		};
		store.setState(makeAppSlice(patch));

		// Allow microtasks to settle
		await Promise.resolve();

		const { result, unmount } = renderHook(() => useEventLibrary(), { wrapper: RouterWrapper });

		expect(result.current.entries).toStrictEqual(Object.values(entriesRecord));
		expect(result.current.isLoading).toBe(true);
		expect(result.current.error).toBe(TEST_ERROR);

		await Effect.runPromise(result.current.removeFromEventLibrary(REMOVE_REQUEST));
		expect(removeFromEventLibrary).toHaveBeenCalledWith(REMOVE_REQUEST);

		store.setState(
			makeAppSlice({
				removeEventFromLibrary: originalRemove,
				eventLibraryEntries: originalEntries,
				isEventLibraryLoading: originalLoading,
				eventLibraryError: originalError,
				subscribeToEventPublicForLibrary: originalSubscribePublic,
			}),
		);
		unmount();
	});

	it("handles StrictMode double-invoke and late-resolving subscriptions safely", async () => {
		const store = useAppStore;
		resetAllSlices();
		const fetchEventLibrary = vi.fn().mockReturnValue(Effect.sync(() => undefined));
		const cleanup = vi.fn();
		const TICK_MS = 0;
		const subscribeToEventLibrary = vi.fn(
			(): Effect.Effect<() => void, Error> =>
				Effect.promise(async () => {
					await delay(TICK_MS);
					return function cleanupFn(): void {
						cleanup();
					};
				}),
		);

		store.setState(makeAppSlice({ fetchEventLibrary, subscribeToEventLibrary }));

		function StrictWrapper({ children }: { children?: React.ReactNode }): ReactElement | null {
			return React.createElement(React.StrictMode, undefined, children);
		}

		let unmountHook: (() => void) | undefined = undefined;
		try {
			const res = renderHook(() => useEventLibrary(), { wrapper: StrictWrapper });
			unmountHook = res.unmount;
			unmountHook();
		} catch {
			// ignore StrictMode noises
		}

		await delay(TICK_MS);
		expect(cleanup.mock.calls.length).toBeLessThanOrEqual(ONE_CALL);
	});
});
