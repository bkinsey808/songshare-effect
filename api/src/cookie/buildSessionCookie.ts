import { buildSetCookieHeader } from "@/api/cookie/buildSetCookieHeader";
import { type ReadonlyContext } from "@/api/hono/hono-context";

type BuildSessionCookieParams = Readonly<{
	ctx: ReadonlyContext;
	name: string;
	value: string;
	opts?: Readonly<{ maxAge?: number; httpOnly?: boolean }>;
}>;

// eslint-disable-next-line @typescript-eslint/prefer-readonly-parameter-types
export const buildSessionCookie = ({
	ctx,
	name,
	value,
	opts,
}: BuildSessionCookieParams): string => {
	return buildSetCookieHeader({
		ctx,
		name,
		value,
		...(opts !== undefined && { opts }),
	});
};
