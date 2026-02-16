/* eslint-disable @typescript-eslint/require-await -- mocks match signatures */
/* eslint-disable unicorn/no-null -- supabase uses null */
/* eslint-disable promise/prefer-await-to-then -- mocked promises need explicit resolve */
import type { MultiResult, SingleBuilder, SingleResult } from "./supabase-mock-types";

export type EventLibraryMockOpts = {
	eventLibraryInsertRows?: unknown[];
	eventLibraryInsertError?: unknown;
};

/* eslint-disable @typescript-eslint/no-explicit-any -- mocking requires loose types */
export function createEventLibraryMock(opts: EventLibraryMockOpts): {
	insert: (rows: unknown[]) => MultiResult & { select: () => SingleBuilder };
} {
	return {
		insert: (rows: unknown[]): MultiResult & { select: () => SingleBuilder } => {
			const promise: MultiResult = Promise.resolve({
				data:
					opts.eventLibraryInsertError === undefined ? opts.eventLibraryInsertRows || rows : null,
				error: opts.eventLibraryInsertError ?? null,
			});

			return Object.assign(promise, {
				select: (): SingleBuilder => ({
					single: async (): SingleResult => {
						// We need to support async execution for single() too
						if (opts.eventLibraryInsertError !== undefined) {
							return { data: undefined, error: opts.eventLibraryInsertError };
						}
						const [firstRow] = opts.eventLibraryInsertRows ?? rows;
						return { data: firstRow, error: undefined };
					},
				}),
			});
		},
	};
}
