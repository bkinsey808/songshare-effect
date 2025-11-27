import { type Effect, type Schema } from "effect";
import { useState } from "react";

import type { ValidationError } from "@/shared/validation/types";

import { registerMessageKey } from "@/shared/register/register";
import { safeSet } from "@/shared/utils/safe";

import { createApiResponseHandlerEffect } from "./createApiResponseHandlerEffect";
import { createFieldBlurHandler } from "./createFieldBlurHandler";
import { createFormSubmitHandler } from "./createFormSubmitHandler";

type UseAppFormProps<FormValues> = {
	readonly schema: Schema.Schema<FormValues>;
	readonly formRef: React.RefObject<HTMLFormElement | null>;
	readonly defaultErrorMessage?: string;
	readonly initialValues?: Partial<FormValues>;
};

type UseAppFormReturn<FormValues> = {
	readonly validationErrors: ReadonlyArray<ValidationError>;
	readonly isSubmitting: boolean;
	readonly handleFieldBlur: <FieldKey extends keyof FormValues>(
		field: FieldKey,
		ref: React.RefObject<HTMLInputElement | null>,
	) => void;
	readonly getFieldError: (
		field: keyof FormValues,
	) => ValidationError | undefined;
	readonly handleSubmit: (
		formData: Readonly<Record<string, unknown>>,
		onSubmit: (data: Readonly<FormValues>) => Promise<void> | void,
	) => Effect.Effect<void>;
	readonly handleApiResponseEffect: (
		response: Response,
		setSubmitError: (error: string) => void,
	) => Effect.Effect<boolean>;
	readonly reset: () => void;
	readonly setValidationErrors: React.Dispatch<
		React.SetStateAction<ReadonlyArray<ValidationError>>
	>;
};

/**
 * Hook for managing form state and validation with Effect schemas
 */
export function useAppForm<FormValues extends Record<string, unknown>>({
	schema,
	formRef,
	initialValues,
	defaultErrorMessage,
}: UseAppFormProps<FormValues>): UseAppFormReturn<FormValues> {
	const [validationErrors, setValidationErrors] = useState<
		ReadonlyArray<ValidationError>
	>([]);
	const [isSubmitting, setIsSubmitting] = useState(false);

	/**
	 * Handle field blur validation
	 */
	function handleFieldBlur<Field extends keyof FormValues>(
		field: Field,
		ref: React.RefObject<HTMLInputElement | null>,
	): void {
		const value = ref.current?.value ?? "";
		/* oxlint-disable no-console */
		// oxlint-disable-next-line no-console
		console.log(`👆 handleFieldBlur called for ${String(field)}:`, value);
		/* oxlint-enable no-console */

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

		/* oxlint-disable no-console */
		// oxlint-disable-next-line no-console
		console.log("📋 Current form data on blur:", currentFormData);
		/* oxlint-enable no-console */

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
	 * Get field error
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
	 * Handle API response using pure Effect - returns Effect that performs side effects and returns success boolean
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
	 * Reset form to initial values
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
