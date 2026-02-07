import { describe, expect, it } from "vitest";

import { ZERO } from "@/shared/constants/shared-constants";

import formatAppDate, { formatAppDateTime } from "./formatAppDate";

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
	it("formats as YYYY/MM/DD (e.g. 2026/01/19 for 19 January 2026)", () => {
		// Use (year, monthIndex, day) to avoid timezone issues: month 0 = January
		expect(formatAppDate(new Date(YEAR_2026, JANUARY, DAY_19))).toBe("2026/01/19");
	});

	it("pads month and day with leading zeros", () => {
		expect(formatAppDate(new Date(YEAR_2025, MARCH, DAY_5))).toBe("2025/03/05");
	});

	it("accepts ISO date strings", () => {
		// Use noon UTC so the date is 19 Jan in all common timezones (avoids TZ-dependent failures)
		expect(formatAppDate("2026-01-19T12:00:00.000Z")).toBe("2026/01/19");
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
