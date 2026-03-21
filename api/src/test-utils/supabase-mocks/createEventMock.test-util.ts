import type { Event, EventInsert } from "@/shared/generated/supabaseSchemas";

import type {
    MaybeSingleBuilder,
    MaybeSingleResult,
    MockRow,
    MultiResult,
    SingleBuilder,
    SingleResult,
} from "./supabase-mock-types";

export type EventMockOpts = {
	eventInsertRows?: MockRow<EventInsert>[];
	eventInsertError?: unknown;
	eventSelectSingleRow?: MockRow<Event> | undefined;
	eventSelectSingleError?: unknown;
	eventUpdateSelectRow?: MockRow<Event> | undefined;
	eventUpdateSelectError?: unknown;
};

export type EventTableMock = {
	select: (_cols: string) => { eq: (_field: string, _val: string) => MaybeSingleBuilder };
	insert: (rows: EventInsert[]) => MultiResult & { select: () => SingleBuilder };
	update: (_obj: unknown) => {
		eq: (_field: string, _val: string) => { select: () => SingleBuilder };
	};
	delete: () => MultiResult & { eq: (_field: string, _val: string) => MultiResult };
};

/**
 * Create a mock for the `event` table in Supabase.
 *
 * @param eventInsertRows - Mock rows to return after insert
 * @param eventInsertError - Mock error to return on insert
 * @param eventSelectSingleRow - Mock row to return for single select
 * @param eventSelectSingleError - Mock error to return for single select
 * @param eventUpdateSelectRow - Mock row to return after update
 * @param eventUpdateSelectError - Mock error to return after update
 * @returns A mocked Supabase table object
 */
export function createEventMock(opts: EventMockOpts): EventTableMock {
	/**
	 * @param rows - rows to write
	 * @returns promise with results
	 */
	function makeWriteResult(rows: EventInsert[]): MultiResult & { select: () => SingleBuilder } {
		const promise: MultiResult = (async () => {
			await Promise.resolve();
			const data: unknown[] | null =
				opts.eventInsertError === undefined
					? opts.eventInsertRows || rows
					: /* oxlint-disable-next-line unicorn/no-null */ null;
			const error: unknown = opts.eventInsertError ?? undefined;
			return { data, error };
		})();

		return Object.assign(promise, {
			select: (): SingleBuilder => ({
				single: async (): SingleResult => {
					await Promise.resolve();
					const [row] = rows;
					const [firstRow] = opts.eventInsertRows ?? [];
					return {
						data: firstRow === undefined ? row : firstRow,
						error: opts.eventInsertError ?? undefined,
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
						return {
							data: opts.eventSelectSingleRow === undefined ? undefined : opts.eventSelectSingleRow,
							error: opts.eventSelectSingleError ?? undefined,
						};
					})(),
			}),
		}),
		insert: (rows: EventInsert[]): MultiResult & { select: () => SingleBuilder } =>
			makeWriteResult(rows),
		update: (
			_obj: unknown,
		): { eq: (_field: string, _val: string) => { select: () => SingleBuilder } } => ({
			eq: (_field: string, _val: string): { select: () => SingleBuilder } => ({
				select: (): SingleBuilder => ({
					single: async (): SingleResult => {
						await Promise.resolve();
						return {
							data: opts.eventUpdateSelectRow,
							error: opts.eventUpdateSelectError ?? undefined,
						};
					},
				}),
			}),
		}),
		delete: (): MultiResult & { eq: (_field: string, _val: string) => MultiResult } => {
			const promise: MultiResult = (async () => {
				await Promise.resolve();
				return {
					data: /* oxlint-disable-next-line unicorn/no-null */ null,
					error: undefined,
				};
			})();
			return Object.assign(promise, {
				eq: (_field: string, _val: string) => promise,
			});
		},
	};
}
