import { Effect, Schema } from "effect";

/**
 * Run an Effect-based Schema decode and map decode errors to a domain error.
 * This centralizes the common pattern `Schema.decodeUnknown(schema)(value).pipe(Effect.mapError(...))`.
 */
export function decodeUnknownEffectOrMap<T, I = unknown, E = unknown>(
	schema: Schema.Schema<T, I>,
	value: unknown,
	mapError: (err: unknown) => E,
): Effect.Effect<T, E> {
	return Schema.decodeUnknown(schema)(value).pipe(Effect.mapError(mapError));
}
