// Prefer per-line console exceptions
import { type Schema } from "effect";

import { clientDebug } from "@/react/lib/utils/clientLogger";
import validateForm from "@/shared/validation/form/validateForm";
import { type ValidationError } from "@/shared/validation/validate-types";

type CreateFieldBlurHandlerParams<FormValues extends Record<string, unknown>> = {
	readonly schema: Schema.Schema<FormValues>;
	readonly formData: Readonly<Record<string, unknown>>;
	readonly currentErrors: readonly ValidationError[];
	readonly setValidationErrors: (errors: readonly ValidationError[]) => void;
	readonly i18nMessageKey: symbol | string;
};

/**
 * Create a field blur handler that validates the field and updates errors
 */
export default function createFieldBlurHandler<FormValues extends Record<string, unknown>>(
	params: CreateFieldBlurHandlerParams<FormValues>,
): (field: keyof FormValues, value: string) => void {
	const { schema, formData, currentErrors, setValidationErrors, i18nMessageKey } = params;

	return function handleFieldBlur<FieldKey extends keyof FormValues>(
		field: FieldKey,
		value: string,
	): void {
		// Localized debug-only logs
		clientDebug(`🔍 Field blur validation for ${String(field)}:`, value);
		clientDebug("📋 Form data for validation:", {
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

		// Localized debug-only log
		clientDebug("📊 Field validation result:", validation);

		if (validation.success) {
			// Localized debug-only log
			clientDebug(`✅ Field ${String(field)} is valid, removing errors`);
			setValidationErrors(currentErrors.filter((error) => error.field !== String(field)));
		} else {
			const errs = validation.errors;
			// Localized debug-only log
			clientDebug(`❌ Field ${String(field)} has errors:`, errs);
			const fieldErrors = errs.filter((error) => error.field === String(field));
			// Localized debug-only log
			clientDebug(`🎯 Filtered field errors for ${String(field)}:`, fieldErrors);
			setValidationErrors([
				...currentErrors.filter((error) => error.field !== String(field)),
				...fieldErrors,
			]);
		}
	};
}
