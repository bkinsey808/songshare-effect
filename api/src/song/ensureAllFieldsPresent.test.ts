import { describe, expect, it } from "vitest";

import ensureAllFieldsPresent from "./ensureAllFieldsPresent";

describe("ensureAllFieldsPresent", () => {
	it("returns a copy with missing keys added", () => {
		const original = { foo: "1" };
		const result = ensureAllFieldsPresent(original, ["foo", "bar"]);
		// original should not be mutated
		expect(original).toStrictEqual({ foo: "1" });
		// result should include both fields
		expect(result).toStrictEqual({ foo: "1", bar: "" });
	});

	it("leaves object unchanged when all fields exist", () => {
		const data = { first: "foo", second: "bar" };
		const result = ensureAllFieldsPresent(data, ["first", "second"]);
		expect(result).toStrictEqual(data);
		// still returns a new object reference
		expect(result).not.toBe(data);
	});

	it("handles empty inputs gracefully", () => {
		const result = ensureAllFieldsPresent({}, ["foo"]);
		expect(result).toStrictEqual({ foo: "" });
	});
});
