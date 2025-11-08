import { type Effect, type Schema } from "effect";
import { useState } from "react";

import { createApiResponseHandlerEffect } from "./createApiResponseHandlerEffect";
import { createFieldBlurHandler } from "./createFieldBlurHandler";
import { createFormSubmitHandler } from "./createFormSubmitHandler";
import { registerMessageKey } from "@/shared/register/register";
import { safeSet } from "@/shared/utils/safe";
import type { ValidationError } from "@/shared/validation/types";

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
		formData: Record<string, unknown>,
		onSubmit: (data: FormValues) => Promise<void> | void,
	) => Effect.Effect<void, never, never>;
	handleApiResponseEffect: (
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
	const handleFieldBlur = <Field extends keyof FormValues>(
		field: Field,
		ref: React.RefObject<HTMLInputElement | null>,
	): void => {
		const value = ref.current?.value ?? "";
		// eslint-disable-next-line no-console
		console.log(`👆 handleFieldBlur called for ${String(field)}:`, value);

		// Read current form data from the form
		const formDataObj = new FormData(formRef.current || undefined);
		const currentFormData: Record<string, string> = {};
		for (const [key, val] of formDataObj.entries()) {
			safeSet(currentFormData, key, val.toString());
		}

		// eslint-disable-next-line no-console
		console.log("📋 Current form data on blur:", currentFormData);

		const fieldBlurHandler = createFieldBlurHandler(
			schema,
			currentFormData as Partial<FormValues>,
			validationErrors,
			setValidationErrors,
			registerMessageKey,
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

	const handleSubmit = createFormSubmitHandler({
		schema,
		setValidationErrors,
		setIsSubmitting,
	});

	/**
	 * Handle API response using pure Effect - returns Effect that performs side effects and returns success boolean
	 */
	const handleApiResponseEffect = (
		response: Response,
		setSubmitError: (error: string) => void,
	): Effect.Effect<boolean, never, never> => {
		return createApiResponseHandlerEffect(
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
		handleApiResponseEffect,
		reset,
		setValidationErrors,
	};
};
