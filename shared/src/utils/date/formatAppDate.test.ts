import { describe, expect, it } from "vitest";

import { ZERO } from "@/shared/constants/shared-constants";

import formatAppDate, {
	formatAppDateTime,
	fromDatetimeLocalFormat,
	toDatetimeLocalFormat,
} from "./formatAppDate";

const JANUARY = 0;
const MARCH = 2;
const YEAR_2025 = 2025;
const YEAR_2026 = 2026;
const DAY_5 = 5;
const DAY_19 = 19;
const DAY_20 = 20;
const HOUR_14 = 14;
const HOUR_23 = 23;
const MINUTE_30 = 30;
const MINUTE_59 = 59;
const SECOND_5 = 5;
const SECOND_59 = 59;

describe("formatAppDate", () => {
	const cases: [Date | string, string][] = [
		[new Date(YEAR_2026, JANUARY, DAY_19), "2026/01/19"],
		[new Date(YEAR_2025, MARCH, DAY_5), "2025/03/05"],
		["2026-01-19T12:00:00.000Z", "2026/01/19"],
	];

	it.each(cases)("formats %p -> %s", (input: Date | string, expected: string) => {
		// Act
		const got = formatAppDate(input);

		// Assert
		expect(got).toBe(expected);
	});
});

describe("formatAppDateTime", () => {
	it("formats as YYYY/MM/DD HH:mm:ss in 24-hour (military) time", () => {
		// 2:30:05 PM = 14:30:05 in military time
		const result = formatAppDateTime(
			new Date(YEAR_2026, JANUARY, DAY_19, HOUR_14, MINUTE_30, SECOND_5),
		);
		expect(result).toBe("2026/01/19 14:30:05");
	});

	it("uses 24-hour clock (no AM/PM)", () => {
		const afternoon = formatAppDateTime(
			new Date(YEAR_2026, JANUARY, DAY_19, HOUR_23, MINUTE_59, SECOND_59),
		);
		expect(afternoon).toBe("2026/01/19 23:59:59");
		const midnight = formatAppDateTime(new Date(YEAR_2026, JANUARY, DAY_20, ZERO, ZERO, ZERO));
		expect(midnight).toBe("2026/01/20 00:00:00");
	});
});

describe("toDatetimeLocalFormat", () => {
	it("converts YYYY/MM/DD HH:mm to YYYY-MM-DDTHH:mm", () => {
		expect(toDatetimeLocalFormat("2026/01/19 14:30")).toBe("2026-01-19T14:30");
	});

	it("returns empty string for empty input", () => {
		expect(toDatetimeLocalFormat("")).toBe("");
	});
});

describe("fromDatetimeLocalFormat", () => {
	it("converts YYYY-MM-DDTHH:mm to YYYY/MM/DD HH:mm", () => {
		expect(fromDatetimeLocalFormat("2026-01-19T14:30")).toBe("2026/01/19 14:30");
	});

	it("returns empty string for empty input", () => {
		expect(fromDatetimeLocalFormat("")).toBe("");
	});

	it("returns empty string when date part is missing", () => {
		expect(fromDatetimeLocalFormat("T14:30")).toBe("");
	});
});
