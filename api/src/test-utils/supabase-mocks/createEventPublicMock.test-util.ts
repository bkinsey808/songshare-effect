import type { EventPublic, EventPublicInsert } from "@/shared/generated/supabaseSchemas";

import type {
	MaybeSingleBuilder,
	MaybeSingleResult,
	MockRow,
	MultiResult,
	SingleBuilder,
	SingleResult,
} from "./supabase-mock-types";

export type EventPublicMockOpts = {
	eventPublicInsertRows?: MockRow<EventPublicInsert>[];
	eventPublicInsertError?: unknown;
	eventPublicUpdateRow?: MockRow<EventPublic> | undefined;
	eventPublicUpdateError?: unknown;
	eventPublicSelectRow?: MockRow<EventPublic> | undefined;
	eventPublicSelectError?: unknown;
};

export type EventPublicTableMock = {
	select: (_cols: string) => { eq: (_field: string, _val: string) => MaybeSingleBuilder };
	insert: (rows: EventPublicInsert[]) => MultiResult & { select: () => SingleBuilder };
	update: (_obj: unknown) => {
		eq: (_field: string, _val: string) => { select: () => SingleBuilder };
	};
	delete: () => MultiResult & { eq: (_field: string, _val: string) => MultiResult };
};

/**
 * Creates a mock for the `event_public` Supabase table.
 * @param eventPublicInsertRows - Mock rows to return after insert
 * @param eventPublicInsertError - Mock error to return on insert
 * @param eventPublicUpdateRow - Mock row to return after update
 * @param eventPublicUpdateError - Mock error to return after update
 * @param eventPublicSelectRow - Mock row to return for select
 * @param eventPublicSelectError - Mock error to return for select
 * @returns A mock event public table object.
 */
export function createEventPublicMock(opts: EventPublicMockOpts): EventPublicTableMock {
	/**
	 * Helper to create a write result (insert/update) with a select builder.
	 * @param rows - The rows being written.
	 * @returns A mock write result with a select method.
	 */
	function makeWriteResult(
		rows: EventPublicInsert[],
	): MultiResult & { select: () => SingleBuilder } {
		const promise: MultiResult = (async () => {
			await Promise.resolve();
			const data: unknown[] | null =
				opts.eventPublicInsertError === undefined
					? opts.eventPublicInsertRows || rows
					: /* oxlint-disable-next-line unicorn/no-null */ null;
			const error: unknown = opts.eventPublicInsertError ?? undefined;
			return { data, error };
		})();

		return Object.assign(promise, {
			select: (): SingleBuilder => ({
				single: async (): SingleResult => {
					await Promise.resolve();
					const [row] = rows;
					const [firstRow] = opts.eventPublicInsertRows ?? [];
					return {
						data: firstRow === undefined ? row : firstRow,
						error: opts.eventPublicInsertError ?? undefined,
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
							data: opts.eventPublicSelectRow === undefined ? undefined : opts.eventPublicSelectRow,
							error: opts.eventPublicSelectError ?? undefined,
						};
					})(),
			}),
		}),
		insert: (rows: EventPublicInsert[]): MultiResult & { select: () => SingleBuilder } =>
			makeWriteResult(rows),
		update: (
			_obj: unknown,
		): { eq: (_field: string, _val: string) => { select: () => SingleBuilder } } => ({
			eq: (_field: string, _val: string): { select: () => SingleBuilder } => ({
				select: (): SingleBuilder => ({
					single: async (): SingleResult => {
						await Promise.resolve();
						return {
							data: opts.eventPublicUpdateRow,
							error: opts.eventPublicUpdateError ?? undefined,
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
