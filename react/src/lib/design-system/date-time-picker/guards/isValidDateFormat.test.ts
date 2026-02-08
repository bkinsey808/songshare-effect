import { describe, it, expect } from "vitest";

import isValidDateFormat from "./isValidDateFormat";

describe("isValidDateFormat", () => {
	it("validates normal dates", () => {
		expect(isValidDateFormat("2023/02/28")).toBe(true);
		expect(isValidDateFormat("2020/02/29")).toBe(true); // leap year
	});

	it("rejects invalid formats", () => {
		expect(isValidDateFormat("2023-02-28")).toBe(false);
		expect(isValidDateFormat("2023/2/28")).toBe(false);
		expect(isValidDateFormat("2023/02/30")).toBe(false);
		expect(isValidDateFormat("2019/02/29")).toBe(false);
	});
});
