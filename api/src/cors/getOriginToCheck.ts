import type { Context } from "hono";

import { normalizeOrigin } from "./normalizeOrigin";

export function getOriginToCheck(ctx: Context): string {
	const originHeader = ctx.req.header("Origin");
	const refererHeader = ctx.req.header("Referer");

	if (typeof originHeader === "string" && originHeader.length > 0) {
		return normalizeOrigin(originHeader);
	}

	if (typeof refererHeader === "string" && refererHeader.length > 0) {
		try {
			const parsed = new URL(refererHeader);
			return normalizeOrigin(parsed.origin);
		} catch {
			return "";
		}
	}

	return "";
}
