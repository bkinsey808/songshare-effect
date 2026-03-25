import { describe, expect, it } from "vitest";

import getStringField from "./getStringField";

describe("getStringField", () => {
	it("returns undefined for non-objects", () => {
		// Arrange
		const NUMBER_VAL = 42;

		// Act & Assert
		expect(getStringField(undefined, "x")).toBeUndefined();
		expect(getStringField("str", "x")).toBeUndefined();
		expect(getStringField(NUMBER_VAL, "x")).toBeUndefined();
	});

	it("returns undefined for missing keys or non-string values", () => {
		// Arrange
		const obj = { keyA: 1, keyB: undefined, keyC: { nested: true } };

		// Act & Assert
		expect(getStringField(obj, "missing")).toBeUndefined();
		expect(getStringField(obj, "keyA")).toBeUndefined();
		expect(getStringField(obj, "keyB")).toBeUndefined();
	});

	it("returns string values when present", () => {
		// Arrange
		const obj = { name: "alice", nested: { value: "x" } };

		// Act
		const gotName = getStringField(obj, "name");
		const gotNested = getStringField(obj, "nested");

		// Assert
		expect(gotName).toBe("alice");
		// nested is not a string so we expect undefined
		expect(gotNested).toBeUndefined();
	});
});
