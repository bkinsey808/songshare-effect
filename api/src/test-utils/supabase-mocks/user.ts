/* oxlint-disable @typescript-eslint/require-await -- mocks match signatures */
/* oxlint-disable unicorn/no-null -- supabase uses null */
/* oxlint-disable promise/prefer-await-to-then -- mocked promises need explicit resolve */
import type { MaybeSingleResult, MultiMaybeResult } from "./supabase-mock-types";

export type UserMockOpts = {
	userMaybe?: unknown;
	userMaybeError?: unknown;
	userMaybeReject?: unknown;
	userInsertRows?: unknown[];
	userInsertError?: unknown;
	userDeleteRows?: unknown[];
	userDeleteError?: unknown;
};

/* oxlint-disable @typescript-eslint/no-explicit-any */
/* oxlint-disable @typescript-eslint/require-await */
export function createUserMock(opts: UserMockOpts): any {
	return {
		select: (
			_cols: string,
		): {
			eq: (
				_field: string,
				_val: string,
			) => { maybeSingle: () => Promise<{ data: unknown; error: unknown } | undefined> };
		} => ({
			eq: (
				_field: string,
				_val: string,
			): { maybeSingle: () => Promise<{ data: unknown; error: unknown } | undefined> } => ({
				maybeSingle: async (): MaybeSingleResult => {
					if (opts.userMaybeError !== undefined) {
						return { data: null, error: opts.userMaybeError };
					}
					/* oxlint-disable-next-line @typescript-eslint/no-unsafe-type-assertion */
					if (opts.userMaybeReject !== undefined) {
						if (opts.userMaybeReject instanceof Error) {
							throw opts.userMaybeReject;
						}
						const err = Object.assign(
							new Error(
								typeof opts.userMaybeReject === "string" ? opts.userMaybeReject : "Unknown error",
							),
							{ code: "PGRST204" },
						);
						throw err;
					}
					return {
						data: opts.userMaybe === undefined ? undefined : opts.userMaybe,
						error: undefined,
					};
				},
			}),
		}),
		insert: (rows: unknown[]): any => {
			const promise = Promise.resolve({
				data: opts.userInsertRows === undefined ? rows : opts.userInsertRows,
				error: opts.userInsertError ?? undefined,
			});

			return Object.assign(promise, {
				select: async (): MultiMaybeResult => ({
					data: opts.userInsertRows === undefined ? rows : opts.userInsertRows,
					error: opts.userInsertError ?? undefined,
				}),
			});
		},
		delete: (): any => {
			const promise = Promise.resolve({
				data: opts.userDeleteRows ?? [],
				error: opts.userDeleteError,
			});

			return Object.assign(promise, {
				eq: async (_field: string, _val: string): MultiMaybeResult => ({
					data: opts.userDeleteRows ?? [],
					error: opts.userDeleteError,
				}),
			});
		},
	};
}
