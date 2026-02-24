import type { User, UserInsert } from "@/shared/generated/supabaseSchemas";

import type { MaybeSingleResult, MultiMaybeResult } from "./supabase-mock-types";

/**
 * Helper that converts every field of `T` into a possibly-`undefined` value.  This
 * mirrors our usage in tests where records may include explicit `undefined` to
 * prove absence (and satisfies exactOptionalPropertyTypes).
 */
// id-length complaints would be noise for this helper type
export type WithUndefinedFields<TValue> = {
	[KValue in keyof TValue]?: TValue[KValue] | undefined;
};

export type UserMockOpts = {
	userMaybe?: WithUndefinedFields<User>;
	userMaybeError?: unknown;
	userMaybeReject?: unknown;
	userInsertRows?: WithUndefinedFields<UserInsert>[];
	userInsertError?: unknown;
	userDeleteRows?: WithUndefinedFields<User>[];
	userDeleteError?: unknown;
};

export type UserTableMock = {
	select: (_cols: string) => {
		eq: (_field: string, _val: string) => { maybeSingle: () => MaybeSingleResult };
	};
	insert: (rows: UserInsert[]) => MultiMaybeResult & { select: () => MultiMaybeResult };
	delete: () => MultiMaybeResult & { eq: (_field: string, _val: string) => MultiMaybeResult };
};

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
