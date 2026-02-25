// bring in the generated DB schemas for accurate row/insert types
import type { EventUser, EventUserInsert } from "@/shared/generated/supabaseSchemas";

import type {
	MaybeSingleBuilder,
	MaybeSingleResult,
	MockRow,
	MultiResult,
	SingleBuilder,
	SingleResult,
} from "./supabase-mock-types";

export type EventUserMockOpts = {
	/** Rows returned by an `insert`/`upsert` call (default is to echo input) */
	eventUserInsertRows?: MockRow<EventUserInsert>[];
	/** Error to simulate from an `insert`/`upsert` call */
	eventUserInsertError?: unknown;
	/** Single row returned by select queries */
	eventUserSelectRow?: MockRow<EventUser> | undefined;
	/** Error to simulate from select queries */
	eventUserSelectError?: unknown;
	/** Error to simulate from delete queries */
	eventUserDeleteError?: unknown;
};

/**
 * Minimal subset of Supabase client methods used for the `event_user` table.
 * The return types reuse the generic result types defined in
 * `supabase-mock-types.ts` so we stay compatible with the rest of our helpers.
 */
export type EventUserTableMock = {
	select: (_cols: string) => {
		eq: (_field: string, _val: string) => { eq: (_f2: string, _v2: string) => MaybeSingleBuilder };
	};
	insert: (rows: EventUserInsert[]) => MultiResult & { select: () => SingleBuilder };
	upsert: (
		rows: EventUserInsert[],
		_options?: { onConflict?: string; ignoreDuplicates?: boolean },
	) => MultiResult & { select: () => SingleBuilder };
	delete: () => MultiResult & { eq: (_field: string, _val: string) => MultiResult };
};

export function createEventUserMock(opts: EventUserMockOpts): EventUserTableMock {
	function makeWriteResult(rows: EventUserInsert[]): MultiResult & { select: () => SingleBuilder } {
		// we wrap the result in an async IIFE so we can `await` something and satisfy
		// both `require-await` and `prefer-await-to-then` rules without file-level
		// disables. the null values below are the only remaining lint hammer,
		// so we disable unicorn/no-null inline there.
		const promise: MultiResult = (async () => {
			await Promise.resolve();

			const data: unknown[] | null =
				opts.eventUserInsertError === undefined
					? opts.eventUserInsertRows || rows
					: /* oxlint-disable-next-line unicorn/no-null */ null;
			const error: unknown = opts.eventUserInsertError ?? undefined;
			return { data, error };
		})();

		return Object.assign(promise, {
			select: (): SingleBuilder => ({
				single: async (): SingleResult => {
					await Promise.resolve();
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
					single: (): MaybeSingleResult =>
						(async (): MaybeSingleResult => {
							await Promise.resolve();
							return {
								data: opts.eventUserSelectRow === undefined ? undefined : opts.eventUserSelectRow,
								error: opts.eventUserSelectError ?? undefined,
							};
						})(),
				}),
			}),
		}),
		insert: (rows: EventUserInsert[]): MultiResult & { select: () => SingleBuilder } =>
			makeWriteResult(rows),
		upsert: (
			rows: EventUserInsert[],
			_options?: { onConflict?: string; ignoreDuplicates?: boolean },
		): MultiResult & { select: () => SingleBuilder } => makeWriteResult(rows),
		delete: (): MultiResult & { eq: (_field: string, _val: string) => MultiResult } => {
			const promise: MultiResult = (async () => {
				await Promise.resolve();
				return {
					// delete always returns empty data; null is fine here
					/* oxlint-disable-next-line unicorn/no-null */
					data: null,
					error: opts.eventUserDeleteError ?? undefined,
				};
			})();

			return Object.assign(promise, {
				eq: (_field: string, _val: string) => promise,
			});
		},
	};
}
