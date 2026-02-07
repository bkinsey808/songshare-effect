import { Schema } from "effect";

import { EventPublicSchema, EventSchema } from "@/shared/generated/supabaseSchemas";

import type { Event, EventPublic } from "../event-types";

/**
 * Type guard to validate that a value is an Event record.
 *
 * @param value - The value to check
 * @returns true if the value is an Event according to the generated schema
 */
export function isEvent(value: unknown): value is Event {
	return Schema.decodeUnknownEither(EventSchema)(value)._tag === "Right";
}

/**
 * Type guard to validate that a value is EventPublic record.
 *
 * @param value - The value to check
 * @returns true if the value is EventPublic according to the generated schema
 */
export function isEventPublic(value: unknown): value is EventPublic {
	return Schema.decodeUnknownEither(EventPublicSchema)(value)._tag === "Right";
}
