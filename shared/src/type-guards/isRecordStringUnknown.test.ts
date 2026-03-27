import { describe, expect, it } from "vitest";

import makeNull from "@/shared/test-utils/makeNull.test-util";

import isRecordStringUnknown from "./isRecordStringUnknown";

const FIRST = 1;
const SECOND = 2;
const NUM_PRIMITIVE = 42;

describe("isRecordStringUnknown", () => {
	const objectCases = [
		{ name: "empty object", value: {} },
		{ name: "object with number", value: { alpha: FIRST } },
		{ name: "object with string", value: { key: "value" } },
	];

	it.each(objectCases)("returns true for $name", ({ value }: { value: unknown }) => {
		// Assert
		expect(isRecordStringUnknown(value)).toBe(true);
	});

	const arrayCases = [
		{ name: "empty array", value: [] as unknown[] },
		{ name: "numbered array", value: [FIRST, SECOND] as unknown[] },
	];

	it.each(arrayCases)("returns true for $name", ({ value }: { value: unknown }) => {
		expect(isRecordStringUnknown(value)).toBe(true);
	});

	const negativeCases = [
		{ name: "null", value: makeNull() },
		{ name: "undefined", value: undefined },
		{ name: "string primitive", value: "str" },
		{ name: "number primitive", value: NUM_PRIMITIVE },
		{ name: "boolean primitive", value: true },
	];

	it.each(negativeCases)("returns false for $name", ({ value }: { value: unknown }) => {
		expect(isRecordStringUnknown(value)).toBe(false);
	});
});
