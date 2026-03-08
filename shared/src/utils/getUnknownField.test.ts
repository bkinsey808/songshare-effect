import { describe, expect, it } from "vitest";

import getUnknownField from "./getUnknownField";

describe("getUnknownField", () => {
	it("returns value of existing field", () => {
		const FORTY_TWO = Number("42");
		const obj = { string: "foo", number: FORTY_TWO, boolean: true, object: { nested: true } };
		expect(getUnknownField(obj, "string")).toBe("foo");
		expect(getUnknownField(obj, "number")).toBe(FORTY_TWO);
		expect(getUnknownField(obj, "boolean")).toBe(true);
		expect(getUnknownField(obj, "object")).toStrictEqual({ nested: true });
	});

	it("returns undefined for non-existent field", () => {
		const obj = { foo: "bar" };
		expect(getUnknownField(obj, "baz")).toBeUndefined();
	});

	it("returns undefined for non-object", () => {
		const FORTY_TWO = Number("42");
		expect(getUnknownField("not an object", "foo")).toBeUndefined();
		expect(getUnknownField(undefined, "foo")).toBeUndefined();
		expect(getUnknownField(FORTY_TWO, "foo")).toBeUndefined();
	});
});
