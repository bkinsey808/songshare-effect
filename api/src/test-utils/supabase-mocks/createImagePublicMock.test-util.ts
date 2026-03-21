import extractErrorMessage from "@/shared/error-message/extractErrorMessage";

import type { MockRow, SingleResult } from "./supabase-mock-types";

type ImagePublicSelectRow = { user_id: string };

export type ImagePublicMockOpts = {
	imagePublicSelectSingleRow?: MockRow<ImagePublicSelectRow> | undefined;
	imagePublicSelectFullRow?: MockRow<Record<string, unknown>> | undefined;
	imagePublicSelectSingleError?: unknown;
	imagePublicSelectThrows?: unknown;
	imagePublicUpdateError?: unknown;
};

export type ImagePublicTableMock = {
	select: (_cols: string) => {
		eq: (_field: string, _val: string) => { single: () => SingleResult };
	};
	update: (_obj: unknown) => {
		eq: (
			_field: string,
			_val: string,
		) => {
			eq: (_field2: string, _val2: string) => Promise<{ data: unknown; error: unknown }>;
		};
	};
};

/**
 * Create a mock for the `image_public` table in Supabase.
 *
 * @param imagePublicSelectSingleRow - Mock row to return for single select
 * @param imagePublicSelectFullRow - Mock row to return for * select
 * @param imagePublicSelectSingleError - Mock error to return for single select
 * @param imagePublicSelectThrows - Error to throw during select
 * @param imagePublicUpdateError - Mock error to return on update
 * @returns A mocked Supabase table object
 */
export function createImagePublicMock(opts: ImagePublicMockOpts): ImagePublicTableMock {
	return {
		select: (cols: string) => ({
			eq: (_field: string, _val: string): { single: () => SingleResult } => ({
				single: (): SingleResult =>
					(async (): SingleResult => {
						await Promise.resolve();
						if (opts.imagePublicSelectThrows !== undefined) {
							throw opts.imagePublicSelectThrows instanceof Error
								? opts.imagePublicSelectThrows
								: new Error(extractErrorMessage(opts.imagePublicSelectThrows, "Mock Error"));
						}
						/* oxlint-disable unicorn/no-null -- Supabase single() returns data: null when no row */
						const data =
							cols === "*"
								? (opts.imagePublicSelectFullRow ?? opts.imagePublicSelectSingleRow ?? null)
								: (opts.imagePublicSelectSingleRow ?? null);
						/* oxlint-enable unicorn/no-null */
						return {
							/* oxlint-disable-next-line unicorn/no-null -- Supabase single() returns data: null when no row */
							data,
							/* oxlint-disable-next-line unicorn/no-null -- Supabase single() returns error: null on success */
							error: opts.imagePublicSelectSingleError ?? null,
						};
					})(),
			}),
		}),
		update: (
			_obj: unknown,
		): {
			eq: (
				field: string,
				value: string,
			) => { eq: (field2: string, value2: string) => Promise<{ data: unknown; error: unknown }> };
		} => ({
			eq: (
				_field: string,
				_val: string,
			): {
				eq: (field2: string, value2: string) => Promise<{ data: unknown; error: unknown }>;
			} => ({
				eq: async (_field2: string, _val2: string): Promise<{ data: unknown; error: unknown }> => {
					await Promise.resolve();
					return {
						data: undefined,
						/* oxlint-disable-next-line unicorn/no-null -- Supabase update returns error: null on success */
						error: opts.imagePublicUpdateError ?? null,
					};
				},
			}),
		}),
	};
}
