import type { EventLibraryInsert } from "@/shared/generated/supabaseSchemas";

import type { MultiResult, SingleBuilder, SingleResult } from "./supabase-mock-types";

export type EventLibraryMockOpts = {
	// support undefined elements and additional fields (tests sometimes supply
	// `created_at` etc)
	eventLibraryInsertRows?: ((Partial<EventLibraryInsert> & Record<string, unknown>) | undefined)[];
	eventLibraryInsertError?: unknown;
};

export type EventLibraryTableMock = {
	insert: (rows: EventLibraryInsert[]) => MultiResult & { select: () => SingleBuilder };
};

export function createEventLibraryMock(opts: EventLibraryMockOpts): EventLibraryTableMock {
	return {
		insert: (rows: EventLibraryInsert[]): MultiResult & { select: () => SingleBuilder } => {
			const promise: MultiResult = (async () => {
				await Promise.resolve();
				const data: unknown[] | null =
					opts.eventLibraryInsertError === undefined
						? opts.eventLibraryInsertRows || rows
						: /* oxlint-disable-next-line unicorn/no-null */ null;
				const error: unknown = opts.eventLibraryInsertError ?? undefined;
				return { data, error };
			})();

			return Object.assign(promise, {
				select: (): SingleBuilder => ({
					single: async (): SingleResult => {
						await Promise.resolve();
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
