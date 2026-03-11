import { describe, expect, it } from "vitest";

import cssVars from "./cssVars";

describe("cssVars", () => {
	it("prefixes keys with -- and returns style object", () => {
		const vars = { primary: "blue", size: "16px" };
		expect(cssVars(vars)).toStrictEqual({
			"--primary": "blue",
			"--size": "16px",
		});
	});

	it("returns empty object for empty input", () => {
		expect(cssVars({})).toStrictEqual({});
	});

	it("handles single property", () => {
		expect(cssVars({ color: "red" })).toStrictEqual({ "--color": "red" });
	});
});
