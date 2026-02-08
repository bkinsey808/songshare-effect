import { describe, expect, it } from "vitest";

import { isEvent, isEventPublic } from "./guardEventTypes";

describe("guardEventTypes", () => {
	it("returns false for non-events", () => {
		expect(isEvent(undefined)).toBe(false);
		expect(isEvent({})).toBe(false);
	});

	it("returns true for valid Event", () => {
		const ev = {
			created_at: "2020-01-01T00:00:00Z",
			event_id: "00000000-0000-0000-0000-000000000001",
			owner_id: "00000000-0000-0000-0000-000000000002",
			private_notes: "notes",
			updated_at: "2020-01-01T00:00:00Z",
		};
		expect(isEvent(ev)).toBe(true);
	});

	it("returns false for non-EventPublic values", () => {
		expect(isEventPublic(undefined)).toBe(false);
		expect(isEventPublic({})).toBe(false);
	});

	it("returns true for valid EventPublic", () => {
		const pub = {
			event_id: "00000000-0000-0000-0000-000000000010",
			event_name: "My Event",
			event_slug: "my-event",
			is_public: true,
			owner_id: "00000000-0000-0000-0000-000000000011",
		};
		expect(isEventPublic(pub)).toBe(true);
	});
});
