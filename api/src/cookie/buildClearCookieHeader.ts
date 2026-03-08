import buildSetCookieHeader from "@/api/cookie/buildSetCookieHeader";
import type { ReadonlyContext } from "@/api/hono/ReadonlyContext.type";

/**
 * Build a Set-Cookie header value that clears (expires) the named cookie.
 *
 * @param ctx - Hono request context used to build cookie attributes
 * @param name - Cookie name to clear
 * @returns A Set-Cookie header string that expires the cookie
 */
export default function buildClearCookieHeader(ctx: ReadonlyContext, name: string): string {
	return buildSetCookieHeader({
		ctx,
		name,
		value: "",
		opts: { maxAge: 0, httpOnly: true },
	});
}
