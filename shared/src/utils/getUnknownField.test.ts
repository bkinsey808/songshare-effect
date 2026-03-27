import { describe, expect, it } from "vitest";

import getUnknownField from "./getUnknownField";

describe("getUnknownField", () => {
	const FORTY_TWO = Number("42");
	const sampleObj = { string: "foo", number: FORTY_TWO, boolean: true, object: { nested: true } };

	const presentFieldCases = [
		{ name: "string field", obj: sampleObj, key: "string", expected: "foo" },
		{ name: "number field", obj: sampleObj, key: "number", expected: FORTY_TWO },
		{ name: "boolean field", obj: sampleObj, key: "boolean", expected: true },
		{ name: "object field", obj: sampleObj, key: "object", expected: { nested: true } },
	];

	it.each(presentFieldCases)(
		"returns value for $name",
		({ obj, key, expected }: { obj: unknown; key: string; expected: unknown }) => {
			// Arrange: inputs provided by the case row
			const inputObj = obj;
			const inputKey = key;

			// Act
			const got = getUnknownField(inputObj, inputKey);

			// Assert
			expect(got).toStrictEqual(expected);
		},
	);

	const missingFieldCases = [{ name: "non-existent field", obj: { foo: "bar" }, key: "baz" }];

	it.each(missingFieldCases)(
		"returns undefined for $name",
		({ obj, key }: { obj: unknown; key: string }) => {
			// Arrange
			const inputObj = obj;
			const inputKey = key;

			// Act
			const got = getUnknownField(inputObj, inputKey);

			// Assert
			expect(got).toBeUndefined();
		},
	);

	const nonObjectCases = [
		{ name: "string input", value: "not an object" },
		{ name: "undefined input", value: undefined },
		{ name: "number input", value: FORTY_TWO },
	];

	it.each(nonObjectCases)("returns undefined for $name", ({ value }: { value: unknown }) => {
		// Arrange
		const inputValue = value;

		// Act
		const got = getUnknownField(inputValue, "foo");

		// Assert
		expect(got).toBeUndefined();
	});
});
