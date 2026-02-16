import { Effect } from "effect";
import { describe, expect, it, vi } from "vitest";

import type { Api, Get, Set } from "@/react/app-store/app-store-types";

import type { EventLibraryEntry, EventLibraryState } from "../event-library-types";
import type { EventLibrarySlice } from "./EventLibrarySlice.type";

import makeEventLibraryEntry from "../test-utils/makeEventLibraryEntry.mock";
import createEventLibrarySlice from "./createEventLibrarySlice";
import makeEventLibrarySlice from "./makeEventLibrarySlice.mock";

// Mock the subscription effect to avoid network calls and authentication
// oxlint-disable-next-line eslint-plugin-jest(no-untyped-mock-factory)
vi.mock("../subscribe/subscribeToEventPublicForLibraryEffect", () => ({
	default: vi.fn(() => Effect.succeed(() => undefined)),
}));

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
			setEventLibraryEntries(entriesObj) {
				state.eventLibraryEntries = entriesObj as EventLibraryState["eventLibraryEntries"];
			},
			setEventLibraryLoading(loading) {
				state.isEventLibraryLoading = loading;
			},
			setEventLibraryError(error) {
				state.eventLibraryError = error;
			},
			addEventLibraryEntry(entry) {
				state.eventLibraryEntries = {
					...state.eventLibraryEntries,
					[entry.event_id]: entry,
				};
			},
			removeEventLibraryEntry(eventId) {
				const entriesObj = state.eventLibraryEntries ?? {};
				const { [eventId]: _removed, ...rest } = entriesObj;
				state.eventLibraryEntries = rest as Record<string, EventLibraryEntry>;
			},
		} as EventLibraryState & EventLibrarySlice;
	}

	const api: Api<EventLibrarySlice> = {
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
	it("returns initial state", () => {
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
		const store = makeMockStore({ eventLibraryEntries: {} });
		const setSpy = vi.spyOn(store, "set");
		const { set, get, state, api } = store;

		const slice = createEventLibrarySlice(set, get, api);

		const entry1 = makeEventLibraryEntry({ user_id: "u1", event_id: "e1", event_owner_id: "o1" });

		const entry2 = makeEventLibraryEntry({ user_id: "u2", event_id: "e2", event_owner_id: "o2" });

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
		const store = makeMockStore({ eventLibraryEntries: {} });
		const { set, get, api } = store;

		const slice = createEventLibrarySlice(set, get, api);

		const entry1 = makeEventLibraryEntry({ user_id: "u1", event_id: "e1", event_owner_id: "o1" });

		slice.addEventLibraryEntry(entry1);

		expect(slice.getEventLibraryIds()).toStrictEqual(["e1"]);
		expect(slice.isInEventLibrary("e1")).toBe(true);
		expect(slice.isInEventLibrary("missing")).toBe(false);
	});

	it("setEventLibraryLoading and setEventLibraryError update state", () => {
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
		const store = makeMockStore({});
		const { set, get, api } = store;

		const slice = createEventLibrarySlice(set, get, api);

		const effect = slice.subscribeToEventPublicForLibrary();
		const fn = await Effect.runPromise(effect);
		expect(typeof fn).toBe("function");
	});
});
