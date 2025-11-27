import { Effect, Schema } from "effect";

/**
 * Run an Effect-based Schema decode and map decode errors to a domain error.
 * This centralizes the common pattern `Schema.decodeUnknown(schema)(value).pipe(Effect.mapError(...))`.
 */
export function decodeUnknownEffectOrMap<
	TDecoded,
	TInput = unknown,
	TError = unknown,
>(
	schema: Schema.Schema<TDecoded, TInput>,
	value: unknown,
	mapError: (err: unknown) => TError,
): Effect.Effect<TDecoded, TError> {
	return Schema.decodeUnknown(schema)(value).pipe(Effect.mapError(mapError));
}
