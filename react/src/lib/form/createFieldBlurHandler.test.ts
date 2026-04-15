import { Schema } from "effect";
import { describe, expect, it, vi } from "vitest";

import forceCast from "@/react/lib/test-utils/forceCast";
import type { ValidationError } from "@/shared/validation/validate-types";

import type createFieldBlurHandlerType from "./createFieldBlurHandler";

// stub logging so tests are quiet and we can inspect calls
vi.mock("@/react/lib/utils/clientLogger");

const NEG_ONE = -1;
const ZERO = 0;

/**
 * Extract errors from the last mock call.
 *
 * @param calls - The mock call array recorded by a spy
 * @returns The last call's validation errors
 */
function extractLastCall(calls: unknown[][]): ValidationError[] {
	return forceCast<ValidationError[]>(calls.at(NEG_ONE)?.at(ZERO));
}

describe("createFieldBlurHandler", () => {
	const i18nMessageKey = Symbol("i18n");
	const baseData = { name: "Alice", age: 30 };
	const schema = Schema.Struct({
		name: Schema.NonEmptyString,
		age: Schema.Number,
	});

	/**
	 * Initialize test modules for `createFieldBlurHandler` and return the
	 * exported symbol under test.
	 *
	 * @returns Object with `createFieldBlurHandler` constructor
	 */
	async function init(): Promise<{
		createFieldBlurHandler: typeof createFieldBlurHandlerType;
	}> {
		vi.resetModules();
		const mod = await import("./createFieldBlurHandler");
		return { createFieldBlurHandler: mod.default };
	}

	it("filters out field errors when validation succeeds", async () => {
		const { createFieldBlurHandler } = await init();
		const setValidationErrors = vi.fn();
		const currentErrors: ValidationError[] = [
			{ field: "name", message: "old" },
			{ field: "age", message: "bad" },
		];

		const handler = createFieldBlurHandler<{ name: string; age: number }>({
			schema,
			formData: baseData, // Alice is valid
			currentErrors,
			setValidationErrors,
			i18nMessageKey,
		});

		handler("name", "Bob");

		// should remove the "name" error but leave the "age" one
		expect(setValidationErrors).toHaveBeenCalledWith([{ field: "age", message: "bad" }]);
	});

	it("replaces old field errors with new ones when validation fails and returns field errors", async () => {
		const { createFieldBlurHandler } = await init();
		const setValidationErrors = vi.fn();
		const currentErrors: ValidationError[] = [
			{ field: "name", message: "old" },
			{ field: "age", message: "bad" },
		];

		const handler = createFieldBlurHandler<{ name: string; age: number }>({
			schema,
			formData: { ...baseData, name: "" }, // invalid name
			currentErrors,
			setValidationErrors,
			i18nMessageKey,
		});

		handler("name", "");

		// Check what the actual error message is from the real implementation.
		// Since we're using real validateForm, we expect the default Effect/i18n output.
		const { calls } = setValidationErrors.mock;
		const lastCall = extractLastCall(calls);

		expect(lastCall.some((error) => error.field === "age")).toBe(true);
		expect(lastCall.some((error) => error.field === "name")).toBe(true);
		expect(lastCall.find((error) => error.field === "name")?.message).not.toBe("old");
	});

	it("removes old field errors when validation fails but provides no new errors for that field", async () => {
		const { createFieldBlurHandler } = await init();
		const setValidationErrors = vi.fn();
		const currentErrors: ValidationError[] = [
			{ field: "name", message: "old" },
			{ field: "age", message: "bad" },
		];

		const handler = createFieldBlurHandler<{ name: string; age: number }>({
			schema,
			formData: { name: "Valid Name", age: Number.NaN }, // age is invalid, name is valid
			currentErrors,
			setValidationErrors,
			i18nMessageKey,
		});

		handler("name", "Bob");

		// Validation fails (on age), but we blurred 'name'.
		// 'name' is now valid, so 'old' name error should be removed.
		expect(setValidationErrors).toHaveBeenCalledWith([{ field: "age", message: "bad" }]);
	});
});
