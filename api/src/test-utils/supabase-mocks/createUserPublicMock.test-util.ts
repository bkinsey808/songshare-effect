import type { UserPublicInsert } from "@/shared/generated/supabaseSchemas";

import type { MaybeSingleResult, MockRow, MultiResult } from "./supabase-mock-types";

export type UserPublicMockOpts = {
	/** value returned by maybeSingle select; kept `unknown` so tests can simulate
	 * invalid rows. */
	userPublicMaybe?: unknown;
	userPublicMaybeError?: unknown;
	userPublicInsertRows?: MockRow<UserPublicInsert>[];
};

export type UserPublicTableMock = {
	select: (_cols: string) => {
		eq: (_field: string, _val: string) => { maybeSingle: () => MaybeSingleResult };
	};
	insert: (rows: UserPublicInsert[]) => MultiResult & { select: () => MultiResult };
};

export function createUserPublicMock(opts: UserPublicMockOpts): UserPublicTableMock {
	return {
		select: (
			_cols,
		): { eq: (_field: string, _val: string) => { maybeSingle: () => MaybeSingleResult } } => ({
			eq: (_field: string, _val: string): { maybeSingle: () => MaybeSingleResult } => ({
				maybeSingle: async (): MaybeSingleResult => {
					await Promise.resolve();
					if (opts.userPublicMaybeError !== undefined) {
						return { data: undefined, error: opts.userPublicMaybeError };
					}
					return {
						data: opts.userPublicMaybe === undefined ? undefined : opts.userPublicMaybe,
						error: undefined,
					};
				},
			}),
		}),
		insert: (rows) => {
			const promise: MultiResult = (async () => {
				await Promise.resolve();
				return {
					data: opts.userPublicInsertRows === undefined ? rows : opts.userPublicInsertRows,
					error: undefined,
				};
			})();
			return Object.assign(promise, {
				select: async (): MultiResult => {
					await Promise.resolve();
					return {
						data: opts.userPublicInsertRows === undefined ? rows : opts.userPublicInsertRows,
						error: undefined,
					};
				},
			});
		},
	};
}
