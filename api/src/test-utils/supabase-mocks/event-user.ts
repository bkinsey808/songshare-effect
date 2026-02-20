/* oxlint-disable @typescript-eslint/require-await -- mocks match signatures */
/* oxlint-disable unicorn/no-null -- supabase uses null */
/* oxlint-disable promise/prefer-await-to-then -- mocked promises need explicit resolve */
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

/* oxlint-disable @typescript-eslint/no-explicit-any */
/* oxlint-disable @typescript-eslint/require-await */
/* oxlint-disable unicorn/no-null */
export function createEventUserMock(opts: EventUserMockOpts): any {
	function makeWriteResult(rows: unknown[]): MultiResult & { select: () => SingleBuilder } {
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
	}

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
		insert: (rows: unknown[]): MultiResult & { select: () => SingleBuilder } =>
			makeWriteResult(rows),
		upsert: (
			rows: unknown[],
			_options?: { onConflict?: string; ignoreDuplicates?: boolean },
		): MultiResult & { select: () => SingleBuilder } => makeWriteResult(rows),
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
