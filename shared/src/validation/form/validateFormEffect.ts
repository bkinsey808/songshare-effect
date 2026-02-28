import { Effect, Either, Schema } from "effect";
import { ArrayFormatter, type ArrayFormatterIssue } from "effect/ParseResult";

import isRecord from "@/shared/type-guards/isRecord";
import isString from "@/shared/type-guards/isString";

import computeParams from "../computeParams";
import extractI18nMessages from "../extractI18nMessages";
import { type ValidationError } from "../validate-types";

/**
 * Extract a shallow params object from a record used for i18n message
 * interpolation. The input `rec` is expected to contain a reserved `key`
 * property and zero or more other properties which are treated as params.
 *
 * The function returns a new object that contains all properties from
 * `rec` except the `key` property.
 *
 * @param rec - Record that may contain a `key` and additional params.
 * @returns A plain object with all entries from `rec` except `key`.
 */

/**
 * Validate form data using an Effect schema and normalize parse errors into
 * the project's `ValidationError` shape.
 *
 * @template FormValues
 * @param schema - The Effect `Schema` used to validate `data`.
 * @param data - The unknown input to validate against the schema.
 * @param i18nMessageKey - Symbol or string used to locate i18n messages
 *   within parse errors produced by Effect.
 * @returns An `Effect` which fails with an array of `ValidationError` on
 *   validation errors, or yields the validated `FormValues` on success.
 */
export default function validateFormEffect<FormValues>({
	schema,
	data,
	i18nMessageKey,
}: Readonly<{
	schema: Schema.Schema<FormValues>;
	data: unknown;
	i18nMessageKey: symbol | string;
}>): Effect.Effect<FormValues, ValidationError[]> {
	return Effect.gen(function* validateFormGen() {
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
							return {
								field: fieldName,
								message: keyVal,
								params: computeParams(rawMsg),
							};
						}
					}

					// Fallback to the message string
					const { message } = err;
					if (typeof message === "string") {
						// Try to parse as JSON first (for backward compatibility)
						try {
							const parsed = JSON.parse(message) as unknown;
							if (isRecord(parsed) && "key" in parsed) {
								const rec = parsed;
								const keyVal = rec["key"];
								if (isString(keyVal)) {
									return {
										field: err.path.join("."),
										message: keyVal,
										params: computeParams(rec),
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
							return {
								field: err.path.join("."),
								message: keyVal,
								params: computeParams(rec),
							};
						}
					}
					// Fallback: ensure message is a string
					const finalMessage =
						typeof message === "string" ? message : String(message ?? "Unknown validation error");
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
