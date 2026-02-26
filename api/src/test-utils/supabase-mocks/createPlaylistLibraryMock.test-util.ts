import type { PlaylistLibrary, PlaylistLibraryInsert } from "@/shared/generated/supabaseSchemas";

import extractErrorMessage from "@/shared/error-message/extractErrorMessage";

import type { MockRow, MultiResult, SingleBuilder, SingleResult } from "./supabase-mock-types";

export type PlaylistLibraryMockOpts = {
	playlistLibraryInsertRows?: MockRow<PlaylistLibraryInsert>[];
	playlistLibraryInsertError?: unknown;
	playlistLibraryDeleteError?: unknown;
	playlistLibraryDeleteRows?: MockRow<PlaylistLibrary>[];
};

export type PlaylistLibraryTableMock = {
	insert: (rows: PlaylistLibraryInsert[]) => MultiResult & { select: () => SingleBuilder };
	delete: () => MultiResult & { eq: (_field: string, _val: string) => MultiResult };
};

export function createPlaylistLibraryMock(opts: PlaylistLibraryMockOpts): PlaylistLibraryTableMock {
	return {
		insert: (rows: PlaylistLibraryInsert[]): MultiResult & { select: () => SingleBuilder } => {
			const promise: MultiResult = (async () => {
				await Promise.resolve();
				if (opts.playlistLibraryInsertError !== undefined) {
					throw opts.playlistLibraryInsertError instanceof Error
						? opts.playlistLibraryInsertError
						: new Error(extractErrorMessage(opts.playlistLibraryInsertError, "Mock Error"));
				}
				return {
					data: opts.playlistLibraryInsertRows ?? (rows as MockRow<PlaylistLibraryInsert>[]),
					error: undefined,
				};
			})();

			// Silence potential unhandled rejection if caller chains .select()
			/* oxlint-disable-next-line promise/prefer-await-to-then, no-empty-function */
			promise.catch(() => {});

			return Object.assign(promise, {
				select: (): SingleBuilder => ({
					single: async (): SingleResult => {
						await Promise.resolve();
						if (opts.playlistLibraryInsertError !== undefined) {
							throw opts.playlistLibraryInsertError instanceof Error
								? opts.playlistLibraryInsertError
								: new Error(extractErrorMessage(opts.playlistLibraryInsertError, "Mock Error"));
						}
						const [row] = rows;
						const [firstRow] = opts.playlistLibraryInsertRows ?? [];
						return {
							/* oxlint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- test helper */
							data: (firstRow === undefined
								? row
								: firstRow) as unknown as MockRow<PlaylistLibrary>,
							error: undefined,
						};
					},
				}),
			});
		},
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
