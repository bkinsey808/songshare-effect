import { Effect } from "effect";
import { describe, expect, it, vi } from "vitest";

import type { Api, Get, Set } from "@/react/app-store/app-store-types";

import type { EventLibraryEntry, EventLibraryState } from "../event-library-types";
import subscribeToEventPublicForLibraryEffect from "../subscribe/subscribeToEventPublicForLibraryEffect";
import makeEventLibraryEntry from "../test-utils/makeEventLibraryEntry.mock";
import createEventLibrarySlice from "./createEventLibrarySlice";
import type { EventLibrarySlice } from "./EventLibrarySlice.type";
import makeEventLibrarySlice from "./makeEventLibrarySlice.test-util";

// Mock the subscription effect to avoid network calls and authentication
vi.mock("../subscribe/subscribeToEventPublicForLibraryEffect");

/**
 * Mimics a minimal zustand store for createEventLibrarySlice.
 * Uses makeEventLibrarySlice for base behavior; state is mutable for test control.
 *
 * @param initialState - Optional initial state overrides for the mock
 * @returns Mock store utilities (`state`, `set`, `get`, `api`)
 */
function makeMockStore(initialState: Partial<EventLibraryState> = {}): {
	state: Partial<EventLibraryState>;
	set: Set<EventLibrarySlice>;
	get: Get<EventLibrarySlice>;
	api: Api<EventLibrarySlice>;
} {
	// Delegate base behavior to shared helper to avoid duplication in tests.
	const getHelper = makeEventLibrarySlice(initialState.eventLibraryEntries ?? {});

	let state: Partial<EventLibraryState> = {
		eventLibraryEntries: initialState.eventLibraryEntries ?? {},
		isEventLibraryLoading: Boolean(initialState.isEventLibraryLoading ?? false),
		eventLibraryError: initialState.eventLibraryError,
	};

	/**
	 * Mock `set` implementation for the test store that applies partials or updaters.
	 *
	 * @param patchOrUpdater - Partial state or updater function applied to the mock store.
	 * @returns void
	 */
	function set(
		patchOrUpdater:
			| Partial<EventLibraryState>
			| ((stateParam: EventLibraryState & EventLibrarySlice) => Partial<EventLibraryState>),
	): void {
		if (typeof patchOrUpdater === "function") {
			const next = (
				patchOrUpdater as (
					stateParam: EventLibraryState & EventLibrarySlice,
				) => Partial<EventLibraryState>
			)(get());
			Object.assign(state, next);
		} else {
			Object.assign(state, patchOrUpdater);
		}
	}

	/**
	 * Update the mock state with a patch or updater function.
	 *
	 * @param patchOrUpdater - Partial state or updater function applied to state
	 * @returns void
	 */

	/**
	 * Test getter that composes the current mock state with slice helpers.
	 *
	 * @returns EventLibraryState merged with test slice methods
	 */
	function get(): EventLibraryState & EventLibrarySlice {
		const base = getHelper();
		return {
			...base,
			get eventLibraryEntries(): Record<string, EventLibraryEntry> {
				return state.eventLibraryEntries ?? {};
			},
			get isEventLibraryLoading(): boolean {
				return Boolean(state.isEventLibraryLoading);
			},
			get eventLibraryError(): string | undefined {
				return state.eventLibraryError;
			},
			/**
			 * Set the event library entries in the mock state.
			 *
			 * @param entriesObj - record of EventLibraryEntry keyed by event id
			 * @returns void
			 */
			setEventLibraryEntries(entriesObj) {
				state.eventLibraryEntries = entriesObj as EventLibraryState["eventLibraryEntries"];
			},

			/**
			 * Update loading flag for event library in mock state.
			 *
			 * @param loading - true when loading
			 * @returns void
			 */
			setEventLibraryLoading(loading) {
				state.isEventLibraryLoading = loading;
			},

			/**
			 * Set an error message on the mock state.
			 *
			 * @param error - optional error string
			 * @returns void
			 */
			setEventLibraryError(error) {
				state.eventLibraryError = error;
			},

			/**
			 * Add an event library entry to the mock state.
			 *
			 * @param entry - EventLibraryEntry to add
			 * @returns void
			 */
			addEventLibraryEntry(entry) {
				state.eventLibraryEntries = {
					...state.eventLibraryEntries,
					[entry.event_id]: entry,
				};
			},

			/**
			 * Remove an event library entry from mock state.
			 *
			 * @param eventId - id of event to remove
			 * @returns void
			 */
			removeEventLibraryEntry(eventId) {
				const entriesObj = state.eventLibraryEntries ?? {};
				const { [eventId]: _removed, ...rest } = entriesObj;
				state.eventLibraryEntries = rest as Record<string, EventLibraryEntry>;
			},
		} as EventLibraryState & EventLibrarySlice;
	}

	const api: Api<EventLibrarySlice> = {
		/**
		 * Proxy `setState` on the test API to the local `set` helper.
		 *
		 * @param patchOrUpdater - partial state or updater function
		 * @returns void
		 */
		setState(patchOrUpdater) {
			set(
				patchOrUpdater as
					| Partial<EventLibraryState>
					| ((state: EventLibraryState & EventLibrarySlice) => Partial<EventLibraryState>),
			);
		},
		getState: get,
		getInitialState: get,
		subscribe: () => () => undefined,
	};

	return { state, set: set as Set<EventLibrarySlice>, get: get as Get<EventLibrarySlice>, api };
}

describe("createEventLibrarySlice", () => {
	/**
	 * Install a mocked subscription effect implementation for tests.
	 *
	 * @returns void
	 */
	function installSubscriptionMock(): void {
		vi.mocked(subscribeToEventPublicForLibraryEffect).mockImplementation(() =>
			Effect.succeed(() => undefined),
		);
	}

	it("returns initial state", () => {
		installSubscriptionMock();
		const store = makeMockStore({
			isEventLibraryLoading: false,
			eventLibraryEntries: {},
			eventLibraryError: undefined,
		});
		const { set, get, api } = store;

		const slice = createEventLibrarySlice(set, get, api);

		expect(slice.eventLibraryEntries).toStrictEqual({});
		expect(slice.isEventLibraryLoading).toBe(false);
		expect(slice.eventLibraryError).toBeUndefined();
	});

	it("exposes key methods", () => {
		installSubscriptionMock();
		const store = makeMockStore({});
		const { set, get, api } = store;
		const slice = createEventLibrarySlice(set, get, api);

		expect(typeof slice.addEventToLibrary).toBe("function");
		expect(typeof slice.removeEventFromLibrary).toBe("function");
		expect(typeof slice.isInEventLibrary).toBe("function");
		expect(typeof slice.getEventLibraryIds).toBe("function");
		expect(typeof slice.setEventLibraryEntries).toBe("function");
	});

	it("setEventLibraryEntries updates entries", () => {
		installSubscriptionMock();
		const store = makeMockStore({ eventLibraryEntries: {} });
		const setSpy = vi.spyOn(store, "set");
		const { set, get, state, api } = store;

		const slice = createEventLibrarySlice(set, get, api);

		const entry = makeEventLibraryEntry();

		slice.setEventLibraryEntries({ e1: entry });

		expect(setSpy).toHaveBeenCalledWith({ eventLibraryEntries: { e1: entry } });
		expect(state.eventLibraryEntries).toStrictEqual({ e1: entry });
	});

	it("addEventLibraryEntry and removeEventLibraryEntry manage entries", () => {
		installSubscriptionMock();
		const store = makeMockStore({ eventLibraryEntries: {} });
		const setSpy = vi.spyOn(store, "set");
		const { set, get, state, api } = store;

		const slice = createEventLibrarySlice(set, get, api);

		const entry1 = makeEventLibraryEntry({ user_id: "u1", event_id: "e1" });

		const entry2 = makeEventLibraryEntry({ user_id: "u2", event_id: "e2" });

		slice.addEventLibraryEntry(entry1);
		expect(setSpy).toHaveBeenCalledWith(expect.any(Function));
		expect(state.eventLibraryEntries).toHaveProperty("e1");

		slice.addEventLibraryEntry(entry2);
		expect(state.eventLibraryEntries).toHaveProperty("e2");

		slice.removeEventLibraryEntry("e1");
		expect(state.eventLibraryEntries).not.toHaveProperty("e1");
		expect(state.eventLibraryEntries).toHaveProperty("e2");
	});

	it("getEventLibraryIds and isInEventLibrary behave correctly", () => {
		installSubscriptionMock();
		const store = makeMockStore({ eventLibraryEntries: {} });
		const { set, get, api } = store;

		const slice = createEventLibrarySlice(set, get, api);

		const entry1 = makeEventLibraryEntry({ user_id: "u1", event_id: "e1" });

		slice.addEventLibraryEntry(entry1);

		expect(slice.getEventLibraryIds()).toStrictEqual(["e1"]);
		expect(slice.isInEventLibrary("e1")).toBe(true);
		expect(slice.isInEventLibrary("missing")).toBe(false);
	});

	it("setEventLibraryLoading and setEventLibraryError update state", () => {
		installSubscriptionMock();
		const store = makeMockStore({ isEventLibraryLoading: false, eventLibraryError: undefined });
		const setSpy = vi.spyOn(store, "set");
		const { set, get, state, api } = store;

		const slice = createEventLibrarySlice(set, get, api);

		slice.setEventLibraryLoading(true);
		expect(setSpy).toHaveBeenCalledWith({ isEventLibraryLoading: true });
		expect(state.isEventLibraryLoading).toBe(true);

		slice.setEventLibraryError("err");
		expect(setSpy).toHaveBeenCalledWith({ eventLibraryError: "err" });
		expect(state.eventLibraryError).toBe("err");
	});

	it("subscribeToEventPublicForLibrary returns a successful effect with a function", async () => {
		installSubscriptionMock();
		const store = makeMockStore({});
		const { set, get, api } = store;

		const slice = createEventLibrarySlice(set, get, api);

		const effect = slice.subscribeToEventPublicForLibrary();
		const fn = await Effect.runPromise(effect);
		expect(typeof fn).toBe("function");
	});
});
