/**
 * Minimal RealtimeChannel shape that matches the Supabase realtime API.
 * This type is intentionally loose to be compatible with the actual SupabaseClient
 * while still providing type safety for our usage patterns.
 */
type RealtimeChannelLike = {
	on: (event: string, opts: unknown, handler: (payload: unknown) => void) => RealtimeChannelLike;
	subscribe: (cb: (status: string, err?: unknown) => void) => unknown;
	/** Optional unsubscribe method present on the channel object */
	unsubscribe?: () => Promise<unknown>;
};

// Postgrest-like response shape used around the app
// (keeps call sites simple: const { data, error } = await query)
type PostgrestResponse = { data?: unknown; error?: unknown };

// Minimal typed shapes that represent the common subset of Postgrest query builder
// methods used throughout the app. Chain methods return unknown to avoid recursion.
type SupabaseFromLike = {
	/** Select returns a query-like object or promise */
	select: (cols: string) => {
		/** Optional order helper used by some callers */
		order?: (
			column: string,
		) => Promise<PostgrestResponse> /** Optional eq helper used by tests and some query patterns */;
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
 * Minimal Supabase client shape used by our app for simple read queries in tests.
 * This mirrors only the chain used in our helpers and tests so we can safely call
 * `client.from(...).select(...).in(...)` without pervasive `any` casts.
 *
 * Generic over Database type to preserve type safety for table names and column types.
 */
export type SupabaseClientLike<DB = unknown> = {
	from: <
		TableName extends DB extends { public: { Tables: infer TablesMap } } ? keyof TablesMap : string,
	>(
		tableName: TableName,
	) => SupabaseFromLike;
	channel: (name: string) => RealtimeChannelLike;
	removeChannel: (channel: unknown) => unknown;
	auth: { getUser: () => Promise<unknown> };
};

// Export types at end of file so linter is happy with export ordering
export type { PostgrestResponse, RealtimeChannelLike };
