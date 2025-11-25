import { Effect, Either, Schema } from "effect";
import { ArrayFormatter, type ArrayFormatterIssue } from "effect/ParseResult";

import { isRecord, isString } from "@/shared/utils/typeGuards";

import type { ValidationError } from "./types";

import { extractI18nMessages } from "./extractI18nMessages";

/**
 * Validate form data using Effect schema - returns an Effect
 */
export function validateFormEffect<FormValues>({
	schema,
	data,
	i18nMessageKey,
}: Readonly<{
	schema: Schema.Schema<FormValues>;
	data: unknown;
	i18nMessageKey: symbol | string;
}>): Effect.Effect<FormValues, ValidationError[]> {
	return Effect.gen(function* () {
		// Use decodeUnknownEither to get structured error information
		const result = Schema.decodeUnknownEither(schema)(data);

		if (Either.isLeft(result)) {
			// Extract i18n messages from the ParseError
			const i18nMessages = extractI18nMessages(result.left, i18nMessageKey);

			// Use ArrayFormatter to get structured error messages
			const formattedErrors = yield* ArrayFormatter.formatError(result.left);

			// Transform into our ValidationError format
			const validationErrors: ValidationError[] = formattedErrors.map(
				(err: ArrayFormatterIssue) => {
					const fieldName = err.path.join(".");

					// Check if we have i18n messages for this field
					// Look up i18n message by fieldName safely and narrow its shape
					const rawMsg = Object.hasOwn(i18nMessages, fieldName)
						? i18nMessages[fieldName]
						: undefined;
					if (isRecord(rawMsg)) {
						const keyVal = rawMsg["key"];
						if (isString(keyVal)) {
							const params: Record<string, unknown> = {};
							for (const [k, v] of Object.entries(rawMsg)) {
								if (k === "key") continue;
								params[k] = v;
							}
							return {
								field: fieldName,
								message: keyVal,
								params,
							};
						}
					}

					// Fallback to the message string
					const message = err.message;
					if (typeof message === "string") {
						// Try to parse as JSON first (for backward compatibility)
						try {
							const parsed = JSON.parse(message) as unknown;
							if (isRecord(parsed) && "key" in parsed) {
								const rec = parsed;
								const keyVal = rec["key"];
								if (isString(keyVal)) {
									const params: Record<string, unknown> = {};
									for (const [k, v] of Object.entries(rec)) {
										if (k === "key") continue;
										params[k] = v;
									}
									return {
										field: err.path.join("."),
										message: keyVal,
										params,
									};
								}
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
					if (isRecord(message) && "key" in message) {
						const rec = message;
						const keyVal = rec["key"];
						if (isString(keyVal)) {
							const params: Record<string, unknown> = {};
							for (const [k, v] of Object.entries(rec)) {
								if (k === "key") continue;
								params[k] = v;
							}
							return {
								field: err.path.join("."),
								message: keyVal,
								params,
							};
						}
					}
					// Fallback: ensure message is a string
					const finalMessage =
						typeof message === "string"
							? message
							: String(message ?? "Unknown validation error");
					return {
						field: err.path.join("."),
						message: finalMessage,
					};
				},
			);

			return yield* Effect.fail(validationErrors);
		}

		return result.right;
	});
}
