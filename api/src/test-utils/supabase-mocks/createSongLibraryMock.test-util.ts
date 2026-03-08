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
	delete: () => MultiResult & { eq: (_field: string, _val: unknown) => MultiResult };
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
							const err = opts.songLibraryInsertError;
							return {
								data: undefined,
								error:
									err instanceof Error ? err : new Error(extractErrorMessage(err, "Mock Error")),
							};
						}
						const [firstRow] = opts.songLibraryInsertRows ?? (rows as unknown[]);
						return { data: firstRow ?? undefined, error: undefined };
					},
				}),
			});
		},
		delete: (): MultiResult & { eq: (_field: string, _val: unknown) => MultiResult } => {
			const promise: MultiResult = (async () => {
				await Promise.resolve();
				if (opts.songLibraryDeleteError !== undefined) {
					throw opts.songLibraryDeleteError instanceof Error
						? opts.songLibraryDeleteError
						: new Error(extractErrorMessage(opts.songLibraryDeleteError, "Mock Error"));
				}
				return { data: [], error: undefined };
			})();
			return Object.assign(promise, {
				eq: (_field: string, _val: unknown) => promise,
			});
		},
	};
}
