import { describe, expect, it } from "vitest";

import sanitizeSlidesForDb from "./sanitizeSlidesForDb";

// constant used instead of magic literal
const NON_RECORD_INPUT = Symbol("not a record") as unknown;

/**
 * Helper that lets us safely extract keys from the Json return value.
 * @param json - The object to extract keys from.
 * @returns An array of keys.
 */
function getKeys(json: unknown): string[] {
	if (typeof json === "object" && json !== null) {
		// `Object.keys` wants object; we've already narrowed at runtime
		return Object.keys(json);
	}
	return [];
}

// value used to verify non-string filtering
const BAD_FIELD_VALUE = 123;
const LANGUAGE_PARAMS = {
	lyrics: ["en"],
	script: [],
	translations: ["es"],
} as const;

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

		const result = sanitizeSlidesForDb(input, {
			lyrics: ["alpha"],
			script: [],
			translations: [],
		});
		const keys = getKeys(result);
		expect(keys).toStrictEqual(["slideOne"]);
	});

	it("coerces non-string field values to empty string", () => {
		const input = {
			slideX: {
				slide_name: true as unknown, // non-string value should be coerced
				field_data: { lyrics: {} as unknown, es: undefined as unknown },
			},
		};

		const result = sanitizeSlidesForDb(input, LANGUAGE_PARAMS);
		// slide_name should fall back to empty string, field_data values coerced
		expect(result).toStrictEqual({
			slideX: {
				slide_name: "",
				field_data: { lyrics: "", es: "" },
			},
		});
	});

	it("normalizes legacy keys into current language-code keys", () => {
		const input = {
			slideOne: {
				slide_name: "s1",
				field_data: { lyrics: "x", enTranslation: "hola" },
			},
		};

		const result = sanitizeSlidesForDb(input, LANGUAGE_PARAMS);
		expect(result).toStrictEqual({
			slideOne: {
				slide_name: "s1",
				field_data: { lyrics: "x", es: "hola" },
			},
		});
	});

	it("drops extra field_data keys that are not active languages", () => {
		const input = {
			slideOne: { slide_name: "", field_data: { lyrics: "hello", chords: String(BAD_FIELD_VALUE) } },
		};
		const result = sanitizeSlidesForDb(input, LANGUAGE_PARAMS);
		expect(result).toStrictEqual({
			slideOne: { slide_name: "", field_data: { lyrics: "hello", es: "" } },
		});
	});

	it("normalizes slide keys to strings when they are numbers", () => {
		// slide keys should be stringified even if the caller uses a number
		const input = { 0: { slide_name: "zero", field_data: {} } } as unknown;
		const result = sanitizeSlidesForDb(input, LANGUAGE_PARAMS);
		expect(result).toStrictEqual({
			"0": { slide_name: "zero", field_data: { lyrics: "", es: "" } },
		});
	});

	it("preserves background image metadata when values are strings", () => {
		const input = {
			slideOne: {
				slide_name: "s1",
				field_data: {},
				background_image_id: "img-1",
				background_image_url: "/api/images/serve/images/user-1/img-1.png",
				background_image_width: 1200,
				background_image_height: 800,
				background_image_focal_point_x: 20,
				background_image_focal_point_y: 80,
			},
		};

		const result = sanitizeSlidesForDb(input, LANGUAGE_PARAMS);
		expect(result).toStrictEqual({
			slideOne: {
				slide_name: "s1",
				field_data: { lyrics: "", es: "" },
				background_image_id: "img-1",
				background_image_url: "/api/images/serve/images/user-1/img-1.png",
				background_image_width: 1200,
				background_image_height: 800,
				background_image_focal_point_x: 20,
				background_image_focal_point_y: 80,
			},
		});
	});

	it("drops non-string background image metadata", () => {
		const input = {
			slideOne: {
				slide_name: "s1",
				field_data: {},
				background_image_id: 123,
				background_image_url: true,
			},
		};

		const result = sanitizeSlidesForDb(input, LANGUAGE_PARAMS);
		expect(result).toStrictEqual({
			slideOne: {
				slide_name: "s1",
				field_data: { lyrics: "", es: "" },
			},
		});
	});
});
