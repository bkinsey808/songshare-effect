import { describe, expect, it, vi } from "vitest";

import type { Api, Get, Set } from "@/react/app-store/app-store-types";

import forceCast from "@/react/lib/test-utils/forceCast";

import type { EventEntry, EventState } from "../event-types";
import type { EventSlice } from "./EventSlice.type";

import createEventSlice from "./createEventSlice";

/**
 * Helper that mimics a minimal zustand store used by the real slice.
 * The implementation is intentionally lightweight – it keeps a mutable
 * `state` object and exposes the `set`/`get`/`api` signatures expected
 * by `createEventSlice` so the slice can be exercised in unit tests.
 */
function makeMockStore(initialState: Partial<EventState> = {}): {
	state: Partial<EventState>;
	set: Set<EventSlice>;
	get: Get<EventSlice>;
	api: Api<EventSlice>;
} {
	const eventSliceInitialState: EventState = {
		currentEvent: undefined,
		events: [],
		participants: [],
		isEventLoading: false,
		eventError: undefined,
		isEventSaving: false,
	};

	let state: Partial<EventState> = { ...initialState };

	function set(
		patchOrUpdater:
			| Partial<EventState>
			| ((stateParam: EventState & EventSlice) => Partial<EventState>),
	): void {
		if (typeof patchOrUpdater === "function") {
			const next = (patchOrUpdater as (stateParam: EventState & EventSlice) => Partial<EventState>)(
				get(),
			);
			Object.assign(state, next);
		} else {
			Object.assign(state, patchOrUpdater);
		}
	}

	function get(): EventState & EventSlice {
		// stub out the slice methods; tests don't rely on their behavior
		const base = forceCast<EventSlice>({
			fetchEventBySlug: vi.fn(),
			saveEvent: vi.fn(),
			joinEvent: vi.fn(),
			leaveEvent: vi.fn(),
			subscribeToEvent: vi.fn(),
			clearCurrentEvent: vi.fn(),
			setCurrentEvent: vi.fn(),
			setEvents: vi.fn(),
			setParticipants: vi.fn(),
			setEventLoading: vi.fn(),
			setEventError: vi.fn(),
			setEventSaving: vi.fn(),
		});

		return {
			...base,
			currentEvent: state.currentEvent ?? eventSliceInitialState.currentEvent,
			events: state.events ?? eventSliceInitialState.events,
			participants: state.participants ?? eventSliceInitialState.participants,
			isEventLoading: state.isEventLoading ?? eventSliceInitialState.isEventLoading,
			eventError: state.eventError ?? eventSliceInitialState.eventError,
			isEventSaving: state.isEventSaving ?? eventSliceInitialState.isEventSaving,
		} as EventState & EventSlice;
	}

	const api: Api<EventSlice> = {
		setState(patchOrUpdater) {
			set(
				patchOrUpdater as
					| Partial<EventState>
					| ((state: EventState & EventSlice) => Partial<EventState>),
			);
		},
		getState: get,
		getInitialState: get,
		subscribe: () => () => undefined,
	};

	return { state, set: set as Set<EventSlice>, get: get as Get<EventSlice>, api };
}

describe("createEventSlice", () => {
	it("returns initial state", () => {
		const store = makeMockStore({});
		const slice = createEventSlice(store.set, store.get, store.api);

		expect(slice.events).toStrictEqual([]);
		expect(slice.isEventLoading).toBe(false);
		expect(slice.eventError).toBeUndefined();
	});

	it("exposes slice methods", () => {
		const store = makeMockStore({});
		const slice = createEventSlice(store.set, store.get, store.api);
		expect(typeof slice.fetchEventBySlug).toBe("function");
		expect(typeof slice.setEventLoading).toBe("function");
	});

	it("setEvents updates the store", () => {
		const store = makeMockStore({});
		const slice = createEventSlice(store.set, store.get, store.api);
		const newEvent = forceCast<EventEntry>({ id: "1", name: "Test" });

		slice.setEvents([newEvent]);
		expect(store.state.events).toStrictEqual([newEvent]);
	});

	it("setEventLoading updates flag", () => {
		const store = makeMockStore({});
		const slice = createEventSlice(store.set, store.get, store.api);

		slice.setEventLoading(true);
		expect(store.state.isEventLoading).toBe(true);
	});

	it("setEventError updates error", () => {
		const store = makeMockStore({});
		const slice = createEventSlice(store.set, store.get, store.api);
		slice.setEventError("oops");
		expect(store.state.eventError).toBe("oops");
	});
});
