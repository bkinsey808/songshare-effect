import type {
	PlaylistLibrary,
	PlaylistLibraryInsert,
} from "@/shared/generated/supabaseSchemas";
import extractErrorMessage from "@/shared/error-message/extractErrorMessage";

import type { MockRow, MultiResult } from "./supabase-mock-types";

export type PlaylistLibraryMockOpts = {
	playlistLibraryInsertRows?: MockRow<PlaylistLibraryInsert>[];
	playlistLibraryInsertError?: unknown;
	playlistLibraryDeleteError?: unknown;
	playlistLibraryDeleteRows?: MockRow<PlaylistLibrary>[];
};

export type PlaylistLibraryTableMock = {
	insert: (rows: PlaylistLibraryInsert[]) => MultiResult;
	delete: () => MultiResult & { eq: (_field: string, _val: string) => MultiResult };
};

export function createPlaylistLibraryMock(opts: PlaylistLibraryMockOpts): PlaylistLibraryTableMock {
	return {
		insert: (rows: PlaylistLibraryInsert[]): MultiResult =>
			(async (): MultiResult => {
				await Promise.resolve();
				if (opts.playlistLibraryInsertError !== undefined) {
					throw opts.playlistLibraryInsertError instanceof Error
						? opts.playlistLibraryInsertError
						: new Error(extractErrorMessage(opts.playlistLibraryInsertError, "Mock Error"));
				}
				return {
					data: opts.playlistLibraryInsertRows ?? rows,
					error: undefined,
				};
			})(),
		delete: (): MultiResult & { eq: (_field: string, _val: string) => MultiResult } => {
			const promise: MultiResult = (async () => {
				await Promise.resolve();
				if (opts.playlistLibraryDeleteError !== undefined) {
					throw opts.playlistLibraryDeleteError instanceof Error
						? opts.playlistLibraryDeleteError
						: new Error(extractErrorMessage(opts.playlistLibraryDeleteError, "Mock Error"));
				}
				return {
					data: opts.playlistLibraryDeleteRows ?? [],
					error: undefined,
				};
			})();
			return Object.assign(promise, {
				eq: (_field: string, _val: string) => promise,
			});
		},
	};
}
