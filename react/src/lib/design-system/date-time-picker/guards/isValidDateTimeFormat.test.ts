import { describe, it, expect } from "vitest";

import isValidDateTimeFormat from "./isValidDateTimeFormat";

describe("isValidDateTimeFormat", () => {
	it("accepts empty and date-only values", () => {
		expect(isValidDateTimeFormat("")).toBe(true);
		expect(isValidDateTimeFormat("2020/02/29")).toBe(true);
	});

	it("accepts date + time when valid", () => {
		expect(isValidDateTimeFormat("2020/02/29 12:30")).toBe(true);
	});

	it("rejects invalid combinations", () => {
		expect(isValidDateTimeFormat("2020/02/30")).toBe(false);
		expect(isValidDateTimeFormat("2020/02/29 24:00")).toBe(false);
		expect(isValidDateTimeFormat("nope")).toBe(false);
	});
});
