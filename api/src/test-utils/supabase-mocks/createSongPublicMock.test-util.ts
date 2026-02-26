import type { SongPublic, SongPublicInsert } from "@/shared/generated/supabaseSchemas";

import extractErrorMessage from "@/shared/error-message/extractErrorMessage";

import type {
	MaybeSingleBuilder,
	MaybeSingleResult,
	MockRow,
	MultiResult,
	SingleBuilder,
	SingleResult,
} from "./supabase-mock-types";

export type SongPublicMockOpts = {
	songPublicInsertRows?: MockRow<SongPublicInsert>[];
	songPublicInsertError?: unknown;
	songPublicSelectSingleRow?: MockRow<SongPublic> | undefined;
	songPublicSelectSingleError?: unknown;
	songPublicSelectThrows?: unknown;
	songPublicUpdateRow?: MockRow<SongPublic> | undefined;
	songPublicUpdateError?: unknown;
	songPublicInRows?: MockRow<SongPublic>[];
	songPublicInError?: unknown;
};

export type SongPublicTableMock = {
	select: (_cols: string) => {
		eq: (_field: string, _val: string) => MaybeSingleBuilder;
		in: (_field: string, _vals: unknown) => MaybeSingleBuilder;
	};
	insert: (rows: SongPublicInsert[]) => MultiResult & { select: () => SingleBuilder };
	update: (_obj: unknown) => {
		eq: (_field: string, _val: string) => { select: () => SingleBuilder };
	};
};

export function createSongPublicMock(opts: SongPublicMockOpts): SongPublicTableMock {
	function makeWriteResult(
		rows: SongPublicInsert[],
	): MultiResult & { select: () => SingleBuilder } {
		const promise: MultiResult = (async () => {
			await Promise.resolve();
			const data: unknown[] | null =
				opts.songPublicInsertError === undefined
					? opts.songPublicInsertRows || rows
					: /* oxlint-disable-next-line unicorn/no-null */ null;
			const error: unknown = opts.songPublicInsertError ?? undefined;
			return { data, error };
		})();

		return Object.assign(promise, {
			select: (): SingleBuilder => ({
				single: async (): SingleResult => {
					await Promise.resolve();
					const [row] = rows;
					const [firstRow] = opts.songPublicInsertRows ?? [];
					return {
						data: firstRow === undefined ? row : firstRow,
						error: opts.songPublicInsertError ?? undefined,
					};
				},
			}),
		});
	}

	return {
		select: (_cols: string) => ({
			eq: (_field: string, _val: string): MaybeSingleBuilder => ({
				single: (): MaybeSingleResult =>
					(async (): MaybeSingleResult => {
						await Promise.resolve();
						if (opts.songPublicSelectThrows !== undefined) {
							throw opts.songPublicSelectThrows instanceof Error
								? opts.songPublicSelectThrows
								: new Error(extractErrorMessage(opts.songPublicSelectThrows, "Mock Error"));
						}
						return {
							data:
								opts.songPublicSelectSingleRow === undefined
									? undefined
									: opts.songPublicSelectSingleRow,
							error: opts.songPublicSelectSingleError ?? undefined,
						};
					})(),
			}),
			in: (_field: string, _vals: unknown): MaybeSingleBuilder => ({
				single: async (): MaybeSingleResult => {
					await Promise.resolve();
					if (opts.songPublicSelectThrows !== undefined) {
						throw opts.songPublicSelectThrows instanceof Error
							? opts.songPublicSelectThrows
							: new Error(extractErrorMessage(opts.songPublicSelectThrows, "Mock Error"));
					}
					return {
						data: opts.songPublicInRows,
						error: opts.songPublicInError ?? undefined,
					};
				},
			}),
		}),
		insert: (rows: SongPublicInsert[]): MultiResult & { select: () => SingleBuilder } =>
			makeWriteResult(rows),
		update: (
			_obj: unknown,
		): { eq: (_field: string, _val: string) => { select: () => SingleBuilder } } => ({
			eq: (_field: string, _val: string): { select: () => SingleBuilder } => ({
				select: (): SingleBuilder => ({
					single: async (): SingleResult => {
						await Promise.resolve();
						return {
							data: opts.songPublicUpdateRow,
							error: opts.songPublicUpdateError ?? undefined,
						};
					},
				}),
			}),
		}),
	};
}
