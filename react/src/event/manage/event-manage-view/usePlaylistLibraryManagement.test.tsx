import { cleanup, fireEvent, render, renderHook, waitFor, within } from "@testing-library/react";
import { Effect } from "effect";
import { describe, expect, it, vi } from "vitest";

import useAppStore from "@/react/app-store/useAppStore";
import forceCast from "@/react/lib/test-utils/forceCast";

import usePlaylistLibraryManagement from "./usePlaylistLibraryManagement";

vi.mock("@/react/app-store/useAppStore");

const mockedUseAppStore = vi.mocked(useAppStore);

const mockFetchPlaylistLibrary = vi.fn(() => Effect.sync(() => undefined));
const mockSubscribeToPlaylistLibrary = vi.fn(() =>
	Effect.sync((): (() => void) => () => undefined),
);
const mockSubscribeToPlaylistPublic = vi.fn((_ids: string[]) =>
	Effect.sync((): (() => void) => () => undefined),
);

function installStore(entries: Record<string, unknown> = {}): void {
	mockFetchPlaylistLibrary.mockClear();
	mockSubscribeToPlaylistLibrary.mockClear();
	mockSubscribeToPlaylistPublic.mockClear();

	const mockState = {
		fetchPlaylistLibrary: mockFetchPlaylistLibrary,
		subscribeToPlaylistLibrary: mockSubscribeToPlaylistLibrary,
		playlistLibraryEntries: entries,
		subscribeToPlaylistPublic: mockSubscribeToPlaylistPublic,
	};

	mockedUseAppStore.mockImplementation((selector: unknown) =>
		// forceCast lets tests call the selector against our typed mock state
		forceCast<(state: typeof mockState) => unknown>(selector)(mockState),
	);
}

/**
 * Harness for `usePlaylistLibraryManagement` (Documentation by Harness).
 *
 * Exposes the store selectors this void hook drives and documents the
 * subscription/fetch handlers via buttons so readers see how to use the hook.
 */
function Harness(): ReactElement {
	usePlaylistLibraryManagement();

	const fetchPlaylistLibrary = useAppStore((state) => state.fetchPlaylistLibrary);
	const subscribeToPlaylistLibrary = useAppStore((state) => state.subscribeToPlaylistLibrary);
	const playlistLibraryEntries = useAppStore((state) => state.playlistLibraryEntries);
	const subscribeToPlaylistPublic = useAppStore((state) => state.subscribeToPlaylistPublic);

	const ids = Object.keys(playlistLibraryEntries).toSorted().join(",");

	return (
		<div>
			{/* visible documentation of current playlist ids */}
			<div data-testid="entries">{ids}</div>

			{/* buttons document how to call store handlers directly */}
			<button
				type="button"
				data-testid="call-fetch"
				onClick={() => {
					void Effect.runPromise(fetchPlaylistLibrary());
				}}
			>
				fetch
			</button>

			<button
				type="button"
				data-testid="call-subscribe"
				onClick={() => {
					void Effect.runPromise(subscribeToPlaylistLibrary());
				}}
			>
				subscribe
			</button>

			<button
				type="button"
				data-testid="call-subscribe-public"
				onClick={() => {
					void Effect.runPromise(subscribeToPlaylistPublic(Object.keys(playlistLibraryEntries)));
				}}
			>
				subscribe-public
			</button>
		</div>
	);
}

describe("usePlaylistLibraryManagement", () => {
	describe("harness (DOM) behavior", () => {
		it("calls fetch and subscribe on mount and unsubscribes on unmount", async () => {
			// cleanup required by project harness rules (no globals:true, no afterEach)
			cleanup();
			installStore({});

			// Make subscribeToPlaylistLibrary resolve to an unsubscribe function that
			// flips a local flag so the test can assert it was invoked without
			// introducing a Mock type that conflicts with strict TS settings.
			let unsubCalled = false;
			function unsub(): void {
				unsubCalled = true;
			}
			mockSubscribeToPlaylistLibrary.mockImplementationOnce(() => Effect.sync(() => unsub));

			const rendered = render(<Harness />);

			await waitFor(() => {
				expect(mockFetchPlaylistLibrary).toHaveBeenCalledWith();
				expect(mockSubscribeToPlaylistLibrary).toHaveBeenCalledWith();
			});

			// unmount should call the unsubscribe returned by the subscription
			rendered.unmount();
			expect(unsubCalled).toBe(true);
		});

		it("harness buttons call the store handlers", async () => {
			cleanup();
			installStore({ p1: { name: "one" }, p2: { name: "two" } });

			const rendered = render(<Harness />);

			// fetch button
			fireEvent.click(within(rendered.container).getByTestId("call-fetch"));

			await waitFor(() => {
				expect(mockFetchPlaylistLibrary).toHaveBeenCalledWith();
			});

			// subscribe button
			fireEvent.click(within(rendered.container).getByTestId("call-subscribe"));

			await waitFor(() => {
				expect(mockSubscribeToPlaylistLibrary).toHaveBeenCalledWith();
			});

			// subscribe-public button should call with the playlist ids
			fireEvent.click(within(rendered.container).getByTestId("call-subscribe-public"));

			await waitFor(() => {
				expect(mockSubscribeToPlaylistPublic).toHaveBeenCalledWith(
					expect.arrayContaining(["p1", "p2"]),
				);
			});
		});
	});

	describe("renderHook behavior", () => {
		it("subscribes to public metadata when playlist entries exist", async () => {
			installStore({ p1: { name: "one" }, p2: { name: "two" } });

			let publicUnsubCalled = false;
			function publicUnsub(): void {
				publicUnsubCalled = true;
			}
			mockSubscribeToPlaylistPublic.mockImplementationOnce(() => Effect.sync(() => publicUnsub));

			const hook = renderHook(() => {
				usePlaylistLibraryManagement();
			});

			await waitFor(() => {
				// subscribeToPlaylistPublic should be called with the playlist ids
				expect(mockSubscribeToPlaylistPublic).toHaveBeenCalledWith(
					expect.arrayContaining(["p1", "p2"]),
				);
			});

			// cleanup the hook to ensure unsubscribe is invoked
			hook.unmount();
			expect(publicUnsubCalled).toBe(true);
		});

		it("does not subscribe to public metadata when there are no playlist entries", async () => {
			installStore({});

			const hook = renderHook(() => {
				usePlaylistLibraryManagement();
			});

			await waitFor(() => {
				expect(mockSubscribeToPlaylistPublic).not.toHaveBeenCalled();
			});

			hook.unmount();
		});

		it("continues to subscribe even if fetchPlaylistLibrary fails", async () => {
			// simulate fetch failure
			mockFetchPlaylistLibrary.mockImplementationOnce(() =>
				Effect.promise(() => {
					throw new Error("fetch-fail");
				}),
			);
			// ensure subscribe still resolves
			let unsubCalled = false;
			function unsub(): void {
				unsubCalled = true;
			}
			mockSubscribeToPlaylistLibrary.mockImplementationOnce(() => Effect.sync(() => unsub));

			const hook = renderHook(() => {
				usePlaylistLibraryManagement();
			});

			await waitFor(() => {
				expect(mockSubscribeToPlaylistLibrary).toHaveBeenCalledWith();
			});

			hook.unmount();
			expect(unsubCalled).toBe(true);
		});
	});
});
