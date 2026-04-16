import { renderHook } from "@testing-library/react";
import { Effect } from "effect";
import React from "react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

import { resetAllSlices } from "@/react/app-store/slice-reset-fns";
import useAppStore from "@/react/app-store/useAppStore";
import { ONE_CALL } from "@/react/lib/test-helpers/test-consts";
import makeAppSlice from "@/react/lib/test-utils/makeAppSlice";

import useTagLibrary from "./useTagLibrary";

const TEST_USER_ID = "u1";

describe("useTagLibrary", () => {
	/**
	 * Wrapper component providing a MemoryRouter for hook testing.
	 *
	* @param children - Optional children to render inside the router
	* @param props.children - Optional children to render inside the router
	 * @returns ReactElement or null
	 */
	function RouterWrapper({ children }: { children?: React.ReactNode }): ReactElement | null {
		return React.createElement(MemoryRouter, undefined, children);
	}

	it("returns empty slugs, isLoading=false, and no error by default", () => {
		resetAllSlices();
		const store = useAppStore;
		store.setState(
			makeAppSlice({
				tagLibraryEntries: {},
				isTagLibraryLoading: false,
				tagLibraryError: undefined,
				fetchTagLibrary: () => Effect.sync(() => undefined),
				subscribeToTagLibrary: () => Effect.sync((): (() => void) => () => undefined),
			}),
		);

		const { result, unmount } = renderHook(() => useTagLibrary(), { wrapper: RouterWrapper });

		expect(result.current.slugs).toStrictEqual([]);
		expect(result.current.isLoading).toBe(false);
		expect(result.current.error).toBeUndefined();

		unmount();
	});

	it("returns slugs sorted alphabetically from tagLibraryEntries", () => {
		resetAllSlices();
		const store = useAppStore;
		store.setState(
			makeAppSlice({
				tagLibraryEntries: {
					rock: { user_id: TEST_USER_ID, tag_slug: "rock" },
					jazz: { user_id: TEST_USER_ID, tag_slug: "jazz" },
					pop: { user_id: TEST_USER_ID, tag_slug: "pop" },
				},
				fetchTagLibrary: () => Effect.sync(() => undefined),
				subscribeToTagLibrary: () => Effect.sync((): (() => void) => () => undefined),
			}),
		);

		const { result, unmount } = renderHook(() => useTagLibrary(), { wrapper: RouterWrapper });

		expect(result.current.slugs).toStrictEqual(["jazz", "pop", "rock"]);

		unmount();
	});

	it("returns isLoading=true when store has isTagLibraryLoading=true", () => {
		resetAllSlices();
		const store = useAppStore;
		store.setState(
			makeAppSlice({
				tagLibraryEntries: {},
				isTagLibraryLoading: true,
				fetchTagLibrary: () => Effect.sync(() => undefined),
				subscribeToTagLibrary: () => Effect.sync((): (() => void) => () => undefined),
			}),
		);

		const { result, unmount } = renderHook(() => useTagLibrary(), { wrapper: RouterWrapper });

		expect(result.current.isLoading).toBe(true);

		unmount();
	});

	it("returns error from store", () => {
		resetAllSlices();
		const store = useAppStore;
		store.setState(
			makeAppSlice({
				tagLibraryEntries: {},
				tagLibraryError: "something went wrong",
				fetchTagLibrary: () => Effect.sync(() => undefined),
				subscribeToTagLibrary: () => Effect.sync((): (() => void) => () => undefined),
			}),
		);

		const { result, unmount } = renderHook(() => useTagLibrary(), { wrapper: RouterWrapper });

		expect(result.current.error).toBe("something went wrong");

		unmount();
	});

	it("calls fetchTagLibrary and subscribeToTagLibrary on mount", async () => {
		resetAllSlices();
		const fetchTagLibrary = vi.fn().mockReturnValue(Effect.sync(() => undefined));
		const unsubscribe = vi.fn();
		const subscribeToTagLibrary = vi.fn(
			(): Effect.Effect<() => void, Error> => Effect.sync((): (() => void) => unsubscribe),
		);

		const store = useAppStore;
		const originalFetch = store.getState().fetchTagLibrary;
		const originalSubscribe = store.getState().subscribeToTagLibrary;

		store.setState(makeAppSlice({ fetchTagLibrary, subscribeToTagLibrary }));

		const { unmount } = renderHook(() => useTagLibrary(), { wrapper: RouterWrapper });

		await Promise.resolve();
		await Promise.resolve();

		expect(fetchTagLibrary).toHaveBeenCalledTimes(ONE_CALL);
		expect(subscribeToTagLibrary).toHaveBeenCalledWith();

		unmount();
		expect(unsubscribe).toHaveBeenCalledWith();

		store.setState(
			makeAppSlice({
				fetchTagLibrary: originalFetch,
				subscribeToTagLibrary: originalSubscribe,
			}),
		);
	});

	it("calls unsubscribe when unmounted before subscription resolves", async () => {
		resetAllSlices();
		const unsubscribe = vi.fn();
		const subscribeToTagLibrary = vi.fn(
			(): Effect.Effect<() => void, Error> => Effect.sync((): (() => void) => unsubscribe),
		);

		const store = useAppStore;
		store.setState(
			makeAppSlice({
				fetchTagLibrary: () => Effect.sync(() => undefined),
				subscribeToTagLibrary,
			}),
		);

		const { unmount } = renderHook(() => useTagLibrary(), { wrapper: RouterWrapper });

		await Promise.resolve();
		await Promise.resolve();

		unmount();

		expect(unsubscribe).toHaveBeenCalledWith();
	});

	it("logs error and does not call unsubscribe when subscription fails", async () => {
		resetAllSlices();
		const unsubscribe = vi.fn();
		const subscribeToTagLibrary = vi.fn(
			(): Effect.Effect<() => void, Error> => Effect.fail(new Error("subscribe failed")),
		);
		const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);

		const store = useAppStore;
		store.setState(
			makeAppSlice({
				fetchTagLibrary: () => Effect.sync(() => undefined),
				fetchTagLibraryCounts: () => Effect.sync(() => undefined),
				subscribeToTagLibrary,
				subscribeToTagCounts: () => Effect.sync((): (() => void) => () => undefined),
			}),
		);

		const { unmount } = renderHook(() => useTagLibrary(), { wrapper: RouterWrapper });

		await Promise.resolve();
		await Promise.resolve();

		unmount();

		expect(unsubscribe).not.toHaveBeenCalled();
		expect(consoleSpy).toHaveBeenCalledWith(
			"[useTagLibrary] Failed to subscribe to tag library:",
			expect.any(Error),
		);

		consoleSpy.mockRestore();
	});
});
