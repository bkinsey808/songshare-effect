import type { EventLibrary, EventLibraryInsert } from "@/shared/generated/supabaseSchemas";

import type { MockRow, MultiResult, SingleBuilder, SingleResult } from "./supabase-mock-types";

export type EventLibraryMockOpts = {
	eventLibraryDeleteError?: unknown;
	eventLibraryInsertRows?: (MockRow<EventLibrary> | undefined)[];
	eventLibraryInsertError?: unknown;
	eventLibraryUpsertError?: unknown;
};

export type EventLibraryTableMock = {
	delete: () => {
		eq: () => { eq: () => Promise<{ data: null; error: unknown }> };
	};
	insert: (rows: EventLibraryInsert[]) => MultiResult & { select: () => SingleBuilder };
	upsert: (rows: EventLibraryInsert[]) => MultiResult;
};

/**
 * Creates a mock for the `event_library` Supabase table.
 * @param opts - Mock configuration options.
 * @returns A mock event library table object.
 */
export function createEventLibraryMock(opts: EventLibraryMockOpts): EventLibraryTableMock {
	return {
		delete: (): {
			eq: () => { eq: () => Promise<{ data: null; error: unknown }> };
		} => ({
			eq: (): { eq: () => Promise<{ data: null; error: unknown }> } => ({
				eq: async (): Promise<{ data: null; error: unknown }> => {
					await Promise.resolve();
					return {
						/* oxlint-disable-next-line unicorn/no-null */
						data: null,
						/* oxlint-disable-next-line unicorn/no-null */
						error: opts.eventLibraryDeleteError ?? null,
					};
				},
			}),
		}),
		upsert: (_rows: EventLibraryInsert[]): MultiResult =>
			(async (): Promise<{ data: null; error: unknown }> => {
				await Promise.resolve();
				return {
					/* oxlint-disable-next-line unicorn/no-null */
					data: null,
					error: opts.eventLibraryUpsertError ?? undefined,
				};
			})(),
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
