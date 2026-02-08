/**
 * Test helper to return null while bypassing unicorn/no-null.
 *
 * Use this when an API explicitly requires null (e.g. DOM elements, Supabase nulls).
 */
export default function asNull(): null {
	/* eslint-disable-next-line unicorn/no-null -- explicit bypass for APIs requiring null */
	return null;
}
