import { Effect } from "effect";
import { describe, expect, it, vi } from "vitest";

import type {
	AddEventToLibraryRequest,
	EventLibraryEntry,
	RemoveEventFromLibraryRequest,
} from "../event-library-types";
import type { EventLibrarySlice } from "../slice/EventLibrarySlice.type";

import addEventToLibraryEffect from "./addEventToLibraryEffect";

function makeGetStub(): () => EventLibrarySlice {
	// Internal mutable state for the fake slice
	const state: {
		eventLibraryEntries: Record<string, EventLibraryEntry>;
		isEventLibraryLoading: boolean;
		eventLibraryError?: string | undefined;
	} = { eventLibraryEntries: {}, isEventLibraryLoading: false, eventLibraryError: undefined };

	function setEventLibraryEntries(entries: Readonly<Record<string, EventLibraryEntry>>): void {
		state.eventLibraryEntries = { ...(entries as Record<string, EventLibraryEntry>) };
	}

	function removeEventLibraryEntry(eventId: string): void {
		state.eventLibraryEntries = Object.fromEntries(
			Object.entries(state.eventLibraryEntries).filter(([id]) => id !== eventId),
		) as Record<string, EventLibraryEntry>;
	}

	function isInEventLibrary(eventId: string): boolean {
		return eventId in state.eventLibraryEntries;
	}

	const setEventLibraryError = vi.fn((err?: string) => {
		state.eventLibraryError = err;
	});

	const addEventLibraryEntry = vi.fn((entry: EventLibraryEntry): void => {
		state.eventLibraryEntries = { ...state.eventLibraryEntries, [entry.event_id]: entry };
	});

	function addEventToLibrary(
		_request: Readonly<AddEventToLibraryRequest>,
	): Effect.Effect<void, Error> {
		return Effect.succeed(undefined);
	}

	function removeEventFromLibrary(
		_request: Readonly<RemoveEventFromLibraryRequest>,
	): Effect.Effect<void, Error> {
		return Effect.succeed(undefined);
	}

	function getEventLibraryIds(): string[] {
		return Object.keys(state.eventLibraryEntries);
	}

	function fetchEventLibrary(): Effect.Effect<void, Error> {
		return Effect.succeed(undefined);
	}

	function subscribeToEventLibrary(): Effect.Effect<() => void, Error> {
		return Effect.succeed((): void => undefined);
	}

	function subscribeToEventPublicForLibrary(): Effect.Effect<() => void, Error> {
		return Effect.succeed((): void => undefined);
	}

	function setEventLibraryLoading(loading: boolean): void {
		state.isEventLibraryLoading = loading;
	}

	const slice: EventLibrarySlice = {
		get eventLibraryEntries() {
			return state.eventLibraryEntries;
		},
		get isEventLibraryLoading() {
			return state.isEventLibraryLoading;
		},
		get eventLibraryError() {
			return state.eventLibraryError;
		},

		addEventToLibrary,
		removeEventFromLibrary,
		isInEventLibrary,
		getEventLibraryIds,
		fetchEventLibrary,
		subscribeToEventLibrary,
		subscribeToEventPublicForLibrary,
		setEventLibraryEntries,
		setEventLibraryLoading,
		setEventLibraryError,
		addEventLibraryEntry,
		removeEventLibraryEntry,
	};

	return () => slice;
}

describe("addEventToLibraryEffect", () => {
	it("throws on invalid request and sets error", async () => {
		vi.resetAllMocks();

		const get = makeGetStub();
		// @ts-expect-error: intentionally pass invalid shape to trigger validation
		const eff = addEventToLibraryEffect({}, get);

		await expect(Effect.runPromise(eff)).rejects.toThrow(/Invalid request/);

		const { setEventLibraryError } = get();
		// first call clears errors
		expect(setEventLibraryError).toHaveBeenCalledWith(undefined);
		// tapError should set an error message on the slice
		expect(setEventLibraryError).toHaveBeenCalledWith(expect.stringMatching(/Invalid request/));
	});

	it("early exits when event already in library and warns", async () => {
		vi.resetAllMocks();
		const spyWarn = vi.spyOn(console, "warn").mockImplementation(vi.fn());

		const get = makeGetStub();
		Object.assign(get(), { isInEventLibrary: vi.fn().mockReturnValue(true) });

		// stub fetch so we can assert it was NOT called
		vi.stubGlobal("fetch", vi.fn());

		const eff = addEventToLibraryEffect({ event_id: "e1" }, get);
		await expect(Effect.runPromise(eff)).resolves.toBeUndefined();

		expect(get().setEventLibraryError).toHaveBeenCalledWith(undefined);
		expect(spyWarn).toHaveBeenCalledWith("[addEventToLibrary] Event already in library:", "e1");
		expect(globalThis.fetch).not.toHaveBeenCalled();
		expect(get().addEventLibraryEntry).not.toHaveBeenCalled();
	});

	it("propagates network errors and sets slice error", async () => {
		vi.resetAllMocks();
		vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network fail")));

		const get = makeGetStub();
		const eff = addEventToLibraryEffect({ event_id: "e1" }, get);

		await expect(Effect.runPromise(eff)).rejects.toThrow(/network fail/);
		expect(get().setEventLibraryError).toHaveBeenCalledWith(expect.stringMatching(/network fail/));
	});

	it("throws when server responds non-ok and sets slice error", async () => {
		vi.resetAllMocks();
		vi.stubGlobal(
			"fetch",
			vi
				.fn()
				.mockResolvedValue(Response.json({ error: "bad" }, { status: 400, statusText: "Bad" })),
		);

		const get = makeGetStub();
		const eff = addEventToLibraryEffect({ event_id: "e1" }, get);

		await expect(Effect.runPromise(eff)).rejects.toThrow(/bad/);
		expect(get().setEventLibraryError).toHaveBeenCalledWith(expect.stringMatching(/bad/));
	});

	it("adds entry on success and clears error", async () => {
		vi.resetAllMocks();
		const entry = {
			user_id: "u1",
			event_id: "e1",
			event_owner_id: "owner1",
			created_at: "2020-01-01",
		};
		vi.stubGlobal(
			"fetch",
			vi.fn().mockResolvedValue(Response.json({ data: entry }, { status: 200 })),
		);

		const get = makeGetStub();
		const eff = addEventToLibraryEffect({ event_id: "e1" }, get);

		await expect(Effect.runPromise(eff)).resolves.toBeUndefined();
		expect(get().setEventLibraryError).toHaveBeenCalledWith(undefined);
		expect(get().addEventLibraryEntry).toHaveBeenCalledWith(entry);
	});

	it("logs validation failure and still calls addEventLibraryEntry with Error when guard throws", async () => {
		vi.resetAllMocks();

		const entry = { not: "valid" };
		vi.stubGlobal(
			"fetch",
			vi.fn().mockResolvedValue(Response.json({ data: entry }, { status: 200 })),
		);

		const spyWarn = vi.spyOn(console, "warn").mockImplementation(vi.fn());

		const addEntryMock = vi.fn();
		const get = makeGetStub();
		Object.assign(get(), { addEventLibraryEntry: addEntryMock });
		const eff = addEventToLibraryEffect({ event_id: "e1" }, get);

		await expect(Effect.runPromise(eff)).rejects.toThrow(/Expected valid EventLibrary/);

		// Validation failure should trigger a clientWarn with response data
		expect(spyWarn).toHaveBeenCalledWith(
			"[addEventToLibrary] Validation failed. Response data:",
			entry,
		);

		// The failure should also set an error on the slice
		expect(get().setEventLibraryError).toHaveBeenCalledWith(
			expect.stringMatching(/Expected valid EventLibrary/),
		);
	});
});
