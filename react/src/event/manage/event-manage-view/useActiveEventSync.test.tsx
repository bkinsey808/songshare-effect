import { cleanup, fireEvent, render, renderHook, waitFor } from "@testing-library/react";
import { Effect as EffectRuntime } from "effect";
import { useRef, useState } from "react";
import { describe, expect, it, vi } from "vitest";

import useAppStore from "@/react/app-store/useAppStore";

import useActiveEventSync from "./useActiveEventSync";

vi.mock("@/react/app-store/useAppStore");

/** Used to assert a function was called exactly once */
const ONCE = 1;

/**
 * Configure the mocked `useAppStore` for tests.
 *
 * This helper accepts an options object and makes the mocked store return
 * the provided values when selectors reading `fetchEventBySlug`,
 * `subscribeToEvent`, or `currentEvent` are invoked by the hook under test.
 *
 * @param fetchEventBySlug - returned when the selector reads `fetchEventBySlug`
 * @param subscribeToEvent - returned when the selector reads `subscribeToEvent`
 * @param currentEventId - event id to return from the `currentEvent` selector
 * @returns void
 */
/**
 * Install a mocked store for `useActiveEventSync` tests.
 *
 * @param opts - Options to configure event and active state.
 * @returns void
 */
function installStore(opts: {
	fetchEventBySlug?: (...args: unknown[]) => unknown;
	subscribeToEvent?: () => (() => void) | undefined;
	currentEventId?: string | undefined;
}): void {
	const { fetchEventBySlug, subscribeToEvent, currentEventId } = opts;
	vi.mocked(useAppStore).mockImplementation((selector: unknown) => {
		const sel = String(selector);
		if (sel.includes("fetchEventBySlug")) {
			return fetchEventBySlug as unknown;
		}
		if (sel.includes("subscribeToEvent")) {
			return subscribeToEvent as unknown;
		}
		if (sel.includes("currentEvent")) {
			if (currentEventId === undefined) {
				return undefined;
			}
			// If the selector specifically accesses `event_id` (e.g. `s => s.currentEvent?.event_id`)
			// return the raw id string; otherwise return the full `currentEvent` object.
			if (sel.includes("event_id")) {
				return currentEventId as unknown;
			}
			return { event_id: currentEventId } as unknown;
		}
		return undefined;
	});
}

/**
 * Demonstrative harness for `useActiveEventSync` used as documentation.
 * It mounts the hook with an optional `eventSlug` and renders simple
 * controls and observable UI so tests and readers can inspect behavior.
 *
 * @param eventSlug - optional event slug to mount the hook with
 * @returns React element containing the harness UI
 */
function Harness({ eventSlug }: { eventSlug?: string }): ReactElement {
	useActiveEventSync({ eventSlug });

	const currentEventId = useAppStore((state) => state.currentEvent?.event_id);
	const fetchEventBySlug = useAppStore((state) => state.fetchEventBySlug);
	const subscribeToEvent = useAppStore((state) => state.subscribeToEvent);

	const [isSubscribed, setIsSubscribed] = useState(false);
	const unsubRef = useRef<(() => void) | undefined>(undefined);

	return (
		<div>
			{/* Shows the currentEventId the hook is watching */}
			<div data-testid="current-event-id">{String(currentEventId ?? "")}</div>

			{/* Button to call the fetch function exposed by the store */}
			<button
				type="button"
				data-testid="call-fetch"
				onClick={() => {
					if (typeof fetchEventBySlug === "function") {
						// call with a documentation slug
						void fetchEventBySlug("doc-slug");
					}
				}}
			>
				fetch
			</button>

			{/* Controls to subscribe/unsubscribe to the current event */}
			<button
				type="button"
				data-testid="subscribe"
				onClick={() => {
					const unsubscribeFn = subscribeToEvent?.();
					unsubRef.current = unsubscribeFn;
					setIsSubscribed(Boolean(unsubscribeFn));
				}}
			>
				subscribe
			</button>
			<button
				type="button"
				data-testid="unsubscribe"
				onClick={() => {
					if (unsubRef.current) {
						unsubRef.current();
						unsubRef.current = undefined;
						setIsSubscribed(false);
					}
				}}
			>
				unsubscribe
			</button>

			<div data-testid="is-subscribed">{String(isSubscribed)}</div>
		</div>
	);
}

describe("useActiveEventSync", () => {
	describe("harness (DOM) behavior", () => {
		it("does not subscribe when currentEventId is undefined", async () => {
			// cleanup() is required here because this project's Vitest config does not
			// use globals:true, so Testing Library cannot auto-register afterEach(cleanup),
			// and afterEach is disallowed by the project linter. Each harness test is
			// responsible for starting with a clean DOM.
			cleanup();
			const unsubscribe = vi.fn();
			const subscribeToEvent = vi.fn().mockReturnValue(unsubscribe);
			const fetchEventBySlug = vi.fn();

			installStore({ fetchEventBySlug, subscribeToEvent, currentEventId: undefined });

			render(<Harness />);

			await waitFor(() => {
				expect(subscribeToEvent).not.toHaveBeenCalled();
			});
		});

		it("harness shows the currentEventId and fetch button calls store fetch", async () => {
			cleanup();
			const fetchEventBySlug = vi.fn();
			const subscribeToEvent = vi.fn();

			installStore({ fetchEventBySlug, subscribeToEvent, currentEventId: "evt-doc" });

			const { getByTestId } = render(<Harness />);

			await waitFor(() => {
				expect(getByTestId("current-event-id").textContent).toBe("evt-doc");
			});

			fireEvent.click(getByTestId("call-fetch"));

			await waitFor(() => {
				expect(fetchEventBySlug).toHaveBeenCalledWith("doc-slug");
			});
		});

		it("subscribe button calls store subscribe and unsubscribe works", async () => {
			cleanup();
			const unsubscribe = vi.fn();
			const subscribeToEvent = vi.fn().mockReturnValue(unsubscribe);
			const fetchEventBySlug = vi.fn();

			installStore({ fetchEventBySlug, subscribeToEvent, currentEventId: "evt-2" });

			const { getByTestId } = render(<Harness />);

			fireEvent.click(getByTestId("subscribe"));

			await waitFor(() => {
				expect(subscribeToEvent).toHaveBeenCalledWith();
				expect(getByTestId("is-subscribed").textContent).toBe("true");
			});

			fireEvent.click(getByTestId("unsubscribe"));

			await waitFor(() => {
				expect(unsubscribe).toHaveBeenCalledWith();
				expect(getByTestId("is-subscribed").textContent).toBe("false");
			});
		});
	});

	describe("renderHook behavior", () => {
		it("does not fetch when slug is undefined or empty", async () => {
			const fetchEventBySlug = vi.fn();
			const subscribeToEvent = vi.fn();

			let sideEffect = false;
			fetchEventBySlug.mockReturnValue(
				EffectRuntime.sync(() => {
					sideEffect = true;
				}),
			);

			installStore({ fetchEventBySlug, subscribeToEvent, currentEventId: undefined });

			// undefined slug
			const { rerender } = renderHook(
				({ slug }) => {
					useActiveEventSync({ eventSlug: slug });
				},
				{
					initialProps: { slug: undefined as string | undefined },
				},
			);

			await waitFor(() => {
				expect(fetchEventBySlug).not.toHaveBeenCalled();
				expect(sideEffect).toBe(false);
			});

			// empty string slug
			rerender({ slug: "" });

			await waitFor(() => {
				expect(fetchEventBySlug).not.toHaveBeenCalled();
				expect(sideEffect).toBe(false);
			});
		});

		it("calls fetchEventBySlug and passes the result to EffectRuntime.runPromise when slug is provided", async () => {
			const fetchEventBySlug = vi.fn();
			const subscribeToEvent = vi.fn();

			let sideEffect = false;
			fetchEventBySlug.mockReturnValue(
				EffectRuntime.sync(() => {
					sideEffect = true;
				}),
			);

			installStore({ fetchEventBySlug, subscribeToEvent, currentEventId: undefined });

			renderHook(() => {
				useActiveEventSync({ eventSlug: "my-slug" });
			});

			await waitFor(() => {
				expect(fetchEventBySlug).toHaveBeenCalledWith("my-slug");
				expect(sideEffect).toBe(true);
			});
		});

		it("subscribes when currentEventId is defined and unsubscribes on unmount", async () => {
			const unsubscribe = vi.fn();
			const subscribeToEvent = vi.fn().mockReturnValue(unsubscribe);
			const fetchEventBySlug = vi.fn();

			installStore({ fetchEventBySlug, subscribeToEvent, currentEventId: "evt-1" });

			const { unmount } = renderHook(() => {
				useActiveEventSync({ eventSlug: undefined });
			});

			await waitFor(() => {
				expect(subscribeToEvent).toHaveBeenCalledTimes(ONCE);
			});

			unmount();

			expect(unsubscribe).toHaveBeenCalledTimes(ONCE);
		});
	});
});
