// This file performs runtime inspection of unknown values coming from Effect
// execution and therefore contains a few intentionally-localized unsafe casts.
// Keep per-site inline disables rather than a broad, file-scope rule disable.
import { Effect, type Schema } from "effect";

import { isRecord } from "@/shared/utils/typeGuards";

import { type ValidationError, type ValidationResult } from "./types";
import { validateFormEffect } from "./validateFormEffect";

/**
 * Validate form data using Effect schema
 */
export function validateForm<FormValues>({
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
		if (
			error instanceof Error &&
			error.constructor.name === "FiberFailureImpl"
		) {
			try {
				// Try to parse the error message as JSON
				const parsed = JSON.parse(error.message) as unknown;
				const extracted = extractValidationErrors(parsed);
				if (extracted.length) {
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
		if (extracted.length) {
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

/**
 * Safely extract ValidationError[] from various unknown shapes.
 */
function extractValidationErrors(
	input: unknown,
): ReadonlyArray<ValidationError> {
	// Local runtime guard to validate array items look like ValidationError
	function isValidationErrorArray(value: unknown): value is ValidationError[] {
		if (!Array.isArray(value)) {
			return false;
		}
		return value.every((item) => {
			if (!isRecord(item)) {
				return false;
			}
			const rec = item;
			return (
				Object.hasOwn(rec, "field") &&
				Object.hasOwn(rec, "message") &&
				typeof rec["field"] === "string" &&
				typeof rec["message"] === "string"
			);
		});
	}

	// Direct array
	if (isValidationErrorArray(input)) {
		return input;
	}

	// Error instance: try parsing message
	if (input instanceof Error) {
		try {
			const parsed = JSON.parse(input.message) as unknown;
			if (isValidationErrorArray(parsed)) {
				return parsed;
			}
		} catch {
			return [];
		}
	}

	// FiberFailure-like objects or other wrapped shapes
	if (isRecord(input)) {
		const obj = input;

		if ("cause" in obj && isValidationErrorArray(obj["cause"])) {
			return obj["cause"];
		}

		if ("message" in obj && typeof obj["message"] === "string") {
			try {
				const parsed = JSON.parse(String(obj["message"])) as unknown;
				if (isValidationErrorArray(parsed)) {
					return parsed;
				}
			} catch {
				return [];
			}
		}
	}

	return [];
}
