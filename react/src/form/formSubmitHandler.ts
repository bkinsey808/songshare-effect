/* eslint-disable no-console */
import { Effect, type Schema } from "effect";

import { type I18nMessage, i18nMessageKey } from "@/shared/register/register";
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
						i18nMessageKey,
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

				// Handle validation errors - Effect.fail throws the ValidationError[] directly
				let errorArray: ValidationError[] = [];

				if (Array.isArray(error)) {
					// Direct array of ValidationError
					errorArray = error as ValidationError[];
					console.log("✅ Error is directly an array:", errorArray);
				} else if (error instanceof Error) {
					// Check if it's an Error object
					console.log("🎯 Error is an Error object");
					console.log("📝 Error message:", error.message);
					try {
						// Try to parse the error message as JSON
						const parsed = JSON.parse(error.message);
						if (Array.isArray(parsed)) {
							errorArray = parsed as ValidationError[];
							console.log(
								"✅ Parsed error array from Error.message:",
								errorArray,
							);
						}
					} catch (parseError) {
						console.log(
							"❌ Failed to parse Error.message as JSON:",
							parseError,
						);
					}
				} else if (typeof error === "object" && error !== null) {
					// Check if it's a wrapped error (like FiberFailure)
					const errorObj = error as Record<string, unknown>;
					console.log("🔍 Error object structure:", errorObj);

					// Try to extract the error array from various possible locations
					if ("_tag" in errorObj && errorObj["_tag"] === "FiberFailure") {
						console.log("🎯 Found FiberFailure");
						// FiberFailure might have the error in different places
						if ("cause" in errorObj) {
							const cause = errorObj["cause"];
							if (Array.isArray(cause)) {
								errorArray = cause as ValidationError[];
							}
						}
						// Also check if the error message contains the JSON array
						if (errorArray.length === 0 && "message" in errorObj) {
							const message = String(errorObj["message"]);
							console.log("📝 Checking error message:", message);
							try {
								// Try to parse the message as JSON
								const parsed = JSON.parse(message);
								if (Array.isArray(parsed)) {
									errorArray = parsed as ValidationError[];
									console.log(
										"✅ Parsed error array from message:",
										errorArray,
									);
								}
							} catch (parseError) {
								console.log(
									"❌ Failed to parse error message as JSON:",
									parseError,
								);
							}
						}
					}

					// If we still don't have an array, check if the error itself is the array
					if (errorArray.length === 0 && Array.isArray(errorObj)) {
						errorArray = errorObj as ValidationError[];
					}
				}

				console.log("📝 Final error array to set:", errorArray);
				if (errorArray.length > 0) {
					console.log("🔄 Setting validation errors:", errorArray);
					setValidationErrors(errorArray);
					console.log("✅ Validation errors set, current state should update");
				}
				setIsSubmitting(false);
			}
		});
	};
};
