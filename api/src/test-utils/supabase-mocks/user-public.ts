/* oxlint-disable @typescript-eslint/require-await -- mocks match signatures */
/* oxlint-disable unicorn/no-null -- supabase uses null */
/* oxlint-disable promise/prefer-await-to-then -- mocked promises need explicit resolve */
import type { MaybeSingleResult, MultiResult } from "./supabase-mock-types";

export type UserPublicMockOpts = {
	userPublicMaybe?: unknown;
	userPublicMaybeError?: unknown;
	userPublicInsertRows?: unknown[];
};

/* oxlint-disable @typescript-eslint/no-explicit-any */
/* oxlint-disable @typescript-eslint/require-await */
export function createUserPublicMock(opts: UserPublicMockOpts): any {
	return {
		select: (
			_cols: string,
		): {
			eq: (_field: string, _val: string) => { maybeSingle: () => MaybeSingleResult };
		} => ({
			eq: (_field: string, _val: string): { maybeSingle: () => MaybeSingleResult } => ({
				maybeSingle: async (): MaybeSingleResult => {
					/* oxlint-disable-next-line @typescript-eslint/no-unsafe-type-assertion */
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
