import { describe, it, expect } from "vitest";

import getArrowClasses from "./getArrowClasses";

describe("getArrowClasses", () => {
	it("returns bottom classes", () => {
		expect(getArrowClasses("bottom")).toContain("-top-1");
	});

	it("returns top classes", () => {
		expect(getArrowClasses("top")).toContain("-bottom-1");
	});

	it("returns right classes", () => {
		expect(getArrowClasses("right")).toContain("-left-1");
	});

	it("returns left classes", () => {
		expect(getArrowClasses("left")).toContain("-right-1");
	});
});
