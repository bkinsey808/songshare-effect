import extractErrorMessage from "@/shared/error-message/extractErrorMessage";
import type { UserLibrary, UserLibraryInsert } from "@/shared/generated/supabaseSchemas";

import mergeMockInsertRows from "./mergeMockInsertRows.test-util";
import type { MockRow, MultiResult, SingleBuilder, SingleResult } from "./supabase-mock-types";

export type UserLibraryMockOpts = {
	userLibraryInsertRows?: (MockRow<UserLibrary> | undefined)[];
	userLibraryInsertError?: unknown;
	/** Row returned by select().eq().eq().single() (used for duplicate-key idempotent path) */
	userLibrarySelectRow?: MockRow<UserLibrary> | undefined;
	userLibraryDeleteError?: unknown;
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
	delete: () => {
		eq: (
			field: string,
			val: string,
		) => { eq?: (field: string, val: string) => MultiResult } & MultiResult;
	};
};

/**
 * Creates a mock for the `user_library` Supabase table.
 * @param userLibraryInsertRows - Mock rows for insert
 * @param userLibraryInsertError - Mock error for insert
 * @param userLibrarySelectRow - Mock row for select
 * @param userLibraryDeleteError - Mock error for delete
 * @returns A mock user library table object.
 */
export function createUserLibraryMock(opts: UserLibraryMockOpts): UserLibraryTableMock {
	return {
		insert: (rows: UserLibraryInsert[]): MultiResult & { select: () => SingleBuilder } => {
			const mergedRows = mergeMockInsertRows(rows, opts.userLibraryInsertRows);
			const promise: MultiResult = (async () => {
				await Promise.resolve();
				// On error, Supabase returns null for data; use empty array to avoid null literal
				const data: unknown[] = opts.userLibraryInsertError === undefined ? mergedRows : [];
				const error: unknown = opts.userLibraryInsertError ?? undefined;
				return { data, error };
			})();

			return Object.assign(promise, {
				select: (): SingleBuilder => ({
					single: async (): SingleResult => {
						await Promise.resolve();
						if (opts.userLibraryInsertError !== undefined) {
							const err = opts.userLibraryInsertError;
							const msg = extractErrorMessage(err, "Mock Error");
							if (msg.includes("user_library_pkey")) {
								return { data: undefined, error: err };
							}
							throw err instanceof Error ? err : new Error(extractErrorMessage(err, "Mock Error"));
						}
						const [firstRow] = mergedRows;
						return {
							data: firstRow ?? undefined,
							/* oxlint-disable-next-line unicorn/no-null */
							error: opts.userLibraryInsertError ?? null,
						};
					},
				}),
			});
		},
		delete: (): {
			eq: (
				field: string,
				val: string,
			) => { eq?: (field: string, val: string) => MultiResult } & MultiResult;
		} => {
			const promise: MultiResult = (async () => {
				await Promise.resolve();
				if (opts.userLibraryDeleteError !== undefined) {
					throw opts.userLibraryDeleteError instanceof Error
						? opts.userLibraryDeleteError
						: new Error(extractErrorMessage(opts.userLibraryDeleteError, "Mock Error"));
				}
				return {
					data: [],
					/* oxlint-disable-next-line unicorn/no-null */
					error: null,
				};
			})();
			const chain = Object.assign(promise, {
				eq: (): MultiResult => promise,
			});
			return { eq: (): typeof chain => chain };
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
