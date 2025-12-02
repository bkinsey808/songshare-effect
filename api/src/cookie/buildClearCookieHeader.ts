import buildSetCookieHeader from "@/api/cookie/buildSetCookieHeader";
import { type ReadonlyContext } from "@/api/hono/hono-context";

export default function buildClearCookieHeader(
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
