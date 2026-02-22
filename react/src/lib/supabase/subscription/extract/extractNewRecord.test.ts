import { describe, expect, it } from "vitest";

import type { RealtimePayload } from "../subscription-types";

import extractNewRecord from "./extractNewRecord";

// helper asserts a value is neither null nor undefined so tests can narrow types
function assertDefined<TValue>(value: TValue): asserts value is NonNullable<TValue> {
	if (value === undefined || value === null) {
		throw new Error("expected defined value");
	}
}

describe("extractNewRecord", () => {
	type Example = {
		id: number;
		text: string;
	};

	it("should return the new record when the payload contains one", () => {
		const record: Example = { id: 42, text: "hello" };
		const payload: RealtimePayload<Example> = {
			eventType: "INSERT",
			new: record,
		};

		const result = extractNewRecord(payload);
		expect(result).toBe(record);
		// function should not clone or mutate the object; narrow before mutating
		assertDefined(result);
		result.text = "modified";
		expect(record.text).toBe("modified");
	});

	it("should return undefined when the payload has no new field", () => {
		const payload: RealtimePayload<Example> = {
			eventType: "DELETE", // new is optional so omit it
		};

		const result = extractNewRecord(payload);
		expect(result).toBeUndefined();
	});

	it("should respect the generic type and allow arbitrary shapes", () => {
		type Complex = {
			foo: string;
			bar: { nested: boolean }[];
		};

		const complexRecord: Complex = {
			foo: "x",
			bar: [{ nested: true }],
		};
		const payload: RealtimePayload<Complex> = {
			eventType: "UPDATE",
			new: complexRecord,
		};

		const result = extractNewRecord(payload);
		// constant for array index to satisfy no-magic-numbers rule
		const IDX = 0;
		assertDefined(result);
		// make sure first entry exists before checking its field
		assertDefined(result.bar[IDX]);
		expect(result.bar[IDX].nested).toBe(true);
	});
});
