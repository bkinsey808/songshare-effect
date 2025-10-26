import { Effect, Either, Schema } from "effect";
import {
	ArrayFormatter,
	type ArrayFormatterIssue,
	type Composite,
	type ParseError,
	type ParseIssue,
	type Pointer,
	type Refinement,
} from "effect/ParseResult";

import { type I18nMessage, i18nMessageKey } from "../register/register";

export type ValidationError = {
	field: string;
	message: string;
	params?: Record<string, unknown>;
};

export type ValidationResult<T> =
	| {
			success: true;
			data: T;
	  }
	| {
			success: false;
			errors: ValidationError[];
	  };

/**
 * Extract i18n messages from a ParseError by traversing the error tree
 */
function extractI18nMessages(error: ParseError): Record<string, I18nMessage> {
	const fieldErrors: Record<string, I18nMessage> = {};

	function traverseIssue(issue: ParseIssue, path: string[] = []): void {
		if (!issue || typeof issue !== "object") return;

		const fieldName = path.join(".");

		// Check if this is a leaf issue (actual validation failure)
		if (
			issue._tag === "Refinement" &&
			(issue as Refinement).kind === "Predicate" &&
			(issue as Refinement).ast?.annotations?.[i18nMessageKey]
		) {
			const messageObject = (issue as Refinement).ast.annotations[
				i18nMessageKey
			] as I18nMessage;
			fieldErrors[fieldName] = messageObject;
			return; // Stop traversing deeper for this path
		}

		// Traverse nested issues
		if (issue._tag === "Pointer") {
			// This is a Pointer issue
			traverseIssue((issue as Pointer).issue, [
				...path,
				String((issue as Pointer).path),
			]);
		} else if (issue._tag === "Composite") {
			// Handle SingleOrNonEmpty<ParseIssue>
			const compositeIssues = (issue as Composite).issues;
			if (Array.isArray(compositeIssues)) {
				compositeIssues.forEach((subIssue: ParseIssue) =>
					traverseIssue(subIssue, path),
				);
			} else {
				// Single issue
				traverseIssue(compositeIssues as ParseIssue, path);
			}
		}

		if ("issue" in issue && issue.issue) {
			traverseIssue(issue.issue, path);
		}
	}

	if (error.issue) {
		traverseIssue(error.issue);
	}

	return fieldErrors;
}

/**
 * Validate form data using Effect schema - returns an Effect
 */
export function validateFormEffect<T>(
	schema: Schema.Schema<T, T, never>,
	data: unknown,
): Effect.Effect<T, ValidationError[]> {
	return Effect.gen(function* () {
		// Use decodeUnknownEither to get structured error information
		const result = Schema.decodeUnknownEither(schema)(data);

		if (Either.isLeft(result)) {
			// Extract i18n messages from the ParseError
			const i18nMessages = extractI18nMessages(result.left);

			// Use ArrayFormatter to get structured error messages
			const formattedErrors = yield* ArrayFormatter.formatError(result.left);

			// Transform into our ValidationError format
			const validationErrors: ValidationError[] = formattedErrors.map(
				(err: ArrayFormatterIssue) => {
					const fieldName = err.path.join(".");

					// Check if we have i18n messages for this field
					const messageObject = i18nMessages[fieldName];
					if (messageObject) {
						const { key, ...params } = messageObject;
						return {
							field: fieldName,
							message: key as string,
							params,
						};
					}

					// Fallback to the message string
					const message = err.message;
					if (typeof message === "string") {
						// Try to parse as JSON first (for backward compatibility)
						try {
							const parsed = JSON.parse(message);
							if (
								typeof parsed === "object" &&
								parsed !== null &&
								"key" in parsed
							) {
								const { key, ...params } = parsed as {
									key: string;
									[key: string]: unknown;
								};
								return {
									field: err.path.join("."),
									message: key,
									params,
								};
							}
						} catch {
							// Not JSON, treat as regular string
						}
						return {
							field: err.path.join("."),
							message,
						};
					}
					// Handle direct objects (if Effect ever supports them)
					if (
						typeof message === "object" &&
						message !== null &&
						"key" in message
					) {
						const { key, ...params } = message as {
							key: string;
							[key: string]: unknown;
						};
						return {
							field: err.path.join("."),
							message: key,
							params,
						};
					}
					// Fallback
					return {
						field: err.path.join("."),
						message: message ?? "Unknown validation error",
					};
				},
			);

			return yield* Effect.fail(validationErrors);
		}

		return result.right;
	});
}

/**
 * Validate form data using Effect schema
 */
export function validateForm<T>(
	schema: Schema.Schema<T, T, never>,
	data: unknown,
): ValidationResult<T> {
	try {
		const result = Effect.runSync(validateFormEffect(schema, data));
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
				const parsed = JSON.parse(error.message);
				if (Array.isArray(parsed)) {
					return {
						success: false,
						errors: parsed as ValidationError[],
					};
				}
			} catch (parseError) {
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
