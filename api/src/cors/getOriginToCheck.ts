import normalizeOrigin from "@/api/cors/normalizeOrigin";
import { type ReadonlyContext } from "@/api/hono/hono-context";

/**
 * Determine the origin to check for CORS from the request.
 *
 * Prefers the `Origin` request header. If absent, attempts to derive an
 * origin from the `Referer` header by parsing the URL. Returns a normalized
 * origin string or an empty string when no valid origin can be determined.
 *
 * @param ctx - Readonly Hono request context (provides request headers).
 * @returns - Normalized origin string, or an empty string when unavailable.
 */
export default function getOriginToCheck(ctx: ReadonlyContext): string {
	const originHeader = ctx.req.header("Origin");
	const refererHeader = ctx.req.header("Referer");
	const ZERO = 0;

	if (typeof originHeader === "string" && originHeader.length > ZERO) {
		return normalizeOrigin(originHeader);
	}

	if (typeof refererHeader === "string" && refererHeader.length > ZERO) {
		try {
			const parsed = new URL(refererHeader);
			return normalizeOrigin(parsed.origin);
		} catch {
			return "";
		}
	}

	return "";
}
