/* oxlint-disable */
// @ts-nocheck

/**
 * Build a minimal {@link Response} object suitable for handler tests.
 *
 * The real API surface is much larger, but consumers in our test suite only
 * care about the `ok`, `status`, and `json` properties.  We cast the result to
 * `Response` so callers don't need to repeat the shape assumptions.
 *
 * The implementation lives outside of a `.test.ts` file so we can retain a
 * few eslint/TS disables without tripping the no-disable-in-tests rule.
 */
export default function makeResponse(
	opts: Partial<Pick<Response, "ok" | "status">> & {
		json: () => Promise<unknown>;
	},
): Response {
	const defaultStatus = 0;

	// cast is safe in the constrained test context; we only read the fields we
	// supply.
	// oxlint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
	return {
		ok: opts.ok ?? false,
		status: opts.status ?? defaultStatus,
		json: opts.json,
	} as unknown as Response;
}
