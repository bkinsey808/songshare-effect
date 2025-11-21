import { type Effect, type Schema } from "effect";
import { useState } from "react";

import { createApiResponseHandlerEffect } from "./createApiResponseHandlerEffect";
import { createFieldBlurHandler } from "./createFieldBlurHandler";
import { createFormSubmitHandler } from "./createFormSubmitHandler";
import { registerMessageKey } from "@/shared/register/register";
import { safeSet } from "@/shared/utils/safe";
import type { ValidationError } from "@/shared/validation/types";

type UseAppFormProps<FormValues> = {
	readonly schema: Schema.Schema<FormValues, FormValues, never>;
	readonly formRef: React.RefObject<HTMLFormElement | null>;
	readonly defaultErrorMessage?: string;
	readonly initialValues?: Partial<FormValues>;
};

type UseAppFormReturn<FormValues> = {
	readonly validationErrors: ReadonlyArray<ValidationError>;
	readonly isSubmitting: boolean;
	readonly handleFieldBlur: <K extends keyof FormValues>(
		field: K,
		ref: React.RefObject<HTMLInputElement | null>,
	) => void;
	readonly getFieldError: (
		field: keyof FormValues,
	) => ValidationError | undefined;
	readonly handleSubmit: (
		formData: Readonly<Record<string, unknown>>,
		onSubmit: (data: FormValues) => Promise<void> | void,
	) => Effect.Effect<void, never, never>;
	readonly handleApiResponseEffect: (
		response: Response,
		setSubmitError: (error: string) => void,
	) => Effect.Effect<boolean, never, never>;
	readonly reset: () => void;
	readonly setValidationErrors: React.Dispatch<
		React.SetStateAction<ReadonlyArray<ValidationError>>
	>;
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
	const [validationErrors, setValidationErrors] = useState<
		ReadonlyArray<ValidationError>
	>([]);
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

		const fieldBlurHandler = createFieldBlurHandler({
			schema,
			formData: currentFormData as Partial<FormValues>,
			currentErrors: validationErrors,
			setValidationErrors,
			i18nMessageKey: registerMessageKey,
		});
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

	const handleSubmit = createFormSubmitHandler<FormValues>({
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
		return createApiResponseHandlerEffect({
			response,
			setValidationErrors,
			setSubmitError,
			...(defaultErrorMessage !== undefined && { defaultErrorMessage }),
		});
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
