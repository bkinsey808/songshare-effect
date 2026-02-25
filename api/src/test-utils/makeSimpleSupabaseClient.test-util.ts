import type { createClient } from "@supabase/supabase-js";

/**
 * Minimal fake client interfaces for tests that only call update/eq/select/single.
 * The generic type `T` represents the `data` field returned from `single()`.
 *
 * These helpers exist because many simple dev‑only endpoints only need to
 * exercise a single update query and copying the nested stub types across
 * tests leads to duplication.  Putting them here makes the pattern reusable
 * without dragging in the larger `makeSupabaseClient.mock` dependency.
 */

type FakeSingle<TData> = { single: () => Promise<{ data: TData; error: unknown }> };
type FakeSelect<TData> = { select: () => FakeSingle<TData> };
type FakeEq<TData> = { eq: (col: string, val: unknown) => FakeSelect<TData> };
type FakeUpdate<TData> = { update: (data: unknown) => FakeEq<TData> };
type FakeFrom<TData> = { from: (table: string) => FakeUpdate<TData> };

/**
 * Build a fake client whose `single()` call resolves with the provided result
 * or error.  The returned object is cast to the full Supabase client type so it
 * can be returned from `vi.mocked(createClient).mockReturnValue(...)` as usual.
 */
type SimpleClientOpts<TData> = {
	result?: TData;
	error?: unknown;
	/**
	 * when true, `single()` will reject instead of resolve; `result` and
	 * `error` are ignored.
	 */
	reject?: boolean;
};

export default function makeSimpleSupabaseClient<TData = unknown>(
	opts: SimpleClientOpts<TData> = {},
): ReturnType<typeof createClient> {
	const { result, error, reject } = opts;
	const shouldReject = reject === true;

	const fake: FakeFrom<TData> = {
		from: (_table: string): FakeUpdate<TData> => ({
			update: (_data: unknown): FakeEq<TData> => ({
				eq: (_col: string, _val: unknown): FakeSelect<TData> => ({
					select: (): FakeSingle<TData> => ({
						single: (): Promise<{ data: TData; error: unknown }> => {
							if (shouldReject) {
								const err = opts.error;
								return Promise.reject(err instanceof Error ? err : new Error(String(err)));
							}
							// eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
							return Promise.resolve({ data: result as TData, error });
						},
					}),
				}),
			}),
		}),
	};

	// narrow cast; fake object only implements small slice of client
	// eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
	return fake as unknown as ReturnType<typeof createClient>;
}
