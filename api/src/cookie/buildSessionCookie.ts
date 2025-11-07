import { type Context } from "hono";

import { buildSetCookieHeader } from "@/api/cookie/buildSetCookieHeader";

export const buildSessionCookie = (
	ctx: Context,
	name: string,
	value: string,
	opts?: { maxAge?: number; httpOnly?: boolean },
): string => {
	return buildSetCookieHeader(ctx, name, value, opts);
};
