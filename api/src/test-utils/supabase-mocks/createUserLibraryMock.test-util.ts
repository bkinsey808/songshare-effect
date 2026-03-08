import type { UserLibrary, UserLibraryInsert } from "@/shared/generated/supabaseSchemas";

import type { MockRow, MultiResult, SingleBuilder, SingleResult } from "./supabase-mock-types";

export type UserLibraryMockOpts = {
	userLibraryInsertRows?: (MockRow<UserLibrary> | undefined)[];
	userLibraryInsertError?: unknown;
	/** Row returned by select().eq().eq().single() (used for duplicate-key idempotent path) */
	userLibrarySelectRow?: MockRow<UserLibrary> | undefined;
};

export type UserLibraryTableMock = {
	insert: (rows: UserLibraryInsert[]) => MultiResult & { select: () => SingleBuilder };
	select: (_cols: string) => {
		eq: (
			_field: string,
			_val: unknown,
		) => {
			eq: (_field2: string, _val2: unknown) => { single: () => SingleResult };
		};
	};
};

export function createUserLibraryMock(opts: UserLibraryMockOpts): UserLibraryTableMock {
	return {
		insert: (rows: UserLibraryInsert[]): MultiResult & { select: () => SingleBuilder } => {
			const promise: MultiResult = (async () => {
				await Promise.resolve();
				// On error, Supabase returns null for data; use empty array to avoid null literal
				const data: unknown[] =
					opts.userLibraryInsertError === undefined
						? (opts.userLibraryInsertRows ?? (rows as unknown[]))
						: [];
				const error: unknown = opts.userLibraryInsertError ?? undefined;
				return { data, error };
			})();

			return Object.assign(promise, {
				select: (): SingleBuilder => ({
					single: async (): SingleResult => {
						await Promise.resolve();
						if (opts.userLibraryInsertError !== undefined) {
							return {
								data: undefined,
								error: opts.userLibraryInsertError,
							};
						}
						const [firstRow] = opts.userLibraryInsertRows ?? (rows as unknown[]);
						return { data: firstRow ?? undefined, error: undefined };
					},
				}),
			});
		},
		select: (): { eq: () => { eq: () => { single: () => SingleResult } } } => ({
			eq: (): { eq: () => { single: () => SingleResult } } => ({
				eq: (): { single: () => SingleResult } => ({
					single: async (): SingleResult => {
						await Promise.resolve();
						return {
							data: opts.userLibrarySelectRow ?? undefined,
							error: undefined,
						};
					},
				}),
			}),
		}),
	};
}
