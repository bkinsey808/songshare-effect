import { type Effect, type Schema } from "effect";
import { useState } from "react";

import { clientDebug } from "@/react/lib/utils/clientLogger";
import { registerMessageKey } from "@/shared/register/register";
import { safeSet } from "@/shared/utils/safe";
import { type ValidationError } from "@/shared/validation/validate-types";

import createApiResponseHandlerEffect from "./createApiResponseHandlerEffect";
import createFieldBlurHandler from "./createFieldBlurHandler";
import createFormSubmitHandler from "./createFormSubmitHandler";

type UseAppFormProps<FormValues> = {
	readonly schema: Schema.Schema<FormValues>;
	readonly formRef: React.RefObject<HTMLFormElement | null>;
	readonly defaultErrorMessage?: string;
	readonly initialValues?: Partial<FormValues>;
};

type UseAppFormReturn<FormValues> = {
	readonly validationErrors: readonly ValidationError[];
	readonly isSubmitting: boolean;
	readonly handleFieldBlur: <FieldKey extends keyof FormValues>(
		field: FieldKey,
		ref: React.RefObject<HTMLInputElement | null>,
	) => void;
	readonly getFieldError: (field: keyof FormValues) => ValidationError | undefined;
	readonly handleSubmit: (
		formData: Readonly<Record<string, unknown>>,
		onSubmit: (data: Readonly<FormValues>) => Promise<void> | void,
	) => Effect.Effect<void>;
	readonly handleApiResponseEffect: (
		response: Response,
		setSubmitError: (error: string) => void,
	) => Effect.Effect<boolean>;
	readonly reset: () => void;
	readonly setValidationErrors: React.Dispatch<React.SetStateAction<readonly ValidationError[]>>;
};

/**
 * Hook for managing form state and validation with Effect schemas.
 *
 * @param schema - Effect Schema used to validate the form payload.
 * @param formRef - Ref to the HTML form element backing this hook.
 * @param initialValues - Optional partial initial values used by `reset`.
 * @param defaultErrorMessage - Optional default message used for submit errors.
 * @returns validationErrors - Array of current validation errors for the form.
 * @returns isSubmitting - True when a submit flow is in progress.
 * @returns handleFieldBlur - Validate a single field on blur and update state.
 * @returns getFieldError - Retrieve the current error for a specific field.
 * @returns handleSubmit - Effect-based submit handler which validates and manages submit state.
 * @returns handleApiResponseEffect - Effect that maps API responses into form errors and submit messages.
 * @returns reset - Reset form inputs to `initialValues` and clear state.
 * @returns setValidationErrors - Setter to update validation errors state from callers/tests.
 */
export default function useAppForm<FormValues extends Record<string, unknown>>({
	schema,
	formRef,
	initialValues,
	defaultErrorMessage,
}: UseAppFormProps<FormValues>): UseAppFormReturn<FormValues> {
	const [validationErrors, setValidationErrors] = useState<readonly ValidationError[]>([]);
	const [isSubmitting, setIsSubmitting] = useState(false);

	/**
	 * Validate a single field when it loses focus and update validation state.
	 *
	 * @param field - Field key to validate.
	 * @param ref - Input ref containing the current value for the field.
	 * @returns void
	 */
	function handleFieldBlur<Field extends keyof FormValues>(
		field: Field,
		ref: React.RefObject<HTMLInputElement | null>,
	): void {
		const value = ref.current?.value ?? "";
		clientDebug(`👆 handleFieldBlur called for ${String(field)}:`, value);

		// Read current form data from the form
		const formDataObj = new FormData(formRef.current || undefined);
		const currentFormData: Record<string, string> = {};
		for (const [key, val] of formDataObj.entries()) {
			if (typeof val === "string") {
				safeSet(currentFormData, key, val);
			} else if (val instanceof File) {
				// Store filename for file inputs
				safeSet(currentFormData, key, val.name);
			} else {
				safeSet(currentFormData, key, String(val));
			}
		}

		clientDebug("📋 Current form data on blur:", currentFormData);

		const fieldBlurHandler = createFieldBlurHandler({
			schema,
			formData: currentFormData,
			currentErrors: validationErrors,
			setValidationErrors,
			i18nMessageKey: registerMessageKey,
		});
		fieldBlurHandler(field, value);
	}

	/**
	 * Get validation error for a specific field.
	 *
	 * @param field - Field key to look up.
	 * @returns ValidationError | undefined - The error object if present.
	 */
	function getFieldError(field: keyof FormValues): ValidationError | undefined {
		return validationErrors.find((err) => err.field === String(field));
	}

	const handleSubmit = createFormSubmitHandler<FormValues>({
		schema,
		setValidationErrors,
		setIsSubmitting,
	});

	/**
	 * Create an Effect that handles an API `Response`, mapping server validation
	 * errors into form state and invoking `setSubmitError` for top-level messages.
	 *
	 * @param response - The fetch `Response` to handle.
	 * @param setSubmitError - Setter to display a submit-level error message.
	 * @returns Effect that resolves to `true` when the response indicates success.
	 */
	function handleApiResponseEffect(
		response: Response,
		setSubmitError: (error: string) => void,
	): Effect.Effect<boolean> {
		return createApiResponseHandlerEffect({
			response,
			setValidationErrors,
			setSubmitError,
			...(defaultErrorMessage !== undefined && { defaultErrorMessage }),
		});
	}

	/**
	 * Reset form inputs to `initialValues` (when provided) and clear form state.
	 *
	 * @returns void
	 */
	function reset(): void {
		if (formRef.current && initialValues) {
			const form = formRef.current;
			// Reset all form elements to their initial values
			for (const [key, value] of Object.entries(initialValues)) {
				const element = form.elements.namedItem(key);
				if (
					element instanceof HTMLInputElement ||
					element instanceof HTMLTextAreaElement ||
					element instanceof HTMLSelectElement
				) {
					element.value = String(value);
				}
			}
		}
		setValidationErrors([]);
		setIsSubmitting(false);
	}

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
}
