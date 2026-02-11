import { Effect } from "effect";
import { describe, expect, it, vi } from "vitest";

import type { EventLibrarySlice } from "../slice/EventLibrarySlice.type";

import handleEventLibrarySubscribeEvent from "./handleEventLibrarySubscribeEvent";

function createSliceGetter(): {
	readonly getSlice: () => EventLibrarySlice;
	readonly addEventLibraryEntry: ReturnType<typeof vi.fn>;
	readonly removeEventLibraryEntry: ReturnType<typeof vi.fn>;
} {
	const addEventLibraryEntry = vi.fn();
	const removeEventLibraryEntry = vi.fn();

	const slice: EventLibrarySlice = {
		eventLibraryEntries: {},
		isEventLibraryLoading: false,
		eventLibraryError: undefined,
		addEventToLibrary: (_req: unknown) => Effect.sync(() => undefined),
		removeEventFromLibrary: (_req: unknown) => Effect.sync(() => undefined),
		getEventLibraryIds: () => [],
		fetchEventLibrary: () => Effect.sync(() => undefined),
		subscribeToEventLibrary: (): Effect.Effect<() => void, Error> =>
			Effect.sync((): (() => void) => () => {
				/* no-op cleanup */
			}),
		subscribeToEventPublicForLibrary: (): Effect.Effect<() => void, Error> =>
			Effect.sync((): (() => void) => () => {
				/* no-op cleanup */
			}),
		eventLibraryUnsubscribe: (): void => undefined,
		setEventLibraryEntries: () => undefined,
		setEventLibraryLoading: () => undefined,
		setEventLibraryError: () => undefined,
		addEventLibraryEntry,
		removeEventLibraryEntry,
		isInEventLibrary: () => false,
	};

	function getSlice(): EventLibrarySlice {
		return slice;
	}

	return { getSlice, addEventLibraryEntry, removeEventLibraryEntry };
}

describe("handleEventLibrarySubscribeEvent", () => {
	it("ignores payloads that do not match the realtime shape", async () => {
		vi.resetAllMocks();
		const { getSlice, addEventLibraryEntry, removeEventLibraryEntry } = createSliceGetter();

		await Effect.runPromise(handleEventLibrarySubscribeEvent({}, {}, getSlice));

		expect(addEventLibraryEntry).not.toHaveBeenCalled();
		expect(removeEventLibraryEntry).not.toHaveBeenCalled();
	});

	it.each(["INSERT", "UPDATE"] as const)("adds a new entry for %s events", async (eventType) => {
		vi.resetAllMocks();
		const { getSlice, addEventLibraryEntry, removeEventLibraryEntry } = createSliceGetter();
		const newEntry = {
			user_id: "u1",
			event_id: "e1",
			event_owner_id: "owner-1",
			created_at: "2022-01-01T00:00:00Z",
		};
		const payload = { eventType, new: newEntry } as const;

		await Effect.runPromise(handleEventLibrarySubscribeEvent(payload, {}, getSlice));

		expect(addEventLibraryEntry).toHaveBeenCalledWith(newEntry);
		expect(removeEventLibraryEntry).not.toHaveBeenCalled();
	});

	it("skips inserts when payload.new is missing", async () => {
		vi.resetAllMocks();
		const { getSlice, addEventLibraryEntry, removeEventLibraryEntry } = createSliceGetter();

		const payload = { eventType: "INSERT" as const };

		await Effect.runPromise(handleEventLibrarySubscribeEvent(payload, {}, getSlice));

		expect(addEventLibraryEntry).not.toHaveBeenCalled();
		expect(removeEventLibraryEntry).not.toHaveBeenCalled();
	});

	it("skips malformed new entries that fail validation", async () => {
		vi.resetAllMocks();
		const { getSlice, addEventLibraryEntry, removeEventLibraryEntry } = createSliceGetter();
		const malformedEntry = { user_id: "u1", event_id: 42 };

		const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => undefined);

		const payload = { eventType: "UPDATE" as const, new: malformedEntry };

		await Effect.runPromise(handleEventLibrarySubscribeEvent(payload, {}, getSlice));

		expect(addEventLibraryEntry).not.toHaveBeenCalled();
		expect(removeEventLibraryEntry).not.toHaveBeenCalled();
		expect(warnSpy).toHaveBeenCalledOnce();

		warnSpy.mockRestore();
	});

	it("removes an entry when DELETE includes an event_id", async () => {
		vi.resetAllMocks();
		const { getSlice, addEventLibraryEntry, removeEventLibraryEntry } = createSliceGetter();
		const eventId = "e-123";

		const payload = { eventType: "DELETE", old: { event_id: eventId } };

		await Effect.runPromise(handleEventLibrarySubscribeEvent(payload, {}, getSlice));

		expect(removeEventLibraryEntry).toHaveBeenCalledWith(eventId);
		expect(addEventLibraryEntry).not.toHaveBeenCalled();
	});

	it("skips removal when DELETE payload is missing event_id", async () => {
		vi.resetAllMocks();
		const { getSlice, addEventLibraryEntry, removeEventLibraryEntry } = createSliceGetter();

		const payload = { eventType: "DELETE", old: {} };

		await Effect.runPromise(handleEventLibrarySubscribeEvent(payload, {}, getSlice));

		expect(removeEventLibraryEntry).not.toHaveBeenCalled();
		expect(addEventLibraryEntry).not.toHaveBeenCalled();
	});

	it("skips removal when DELETE event_id is not a string", async () => {
		vi.resetAllMocks();
		const { getSlice, addEventLibraryEntry, removeEventLibraryEntry } = createSliceGetter();

		const payload = { eventType: "DELETE" as const, old: { event_id: 1234 } };

		await Effect.runPromise(handleEventLibrarySubscribeEvent(payload, {}, getSlice));

		expect(removeEventLibraryEntry).not.toHaveBeenCalled();
		expect(addEventLibraryEntry).not.toHaveBeenCalled();
	});
});
