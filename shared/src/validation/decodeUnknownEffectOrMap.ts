import { Effect, Schema } from "effect";

/**
 * Run an Effect-based Schema decode and map decode errors to a domain error.
 * This centralizes the common pattern `Schema.decodeUnknown(schema)(value).pipe(Effect.mapError(...))`.
 *
 * @param schema - The effect-ts schema to decode against
 * @param value - The unknown value to decode
 * @param mapError - Callback to transform decode errors
 * @returns An effect containing the decoded value or the mapped error
 */
export default function decodeUnknownEffectOrMap<TDecoded, TInput = unknown, TError = unknown>(
	schema: Schema.Schema<TDecoded, TInput>,
	value: unknown,
	mapError: (err: unknown) => TError,
): Effect.Effect<TDecoded, TError> {
	return Schema.decodeUnknown(schema)(value).pipe(Effect.mapError(mapError));
}
