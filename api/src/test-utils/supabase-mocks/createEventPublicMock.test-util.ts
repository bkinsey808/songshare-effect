import type { EventPublic, EventPublicInsert } from "@/shared/generated/supabaseSchemas";

import type {
	MaybeSingleBuilder,
	MaybeSingleResult,
	MultiResult,
	SingleBuilder,
	SingleResult,
} from "./supabase-mock-types";

export type EventPublicMockOpts = {
	eventPublicInsertRows?: Partial<EventPublicInsert>[];
	eventPublicInsertError?: unknown;
	eventPublicUpdateRow?: Partial<EventPublic> | undefined;
	eventPublicUpdateError?: unknown;
	eventPublicSelectRow?: Partial<EventPublic> | undefined;
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

export function createEventPublicMock(opts: EventPublicMockOpts): EventPublicTableMock {
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
