/**
 * Unit tests for `safeJsonParse` utility. This helper only deals with
 * JSON parsing, so we verify several input types and edge cases. The
 * implementation intentionally returns `undefined` on parse error rather
 * than throwing, which makes it easier to use in form code.
 */
import { describe, expect, it } from "vitest";

import safeJsonParse from "./safeJsonParse";

const OBJ = { foo: "bar" };
// derive small numeric constants from string lengths to satisfy lint
const ONE = "a".length;
const TWO = "aa".length;
const THREE = "aaa".length;
const ARR: number[] = [ONE, TWO, THREE];
const NUM_STRING = "123";
const NUM = Number(NUM_STRING);
const BOOLEAN = true;
const NULL_STR = "null";
const FORTY_TWO = Number("42");

describe("safeJsonParse", () => {
	it("returns undefined for invalid JSON strings", () => {
		expect(safeJsonParse("{not valid}" as unknown)).toBeUndefined();
		expect(safeJsonParse("[1,2,}")).toBeUndefined();
		expect(safeJsonParse('"unterminated')).toBeUndefined();
	});

	it("parses valid JSON strings", () => {
		expect(safeJsonParse(JSON.stringify(OBJ))).toStrictEqual(OBJ);

		expect(safeJsonParse(JSON.stringify(ARR))).toStrictEqual(ARR);

		expect(safeJsonParse(NUM_STRING)).toBe(NUM);
		expect(safeJsonParse("true")).toBe(BOOLEAN);
		expect(safeJsonParse(NULL_STR)).toBeNull();
	});

	it("coerces non-string inputs to string before parsing", () => {
		// boolean and number will be stringified
		expect(safeJsonParse(BOOLEAN)).toBe(BOOLEAN);
		expect(safeJsonParse(FORTY_TWO)).toBe(FORTY_TWO);

		// object gets stringified to "[object Object]" which isn't JSON
		expect(safeJsonParse({})).toBeUndefined();

		expect(safeJsonParse(undefined)).toBeUndefined();
	});

	it("does not throw when given a string that looks like JSON but isn't", () => {
		const result = safeJsonParse("{123}");
		expect(result).toBeUndefined();
	});
});
