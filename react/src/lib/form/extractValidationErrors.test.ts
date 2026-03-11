import { describe, expect, it } from "vitest";

import extractValidationErrors from "./extractValidationErrors";

const VALID_ERROR = { field: "name", message: "required" };

describe("extractValidationErrors", () => {
	it("returns direct ValidationError array", () => {
		const errors = [VALID_ERROR];
		expect(extractValidationErrors(errors)).toStrictEqual(errors);
	});

	it("returns [] for non-array, non-Error, non-object", () => {
		expect(extractValidationErrors(undefined)).toStrictEqual([]);
		const numericInput = 42;
		expect(extractValidationErrors(numericInput)).toStrictEqual([]);
		expect(extractValidationErrors("err")).toStrictEqual([]);
	});

	it("parses Error message when it contains JSON array", () => {
		const errors = [VALID_ERROR];
		const err = new Error(JSON.stringify(errors));
		expect(extractValidationErrors(err)).toStrictEqual(errors);
	});

	it("returns [] when Error message is not valid JSON array", () => {
		expect(extractValidationErrors(new Error("plain string"))).toStrictEqual([]);
		expect(extractValidationErrors(new Error("{}"))).toStrictEqual([]);
	});

	it("extracts from FiberFailure cause", () => {
		const errors = [VALID_ERROR];
		const obj = { _tag: "FiberFailure", cause: errors };
		expect(extractValidationErrors(obj)).toStrictEqual(errors);
	});

	it("extracts from FiberFailure message when cause is not array", () => {
		const errors = [VALID_ERROR];
		const obj = { _tag: "FiberFailure", message: JSON.stringify(errors) };
		expect(extractValidationErrors(obj)).toStrictEqual(errors);
	});

	it("returns [] for record without _tag FiberFailure", () => {
		expect(extractValidationErrors({ key: 1 })).toStrictEqual([]);
	});
});
