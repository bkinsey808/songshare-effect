/* oxlint-disable typescript-eslint/no-unsafe-type-assertion, typescript-eslint/no-unsafe-call, typescript-eslint/no-unsafe-assignment, typescript-eslint/dot-notation */
import type { PostgrestResponse, SupabaseClientLike } from "../SupabaseClientLike";

/**
 * Options for callInsert helper (row is intentionally untyped for flexibility).
 */
type InsertOptions = {
	row: unknown;
	selectCols?: string;
	single?: boolean;
};

/**
 * Safely call insert on a Supabase-like client with type-safe table names.
 *
 * @param client - The Supabase client
 * @param table - Table name (type-checked against database schema)
 * @param opts - Insert options (row, selectCols, single)
 * @returns PostgrestResponse with data/error
 */
export default async function callInsert<
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
	opts: InsertOptions,
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
	if (typeof tableObj["insert"] !== "function") {
		throw new TypeError("Supabase from(...).insert missing");
	}
	let query: unknown = tableObj["insert"](opts.row);

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
