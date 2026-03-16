/**
 * Returns null for testing type guards that explicitly check for null.
 * Disable is required: unicorn/no-null forbids null literals; no alternative for testing guards.
 */
export default function getNull(): null {
	// oxlint-disable-next-line unicorn/no-null -- required for type-guard tests
	return null;
}
