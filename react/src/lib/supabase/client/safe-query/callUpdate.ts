/*
 * ⚠️ WARNING: this file exposes a helper that performs insert queries directly on the
 * client. It is extremely unsafe for production usage—any insert/update/delete work
 * should always run on the server side where credentials and RLS policies can be
 * enforced. Do **not** import or rely on this in application code except for tests or
 * narrow debugging scenarios. Using it elsewhere can leak secrets and bypass
 * authorization.
 */

/* oxlint-disable typescript-eslint/no-unsafe-type-assertion, typescript-eslint/no-unsafe-call, typescript-eslint/no-unsafe-assignment, typescript-eslint/dot-notation */
import type { PostgrestResponse, SupabaseClientLike } from "../SupabaseClientLike";

/**
 * Options for callUpdate helper (data is intentionally untyped for flexibility).
 */
type UpdateOptions = {
	data: unknown;
	eq?: { col: string; val: unknown };
	selectCols?: string;
	single?: boolean;
};

/**
 * Safely call update on a Supabase-like client with type-safe table names.
 *
 * @param client - The Supabase client
 * @param table - Table name (type-checked against database schema)
 * @param opts - Update options (data, eq filter, selectCols, single)
 * @returns PostgrestResponse with data/error
 */
export default async function callUpdate<
	DB = unknown,
	TableName extends DB extends { public: { Tables: infer TablesMap } } ? keyof TablesMap : string =
		DB extends {
			public: { Tables: infer TablesMap };
		}
			? keyof TablesMap
			: string,
>(
	client: SupabaseClientLike<DB>,
	table: TableName,
	opts: UpdateOptions,
): Promise<PostgrestResponse> {
	const clientRec = client as Record<string, unknown>;
	const fromFn = clientRec["from"];
	if (typeof fromFn !== "function") {
		throw new TypeError("Supabase client missing from(...)");
	}
	// Call from as a method to preserve 'this' context
	const tableObj = (fromFn as (table: unknown) => unknown).call(clientRec, table) as Record<
		string,
		unknown
	>;
	if (typeof tableObj["update"] !== "function") {
		throw new TypeError("Supabase from(...).update missing");
	}
	let query: unknown = tableObj["update"](opts.data);

	// Apply .eq() filter if specified
	if (opts.eq !== undefined && typeof (query as Record<string, unknown>)["eq"] === "function") {
		const eqFn = (query as Record<string, unknown>)["eq"] as (col: string, val: unknown) => unknown;
		query = eqFn(opts.eq.col, opts.eq.val);
	}

	// Apply .select() if specified
	if (
		opts.selectCols !== undefined &&
		typeof (query as Record<string, unknown>)["select"] === "function"
	) {
		const selectFn = (query as Record<string, unknown>)["select"] as (cols: string) => unknown;
		query = selectFn(opts.selectCols);
	}

	// Apply .single() if specified
	if (opts.single === true && typeof (query as Record<string, unknown>)["single"] === "function") {
		const singleFn = (query as Record<string, unknown>)["single"] as () => unknown;
		query = singleFn();
	}

	// Await the promise
	if (typeof (query as Promise<unknown>)?.then === "function") {
		return (await (query as Promise<unknown>)) as PostgrestResponse;
	}

	return query as PostgrestResponse;
}
