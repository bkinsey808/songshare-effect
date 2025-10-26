import { type Schema } from "effect";

import { type I18nMessage, i18nMessageKey } from "@/shared/register/register";
import type { ValidationError } from "@/shared/validation/types";
import { validateForm } from "@/shared/validation/validateForm";

/**
 * Create a field blur handler that validates the field and updates errors
 */
export const createFieldBlurHandler = <
	FormValues extends Record<string, unknown>,
>(
	schema: Schema.Schema<FormValues, FormValues, never>,
	formData: Partial<FormValues>,
	currentErrors: ValidationError[],
	setValidationErrors: (errors: ValidationError[]) => void,
) => {
	return <K extends keyof FormValues>(field: K, value: string): void => {
		console.log(`🔍 Field blur validation for ${String(field)}:`, value);
		console.log("📋 Form data for validation:", {
			...formData,
			[field]: value,
		});

		const validation = validateForm<FormValues, I18nMessage>(
			schema,
			{
				...formData,
				[field]: value,
			} as Partial<FormValues>,
			i18nMessageKey,
		);

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
