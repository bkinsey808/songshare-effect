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

export type EventPublicMockOpts = {
	eventPublicInsertRows?: unknown[];
	eventPublicInsertError?: unknown;
	eventPublicUpdateRow?: unknown;
	eventPublicUpdateError?: unknown;
	eventPublicSelectRow?: unknown;
	eventPublicSelectError?: unknown;
};

/* oxlint-disable @typescript-eslint/no-explicit-any */
/* oxlint-disable @typescript-eslint/require-await */
/* oxlint-disable unicorn/no-null */
export function createEventPublicMock(opts: EventPublicMockOpts): any {
	return {
		select: (_cols: string): { eq: (_field: string, _val: string) => MaybeSingleBuilder } => ({
			eq: (_field: string, _val: string): MaybeSingleBuilder => ({
				single: async (): MaybeSingleResult => ({
					data: opts.eventPublicSelectRow,
					error: opts.eventPublicSelectError ?? undefined,
				}),
			}),
		}),
		insert: (rows: unknown[]): any => {
			const promise = Promise.resolve({
				data: opts.eventPublicInsertError === undefined ? opts.eventPublicInsertRows || rows : null,
				error: opts.eventPublicInsertError ?? null,
			});

			return Object.assign(promise, {
				select: (): SingleBuilder => ({
					single: async (): SingleResult => {
						const [row] = rows;
						const [firstRow] = opts.eventPublicInsertRows ?? [];
						return {
							data: firstRow === undefined ? row : firstRow,
							error: opts.eventPublicInsertError ?? undefined,
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
						data: opts.eventPublicUpdateRow,
						error: opts.eventPublicUpdateError ?? undefined,
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
