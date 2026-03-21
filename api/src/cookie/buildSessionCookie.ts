import buildSetCookieHeader from "@/api/cookie/buildSetCookieHeader";
import type { ReadonlyContext } from "@/api/hono/ReadonlyContext.type";

type BuildSessionCookieParams = Readonly<{
	ctx: ReadonlyContext;
	name: string;
	value: string;
	opts?: Readonly<{ maxAge?: number; httpOnly?: boolean }>;
}>;

/**
 * Build a session cookie header value using `buildSetCookieHeader`.
 *
 * @param ctx - The request context.
 * @param name - The cookie name.
 * @param value - The cookie value.
 * @param opts - The cookie options.
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
