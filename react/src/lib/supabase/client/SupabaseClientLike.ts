/**
 * Minimal RealtimeChannel shape that matches the Supabase realtime API.
 * This type is intentionally loose to be compatible with the actual SupabaseClient
 * while still providing type safety for our usage patterns.
 */
type RealtimeChannelLike = {
	/** Register a callback for a specific event type on the channel */
	on: (event: string, opts: unknown, handler: (payload: unknown) => void) => RealtimeChannelLike;
	/** Subscribe to the channel to start receiving events */
	subscribe: (cb: (status: string, err?: unknown) => void) => unknown;
	/** Optional unsubscribe method present on the channel object */
	unsubscribe?: () => Promise<unknown>;
};

/**
 * Postgrest-like response shape used around the app.
 * Keeps call sites simple: const { data, error } = await query
 */
type PostgrestResponse = {
	/** The data returned from the query, if successful */
	data?: unknown;
	/** The error returned from the query, if it failed */
	error?: unknown;
};

/**
 * Minimal typed shapes that represent the common subset of Postgrest query builder
 * methods used throughout the app. Chain methods return unknown to avoid recursion.
 */
type SupabaseFromLike = {
	/** Select returns a query-like object or promise */
	select: (cols: string) => {
		/** Optional order helper used by some callers */
		order?: (
			column: string,
		) => Promise<PostgrestResponse> /** Optional eq helper used by tests and some query patterns */;
		/** Optional eq filter helper */
		eq?: (column: string, value: string) => { single: () => Promise<unknown> };
	};

	/** Insert returns a query-like object or promise */
	insert?: (row: unknown) => unknown;

	/** Update returns a query-like object or promise */
	update?: (values: unknown) => unknown;

	/** Optional: not every fake needs to implement `delete` */
	delete?: () => unknown;
};

/**
 * Minimal Supabase client shape used by our app for simple read queries and realtime.
 * This mirrors only the chain used in our helpers and tests so we can safely call
 * `client.from(...).select(...).in(...)` without pervasive `any` casts.
 *
 * Generic over Database type to preserve type safety for table names and column types.
 */
export type SupabaseClientLike<DB = unknown> = {
	/** Create a request against a specific table */
	from: <
		TableName extends DB extends { public: { Tables: infer TablesMap } } ? keyof TablesMap : string,
	>(
		tableName: TableName,
	) => SupabaseFromLike;
	/** Initialize a realtime channel */
	channel: (name: string) => RealtimeChannelLike;
	/** Clean up a realtime channel */
	removeChannel: (channel: unknown) => unknown;
	/** Auth capabilities */
	auth: { getUser: () => Promise<unknown> };
};

/**
 * Subset of Supabase client that only includes realtime capabilities.
 * Useful for components that only need to listen for live updates.
 */
export type SupabaseRealtimeClientLike = {
	/** Initialize a realtime channel */
	channel: (name: string) => RealtimeChannelLike;
	/** Clean up a realtime channel */
	removeChannel: (channel: unknown) => unknown;
};

// Export types at end of file so linter is happy with export ordering
export type { PostgrestResponse, RealtimeChannelLike };
