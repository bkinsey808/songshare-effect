/* eslint-disable no-console */
import { Effect, type Schema } from "effect";

import { extractValidationErrors } from "./extractValidationErrors";
import {
	type I18nMessage,
	registerMessageKey,
} from "@/shared/register/register";
import type { ValidationError } from "@/shared/validation/types";
import { validateFormEffect } from "@/shared/validation/validateFormEffect";

type FormSubmitHandlerParams<FormValues> = {
	schema: Schema.Schema<FormValues, FormValues, never>;
	setValidationErrors: React.Dispatch<React.SetStateAction<ValidationError[]>>;
	setIsSubmitting: (isSubmitting: boolean) => void;
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
		formData: Record<string, unknown>,
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
					validateFormEffect<FormValues, I18nMessage>(
						schema,
						currentFormData,
						registerMessageKey,
					),
				);
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
