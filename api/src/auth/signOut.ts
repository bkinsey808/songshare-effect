import type { ReadonlyContext } from "@/api/hono/ReadonlyContext.type";

import buildClearCookieHeader from "@/api/cookie/buildClearCookieHeader";
import { userSessionCookieName } from "@/api/cookie/cookie";
import verifySameOriginOrThrow from "@/api/csrf/verifySameOriginOrThrow";
import { HTTP_INTERNAL } from "@/shared/constants/http";
import extractErrorMessage from "@/shared/error-message/extractErrorMessage";

/**
 * Sign-out handler: clears the user session cookie and returns success.
 *
 * @param ctx - Hono request context used to perform CSRF
 *   validation and to modify the outgoing response headers (e.g., clearing
 *   the user session cookie).
 * @returns - a JSON HTTP response with `{ success: true }` on
 *   success, or a JSON error response with HTTP 500 on failure.
 */
export default function signOutHandler(ctx: ReadonlyContext): Response {
	try {
		// CSRF check: ensure sign-out requests originate from an allowed origin
		verifySameOriginOrThrow(ctx);
		// Clear the userSession cookie by setting an expired cookie on the response
		// Use the cookie helper so attributes (SameSite/Secure/Domain) match how
		// the cookie was originally set in the OAuth callback.
		const cookieValue = buildClearCookieHeader(ctx, userSessionCookieName);
		ctx.res.headers.append("Set-Cookie", cookieValue);
		return ctx.json({ success: true });
	} catch (error) {
		console.error("Failed to sign out", extractErrorMessage(error, "Unknown error"));
		return Response.json(
			{ error: "failed" },
			{
				status: HTTP_INTERNAL,
				headers: { "Content-Type": "application/json" },
			},
		);
	}
}
