import { type Context } from "hono";

import { buildSetCookieHeader } from "@/api/cookie/buildSetCookieHeader";

export const buildSessionCookie = ({
	ctx,
	name,
	value,
	opts,
}: Readonly<{
	ctx: Context;
	name: string;
	value: string;
	opts?: Readonly<{ maxAge?: number; httpOnly?: boolean }>;
}>): string => {
	return buildSetCookieHeader({
		ctx,
		name,
		value,
		...(opts !== undefined && { opts }),
	});
};
