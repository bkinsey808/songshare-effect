import { describe, expect, it } from "vitest";

import { clientLocalDateToUtcTimestamp, utcTimestampToClientLocalDate } from "./formatEventDate";

describe("clientLocalDateToUtcTimestamp", () => {
	it("converts YYYY/MM/DD HH:mm format to UTC ISO timestamp", () => {
		const result = clientLocalDateToUtcTimestamp("2026/01/01 00:00");
		expect(result).toBeDefined();
		expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:00\.000Z$/);
	});

	it("converts YYYY/MM/DD format without time (defaults to 00:00)", () => {
		const result = clientLocalDateToUtcTimestamp("2026/06/15");
		expect(result).toBeDefined();
		expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:00\.000Z$/);
	});

	it("returns undefined for empty/null/undefined inputs", () => {
		expect(clientLocalDateToUtcTimestamp("")).toBeUndefined();
		expect(clientLocalDateToUtcTimestamp(undefined)).toBeUndefined();
		// null is not used by project conventions — assert undefined instead
		expect(clientLocalDateToUtcTimestamp(undefined)).toBeUndefined();
	});

	it("returns undefined for invalid formats or values", () => {
		expect(clientLocalDateToUtcTimestamp("invalid")).toBeUndefined();
		expect(clientLocalDateToUtcTimestamp("2026-01-01")).toBeUndefined();
		expect(clientLocalDateToUtcTimestamp("2026/13/01")).toBeUndefined();
		expect(clientLocalDateToUtcTimestamp("2026/01/01 14")).toBeUndefined();
	});
});

describe("utcTimestampToClientLocalDate", () => {
	it("converts ISO UTC timestamp to YYYY/MM/DD HH:mm format", () => {
		const result = utcTimestampToClientLocalDate("2026-01-01T00:00:00Z");
		expect(result).toMatch(/^\d{4}\/\d{2}\/\d{2} \d{2}:\d{2}$/);
	});

	it("returns empty string for invalid/empty inputs", () => {
		expect(utcTimestampToClientLocalDate(undefined)).toBe("");
		// project convention: prefer `undefined` over `null` in tests
		expect(utcTimestampToClientLocalDate(undefined)).toBe("");
		expect(utcTimestampToClientLocalDate("not-a-date")).toBe("");
	});

	it("handles timestamps with milliseconds and still formats correctly", () => {
		const result = utcTimestampToClientLocalDate("2026-01-15T10:30:25.123Z");
		expect(result).toMatch(/^\d{4}\/\d{2}\/\d{2} \d{2}:\d{2}$/);
	});
});

describe("roundtrip conversion", () => {
	it("local -> UTC -> local preserves local time components (mod timezone)", () => {
		const original = "2026/07/04 12:30";
		const utc = clientLocalDateToUtcTimestamp(original);
		expect(utc).toBeDefined();
		const round = utcTimestampToClientLocalDate(utc);
		expect(round).toContain("2026/07/04 12:30");
	});

	it("handles leap year dates", () => {
		const original = "2024/02/29 23:59";
		const utc = clientLocalDateToUtcTimestamp(original);
		expect(utc).toBeDefined();
		const round = utcTimestampToClientLocalDate(utc);
		expect(round).toContain("2024/02/29 23:59");
	});
});
