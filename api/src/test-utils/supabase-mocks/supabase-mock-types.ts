export type MaybeSingleResult = Promise<{ data: unknown; error: unknown } | undefined>;
export type SingleResult = Promise<{ data: unknown; error: unknown }>;
export type MultiResult = Promise<{ data: unknown[] | null; error: unknown }>;
export type MultiMaybeResult = Promise<{ data: unknown[] | null | undefined; error: unknown }>;

export type SingleBuilder = { single: () => SingleResult };
export type MaybeSingleBuilder = { single: () => MaybeSingleResult };

/**
 * Type representing a Supabase row in tests, which permits `null` or `undefined`
 * for any property to match Supabase's behavior for nullable columns and
 * vitest's exactOptionalPropertyTypes configuration.
 */
export type MockRow<TRow> = {
	[TKey in keyof TRow]?: TRow[TKey] | null | undefined;
};
