/* eslint-disable @typescript-eslint/require-await -- mocks match signatures */
/* eslint-disable unicorn/no-null -- supabase uses null */
/* eslint-disable promise/prefer-await-to-then -- mocked promises need explicit resolve */
import type { MaybeSingleResult, MultiResult } from "./supabase-mock-types";

export type UserPublicMockOpts = {
	userPublicMaybe?: unknown;
	userPublicMaybeError?: unknown;
	userPublicInsertRows?: unknown[];
};

/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/require-await */
export function createUserPublicMock(opts: UserPublicMockOpts): any {
	return {
		select: (
			_cols: string,
		): {
			eq: (_field: string, _val: string) => { maybeSingle: () => MaybeSingleResult };
		} => ({
			eq: (_field: string, _val: string): { maybeSingle: () => MaybeSingleResult } => ({
				maybeSingle: async (): MaybeSingleResult => {
					/* eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion */
					if (opts.userPublicMaybeError !== undefined) {
						return { data: undefined, error: opts.userPublicMaybeError };
					}
					return {
						data: opts.userPublicMaybe === undefined ? undefined : opts.userPublicMaybe,
						error: undefined,
					};
				},
			}),
		}),
		insert: (rows: unknown[]): any => {
			const promise = Promise.resolve({
				data: opts.userPublicInsertRows === undefined ? rows : opts.userPublicInsertRows,
				error: null,
			});

			return Object.assign(promise, {
				select: async (): MultiResult => ({
					data: opts.userPublicInsertRows === undefined ? rows : opts.userPublicInsertRows,
					error: undefined,
				}),
			});
		},
	};
}
