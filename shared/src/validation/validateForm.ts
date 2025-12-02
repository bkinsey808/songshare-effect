// This file performs runtime inspection of unknown values coming from Effect
// execution and therefore contains a few intentionally-localized unsafe casts.
// Keep per-site inline disables rather than a broad, file-scope rule disable.
import { Effect, type Schema } from "effect";

import extractValidationErrors from "./extractValidationErrors";
import { type ValidationResult } from "./validate-types";
import validateFormEffect from "./validateFormEffect";

const ZERO = 0;

/**
 * Validate form data using Effect schema
 */
export default function validateForm<FormValues>({
	schema,
	data,
	i18nMessageKey,
}: Readonly<{
	schema: Schema.Schema<FormValues>;
	data: unknown;
	i18nMessageKey: symbol | string;
}>): ValidationResult<FormValues> {
	try {
		const result = Effect.runSync(
			validateFormEffect<FormValues>({
				schema,
				data,
				i18nMessageKey,
			}),
		);
		return {
			success: true,
			data: result,
		};
	} catch (error) {
		// Handle FiberFailure from Effect.runSync
		if (error instanceof Error && error.constructor.name === "FiberFailureImpl") {
			try {
				// Try to parse the error message as JSON
				const parsed = JSON.parse(error.message) as unknown;
				const extracted = extractValidationErrors(parsed);
				if (extracted.length > ZERO) {
					return {
						success: false,
						errors: extracted,
					};
				}
			} catch {
				// Fall through to fallback
			}
		}

		// The error should be our ValidationError[] array
		const extracted = extractValidationErrors(error);
		if (extracted.length > ZERO) {
			return {
				success: false,
				errors: extracted,
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
