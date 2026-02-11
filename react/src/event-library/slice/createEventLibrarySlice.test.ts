import { Effect } from "effect";
import { describe, expect, it, vi } from "vitest";

import type { Api, Get, Set } from "@/react/app-store/app-store-types";

import type { EventLibraryEntry, EventLibraryState } from "../event-library-types";
import type { EventLibrarySlice } from "./EventLibrarySlice.type";

import createEventLibrarySlice from "./createEventLibrarySlice";

function makeMockStore(initialState: Partial<EventLibraryState> = {}): {
	state: Partial<EventLibraryState>;
	set: Set<EventLibrarySlice>;
	get: Get<EventLibrarySlice>;
	api: Api<EventLibrarySlice>;
} {
	const state: Partial<EventLibraryState> = {
		eventLibraryEntries: {},
		isEventLibraryLoading: false,
		...initialState,
	};

	function set(
		patchOrUpdater:
			| Partial<EventLibraryState>
			| ((
					stateParam: EventLibraryState & EventLibrarySlice,
			  ) => EventLibraryState & EventLibrarySlice),
	): void {
		if (typeof patchOrUpdater === "function") {
			const updater = patchOrUpdater as (
				stateParam: EventLibraryState & EventLibrarySlice,
			) => EventLibraryState & EventLibrarySlice;
			const next = updater(get());
			Object.assign(state, next);
		} else {
			Object.assign(state, patchOrUpdater);
		}
	}

	function get(): EventLibraryState & EventLibrarySlice {
		const entries = state.eventLibraryEntries ?? {};
		const base: EventLibraryState & EventLibrarySlice = {
			eventLibraryEntries: entries,
			isEventLibraryLoading: Boolean(state.isEventLibraryLoading),
			eventLibraryError: state.eventLibraryError,
			addEventToLibrary: (_req) => Effect.succeed(undefined),
			removeEventFromLibrary: (_req) => Effect.succeed(undefined),
			getEventLibraryIds: () => Object.keys(entries),
			isInEventLibrary: (id: string) => Object.hasOwn(entries, id),
			fetchEventLibrary: () => Effect.succeed(undefined),
			subscribeToEventLibrary: () => Effect.succeed(() => undefined),
			subscribeToEventPublicForLibrary: () => Effect.succeed(() => undefined),
			setEventLibraryEntries: (entriesObj) => {
				state.eventLibraryEntries = entriesObj as EventLibraryState["eventLibraryEntries"];
			},
			setEventLibraryLoading: (loading) => {
				state.isEventLibraryLoading = loading;
			},
			setEventLibraryError: (error) => {
				state.eventLibraryError = error;
			},
			addEventLibraryEntry: (entry) => {
				state.eventLibraryEntries = {
					...state.eventLibraryEntries,
					[entry.event_id]: entry,
				};
			},
			removeEventLibraryEntry: (eventId) => {
				const entriesObj = state.eventLibraryEntries ?? {};
				const { [eventId]: _removed, ...rest } = entriesObj;
				state.eventLibraryEntries = rest as Record<string, EventLibraryEntry>;
			},
		};
		return base;
	}

	const api: Api<EventLibrarySlice> = {
		setState(
			patchOrUpdater:
				| Partial<EventLibraryState>
				| ((
						stateParam: EventLibraryState & EventLibrarySlice,
				  ) => EventLibraryState & EventLibrarySlice),
		): void {
			set(
				patchOrUpdater as
					| Partial<EventLibraryState>
					| ((
							stateParam: EventLibraryState & EventLibrarySlice,
					  ) => EventLibraryState & EventLibrarySlice),
			);
		},
		getState(): EventLibraryState & EventLibrarySlice {
			return get();
		},
		subscribe(): () => void {
			return () => undefined;
		},
		getInitialState(): EventLibraryState & EventLibrarySlice {
			return get();
		},
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

		const entry: EventLibraryEntry = {
			user_id: "u1",
			event_id: "e1",
			event_owner_id: "o1",
			created_at: "2026-01-01T00:00:00Z",
		};

		slice.setEventLibraryEntries({ e1: entry });

		expect(setSpy).toHaveBeenCalledWith({ eventLibraryEntries: { e1: entry } });
		expect(state.eventLibraryEntries).toStrictEqual({ e1: entry });
	});

	it("addEventLibraryEntry and removeEventLibraryEntry manage entries", () => {
		const store = makeMockStore({ eventLibraryEntries: {} });
		const setSpy = vi.spyOn(store, "set");
		const { set, get, state, api } = store;

		const slice = createEventLibrarySlice(set, get, api);

		const entry1: EventLibraryEntry = {
			user_id: "u1",
			event_id: "e1",
			event_owner_id: "o1",
			created_at: "2026-01-01T00:00:00Z",
		};

		const entry2: EventLibraryEntry = {
			user_id: "u2",
			event_id: "e2",
			event_owner_id: "o2",
			created_at: "2026-01-02T00:00:00Z",
		};

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

		const entry1: EventLibraryEntry = {
			user_id: "u1",
			event_id: "e1",
			event_owner_id: "o1",
			created_at: "2026-01-01T00:00:00Z",
		};

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
