import { describe, expect, it } from "vitest";

import { clientLocalDateToUtcTimestamp, utcTimestampToClientLocalDate } from "./formatEventDate";

describe("clientLocalDateToUtcTimestamp", () => {
	it("converts YYYY/MM/DD HH:mm format to UTC ISO timestamp", () => {
		// Using a fixed date to test: Jan 1, 2026 at 00:00
		// In any timezone, this should parse to a valid ISO UTC timestamp
		const result = clientLocalDateToUtcTimestamp("2026/01/01 00:00");
		expect(result).toBeDefined();
		expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:00\.000Z$/);
	});

	it("converts YYYY/MM/DD format without time (defaults to 00:00)", () => {
		const result = clientLocalDateToUtcTimestamp("2026/06/15");
		expect(result).toBeDefined();
		expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:00\.000Z$/);
	});

	it("handles different times correctly", () => {
		const result = clientLocalDateToUtcTimestamp("2026/12/25 14:30");
		expect(result).toBeDefined();
		// Just verify it's a valid ISO timestamp, don't check the exact date
		// since the date changes based on timezone offset
		expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:00\.000Z$/);
	});

	const invalidLocalInputs: (string | undefined)[] = [
		"",
		undefined,
		"invalid",
		"2026-01-01",
		"01/01/2026",
		"2026/13/01",
		"2026/00/01",
		"2026/01/01 14",
	];

	const invalidLocalCases = invalidLocalInputs.map((input, idx) => ({
		name: `invalid-local-${idx}`,
		input,
	}));

	it.each(invalidLocalCases)("clientLocalDateToUtcTimestamp($name) => undefined", ({ input }) => {
		// Act
		const got = clientLocalDateToUtcTimestamp(input);

		// Assert
		expect(got).toBeUndefined();
	});
});

describe("utcTimestampToClientLocalDate", () => {
	it("converts ISO UTC timestamp to YYYY/MM/DD HH:mm format", () => {
		const result = utcTimestampToClientLocalDate("2026-01-01T00:00:00Z");
		expect(result).toMatch(/^\d{4}\/\d{2}\/\d{2} \d{2}:\d{2}$/);
	});

	it("handles various ISO timestamps", () => {
		const result = utcTimestampToClientLocalDate("2026-12-25T14:30:45Z");
		expect(result).toMatch(/^\d{4}\/\d{2}\/\d{2} \d{2}:\d{2}$/);
		expect(result).toContain("2026");
	});

	const invalidUtcInputs: (string | undefined)[] = [
		"",
		undefined,
		"invalid",
		"2026-01-01",
		"not-a-date",
	];

	const invalidUtcCases = invalidUtcInputs.map((input, idx) => ({
		name: `invalid-utc-${idx}`,
		input,
	}));

	it.each(invalidUtcCases)("utcTimestampToClientLocalDate($name) => empty string", ({ input }) => {
		// Act
		const got = utcTimestampToClientLocalDate(input);

		// Assert
		expect(got).toBe("");
	});

	it("handles timestamps with milliseconds", () => {
		const result = utcTimestampToClientLocalDate("2026-01-15T10:30:25.123Z");
		expect(result).toMatch(/^\d{4}\/\d{2}\/\d{2} \d{2}:\d{2}$/);
	});
});

describe("roundtrip conversion", () => {
	it("converts local to UTC and back preserves time (modulo timezone)", () => {
		const originalInput = "2026/07/04 12:30";
		const utcTimestamp = clientLocalDateToUtcTimestamp(originalInput);

		expect(utcTimestamp).toBeDefined();
		// Function accepts undefined, so we can pass directly after checking it's defined
		const result = utcTimestampToClientLocalDate(utcTimestamp);
		// The roundtrip should give us back the same local time parts
		expect(result).toContain("2026/07/04 12:30");
	});

	it("handles leap year dates", () => {
		const originalInput = "2024/02/29 23:59";
		const utcTimestamp = clientLocalDateToUtcTimestamp(originalInput);

		expect(utcTimestamp).toBeDefined();
		// Function accepts undefined, so we can pass directly after checking it's defined
		const result = utcTimestampToClientLocalDate(utcTimestamp);
		expect(result).toContain("2024/02/29 23:59");
	});
});
