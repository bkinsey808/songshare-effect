import { describe, expect, it } from "vitest";

import sanitizeSlidesForDb from "./sanitizeSlidesForDb";

// constant used instead of magic literal
const NON_RECORD_INPUT = Symbol("not a record") as unknown;

// helper that lets us safely extract keys from the Json return value
function getKeys(json: unknown): string[] {
	if (typeof json === "object" && json !== null) {
		// `Object.keys` wants object; we've already narrowed at runtime
		return Object.keys(json);
	}
	return [];
}

// value used to verify non-string filtering
const BAD_FIELD_VALUE = 123;

// Note: we prefer verboser variable names to satisfy eslint/id-length.
describe("sanitizeSlidesForDb", () => {
	it("returns empty object when slides isn't a record", () => {
		// undefined and arbitrary non-object values
		expect(sanitizeSlidesForDb(undefined)).toStrictEqual({});
		expect(sanitizeSlidesForDb("string")).toStrictEqual({});
		expect(sanitizeSlidesForDb(NON_RECORD_INPUT)).toStrictEqual({});
	});

	it("skips entries whose value is not a record", () => {
		const input = {
			slideOne: { slide_name: "foo", field_data: { alpha: "1" } },
			slideTwo: "not-a-record",
		};

		const result = sanitizeSlidesForDb(input, ["alpha"]);
		const keys = getKeys(result);
		expect(keys).toStrictEqual(["slideOne"]);
	});

	it("coerces non-string field values to empty string", () => {
		const input = {
			slideX: {
				slide_name: true as unknown, // non-string value should be coerced
				field_data: { foo: {} as unknown, bar: undefined as unknown },
			},
		};

		const result = sanitizeSlidesForDb(input);
		// slide_name should fall back to empty string, field_data values coerced
		expect(result).toStrictEqual({
			slideX: {
				slide_name: "",
				field_data: { foo: "", bar: "" },
			},
		});
	});

	it("adds missing required fields", () => {
		const input = {
			slideOne: { slide_name: "s1", field_data: { existing: "x" } },
		};

		const result = sanitizeSlidesForDb(input, ["existing", "newField"]);
		expect(result).toStrictEqual({
			slideOne: {
				slide_name: "s1",
				field_data: { existing: "x", newField: "" },
			},
		});
	});

	it("ignores non-string entries in the fields array", () => {
		const input = { slideOne: { slide_name: "", field_data: {} } };
		// @ts-expect-error intentionally mixing types
		const result = sanitizeSlidesForDb(input, ["keep", BAD_FIELD_VALUE]);
		expect(result).toStrictEqual({
			slideOne: { slide_name: "", field_data: { keep: "" } },
		});
	});

	it("normalizes slide keys to strings when they are numbers", () => {
		// slide keys should be stringified even if the caller uses a number
		const input = { 0: { slide_name: "zero", field_data: {} } } as unknown;
		const result = sanitizeSlidesForDb(input, []);
		expect(result).toStrictEqual({
			"0": { slide_name: "zero", field_data: {} },
		});
	});
});
