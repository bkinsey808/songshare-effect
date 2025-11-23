/* eslint-disable no-console */
import { Effect, type Schema } from "effect";

import type { ValidationError } from "@/shared/validation/types";

import {
	type I18nMessage,
	registerMessageKey,
} from "@/shared/register/register";
import { validateFormEffect } from "@/shared/validation/validateFormEffect";

import { extractValidationErrors } from "./extractValidationErrors";

type FormSubmitHandlerParams<FormValues> = {
	readonly schema: Schema.Schema<FormValues, FormValues, never>;
	readonly setValidationErrors: React.Dispatch<
		React.SetStateAction<ReadonlyArray<ValidationError>>
	>;
	readonly setIsSubmitting: (isSubmitting: boolean) => void;
};

/**
 * Create a form submission handler that validates form data and handles submission
 */
export const createFormSubmitHandler = <
	FormValues extends Record<string, unknown>,
>(
	params: FormSubmitHandlerParams<FormValues>,
) => {
	const { schema, setValidationErrors, setIsSubmitting } = params;
	return (
		formData: Readonly<Record<string, unknown>>,
		onSubmit: (data: FormValues) => Promise<void> | void,
	): Effect.Effect<void, never, never> => {
		return Effect.sync(() => {
			console.log("🚀 useAppForm.handleSubmit called");
			console.log("🔍 Starting form submission validation");

			// Read form data from the form element
			const currentFormData = formData;

			console.log("📋 Form data read from DOM:", currentFormData);

			setIsSubmitting(true);
			setValidationErrors([]);

			try {
				// Run validation effect synchronously
				console.log("⚡ Running schema validation");
				const validatedData = Effect.runSync(
					validateFormEffect<FormValues, I18nMessage>({
						schema,
						data: currentFormData,
						i18nMessageKey: registerMessageKey,
					}),
				) as FormValues;
				console.log("✅ Validation successful, validated data:", validatedData);

				const result = onSubmit(validatedData);
				if (result instanceof Promise) {
					// For async submission, we need to handle it differently
					void result.finally(() => {
						console.log("🏁 Async submission completed");
						setIsSubmitting(false);
					});
				} else {
					console.log("🏁 Sync submission completed");
					setIsSubmitting(false);
				}
			} catch (error) {
				console.log("❌ Validation failed:", error);
				console.log("🔍 Error instanceof Error:", error instanceof Error);
				console.log("🔍 Error type:", typeof error);
				console.log("🔍 Error constructor:", error?.constructor?.name);

				// Delegate extraction to the helper to reduce complexity here
				const errorArray = extractValidationErrors(error);
				if (errorArray.length > 0) {
					console.log("📝 Final error array to set:", errorArray);
					console.log("🔄 Setting validation errors:", errorArray);
					setValidationErrors(errorArray);
					console.log("✅ Validation errors set, current state should update");
				} else {
					console.log("� No validation errors extracted from error");
				}

				setIsSubmitting(false);
			}
		});
	};
};
