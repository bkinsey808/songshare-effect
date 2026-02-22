import { describe, expect, it } from "vitest";

import type { RealtimePayload } from "../subscription-types";

import extractOldRecord from "./extractOldRecord";

// helper asserts a value is neither null nor undefined so tests can narrow types
function assertDefined<Type>(value: Type): asserts value is NonNullable<Type> {
	if (value === undefined || value === null) {
		throw new Error("expected defined value");
	}
}

describe("extractOldRecord", () => {
	type Example = {
		id: number;
		text: string;
	};

	it("should return the old record when the payload contains one", () => {
		const record: Example = { id: 1, text: "goodbye" };
		const payload: RealtimePayload<Example> = {
			eventType: "DELETE",
			old: record,
		};

		const result = extractOldRecord(payload);
		expect(result).toBe(record);
		// function should not clone or mutate the object; use helper to narrow
		assertDefined(result);
		result.text = "mutated";
		expect(record.text).toBe("mutated");
	});

	it("should return undefined when the payload has no old field", () => {
		const payload: RealtimePayload<Example> = {
			eventType: "INSERT", // old is optional so omit it
		};

		const result = extractOldRecord(payload);
		expect(result).toBeUndefined();
	});

	it("should respect the generic type and allow arbitrary shapes", () => {
		type Complex = {
			foo: string;
			bar: { nested: boolean }[];
		};

		const complexRecord: Complex = {
			foo: "y",
			bar: [{ nested: false }],
		};
		const payload: RealtimePayload<Complex> = {
			eventType: "DELETE",
			old: complexRecord,
		};

		const result = extractOldRecord(payload);
		// constant for array index to satisfy no-magic-numbers rule
		const IDX = 0;
		assertDefined(result);
		assertDefined(result.bar[IDX]);
		expect(result.bar[IDX].nested).toBe(false);
	});
});
