import { describe, expect, it } from "vitest";

import parseDateTime from "../parseDateTime";

describe("parseDateTime", () => {
	it("parses date-only strings", () => {
		expect(parseDateTime("2023/01/02")).toStrictEqual({
			year: 2023,
			month: 1,
			day: 2,
			hours: undefined,
			minutes: undefined,
		});
	});

	it("parses date + time strings", () => {
		expect(parseDateTime("2023/01/02 03:04")).toStrictEqual({
			year: 2023,
			month: 1,
			day: 2,
			hours: 3,
			minutes: 4,
		});
	});

	it("throws on invalid input", () => {
		expect(() => parseDateTime("2023/02/30")).toThrow(
			'Invalid date/time format: "2023/02/30". Expected YYYY/MM/DD or YYYY/MM/DD HH:mm',
		);
	});
});
