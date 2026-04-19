import type {
	PostgrestResponse,
	RealtimeChannelLike,
	SupabaseClientLike,
} from "@/react/lib/supabase/client/SupabaseClientLike";

/**
 * Build a minimal realtime channel stub for Supabase client tests.
 *
 * @returns A chainable channel stub that satisfies `RealtimeChannelLike`.
 */
function createChannel(): RealtimeChannelLike {
	const channel: RealtimeChannelLike = {
		/**
		 * Attach an event handler and return the channel for chaining.
		 *
		 * @param _event - Event name (unused in stub)
		 * @param _opts - Options passed to `on` (unused in stub)
		 * @param _handler - Optional payload handler (unused in stub)
		 * @returns The channel stub for chaining
		 */
		on(_event: string, _opts: unknown, _handler?: (payload: unknown) => void): RealtimeChannelLike {
			return channel;
		},
		/**
		 * Subscribe placeholder returning undefined in this minimal stub.
		 *
		 * @param _cb - Optional subscribe callback (unused)
		 * @returns undefined
		 */
		subscribe(_cb?: (status: string, err?: unknown) => void): unknown {
			return undefined;
		},
	};
	return channel;
}

/**
 * Create the smallest Supabase client double needed by library tests.
 *
 * This helper returns a client stub implementing the minimal subset of the
 * Supabase client used across tests (`from`, `channel`, and `auth.getUser`).
 *
 * @typeParam DB - Database row type parameter (unused in the stub)
 * @returns A minimal `SupabaseClientLike` instance for tests
 */
export default function createMinimalSupabaseClient<DB = unknown>(): SupabaseClientLike<DB> {
	return {
		from: (_table: string): ReturnType<SupabaseClientLike<DB>["from"]> => ({
			select: (
				_cols: string,
			): {
				in: (col: string, vals: readonly unknown[]) => Promise<PostgrestResponse>;
				eq: (col: string, val: string) => { single: () => Promise<unknown> };
			} => ({
				in: async (_col: string, _vals: readonly unknown[]): Promise<PostgrestResponse> => {
					await Promise.resolve();
					return { data: [], error: undefined };
				},
				eq: (_col: string, _val: string): { single: () => Promise<unknown> } => ({
					single: async (): Promise<unknown> => {
						await Promise.resolve();
						return {};
					},
				}),
			}),
		}),
		channel: (_name: string): RealtimeChannelLike => createChannel(),
		removeChannel: (): unknown => undefined,
		auth: {
			getUser: async (): Promise<unknown> => {
				await Promise.resolve();
				return { data: undefined, error: undefined };
			},
		},
	};
}
