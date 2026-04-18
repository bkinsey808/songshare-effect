import type { User, UserInsert } from "@/shared/generated/supabaseSchemas";

import type { MaybeSingleResult, MockRow, MultiMaybeResult } from "./supabase-mock-types";

export type UserMockOpts = {
	userMaybe?: MockRow<User>;
	userMaybeError?: unknown;
	userMaybeReject?: unknown;
	userInsertRows?: MockRow<UserInsert>[];
	userInsertError?: unknown;
	userDeleteRows?: MockRow<User>[];
	userDeleteError?: unknown;
};

export type UserTableMock = {
	select: (_cols: string) => {
		eq: (_field: string, _val: string) => { maybeSingle: () => MaybeSingleResult };
	};
	insert: (rows: UserInsert[]) => MultiMaybeResult & { select: () => MultiMaybeResult };
	delete: () => MultiMaybeResult & { eq: (_field: string, _val: string) => MultiMaybeResult };
};

/**
 * Creates a mock for the `user` Supabase table.
 * @param userMaybe - Mock row for maybeSingle select
 * @param userMaybeError - Mock error for maybeSingle select
 * @param userMaybeReject - Error to throw/reject for maybeSingle select
 * @param userInsertRows - Mock rows for insert
 * @param userInsertError - Mock error for insert
 * @param userDeleteRows - Mock rows for delete
 * @param userDeleteError - Mock error for delete
 * @returns A mock user table object.
 */
export function createUserMock(opts: UserMockOpts): UserTableMock {
	return {
		select: (
			_cols,
		): { eq: (_field: string, _val: string) => { maybeSingle: () => MaybeSingleResult } } => ({
			eq: (_field: string, _val: string): { maybeSingle: () => MaybeSingleResult } => ({
				maybeSingle: async (): MaybeSingleResult => {
					await Promise.resolve();
					if (opts.userMaybeError !== undefined) {
						return {
							data: /* oxlint-disable-next-line unicorn/no-null */ null,
							error: opts.userMaybeError,
						};
					}
					if (opts.userMaybeReject !== undefined) {
						if (opts.userMaybeReject instanceof Error) {
							throw opts.userMaybeReject;
						}
						const err = Object.assign(
							new Error(
								typeof opts.userMaybeReject === "string" ? opts.userMaybeReject : "Unknown error",
							),
							{ code: "PGRST204" },
						);
						throw err;
					}
					return {
						data: opts.userMaybe === undefined ? undefined : opts.userMaybe,
						error: undefined,
					};
				},
			}),
		}),
		insert: (rows) => {
			const promise: MultiMaybeResult = (async () => {
				await Promise.resolve();
				return {
					data: opts.userInsertRows === undefined ? rows : opts.userInsertRows,
					error: opts.userInsertError ?? undefined,
				};
			})();
			return Object.assign(promise, {
				select: async (): MultiMaybeResult => {
					await Promise.resolve();
					return {
						data: opts.userInsertRows === undefined ? rows : opts.userInsertRows,
						error: opts.userInsertError ?? undefined,
					};
				},
			});
		},
		delete: () => {
			const promise: MultiMaybeResult = (async () => {
				await Promise.resolve();
				return {
					data: opts.userDeleteRows ?? [],
					error: opts.userDeleteError,
				};
			})();
			return Object.assign(promise, {
				eq: (_field: string, _val: string) => promise,
			});
		},
	};
}
