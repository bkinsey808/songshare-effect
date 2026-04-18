import extractErrorMessage from "@/shared/error-message/extractErrorMessage";

import type { MockRow, MultiResult, SingleBuilder, SingleResult } from "./supabase-mock-types";

type ImageLibraryInsertRow = {
	user_id: string;
	image_id: string;
	created_at?: string;
};

export type ImageLibraryMockOpts = {
	imageLibraryInsertRows?: (MockRow<ImageLibraryInsertRow> | undefined)[];
	imageLibraryInsertError?: unknown;
	imageLibraryDeleteError?: unknown;
};

export type ImageLibraryTableMock = {
	insert: (rows: ImageLibraryInsertRow[]) => MultiResult & { select: () => SingleBuilder };
	delete: () => {
		eq: (
			field: string,
			val: string,
		) => { eq?: (field: string, val: string) => MultiResult } & MultiResult;
	};
};

/**
 * Creates a mock for the `image_library` Supabase table.
 * @param imageLibraryInsertRows - Mock rows for insert
 * @param imageLibraryInsertError - Mock error for insert
 * @param imageLibraryDeleteError - Mock error for delete
 * @returns A mock image library table object.
 */
export function createImageLibraryMock(opts: ImageLibraryMockOpts): ImageLibraryTableMock {
	return {
		insert: (rows: ImageLibraryInsertRow[]): MultiResult & { select: () => SingleBuilder } => {
			const promise: MultiResult = (async () => {
				await Promise.resolve();
				const data: unknown[] | null =
					opts.imageLibraryInsertError === undefined
						? ((opts.imageLibraryInsertRows ?? rows) as unknown[])
						: /* oxlint-disable-next-line unicorn/no-null */ null;
				const error: unknown = opts.imageLibraryInsertError ?? undefined;
				return { data, error };
			})();

			return Object.assign(promise, {
				select: (): SingleBuilder => ({
					single: async (): SingleResult => {
						await Promise.resolve();
						if (opts.imageLibraryInsertError !== undefined) {
							throw opts.imageLibraryInsertError instanceof Error
								? opts.imageLibraryInsertError
								: new Error(extractErrorMessage(opts.imageLibraryInsertError, "Mock Error"));
						}
						const [firstRow] = opts.imageLibraryInsertRows ?? (rows as unknown[]);
						return {
							data: firstRow ?? undefined,
							/* oxlint-disable-next-line unicorn/no-null -- Supabase single() returns error: null on success */
							error: opts.imageLibraryInsertError ?? null,
						};
					},
				}),
			});
		},
		delete: (): {
			eq: (
				field: string,
				val: string,
			) => { eq?: (field: string, val: string) => MultiResult } & MultiResult;
		} => {
			const promise: MultiResult = (async () => {
				await Promise.resolve();
				if (opts.imageLibraryDeleteError !== undefined) {
					throw opts.imageLibraryDeleteError instanceof Error
						? opts.imageLibraryDeleteError
						: new Error(extractErrorMessage(opts.imageLibraryDeleteError, "Mock Error"));
				}
				return {
					data: [],
					/* oxlint-disable-next-line unicorn/no-null -- Supabase delete returns error: null on success */
					error: null,
				};
			})();
			const chain = Object.assign(promise, {
				eq: (): MultiResult => promise,
			});
			return { eq: (): typeof chain => chain };
		},
	};
}
