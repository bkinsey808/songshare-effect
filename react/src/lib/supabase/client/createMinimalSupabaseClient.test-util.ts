import type {
	PostgrestResponse,
	RealtimeChannelLike,
	SupabaseClientLike,
} from "@/react/lib/supabase/client/SupabaseClientLike";

export default function createMinimalSupabaseClient<DB = unknown>(): SupabaseClientLike<DB> {
	function createChannel(): RealtimeChannelLike {
		const channel: RealtimeChannelLike = {
			on(
				_event: string,
				_opts: unknown,
				_handler?: (payload: unknown) => void,
			): RealtimeChannelLike {
				return channel;
			},
			subscribe(_cb?: (status: string, err?: unknown) => void): unknown {
				return undefined;
			},
		};
		return channel;
	}

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
