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

export type EventUserMockOpts = {
	eventUserInsertRows?: unknown[];
	eventUserInsertError?: unknown;
	eventUserSelectRow?: unknown;
	eventUserSelectError?: unknown;
	eventUserDeleteError?: unknown;
};

/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/require-await */
/* eslint-disable unicorn/no-null */
export function createEventUserMock(opts: EventUserMockOpts): any {
	return {
		select: (
			_cols: string,
		): {
			eq: (_f: string, _v: string) => { eq: (_f2: string, _v2: string) => MaybeSingleBuilder };
		} => ({
			eq: (
				_field: string,
				_val: string,
			): { eq: (_f2: string, _v2: string) => MaybeSingleBuilder } => ({
				eq: (_field2: string, _val2: string): MaybeSingleBuilder => ({
					single: async (): MaybeSingleResult => ({
						data: opts.eventUserSelectRow === undefined ? undefined : opts.eventUserSelectRow,
						error: opts.eventUserSelectError ?? undefined,
					}),
				}),
			}),
		}),
		insert: (rows: unknown[]): MultiResult & { select: () => SingleBuilder } => {
			const promise: MultiResult = Promise.resolve({
				data: opts.eventUserInsertError === undefined ? opts.eventUserInsertRows || rows : null,
				error: opts.eventUserInsertError ?? null,
			});

			return Object.assign(promise, {
				select: (): SingleBuilder => ({
					single: async (): SingleResult => {
						const [row] = rows;
						const [firstEventUserInsertRow] = opts.eventUserInsertRows ?? [];
						return {
							data: firstEventUserInsertRow === undefined ? row : firstEventUserInsertRow,
							error: opts.eventUserInsertError ?? undefined,
						};
					},
				}),
			});
		},
		delete: (): any => {
			const promise = Promise.resolve({
				data: null,
				error: opts.eventUserDeleteError ?? null,
			});

			return Object.assign(promise, {
				eq: (_field: string, _val: string) => promise,
			});
		},
	};
}
