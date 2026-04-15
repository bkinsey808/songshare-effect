// Prefer per-line console exceptions instead of module-wide disabling
import { Effect, type Schema } from "effect";

import { clientDebug } from "@/react/lib/utils/clientLogger";
import { ZERO } from "@/shared/constants/shared-constants";
import { registerMessageKey } from "@/shared/register/register";
import validateFormEffect from "@/shared/validation/form/validateFormEffect";
import { type ValidationError } from "@/shared/validation/validate-types";

import extractValidationErrors from "./extractValidationErrors";

type FormSubmitHandlerParams<FormValues> = {
	readonly schema: Schema.Schema<FormValues>;
	readonly setValidationErrors: React.Dispatch<React.SetStateAction<readonly ValidationError[]>>;
	readonly setIsSubmitting: (isSubmitting: boolean) => void;
};

/**
 * Create a form submission handler that validates form data and handles submission.
 *
 * @param params - Handler parameters including schema and state setters
 * @returns Function accepting `formData` and `onSubmit` that returns an Effect
 */
export default function createFormSubmitHandler<FormValues extends Record<string, unknown>>(
	params: FormSubmitHandlerParams<FormValues>,
): (
	formData: Readonly<Record<string, unknown>>,
	onSubmit: (data: Readonly<FormValues>) => Promise<void> | void,
) => Effect.Effect<void> {
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
					// For async submission, prefer `await` over `.then/.catch/.finally`.
					// Use an async IIFE so we can await the promise and ensure
					// `setIsSubmitting(false)` runs in a `finally` block.
					void (async (): Promise<void> => {
						try {
							await result;
							// Localized debug-only log
							clientDebug("🏁 Async submission completed");
						} finally {
							setIsSubmitting(false);
						}
					})();
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
				if (errorArray.length > ZERO) {
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
