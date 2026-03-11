import { describe, expect, it } from "vitest";

import makeNull from "@/shared/test-utils/makeNull.test-util";

import computeSlides from "./computeSlides";

describe("computeSlides", () => {
	it("returns empty object when pub is undefined", () => {
		expect(computeSlides(undefined)).toStrictEqual({});
	});

	it("returns empty object when slides is not a record", () => {
		expect(computeSlides({ slides: "not-object" })).toStrictEqual({});
		expect(computeSlides({ slides: makeNull() })).toStrictEqual({});
	});

	it("extracts valid slide entries with slide_name and field_data", () => {
		const pub = {
			slides: {
				slide_id_1: { slide_name: "Slide 1", field_data: { title: "Hello" } },
				slide_id_2: { slide_name: "Slide 2", field_data: {} },
			},
		};
		const result = computeSlides(pub);
		expect(result).toMatchObject({
			slide_id_1: { slide_name: "Slide 1", field_data: { title: "Hello" } },
			slide_id_2: { slide_name: "Slide 2", field_data: {} },
		});
	});

	it("skips entries without slide_name or with non-string slide_name", () => {
		const pub = {
			slides: {
				valid: { slide_name: "Valid", field_data: {} },
				no_name: { field_data: {} },
				bad_name: { slide_name: 123, field_data: {} },
			},
		};
		const result = computeSlides(pub);
		expect(Object.keys(result)).toStrictEqual(["valid"]);
		expect(result["valid"]).toMatchObject({ slide_name: "Valid", field_data: {} });
	});

	it("extracts only string values from field_data", () => {
		const pub = {
			slides: {
				s1: {
					slide_name: "Slide",
					field_data: { title: "T", count: 5, nested: {} },
				},
			},
		};
		const result = computeSlides(pub);
		expect(result["s1"]?.field_data).toStrictEqual({ title: "T" });
	});
});
