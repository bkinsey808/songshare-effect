import { Effect, Either, Schema } from "effect";
import { ArrayFormatter, type ArrayFormatterIssue } from "effect/ParseResult";

import { extractI18nMessages } from "./extractI18nMessages";
import type { ValidationError } from "./types";
import { safeGet } from "@/shared/utils/safe";

/**
 * Validate form data using Effect schema - returns an Effect
 */
export function validateFormEffect<
	FormValues,
	I18nMessageType extends { key: string; [key: string]: unknown },
>({
	schema,
	data,
	i18nMessageKey,
}: {
	schema: Schema.Schema<FormValues, FormValues, never>;
	data: unknown;
	i18nMessageKey: symbol | string;
}): Effect.Effect<FormValues, ValidationError[]> {
	return Effect.gen(function* () {
		// Use decodeUnknownEither to get structured error information
		const result = Schema.decodeUnknownEither(schema)(data);

		if (Either.isLeft(result)) {
			// Extract i18n messages from the ParseError
			const i18nMessages = extractI18nMessages<I18nMessageType>(
				result.left,
				i18nMessageKey,
			);

			// Use ArrayFormatter to get structured error messages
			const formattedErrors = yield* ArrayFormatter.formatError(result.left);

			// Transform into our ValidationError format
			const validationErrors: ValidationError[] = formattedErrors.map(
				(err: ArrayFormatterIssue) => {
					const fieldName = err.path.join(".");

					// Check if we have i18n messages for this field
					const messageObject = safeGet(i18nMessages, fieldName);
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
							const parsed = JSON.parse(message) as unknown;
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
