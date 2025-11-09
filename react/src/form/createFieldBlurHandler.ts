/* eslint-disable no-console */
import { type Schema } from "effect";

import type { ValidationError } from "@/shared/validation/types";
import { validateForm } from "@/shared/validation/validateForm";

type CreateFieldBlurHandlerParams<
	FormValues extends Record<string, unknown>,
	_I18nMessageType extends { key: string; [key: string]: unknown },
> = {
	readonly schema: Schema.Schema<FormValues, FormValues, never>;
	readonly formData: Partial<FormValues>;
	readonly currentErrors: ReadonlyArray<ValidationError>;
	readonly setValidationErrors: (
		errors: ReadonlyArray<ValidationError>,
	) => void;
	readonly i18nMessageKey: symbol | string;
};

/**
 * Create a field blur handler that validates the field and updates errors
 */
export const createFieldBlurHandler = <
	FormValues extends Record<string, unknown>,
	I18nMessageType extends { key: string; [key: string]: unknown },
>(
	params: CreateFieldBlurHandlerParams<FormValues, I18nMessageType>,
) => {
	const {
		schema,
		formData,
		currentErrors,
		setValidationErrors,
		i18nMessageKey,
	} = params;
	return <K extends keyof FormValues>(field: K, value: string): void => {
		console.log(`🔍 Field blur validation for ${String(field)}:`, value);
		console.log("📋 Form data for validation:", {
			...formData,
			[field]: value,
		});

		const validation = validateForm<FormValues, I18nMessageType>({
			schema,
			data: {
				...formData,
				[field]: value,
			} as Partial<FormValues>,
			i18nMessageKey,
		});

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
