/**
 * Test helper that returns a `null` value while bypassing the
 * unicorn/no-null lint rule.
 *
 * Use when a test must supply explicit `null` (e.g. validating
 * rejection paths, Supabase nullable fields, or request === null checks).
 */

export default function makeNull(): null {
	/* oxlint-disable-next-line unicorn/no-null -- explicit null for tests */
	return null;
}
