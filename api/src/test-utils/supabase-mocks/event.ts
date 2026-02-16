/* eslint-disable @typescript-eslint/require-await -- mocks match signatures */
/* eslint-disable unicorn/no-null -- supabase uses null */
/* eslint-disable promise/prefer-await-to-then -- mocked promises need explicit resolve */
import type {
    MaybeSingleBuilder,
    MaybeSingleResult,
    MultiResult,
    SingleBuilder,
    SingleResult,
} from "./supabase-mock-types";

export type EventMockOpts = {
	eventInsertRows?: unknown[];
	eventInsertError?: unknown;
	eventSelectSingleRow?: unknown;
	eventSelectSingleError?: unknown;
	eventUpdateSelectRow?: unknown;
	eventUpdateSelectError?: unknown;
};

/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/require-await */
/* eslint-disable unicorn/no-null */
export function createEventMock(opts: EventMockOpts): any {
	return {
		select: (_cols: string): { eq: (_field: string, _val: string) => MaybeSingleBuilder } => ({
			eq: (_field: string, _val: string): MaybeSingleBuilder => ({
				single: async (): MaybeSingleResult => ({
					data: opts.eventSelectSingleRow,
					error: opts.eventSelectSingleError ?? undefined,
				}),
			}),
		}),
		insert: (rows: unknown[]): any => {
			const promise = Promise.resolve({
				data: opts.eventInsertError === undefined ? opts.eventInsertRows || rows : null,
				error: opts.eventInsertError ?? null,
			});

			return Object.assign(promise, {
				select: (): SingleBuilder => ({
					single: async (): SingleResult => {
						const [row] = rows;
						const [firstRow] = opts.eventInsertRows ?? [];
						return {
							data: firstRow === undefined ? row : firstRow,
							error: opts.eventInsertError ?? undefined,
						};
					},
				}),
			});
		},
		update: (
			_obj: unknown,
		): { eq: (_field: string, _val: string) => { select: () => SingleBuilder } } => ({
			eq: (_field: string, _val: string): { select: () => SingleBuilder } => ({
				select: (): SingleBuilder => ({
					single: async (): SingleResult => ({
						data: opts.eventUpdateSelectRow,
						error: opts.eventUpdateSelectError ?? undefined,
					}),
				}),
			}),
		}),
		delete: (): any => {
			const promise = Promise.resolve({ data: null, error: null });

			return Object.assign(promise, {
				eq: async (_field: string, _val: string): MultiResult => ({
					data: [],
					error: undefined,
				}),
			});
		},
	};
}
