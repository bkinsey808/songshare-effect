import type { PostgrestResponse } from "@supabase/postgrest-js";

/* oxlint-disable typescript-eslint/no-unsafe-type-assertion, typescript-eslint/no-unsafe-call, typescript-eslint/no-unsafe-assignment, typescript-eslint/dot-notation */
import type { SupabaseClientLike } from "../SupabaseClientLike";

/**
 * Extract column names from a table in the database schema.
 */
type ColumnsOf<DB, TableName> = DB extends {
	public: { Tables: Record<string, { Row: Record<string, unknown> }> };
}
	? TableName extends keyof DB["public"]["Tables"]
		? keyof DB["public"]["Tables"][TableName]["Row"] & string
		: string
	: string;

/**
 * Options for callSelect helper with type-safe column names.
 * For joins/complex queries, column names fall back to string.
 */
type SelectOptions<DB, TableName> = {
	cols?: string;
	in?: { col: ColumnsOf<DB, TableName> | string; vals: readonly unknown[] };
	eq?: { col: ColumnsOf<DB, TableName> | string; val: unknown };
	order?: ColumnsOf<DB, TableName> | string;
	single?: boolean;
};

/**
 * Safely call select on a Supabase-like client with type-safe table names.
 *
 * The helper is generic over the shape of rows returned from the query, as
 * well as the database schema and table name.  Callers should provide the row
 * type when they know it, which allows future code to operate on `.data`
 * without unsafe assertions.
 *
 * @template Row - the type of each row returned by the query; defaults to
 *   `unknown` when unspecified
 * @template DB - database schema type used for table name inference
 * @template TableName - specific table name within the schema
 * @param client - The Supabase client
 * @param table - Table name (type-checked against database schema)
 * @param opts - Select options (cols, in, eq, single)
 * @returns PostgrestResponse with data/error
 */
export default async function callSelect<
	/**
	 * Type of rows returned by the query. Specify this when calling to avoid
	 * unsafe assertions at the call site.
	 */
	Row = unknown,
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
	opts?: SelectOptions<DB, TableName>,
): Promise<PostgrestResponse<Row>> {
	const cols = opts?.cols ?? "*";
	const inOpt = opts?.in;
	const eqOpt = opts?.eq;
	const orderOpt = opts?.order;
	const singleOpt = opts?.single ?? false;

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
	if (typeof tableObj["select"] !== "function") {
		throw new TypeError("Supabase from(...).select missing");
	}
	let query: unknown = tableObj["select"](cols);

	// Apply .in() if specified
	if (inOpt !== undefined && typeof (query as Record<string, unknown>)["in"] === "function") {
		const queryRec = query as Record<string, unknown>;
		const inFn = queryRec["in"];
		query = (inFn as (col: string, vals: readonly unknown[]) => unknown).call(
			queryRec,
			inOpt.col,
			inOpt.vals,
		);
	}

	// Apply .eq() if specified
	if (eqOpt !== undefined && typeof (query as Record<string, unknown>)["eq"] === "function") {
		const queryRec = query as Record<string, unknown>;
		const eqFn = queryRec["eq"];
		query = (eqFn as (col: string, val: unknown) => unknown).call(queryRec, eqOpt.col, eqOpt.val);
	}

	// Apply .order() if specified
	if (orderOpt !== undefined && typeof (query as Record<string, unknown>)["order"] === "function") {
		const queryRec = query as Record<string, unknown>;
		const orderFn = queryRec["order"];
		query = (orderFn as (col: string) => unknown).call(queryRec, orderOpt);
	}

	// Apply .single() if specified
	if (singleOpt && typeof (query as Record<string, unknown>)["single"] === "function") {
		const queryRec = query as Record<string, unknown>;
		const singleFn = queryRec["single"];
		query = (singleFn as () => unknown).call(queryRec);
	}

	// Await the promise
	if (typeof (query as Promise<unknown>)?.then === "function") {
		return (await (query as Promise<unknown>)) as PostgrestResponse<Row>;
	}

	return query as PostgrestResponse<Row>;
}
