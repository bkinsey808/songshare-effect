// Prefer per-line console exceptions instead of module-wide disabling
import { Effect, type Schema } from "effect";

import { clientDebug } from "@/react/utils/clientLogger";
import { registerMessageKey } from "@/shared/register/register";
import { type ValidationError } from "@/shared/validation/types";
import { validateFormEffect } from "@/shared/validation/validateFormEffect";

import { extractValidationErrors } from "./extractValidationErrors";

type FormSubmitHandlerParams<FormValues> = {
	readonly schema: Schema.Schema<FormValues>;
	readonly setValidationErrors: React.Dispatch<
		React.SetStateAction<ReadonlyArray<ValidationError>>
	>;
	readonly setIsSubmitting: (isSubmitting: boolean) => void;
};

/**
 * Create a form submission handler that validates form data and handles submission
 */
export function createFormSubmitHandler<
	FormValues extends Record<string, unknown>,
>(params: FormSubmitHandlerParams<FormValues>) {
	const { schema, setValidationErrors, setIsSubmitting } = params;
	return (
		formData: Readonly<Record<string, unknown>>,
		onSubmit: (data: Readonly<FormValues>) => Promise<void> | void,
	): Effect.Effect<void> =>
		Effect.sync(() => {
			// Localized debug-only logs
			clientDebug("🚀 useAppForm.handleSubmit called");
			clientDebug("🔍 Starting form submission validation");

			// Read form data from the form element
			const currentFormData = formData;

			// Localized debug-only log
			clientDebug("📋 Form data read from DOM:", currentFormData);

			setIsSubmitting(true);
			setValidationErrors([]);

			try {
				// Run validation effect synchronously
				// Localized debug-only log
				clientDebug("⚡ Running schema validation");
				const validatedData = Effect.runSync(
					validateFormEffect<FormValues>({
						schema,
						data: currentFormData,
						i18nMessageKey: registerMessageKey,
					}),
				);
				// Localized debug-only log
				clientDebug("✅ Validation successful, validated data:", validatedData);

				const result = onSubmit(validatedData);
				if (result instanceof Promise) {
					// For async submission, we need to handle it differently
					void result.finally(() => {
						// Localized debug-only log
						clientDebug("🏁 Async submission completed");
						setIsSubmitting(false);
					});
				} else {
					// Localized debug-only log
					clientDebug("🏁 Sync submission completed");
					setIsSubmitting(false);
				}
			} catch (error) {
				// Localized debug-only logs
				clientDebug("❌ Validation failed:", error);
				clientDebug("🔍 Error instanceof Error:", error instanceof Error);
				clientDebug("🔍 Error type:", typeof error);
				clientDebug("🔍 Error constructor:", error?.constructor?.name);

				// Delegate extraction to the helper to reduce complexity here
				const errorArray = extractValidationErrors(error);
				if (errorArray.length) {
					// Localized debug-only logs
					clientDebug("📝 Final error array to set:", errorArray);
					clientDebug("🔄 Setting validation errors:", errorArray);
					setValidationErrors(errorArray);
					// Localized debug-only log
					clientDebug("✅ Validation errors set, current state should update");
				} else {
					// Localized debug-only log
					clientDebug("� No validation errors extracted from error");
				}

				setIsSubmitting(false);
			}
		});
}
