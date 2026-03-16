import { describe, expect, it } from "vitest";

import forceCast from "@/react/lib/test-utils/forceCast";
import makeNull from "@/shared/test-utils/makeNull.test-util";

import normalizeEventPublicRow from "./normalizeEventPublicRow";
import { createRowWithAllNullables, createRowWithNulls } from "./normalizeEventPublicRow.test-util";

const NOT_A_RECORD = 42;

describe("normalizeEventPublicRow", () => {
	it("returns value as-is when not a record", () => {
		expect(normalizeEventPublicRow(makeNull())).toBeNull();
		expect(normalizeEventPublicRow(NOT_A_RECORD)).toBe(NOT_A_RECORD);
		expect(normalizeEventPublicRow("string")).toBe("string");
		expect(normalizeEventPublicRow([])).toStrictEqual([]);
	});

	it("converts null to undefined for nullable keys", () => {
		const input = createRowWithNulls();
		const result = forceCast<Record<string, unknown>>(normalizeEventPublicRow(input));
		expect(result["event_id"]).toBe("evt-1");
		expect(result["active_playlist_id"]).toBeUndefined();
		expect(result["active_song_id"]).toBeUndefined();
		expect(result["event_date"]).toBeUndefined();
	});

	it("preserves non-null values", () => {
		const input = {
			event_id: "evt-1",
			active_playlist_id: "pl-1",
			event_date: "2026-01-01",
		};
		const result = forceCast<Record<string, unknown>>(normalizeEventPublicRow(input));
		expect(result["active_playlist_id"]).toBe("pl-1");
		expect(result["event_date"]).toBe("2026-01-01");
	});

	it("normalizes all known nullable keys", () => {
		const input = createRowWithAllNullables();
		const result = forceCast<Record<string, unknown>>(normalizeEventPublicRow(input));
		const keys = Object.keys(result);
		for (const key of keys) {
			expect(result[key]).toBeUndefined();
		}
	});

	it("does not mutate the input object", () => {
		const input = createRowWithNulls();
		normalizeEventPublicRow(input);
		// Input still has null (Supabase shape); we copy to normalized and convert there
		expect(input["active_playlist_id"]).toBeNull();
	});
});
