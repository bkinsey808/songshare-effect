import extractErrorMessage from "@/shared/error-message/extractErrorMessage";
import type { Playlist, PlaylistInsert } from "@/shared/generated/supabaseSchemas";

import type {
    MaybeSingleBuilder,
    MaybeSingleResult,
    MockRow,
    MultiResult,
    SingleBuilder,
    SingleResult,
} from "./supabase-mock-types";

export type PlaylistMockOpts = {
	playlistInsertRows?: MockRow<PlaylistInsert>[];
	playlistInsertError?: unknown;
	playlistSelectSingleRow?: MockRow<Playlist> | undefined;
	playlistSelectSingleError?: unknown;
	playlistSelectThrows?: unknown;
	playlistUpdateRow?: MockRow<Playlist> | undefined;
	playlistUpdateError?: unknown;
	playlistDeleteError?: unknown;
	playlistDeleteRows?: MockRow<Playlist>[];
};

export type PlaylistTableMock = {
	select: (_cols: string) => { eq: (_field: string, _val: string) => MaybeSingleBuilder };
	insert: (rows: PlaylistInsert[]) => MultiResult & { select: () => SingleBuilder };
	update: (_obj: unknown) => {
		eq: (_field: string, _val: string) => { select: () => SingleBuilder };
	};
	delete: () => MultiResult & { eq: (_field: string, _val: string) => MultiResult };
};

/**
 * Creates a mock for the `playlist` Supabase table.
 * @param opts - Mock configuration options.
 * @returns A mock playlist table object.
 */
export function createPlaylistMock(opts: PlaylistMockOpts): PlaylistTableMock {
	/**
	 * Helper to create a write result (insert/update) with a select builder.
	 * @param rows - The rows being written.
	 * @returns A mock write result with a select method.
	 */
	function makeWriteResult(rows: PlaylistInsert[]): MultiResult & { select: () => SingleBuilder } {
		const promise: MultiResult = (async () => {
			await Promise.resolve();
			const data: unknown[] | null =
				opts.playlistInsertError === undefined
					? opts.playlistInsertRows || rows
					: /* oxlint-disable-next-line unicorn/no-null */ null;
			const error: unknown = opts.playlistInsertError ?? undefined;
			return { data, error };
		})();

		return Object.assign(promise, {
			select: (): SingleBuilder => ({
				single: async (): SingleResult => {
					await Promise.resolve();
					const [row] = rows;
					const [firstRow] = opts.playlistInsertRows ?? [];
					return {
						data: firstRow === undefined ? row : firstRow,
						error: opts.playlistInsertError ?? undefined,
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
						if (opts.playlistSelectThrows !== undefined) {
							throw opts.playlistSelectThrows instanceof Error
								? opts.playlistSelectThrows
								: new Error(extractErrorMessage(opts.playlistSelectThrows, "Mock Error"));
						}
						return {
							data:
								opts.playlistSelectSingleRow === undefined
									? undefined
									: opts.playlistSelectSingleRow,
							error: opts.playlistSelectSingleError ?? undefined,
						};
					})(),
			}),
		}),
		insert: (rows: PlaylistInsert[]): MultiResult & { select: () => SingleBuilder } =>
			makeWriteResult(rows),
		update: (
			_obj: unknown,
		): { eq: (_field: string, _val: string) => { select: () => SingleBuilder } } => ({
			eq: (_field: string, _val: string): { select: () => SingleBuilder } => ({
				select: (): SingleBuilder => ({
					single: async (): SingleResult => {
						await Promise.resolve();
						return {
							data: opts.playlistUpdateRow,
							error: opts.playlistUpdateError ?? undefined,
						};
					},
				}),
			}),
		}),
		delete: (): MultiResult & { eq: (_field: string, _val: string) => MultiResult } => {
			const promise: MultiResult = (async () => {
				await Promise.resolve();
				if (opts.playlistDeleteError !== undefined) {
					throw opts.playlistDeleteError instanceof Error
						? opts.playlistDeleteError
						: new Error(extractErrorMessage(opts.playlistDeleteError, "Mock Error"));
				}
				return {
					data: opts.playlistDeleteRows ?? [],
					error: undefined,
				};
			})();
			return Object.assign(promise, {
				eq: (_field: string, _val: string) => promise,
			});
		},
	};
}
