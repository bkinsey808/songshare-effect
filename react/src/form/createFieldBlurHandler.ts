/* eslint-disable no-console */
import { type Schema } from "effect";

import type { ValidationError } from "@/shared/validation/types";

import { validateForm } from "@/shared/validation/validateForm";

type CreateFieldBlurHandlerParams<FormValues extends Record<string, unknown>> =
	{
		readonly schema: Schema.Schema<FormValues>;
		readonly formData: Readonly<Record<string, unknown>>;
		readonly currentErrors: ReadonlyArray<ValidationError>;
		readonly setValidationErrors: (
			errors: ReadonlyArray<ValidationError>,
		) => void;
		readonly i18nMessageKey: symbol | string;
	};

/**
 * Create a field blur handler that validates the field and updates errors
 */
export function createFieldBlurHandler<
	FormValues extends Record<string, unknown>,
>(
	params: CreateFieldBlurHandlerParams<FormValues>,
): (field: keyof FormValues, value: string) => void {
	const {
		schema,
		formData,
		currentErrors,
		setValidationErrors,
		i18nMessageKey,
	} = params;

	return function handleFieldBlur<FieldKey extends keyof FormValues>(
		field: FieldKey,
		value: string,
	): void {
		console.log(`🔍 Field blur validation for ${String(field)}:`, value);
		console.log("📋 Form data for validation:", {
			...formData,
			[field]: value,
		});

		const validation = validateForm<FormValues>({
			schema,
			data: {
				...formData,
				[field]: value,
			},
			i18nMessageKey,
		});

		console.log("📊 Field validation result:", validation);

		if (validation.success) {
			console.log(`✅ Field ${String(field)} is valid, removing errors`);
			setValidationErrors(
				currentErrors.filter((error) => error.field !== String(field)),
			);
		} else {
			const errs = validation.errors;
			console.log(`❌ Field ${String(field)} has errors:`, errs);
			const fieldErrors = errs.filter((error) => error.field === String(field));
			console.log(
				`🎯 Filtered field errors for ${String(field)}:`,
				fieldErrors,
			);
			setValidationErrors([
				...currentErrors.filter((error) => error.field !== String(field)),
				...fieldErrors,
			]);
		}
	};
}
