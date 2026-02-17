import { describe, expect, it } from "vitest";

import isRecord from "@/shared/type-guards/isRecord";

import normalizeEventPublicRow from "./normalizeEventPublicRow";

const NULL_VALUE: unknown = JSON.parse("null");

/**
 * Narrows unknown values to records for test assertions.
 *
 * @param value - Value to narrow
 * @returns The input value as a record
 */
function toRecordOrThrow(value: unknown): Record<string, unknown> {
	if (!isRecord(value)) {
		throw new TypeError("Expected a record value");
	}

	return value;
}

describe("normalizeEventPublicRow", () => {
	it("should return non-record values unchanged", () => {
		const primitiveValue = "not-a-record";
		const arrayValue = ["a", "b"];

		const normalizedPrimitive = normalizeEventPublicRow(primitiveValue);
		const normalizedArray = normalizeEventPublicRow(arrayValue);

		expect(normalizedPrimitive).toBe(primitiveValue);
		expect(normalizedArray).toBe(arrayValue);
	});

	it("should convert known nullable fields from null to undefined", () => {
		const row: unknown = JSON.parse(`{
			"active_playlist_id": null,
			"active_slide_id": null,
			"active_song_id": null,
			"event_date": null,
			"event_description": null,
			"public_notes": null,
			"created_at": null,
			"updated_at": null
		}`);

		const normalized = toRecordOrThrow(normalizeEventPublicRow(row));

		expect(normalized).toMatchObject({
			active_playlist_id: undefined,
			active_slide_id: undefined,
			active_song_id: undefined,
			event_date: undefined,
			event_description: undefined,
			public_notes: undefined,
			created_at: undefined,
			updated_at: undefined,
		});
	});

	it("should keep non-null values for known nullable fields", () => {
		const row = {
			active_playlist_id: "playlist-1",
			active_slide_id: undefined,
			active_song_id: "song-1",
			event_date: "2026-02-16",
			event_description: "desc",
			public_notes: "notes",
			created_at: "2026-02-16T00:00:00Z",
			updated_at: "2026-02-16T00:00:00Z",
		};

		const normalized = toRecordOrThrow(normalizeEventPublicRow(row));

		expect(normalized).toMatchObject(row);
	});

	it("should not mutate the input and should keep unrelated keys as-is", () => {
		const row: unknown = JSON.parse(`{
			"event_description": null,
			"custom_nullable": null,
			"event_name": "My Event"
		}`);
		const rowRecord = toRecordOrThrow(row);
		const normalized = toRecordOrThrow(normalizeEventPublicRow(rowRecord));

		expect(normalized).not.toBe(rowRecord);
		expect(rowRecord["event_description"]).toStrictEqual(NULL_VALUE);
		expect(normalized["event_description"]).toBeUndefined();
		expect(normalized["custom_nullable"]).toStrictEqual(NULL_VALUE);
		expect(normalized["event_name"]).toBe("My Event");
	});
});
