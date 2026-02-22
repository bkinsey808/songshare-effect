import { describe, expect, it } from "vitest";

import { type ValidationError } from "@/shared/validation/validate-types";

import extractFromFiberFailure from "./extractFromFiberFailure";

// we rely on the real helpers (`isValidationErrorArray` and `safeJsonParse`) since
// they are already covered elsewhere; our tests can treat them as part of the
// production behaviour.

describe("extractFromFiberFailure", () => {
	const sampleErrors: ValidationError[] = [{ field: "name", message: "required" }];

	it("returns the array when `cause` property directly contains errors", () => {
		const obj = { cause: sampleErrors } as const;
		expect(extractFromFiberFailure(obj)).toBe(sampleErrors);
	});

	it("ignores a `cause` value that is not a validation-error array", () => {
		const obj = { cause: "oops" } as Record<string, unknown>;
		expect(extractFromFiberFailure(obj)).toStrictEqual([]);
	});

	it("parses a JSON-encoded array from `message` when `cause` is absent", () => {
		const obj = { message: JSON.stringify(sampleErrors) };
		expect(extractFromFiberFailure(obj)).toStrictEqual(sampleErrors);
	});

	it("returns empty when `message` cannot be parsed or yields wrong shape", () => {
		// unparseable JSON
		expect(extractFromFiberFailure({ message: "not json" })).toStrictEqual([]);

		// parses to an object instead of an array
		expect(extractFromFiberFailure({ message: "{}" })).toStrictEqual([]);
	});

	it("gives precedence to `cause` over `message` when both are present", () => {
		const obj = {
			cause: sampleErrors,
			message: JSON.stringify([{ field: "age", message: "wrong" }]),
		};
		// should return the cause array, not the parsed message
		expect(extractFromFiberFailure(obj)).toBe(sampleErrors);
	});

	it("does not mutate the input object", () => {
		const obj: Record<string, unknown> = { message: JSON.stringify(sampleErrors) };
		const copy = { ...obj };
		extractFromFiberFailure(obj);
		expect(obj).toStrictEqual(copy);
	});
});
