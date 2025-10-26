// @react-compiler ignore
import { Effect, type Schema } from "effect";
import { useState } from "react";

import { createApiResponseHandler } from "./apiResponse";
import { createFieldBlurHandler } from "./fieldValidation";
import { type I18nMessage, i18nMessageKey } from "@/shared/register/register";
import { safeSet } from "@/shared/utils/safe";
import type { ValidationError } from "@/shared/validation/types";
import { validateFormEffect } from "@/shared/validation/validateFormEffect";

type UseAppFormProps<FormValues> = {
	schema: Schema.Schema<FormValues, FormValues, never>;
	formRef: React.RefObject<HTMLFormElement | null>;
	defaultErrorMessage?: string;
	initialValues?: Partial<FormValues>;
};

type UseAppFormReturn<FormValues> = {
	validationErrors: ValidationError[];
	isSubmitting: boolean;
	handleFieldBlur: <K extends keyof FormValues>(
		field: K,
		ref: React.RefObject<HTMLInputElement | null>,
	) => void;
	getFieldError: (field: keyof FormValues) => ValidationError | undefined;
	handleSubmit: (
		onSubmit: (data: FormValues) => Promise<void> | void,
	) => Effect.Effect<void, never, never>;
	handleApiResponse: (
		response: Response,
		setSubmitError: (error: string) => void,
	) => Effect.Effect<boolean, never, never>;
	reset: () => void;
	setValidationErrors: React.Dispatch<React.SetStateAction<ValidationError[]>>;
};

/**
 * Hook for managing form state and validation with Effect schemas
 */
export const useAppForm = <FormValues extends Record<string, unknown>>({
	schema,
	formRef,
	initialValues,
	defaultErrorMessage,
}: UseAppFormProps<FormValues>): UseAppFormReturn<FormValues> => {
	const [validationErrors, setValidationErrors] = useState<ValidationError[]>(
		[],
	);
	const [isSubmitting, setIsSubmitting] = useState(false);

	/**
	 * Handle field blur validation
	 */
	const handleFieldBlur = <K extends keyof FormValues>(
		field: K,
		ref: React.RefObject<HTMLInputElement | null>,
	): void => {
		const value = ref.current?.value ?? "";
		console.log(`👆 handleFieldBlur called for ${String(field)}:`, value);

		// Read current form data from the form
		const formDataObj = new FormData(formRef.current || undefined);
		const currentFormData: Record<string, string> = {};
		for (const [key, val] of formDataObj.entries()) {
			safeSet(currentFormData, key, val.toString());
		}

		console.log("📋 Current form data on blur:", currentFormData);

		const fieldBlurHandler = createFieldBlurHandler(
			schema,
			currentFormData as Partial<FormValues>,
			validationErrors,
			setValidationErrors,
		);
		fieldBlurHandler(field, value);
	};
	/**
	 * Get field error
	 */
	const getFieldError = (
		field: keyof FormValues,
	): ValidationError | undefined => {
		return validationErrors.find((err) => err.field === String(field));
	};

	const handleSubmit = (
		onSubmit: (data: FormValues) => Promise<void> | void,
	): Effect.Effect<void, never, never> => {
		return Effect.sync(() => {
			console.log("� useAppForm.handleSubmit called");
			console.log("�🔍 Starting form submission validation");
			// Read form data from the form element
			const formDataObj = new FormData(formRef.current || undefined);
			const currentFormData: Record<string, unknown> = {};

			// Convert FormData to our expected shape
			for (const [key, value] of formDataObj.entries()) {
				safeSet(currentFormData, key, value.toString());
			}

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

	/**
	 * Handle API response using pure Effect - returns Effect that performs side effects and returns success boolean
	 */
	const handleApiResponse = (
		response: Response,
		setSubmitError: (error: string) => void,
	): Effect.Effect<boolean, never, never> => {
		return createApiResponseHandler(
			response,
			setValidationErrors,
			setSubmitError,
			defaultErrorMessage,
		);
	};

	/**
	 * Reset form to initial values
	 */
	const reset = (): void => {
		if (formRef.current && initialValues) {
			const form = formRef.current;
			// Reset all form elements to their initial values
			for (const [key, value] of Object.entries(initialValues)) {
				const element = form.elements.namedItem(key) as HTMLInputElement | null;
				if (element && "value" in element) {
					element.value = String(value);
				}
			}
		}
		setValidationErrors([]);
		setIsSubmitting(false);
	};

	return {
		// State
		validationErrors,
		isSubmitting,

		// Actions
		handleFieldBlur,
		getFieldError,
		handleSubmit,
		handleApiResponse,
		reset,
		setValidationErrors,
	};
};
