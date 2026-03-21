import extractErrorMessage from "@/shared/error-message/extractErrorMessage";
import type { PlaylistPublic, PlaylistPublicInsert } from "@/shared/generated/supabaseSchemas";

import type {
    MaybeSingleBuilder,
    MaybeSingleResult,
    MockRow,
    MultiResult,
    SingleBuilder,
    SingleResult,
} from "./supabase-mock-types";

export type PlaylistPublicMockOpts = {
	playlistPublicInsertRows?: MockRow<PlaylistPublicInsert>[];
	playlistPublicInsertError?: unknown;
	playlistPublicSelectSingleRow?: MockRow<PlaylistPublic> | undefined;
	playlistPublicSelectSingleError?: unknown;
	playlistPublicSelectThrows?: unknown;
	playlistPublicUpdateRow?: MockRow<PlaylistPublic> | undefined;
	playlistPublicUpdateError?: unknown;
	playlistPublicDeleteError?: unknown;
	playlistPublicDeleteRows?: MockRow<PlaylistPublic>[];
};

export type PlaylistPublicTableMock = {
	select: (_cols: string) => { eq: (_field: string, _val: string) => MaybeSingleBuilder };
	insert: (rows: PlaylistPublicInsert[]) => MultiResult & { select: () => SingleBuilder };
	update: (_obj: unknown) => {
		eq: (_field: string, _val: string) => { select: () => SingleBuilder };
	};
	delete: () => MultiResult & { eq: (_field: string, _val: string) => MultiResult };
};

/**
 * Create a mock for the `playlist_public` table in Supabase.
 *
 * @param playlistPublicInsertRows - Mock rows to return after insert
 * @param playlistPublicInsertError - Mock error to return on insert
 * @param playlistPublicSelectSingleRow - Mock row to return for single select
 * @param playlistPublicSelectSingleError - Mock error to return for single select
 * @param playlistPublicUpdateSelectRow - Mock row to return after update
 * @param playlistPublicUpdateSelectError - Mock error to return after update
 * @returns A mocked Supabase table object
 */
export function createPlaylistPublicMock(opts: PlaylistPublicMockOpts): PlaylistPublicTableMock {
	/**
	 * @param rows - rows to write
	 * @returns promise with results
	 */
	function makeWriteResult(
		rows: PlaylistPublicInsert[],
	): MultiResult & { select: () => SingleBuilder } {
		const promise: MultiResult = (async () => {
			await Promise.resolve();
			const data: unknown[] | null =
				opts.playlistPublicInsertError === undefined
					? opts.playlistPublicInsertRows || rows
					: /* oxlint-disable-next-line unicorn/no-null */ null;
			const error: unknown = opts.playlistPublicInsertError ?? undefined;
			return { data, error };
		})();

		return Object.assign(promise, {
			select: (): SingleBuilder => ({
				single: async (): SingleResult => {
					await Promise.resolve();
					const [row] = rows;
					const [firstRow] = opts.playlistPublicInsertRows ?? [];
					return {
						data: firstRow === undefined ? row : firstRow,
						error: opts.playlistPublicInsertError ?? undefined,
					};
				},
			}),
		});
	}

	return {
		select: (
			_cols: string,
		): { eq: (_field: string, _val: string) => { single: () => MaybeSingleResult } } => ({
			eq: (_field: string, _val: string): { single: () => MaybeSingleResult } => ({
				single: (): MaybeSingleResult =>
					(async (): MaybeSingleResult => {
						await Promise.resolve();
						if (opts.playlistPublicSelectThrows !== undefined) {
							throw opts.playlistPublicSelectThrows instanceof Error
								? opts.playlistPublicSelectThrows
								: new Error(extractErrorMessage(opts.playlistPublicSelectThrows, "Mock Error"));
						}
						return {
							data:
								opts.playlistPublicSelectSingleRow === undefined
									? undefined
									: opts.playlistPublicSelectSingleRow,
							error: opts.playlistPublicSelectSingleError ?? undefined,
						};
					})(),
			}),
		}),
		insert: (rows: PlaylistPublicInsert[]): MultiResult & { select: () => SingleBuilder } =>
			makeWriteResult(rows),
		update: (
			_obj: unknown,
		): { eq: (_field: string, _val: string) => { select: () => SingleBuilder } } => ({
			eq: (_field: string, _val: string): { select: () => SingleBuilder } => ({
				select: (): SingleBuilder => ({
					single: async (): SingleResult => {
						await Promise.resolve();
						return {
							data: opts.playlistPublicUpdateRow,
							error: opts.playlistPublicUpdateError ?? undefined,
						};
					},
				}),
			}),
		}),
		delete: (): MultiResult & { eq: (_field: string, _val: string) => MultiResult } => {
			const promise: MultiResult = (async () => {
				await Promise.resolve();
				if (opts.playlistPublicDeleteError !== undefined) {
					throw opts.playlistPublicDeleteError instanceof Error
						? opts.playlistPublicDeleteError
						: new Error(extractErrorMessage(opts.playlistPublicDeleteError, "Mock Error"));
				}
				return {
					data: opts.playlistPublicDeleteRows ?? [],
					error: undefined,
				};
			})();
			return Object.assign(promise, {
				eq: (_field: string, _val: string) => promise,
			});
		},
	};
}
