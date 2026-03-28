import { describe, expect, it } from "vitest";

import makeNull from "@/shared/test-utils/makeNull.test-util";
import decodeUnknownSyncOrThrow from "@/shared/validation/decodeUnknownSyncOrThrow";

import eventFormSchema from "./eventFormSchema";

describe("eventFormSchema", () => {
	it("decodes valid form data", () => {
		const input = {
			event_name: "Test Event",
			event_slug: "test-event",
		} as unknown;

		const result = decodeUnknownSyncOrThrow(eventFormSchema, input);

		expect(result.event_name).toBe("Test Event");
		expect(result.event_slug).toBe("test-event");
	});

	it("accepts optional fields", () => {
		const input = {
			event_id: "evt-123",
			event_name: "My Event",
			event_slug: "my-event",
			event_description: "Description",
			event_date: "2025-01-15",
			is_public: true,
			public_notes: "Public",
			private_notes: "Private",
		} as unknown;

		const result = decodeUnknownSyncOrThrow(eventFormSchema, input);

		expect(result.event_id).toBe("evt-123");
		expect(result.event_description).toBe("Description");
		expect(result.event_date).toBe("2025-01-15");
		expect(result.is_public).toBe(true);
		expect(result.public_notes).toBe("Public");
		expect(result.private_notes).toBe("Private");
	});

	it("accepts nullish active fields", () => {
		const input = {
			event_name: "Event",
			event_slug: "event",
			active_playlist_id: makeNull(),
			active_song_id: undefined,
			active_slide_position: makeNull(),
		} as unknown;

		const result = decodeUnknownSyncOrThrow(eventFormSchema, input);

		expect(result.active_playlist_id).toBeNull();
		expect(result.active_slide_position).toBeNull();
	});

	it("accepts tags", () => {
		const input = {
			event_name: "Tagged Event",
			event_slug: "tagged-event",
			tags: ["worship", "youth"],
		} as unknown;

		const result = decodeUnknownSyncOrThrow(eventFormSchema, input);

		expect(result.tags).toStrictEqual(["worship", "youth"]);
	});

	it("throws when event_name is too short", () => {
		const input = { event_name: "x", event_slug: "valid-slug" } as unknown;

		expect(() => decodeUnknownSyncOrThrow(eventFormSchema, input)).toThrow(/length|min/i);
	});

	it("throws when event_slug has invalid characters", () => {
		const input = { event_name: "Valid Name", event_slug: "invalid_slug" } as unknown;

		expect(() => decodeUnknownSyncOrThrow(eventFormSchema, input)).toThrow(
			/lowercase|slug|pattern/i,
		);
	});
});
