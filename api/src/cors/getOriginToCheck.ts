import normalizeOrigin from "@/api/cors/normalizeOrigin";
import { type ReadonlyContext } from "@/api/hono/hono-context";

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
