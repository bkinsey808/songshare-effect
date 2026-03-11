import { describe, expect, it } from "vitest";

import parseDateTime from "./parseDateTime";

describe("parseDateTime", () => {
	it("parses date-only format YYYY/MM/DD", () => {
		expect(parseDateTime("2026/01/19")).toStrictEqual({
			year: 2026,
			month: 1,
			day: 19,
			hours: undefined,
			minutes: undefined,
		});
	});

	it("parses date and time format YYYY/MM/DD HH:mm", () => {
		expect(parseDateTime("2026/01/19 14:30")).toStrictEqual({
			year: 2026,
			month: 1,
			day: 19,
			hours: 14,
			minutes: 30,
		});
	});

	it("throws for invalid format", () => {
		expect(() => parseDateTime("2026-01-19")).toThrow(/Invalid date\/time format/);
		expect(() => parseDateTime("invalid")).toThrow(/Invalid date\/time format/);
	});

	it("throws for empty string", () => {
		expect(() => parseDateTime("")).toThrow("Invalid date format");
	});
});
