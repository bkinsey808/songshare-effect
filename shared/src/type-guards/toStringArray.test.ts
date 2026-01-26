/* oxlint-disable no-magic-numbers */
import { describe, expect, it } from "vitest";

import toStringArray from "./toStringArray";

describe("toStringArray", () => {
	it("converts array items to strings", () => {
		const input = [1, true, "a"] as const;
		expect(toStringArray(input)).toStrictEqual(["1", "true", "a"]);
	});

	it("returns empty array for non-arrays", () => {
		expect(toStringArray("nope")).toStrictEqual([]);
	});

	it("produces a mutable string array and coerces values from readonly input", () => {
		const readonlyInput = [undefined, undefined] as const;
		const out = toStringArray(readonlyInput);
		expect(out).toStrictEqual(["undefined", "undefined"]);
		out.push("added");
		expect(out).toContain("added");
	});
});
