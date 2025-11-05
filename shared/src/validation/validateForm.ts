import { Effect, type Schema } from "effect";

import type { ValidationError, ValidationResult } from "./types";
import { validateFormEffect } from "./validateFormEffect";

/**
 * Validate form data using Effect schema
 */
export function validateForm<
	FormValues,
	I18nMessageType extends { key: string; [key: string]: unknown },
>(
	schema: Schema.Schema<FormValues, FormValues, never>,
	data: unknown,
	i18nMessageKey: symbol | string,
): ValidationResult<FormValues> {
	try {
		const result = Effect.runSync(
			validateFormEffect<FormValues, I18nMessageType>(
				schema,
				data,
				i18nMessageKey,
			),
		);
		return {
			success: true,
			data: result,
		};
	} catch (error) {
		// Handle FiberFailure from Effect.runSync
		if (
			error instanceof Error &&
			error.constructor.name === "FiberFailureImpl"
		) {
			try {
				// Try to parse the error message as JSON
				const parsed = JSON.parse(error.message) as unknown;
				if (Array.isArray(parsed)) {
					return {
						success: false,
						errors: parsed as ValidationError[],
					};
				}
			} catch {
				// Fall through to fallback
			}
		}

		// The error should be our ValidationError[] array
		if (Array.isArray(error)) {
			return {
				success: false,
				errors: error as ValidationError[],
			};
		}

		// Fallback for unexpected errors
		return {
			success: false,
			errors: [
				{
					field: "form",
					message: "Validation failed",
				},
			],
		};
	}
}
