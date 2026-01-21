/**
 * Minimal RealtimeChannel shape that matches the Supabase realtime API.
 * This type is intentionally loose to be compatible with the actual SupabaseClient
 * while still providing type safety for our usage patterns.
 */
type RealtimeChannelLike = {
	on: (event: string, opts: unknown, handler: (payload: unknown) => void) => RealtimeChannelLike;
	subscribe: (cb: (status: string, err?: unknown) => void) => unknown;
};

/**
 * Minimal Supabase client shape used by our app for simple read queries in tests.
 * This intentionally mirrors only the chain used in `fetchUsername` / enrichment helpers:
 * client.from(table).select(col).eq(col, val).single()
 */
export type SupabaseClientLike = {
	from: (tableName: string) => {
		select: (column: string) => {
			eq: (
				col: string,
				val: string,
			) => {
				single: () => PromiseLike<unknown>;
			};
		};
	};
	channel: (name: string) => RealtimeChannelLike;
	removeChannel: (channel: unknown) => unknown;
};
