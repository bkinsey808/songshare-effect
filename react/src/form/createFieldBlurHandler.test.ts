import { describe, expect, it, vi } from "vitest";

import type { clientDebug as _clientDebug } from "@/react/lib/utils/clientLogger";
import type { ValidationError } from "@/shared/validation/validate-types";

import validateForm from "@/shared/validation/validateForm";

import createFieldBlurHandler from "./createFieldBlurHandler";
import { makeDummySchema } from "./test-util";
// stub logging so tests are quiet and we can inspect calls

vi.mock("@/react/lib/utils/clientLogger", (): { clientDebug: typeof _clientDebug } => ({
	clientDebug: vi.fn(),
}));

// mock the validation helper so we can control the outcome

vi.mock("@/shared/validation/validateForm", (): { default: typeof validateForm } => ({
	default: vi.fn(),
}));

const mockedValidateForm = vi.mocked(validateForm);

describe("createFieldBlurHandler", () => {
	const i18nMessageKey = Symbol("i18n");
	const baseData = { name: "Alice", age: 30 };

	it("filters out field errors when validation succeeds", () => {
		const setValidationErrors = vi.fn();
		const currentErrors: ValidationError[] = [
			{ field: "name", message: "old" },
			{ field: "age", message: "bad" },
		];

		mockedValidateForm.mockReturnValue({ success: true, data: {} });

		// schema is irrelevant for this unit test
		const handler = createFieldBlurHandler<{ name: string; age: number }>({
			schema: makeDummySchema(),
			formData: baseData,
			currentErrors,
			setValidationErrors,
			i18nMessageKey,
		});

		handler("name", "Bob");

		// should remove the "name" error but leave the "age" one
		expect(setValidationErrors).toHaveBeenCalledWith([{ field: "age", message: "bad" }]);
	});

	it("replaces old field errors with new ones when validation fails and returns field errors", () => {
		const setValidationErrors = vi.fn();
		const currentErrors: ValidationError[] = [
			{ field: "name", message: "old" },
			{ field: "age", message: "bad" },
		];

		const errs: ValidationError[] = [
			{ field: "name", message: "required" },
			{ field: "other", message: "ignored" },
		];

		mockedValidateForm.mockReturnValue({ success: false, errors: errs });

		// schema is irrelevant for this unit test
		const handler = createFieldBlurHandler<{ name: string; age: number }>({
			schema: makeDummySchema(),
			formData: baseData,
			currentErrors,
			setValidationErrors,
			i18nMessageKey,
		});

		handler("name", "");

		// existing name error should be gone, age should remain
		// new name error should be added, global/other errors ignored
		expect(setValidationErrors).toHaveBeenCalledWith([
			{ field: "age", message: "bad" },
			{ field: "name", message: "required" },
		]);
	});

	it("removes old field errors when validation fails but provides no new errors for that field", () => {
		const setValidationErrors = vi.fn();
		const currentErrors: ValidationError[] = [
			{ field: "name", message: "old" },
			{ field: "age", message: "bad" },
		];

		mockedValidateForm.mockReturnValue({
			success: false,
			errors: [{ field: "other", message: "nope" }],
		});

		const handler = createFieldBlurHandler<{ name: string; age: number }>({
			schema: makeDummySchema(),
			formData: baseData,
			currentErrors,
			setValidationErrors,
			i18nMessageKey,
		});

		handler("name", "something");

		expect(setValidationErrors).toHaveBeenCalledWith([{ field: "age", message: "bad" }]);
	});
});
