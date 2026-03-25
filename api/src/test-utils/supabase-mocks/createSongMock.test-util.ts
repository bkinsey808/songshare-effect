import extractErrorMessage from "@/shared/error-message/extractErrorMessage";
import type { Song, SongInsert } from "@/shared/generated/supabaseSchemas";

import type {
	MaybeSingleBuilder,
	MaybeSingleResult,
	MockRow,
	MultiResult,
	SingleBuilder,
	SingleResult,
} from "./supabase-mock-types";

export type SongMockOpts = {
	songInsertRows?: MockRow<SongInsert>[];
	songInsertError?: unknown;
	songSelectSingleRow?: MockRow<Song> | undefined;
	songSelectSingleError?: unknown;
	songSelectThrows?: unknown;
	songUpdateRow?: MockRow<Song> | undefined;
	songUpdateError?: unknown;
	songDeleteError?: unknown;
	songDeleteRows?: MockRow<Song>[];
};

export type SongTableMock = {
	select: (_cols: string) => { eq: (_field: string, _val: string) => MaybeSingleBuilder };
	insert: (rows: SongInsert[]) => MultiResult & { select: () => SingleBuilder };
	update: (_obj: unknown) => {
		eq: (_field: string, _val: string) => { select: () => SingleBuilder };
	};
	delete: () => MultiResult & { eq: (_field: string, _val: string) => MultiResult };
};

/**
 * Create a mock for the `song_public` table in Supabase.
 *
 * @param songPublicInsertRows - Mock rows to return after insert
 * @param songPublicInsertError - Mock error to return on insert
 * @param songPublicSelectSingleRow - Mock row to return for single select
 * @param songPublicSelectSingleError - Mock error to return for single select
 * @param songPublicUpdateSelectRow - Mock row to return after update
 * @param songPublicUpdateSelectError - Mock error to return after update
 * @returns A mocked Supabase table object
 */
export function createSongMock(opts: SongMockOpts): SongTableMock {
	/**
	 * @param rows - rows to write
	 * @returns promise with results
	 */
	function makeWriteResult(rows: SongInsert[]): MultiResult & { select: () => SingleBuilder } {
		const promise: MultiResult = (async () => {
			await Promise.resolve();
			const data: unknown[] | null =
				opts.songInsertError === undefined
					? opts.songInsertRows || rows
					: /* oxlint-disable-next-line unicorn/no-null */
						null;
			const error: unknown = opts.songInsertError ?? undefined;
			return { data, error };
		})();

		return Object.assign(promise, {
			select: (): SingleBuilder => ({
				single: async (): SingleResult => {
					await Promise.resolve();
					const [row] = rows;
					const [firstRow] = opts.songInsertRows ?? [];
					return {
						data: firstRow === undefined ? row : firstRow,
						error: opts.songInsertError ?? undefined,
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
						if (opts.songSelectThrows !== undefined) {
							throw opts.songSelectThrows instanceof Error
								? opts.songSelectThrows
								: new Error(extractErrorMessage(opts.songSelectThrows, "Mock Error"));
						}
						return {
							data: opts.songSelectSingleRow === undefined ? undefined : opts.songSelectSingleRow,
							error: opts.songSelectSingleError ?? undefined,
						};
					})(),
			}),
		}),
		insert: (rows: SongInsert[]): MultiResult & { select: () => SingleBuilder } =>
			makeWriteResult(rows),
		update: (
			_obj: unknown,
		): { eq: (_field: string, _val: string) => { select: () => SingleBuilder } } => ({
			eq: (_field: string, _val: string): { select: () => SingleBuilder } => ({
				select: (): SingleBuilder => ({
					single: async (): SingleResult => {
						await Promise.resolve();
						return {
							data: opts.songUpdateRow,
							error: opts.songUpdateError ?? undefined,
						};
					},
				}),
			}),
		}),
		delete: (): MultiResult & { eq: (_field: string, _val: string) => MultiResult } => {
			const promise: MultiResult = (async () => {
				await Promise.resolve();
				if (opts.songDeleteError !== undefined) {
					throw opts.songDeleteError instanceof Error
						? opts.songDeleteError
						: new Error(extractErrorMessage(opts.songDeleteError, "Mock Error"));
				}
				return {
					data: opts.songDeleteRows ?? [],
					error: undefined,
				};
			})();
			return Object.assign(promise, {
				eq: (_field: string, _val: string) => promise,
			});
		},
	};
}
