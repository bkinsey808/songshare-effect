/**
 * Test helper that returns a `null` value while bypassing the
 * unicorn/no-null lint rule.
 *
 * This is useful when a test needs to supply an explicit `null` (for
 * example, when verifying behavior against an optional DOM element or a
 * Supabase nullable field). Placing it in a shared helper keeps clients
 * from repeating the eslint disable comment.
 */
export default function makeNull(): null {
	/* oxlint-disable-next-line unicorn/no-null -- explicit null value for tests */
	return null;
}
