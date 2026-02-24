import { Schema } from "effect";

/**
 * Decode an unknown value synchronously with an Effect Schema and return the
 * typed result or re-throw the schema validation error. Centralizing this
 * call reduces scattered unsafe assertions across the codebase.
 *
 * @param schema - schema used to validate and decode the input value
 * @param value - untrusted data, usually something parsed from JSON or
 *   retrieved from an external service
 * @returns the successfully decoded value, typed as `TDecoded`
 */
export default function decodeUnknownSyncOrThrow<TDecoded, TInput = unknown>(
	schema: Schema.Schema<TDecoded, TInput>,
	value: unknown,
): TDecoded {
	// Schema.decodeUnknownSync expects an unknown input and will throw on
	// validation failure. Keep the call simple and let calling code handle
	// mapping or wrapping the thrown error to their domain error type.
	return Schema.decodeUnknownSync(schema)(value);
}
