import extractErrorMessage from "@/shared/error-message/extractErrorMessage";
import type { SongLibrary, SongLibraryInsert } from "@/shared/generated/supabaseSchemas";

import type { MockRow, MultiResult, SingleBuilder, SingleResult } from "./supabase-mock-types";

export type SongLibraryMockOpts = {
	songLibrarySelectRows?: MockRow<SongLibrary>[];
	songLibrarySelectError?: unknown;
	songLibraryInsertRows?: (MockRow<SongLibrary> | undefined)[];
	songLibraryInsertError?: unknown;
	songLibraryDeleteError?: unknown;
};

export type SongLibraryTableMock = {
	select: (_cols: string) => { eq: (_field: string, _val: unknown) => MultiResult };
	insert: (rows: SongLibraryInsert[]) => MultiResult & { select: () => SingleBuilder };
	delete: () => {
		eq: (
			field: string,
			val: string,
		) => { eq?: (field: string, val: string) => MultiResult } & MultiResult;
	};
};

export function createSongLibraryMock(opts: SongLibraryMockOpts): SongLibraryTableMock {
	return {
		select: (_cols: string) => ({
			eq: (_field: string, _val: unknown): MultiResult =>
				(async (): Promise<{ data: unknown[] | null; error: unknown }> => {
					await Promise.resolve();
					if (opts.songLibrarySelectError !== undefined) {
						throw opts.songLibrarySelectError instanceof Error
							? opts.songLibrarySelectError
							: new Error(extractErrorMessage(opts.songLibrarySelectError, "Mock Error"));
					}
					return { data: opts.songLibrarySelectRows ?? [], error: undefined };
				})(),
		}),
		insert: (rows: SongLibraryInsert[]): MultiResult & { select: () => SingleBuilder } => {
			const promise: MultiResult = (async () => {
				await Promise.resolve();
				const data: unknown[] | null =
					opts.songLibraryInsertError === undefined
						? ((opts.songLibraryInsertRows ?? rows) as unknown[])
						: /* oxlint-disable-next-line unicorn/no-null */ null;
				const error: unknown = opts.songLibraryInsertError ?? undefined;
				return { data, error };
			})();

			return Object.assign(promise, {
				select: (): SingleBuilder => ({
					single: async (): SingleResult => {
						await Promise.resolve();
						if (opts.songLibraryInsertError !== undefined) {
							throw opts.songLibraryInsertError instanceof Error
								? opts.songLibraryInsertError
								: new Error(extractErrorMessage(opts.songLibraryInsertError, "Mock Error"));
						}
						const [firstRow] = opts.songLibraryInsertRows ?? (rows as unknown[]);
						return {
							data: firstRow ?? undefined,
							/* oxlint-disable-next-line unicorn/no-null */
							error: opts.songLibraryInsertError ?? null,
						};
					},
				}),
			});
		},
		delete: (): {
			eq: (field: string, val: string) => { eq?: (field: string, val: string) => MultiResult } & MultiResult;
		} => {
			const promise: MultiResult = (async () => {
				await Promise.resolve();
				if (opts.songLibraryDeleteError !== undefined) {
					throw opts.songLibraryDeleteError instanceof Error
						? opts.songLibraryDeleteError
						: new Error(extractErrorMessage(opts.songLibraryDeleteError, "Mock Error"));
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
	};
}
