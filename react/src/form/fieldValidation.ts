import { type Schema } from "effect";

import { type ValidationError, validateForm } from "@/shared/utils/validation";

/**
 * Create a field blur handler that validates the field and updates errors
 */
export const createFieldBlurHandler = <T extends Record<string, unknown>>(
	schema: Schema.Schema<T, T, never>,
	formData: Partial<T>,
	currentErrors: ValidationError[],
	setValidationErrors: (errors: ValidationError[]) => void,
) => {
	return <K extends keyof T>(field: K, value: string): void => {
		console.log(`🔍 Field blur validation for ${String(field)}:`, value);
		console.log("📋 Form data for validation:", {
			...formData,
			[field]: value,
		});

		const validation = validateForm(schema, {
			...formData,
			[field]: value,
		} as Partial<T>);

		console.log("📊 Field validation result:", validation);

		if (validation.success) {
			console.log(`✅ Field ${String(field)} is valid, removing errors`);
			setValidationErrors(
				currentErrors.filter(
					(error: ValidationError) => error.field !== String(field),
				),
			);
		} else {
			console.log(`❌ Field ${String(field)} has errors:`, validation.errors);
			const fieldErrors = validation.errors.filter(
				(error: ValidationError) => error.field === String(field),
			);
			console.log(
				`🎯 Filtered field errors for ${String(field)}:`,
				fieldErrors,
			);
			setValidationErrors([
				...currentErrors.filter(
					(error: ValidationError) => error.field !== String(field),
				),
				...fieldErrors,
			]);
		}
	};
};
