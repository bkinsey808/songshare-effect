import type { ReadonlyContext } from "@/api/hono/ReadonlyContext.type";

import buildSetCookieHeader from "@/api/cookie/buildSetCookieHeader";

type BuildSessionCookieParams = Readonly<{
	ctx: ReadonlyContext;
	name: string;
	value: string;
	opts?: Readonly<{ maxAge?: number; httpOnly?: boolean }>;
}>;

/**
 * Build a session cookie header value using `buildSetCookieHeader`.
 *
 * @param params - Parameters with ctx/name/value and optional opts
 * @returns The Set-Cookie header value for the session cookie
 */
export default function buildSessionCookie({
	ctx,
	name,
	value,
	opts,
}: BuildSessionCookieParams): string {
	return buildSetCookieHeader({
		ctx,
		name,
		value,
		opts,
	});
}
