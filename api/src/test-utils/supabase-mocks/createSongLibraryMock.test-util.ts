
import type {
    SongLibrary,
    SongLibraryInsert,
} from "@/shared/generated/supabaseSchemas";

import extractErrorMessage from "@/shared/error-message/extractErrorMessage";
import type {
    MockRow,
    MultiResult
} from "./supabase-mock-types";

export type SongLibraryMockOpts = {
	songLibrarySelectRows?: MockRow<SongLibrary>[];
	songLibrarySelectError?: unknown;
	songLibraryInsertRows?: MockRow<SongLibraryInsert>[];
	songLibraryInsertError?: unknown;
};

export type SongLibraryTableMock = {
	select: (_cols: string) => { eq: (_field: string, _val: unknown) => MultiResult };
	insert: (rows: SongLibraryInsert[]) => MultiResult;
};

export function createSongLibraryMock(opts: SongLibraryMockOpts): SongLibraryTableMock {
	return {
		select: (_cols: string) => ({
			eq: (_field: string, _val: unknown): MultiResult => (async (): Promise<{ data: unknown[] | null; error: unknown }> => {
					await Promise.resolve();
					if (opts.songLibrarySelectError !== undefined) {
						throw opts.songLibrarySelectError instanceof Error
							? opts.songLibrarySelectError
							: new Error(
								extractErrorMessage(opts.songLibrarySelectError, "Mock Error"),
							);
					}
					return { data: opts.songLibrarySelectRows ?? [], error: undefined };
				})(),
		}),
		insert: (rows: SongLibraryInsert[]): MultiResult => (async (): Promise<{ data: unknown[] | null; error: unknown }> => {
				await Promise.resolve();
				if (opts.songLibraryInsertError !== undefined) {
					throw opts.songLibraryInsertError instanceof Error
						? opts.songLibraryInsertError
						: new Error(
							extractErrorMessage(opts.songLibraryInsertError, "Mock Error"),
						);
				}
				return { data: opts.songLibraryInsertRows ?? rows, error: undefined };
			})(),
	};
}
