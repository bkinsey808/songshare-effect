import type { Effect } from "effect/Effect";

import type { SupabaseClientLike } from "@/react/supabase/client/SupabaseClientLike";
import type { Database } from "@/shared/generated/supabaseTypes";

/**
 * Extract valid table names from the Supabase database schema.
 */
export type ValidTableName = keyof Database["public"]["Tables"];

/**
 * Valid subscription status values emitted by Supabase realtime channel.
 */
export type SubscriptionStatus = "SUBSCRIBED" | "CHANNEL_ERROR" | "TIMED_OUT" | "CLOSED";

/**
 * Valid realtime event types from postgres_changes.
 */
export type RealtimeEventType = "INSERT" | "UPDATE" | "DELETE";

/**
 * Configuration for a Supabase realtime subscription.
 * @template TPayload - The type of realtime event payload (defaults to unknown)
 */
export type SubscriptionConfig<TPayload = unknown> = {
	/** Supabase client instance for the subscription */
	client: SupabaseClientLike<Database>;
	/** Table name to subscribe to (must be a valid table in the database schema) */
	tableName: ValidTableName;
	/** Handler for incoming realtime events. Returns an Effect that may fail with an error. */
	onEvent: (payload: TPayload) => Effect<void, Error>;
	/** Optional PostgREST filter clause (e.g., "user_id=eq.123") */
	filter?: string;
	/** Optional custom channel name. Defaults to `${tableName}_changes_${timestamp}` */
	channelName?: string;
	/** Optional handler for subscription lifecycle events. Status is one of: SUBSCRIBED, CHANNEL_ERROR, TIMED_OUT, CLOSED */
	onStatus?: (status: string, error?: unknown) => void;
};

/**
 * Standard realtime payload structure from Supabase postgres_changes event.
 * @template TRecord - The type of the table record (defaults to generic object)
 */
export type RealtimePayload<TRecord = Record<string, unknown>> = {
	/** Event type: INSERT, UPDATE, or DELETE */
	eventType: RealtimeEventType;
	/** New record state (present for INSERT and UPDATE events) */
	new?: TRecord;
	/** Old record state (present for UPDATE and DELETE events) */
	old?: TRecord;
	/** Any errors that occurred during the event (typically undefined if successful) */
	errors?: Error | null;
};
