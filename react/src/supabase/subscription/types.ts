import type { SupabaseClientLike } from "@/react/supabase/client/SupabaseClientLike";

/**
 * Configuration for a Supabase realtime subscription.
 */
export type SubscriptionConfig<TPayload = unknown> = {
	/** Supabase client instance */
	client: SupabaseClientLike;
	/** Table name to subscribe to */
	tableName: string;
	/** Optional filter for the subscription (e.g., "user_id=eq.123") */
	filter?: string;
	/** Handler for incoming realtime events */
	onEvent: (payload: TPayload) => void | Promise<void>;
	/** Optional custom channel name (defaults to `${tableName}_changes_${timestamp}`) */
	channelName?: string;
	/** Optional status handler for subscription lifecycle events */
	onStatus?: (status: string, error?: unknown) => void;
};

/**
 * Standard realtime payload structure from Supabase postgres_changes.
 */
export type RealtimePayload<TRecord = Record<string, unknown>> = {
	eventType: "INSERT" | "UPDATE" | "DELETE";
	new?: TRecord;
	old?: TRecord;
	errors?: unknown;
};
