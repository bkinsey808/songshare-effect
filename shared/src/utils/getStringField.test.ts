import { describe, expect, it } from "vitest";

import getStringField from "./getStringField";

describe("getStringField", () => {
	it("returns undefined for non-objects", () => {
		const NUMBER_VAL = 42;
		expect(getStringField(undefined, "x")).toBeUndefined();
		expect(getStringField("str", "x")).toBeUndefined();
		expect(getStringField(NUMBER_VAL, "x")).toBeUndefined();
	});

	it("returns undefined for missing keys or non-string values", () => {
		const obj = { keyA: 1, keyB: undefined, keyC: { nested: true } };
		expect(getStringField(obj, "missing")).toBeUndefined();
		expect(getStringField(obj, "keyA")).toBeUndefined();
		expect(getStringField(obj, "keyB")).toBeUndefined();
	});

	it("returns string values when present", () => {
		const obj = { name: "alice", nested: { value: "x" } };
		expect(getStringField(obj, "name")).toBe("alice");
		// nested is not a string so we expect undefined
		expect(getStringField(obj, "nested")).toBeUndefined();
	});
});
