import { type Context } from "hono";

import { buildSetCookieHeader } from "@/api/cookie/buildSetCookieHeader";

export function buildClearCookieHeader(ctx: Context, name: string): string {
	return buildSetCookieHeader(ctx, name, "", { maxAge: 0, httpOnly: true });
}
