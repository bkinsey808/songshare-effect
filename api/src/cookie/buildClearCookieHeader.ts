import { buildSetCookieHeader } from "@/api/cookie/buildSetCookieHeader";
import { type ReadonlyContext } from "@/api/hono/hono-context";

export function buildClearCookieHeader(
	// eslint-disable-next-line @typescript-eslint/prefer-readonly-parameter-types
	ctx: ReadonlyContext,
	name: string,
): string {
	return buildSetCookieHeader({
		ctx,
		name,
		value: "",
		opts: { maxAge: 0, httpOnly: true },
	});
}
