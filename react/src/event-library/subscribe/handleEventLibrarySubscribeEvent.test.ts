import { Effect } from "effect";
import { describe, expect, it, vi } from "vitest";

import makeEventLibrarySlice from "../slice/makeEventLibrarySlice.mock";
import makeEventLibraryEntry from "../test-utils/makeEventLibraryEntry.mock";
import handleEventLibrarySubscribeEvent from "./handleEventLibrarySubscribeEvent";

describe("handleEventLibrarySubscribeEvent", () => {
	it("ignores payloads that do not match the realtime shape", async () => {
		vi.resetAllMocks();
		const getSlice = makeEventLibrarySlice();
		const slice = getSlice();

		await Effect.runPromise(handleEventLibrarySubscribeEvent({}, {}, getSlice));

		expect(slice.addEventLibraryEntry).not.toHaveBeenCalled();
		expect(slice.removeEventLibraryEntry).not.toHaveBeenCalled();
	});

	it.each(["INSERT", "UPDATE"] as const)("adds a new entry for %s events", async (eventType) => {
		vi.resetAllMocks();
		const getSlice = makeEventLibrarySlice();
		const slice = getSlice();
		const newEntry = makeEventLibraryEntry({
			event_id: "e1",
			user_id: "u1",
			event_owner_id: "owner-1",
			created_at: "2022-01-01T00:00:00Z",
		});
		const payload = { eventType, new: newEntry } as const;

		await Effect.runPromise(handleEventLibrarySubscribeEvent(payload, {}, getSlice));

		expect(slice.addEventLibraryEntry).toHaveBeenCalledWith(newEntry);
		expect(slice.removeEventLibraryEntry).not.toHaveBeenCalled();
	});

	it("skips inserts when payload.new is missing", async () => {
		vi.resetAllMocks();
		const getSlice = makeEventLibrarySlice();
		const slice = getSlice();

		const payload = { eventType: "INSERT" as const };

		await Effect.runPromise(handleEventLibrarySubscribeEvent(payload, {}, getSlice));

		expect(slice.addEventLibraryEntry).not.toHaveBeenCalled();
		expect(slice.removeEventLibraryEntry).not.toHaveBeenCalled();
	});

	it("skips malformed new entries that fail validation", async () => {
		vi.resetAllMocks();
		const getSlice = makeEventLibrarySlice();
		const slice = getSlice();
		const malformedEntry = { user_id: "u1", event_id: 42 };

		const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => undefined);

		const payload = { eventType: "UPDATE" as const, new: malformedEntry };

		await Effect.runPromise(handleEventLibrarySubscribeEvent(payload, {}, getSlice));

		expect(slice.addEventLibraryEntry).not.toHaveBeenCalled();
		expect(slice.removeEventLibraryEntry).not.toHaveBeenCalled();
		expect(warnSpy).toHaveBeenCalledOnce();

		warnSpy.mockRestore();
	});

	it("removes an entry when DELETE includes an event_id", async () => {
		vi.resetAllMocks();
		const getSlice = makeEventLibrarySlice();
		const slice = getSlice();
		const eventId = "e-123";

		const payload = { eventType: "DELETE", old: { event_id: eventId } };

		await Effect.runPromise(handleEventLibrarySubscribeEvent(payload, {}, getSlice));

		expect(slice.removeEventLibraryEntry).toHaveBeenCalledWith(eventId);
		expect(slice.addEventLibraryEntry).not.toHaveBeenCalled();
	});

	it("skips removal when DELETE payload is missing event_id", async () => {
		vi.resetAllMocks();
		const getSlice = makeEventLibrarySlice();
		const slice = getSlice();

		const payload = { eventType: "DELETE", old: {} };

		await Effect.runPromise(handleEventLibrarySubscribeEvent(payload, {}, getSlice));

		expect(slice.removeEventLibraryEntry).not.toHaveBeenCalled();
		expect(slice.addEventLibraryEntry).not.toHaveBeenCalled();
	});

	it("skips removal when DELETE event_id is not a string", async () => {
		vi.resetAllMocks();
		const getSlice = makeEventLibrarySlice();
		const slice = getSlice();

		const payload = { eventType: "DELETE" as const, old: { event_id: 1234 } };

		await Effect.runPromise(handleEventLibrarySubscribeEvent(payload, {}, getSlice));

		expect(slice.removeEventLibraryEntry).not.toHaveBeenCalled();
		expect(slice.addEventLibraryEntry).not.toHaveBeenCalled();
	});
});
