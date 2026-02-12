import { describe, expect, it } from "vitest";

import makeEventLibraryEntry from "@/react/event-library/test-utils/makeEventLibraryEntry.mock";

import type { EventLibraryEntry } from "../event-library-types";

import makeEventLibrarySlice from "./makeEventLibrarySlice.mock";

describe("makeEventLibrarySlice", () => {
	it("reflects initial entries and setters update state", () => {
		const initial: Record<string, EventLibraryEntry> = {
			e1: makeEventLibraryEntry({
				user_id: "u1",
				event_id: "e1",
				event_owner_id: "o",
				created_at: "t",
			}),
		};
		const get = makeEventLibrarySlice(initial);
		const slice = get();

		expect(slice.eventLibraryEntries).toStrictEqual(initial);

		slice.setEventLibraryEntries({});
		expect(slice.eventLibraryEntries).toStrictEqual({});

		slice.setEventLibraryError("err");
		expect(slice.eventLibraryError).toBe("err");

		slice.setEventLibraryLoading(true);
		expect(slice.isEventLibraryLoading).toBe(true);
	});

	it("add and remove mutate state and isInEventLibrary reflects changes", () => {
		const get = makeEventLibrarySlice();
		const slice = get();

		const entry = makeEventLibraryEntry({
			user_id: "u2",
			event_id: "e2",
			event_owner_id: "o",
			created_at: "t",
		});

		slice.addEventLibraryEntry(entry);
		expect(slice.isInEventLibrary("e2")).toBe(true);
		expect(slice.eventLibraryEntries["e2"]).toStrictEqual(entry);

		slice.removeEventLibraryEntry("e2");
		expect(slice.isInEventLibrary("e2")).toBe(false);
	});

	it("exposes vi.fn spies for actions", () => {
		const get = makeEventLibrarySlice();
		const slice = get();

		slice.addEventLibraryEntry({
			user_id: "u3",
			event_id: "e3",
			event_owner_id: "o",
			created_at: "t",
		});
		expect(slice.addEventLibraryEntry).toHaveBeenCalledWith(
			expect.objectContaining({ event_id: "e3" }),
		);
	});
});
