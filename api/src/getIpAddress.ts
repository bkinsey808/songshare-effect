import { type ReadonlyContext } from "@/api/hono/hono-context";

/**
 * Return the requestor's IP address.
 *
 * Prefers the Cloudflare `cf-connecting-ip` header, then the first entry of
 * `x-forwarded-for`. When no forwarding headers are present (e.g. local
 * development) the function returns `"127.0.0.1"`.
 *
 * @param ctx - Readonly Hono request context. Accepts a readonly wrapper so
 *   the function is compatible with both `Context` and `ReadonlyContext`.
 * @returns - The determined IP address as a string.
 */
export default function getIpAddress(ctx: ReadonlyContext): string {
	// headers.get can return string | null. Read each header explicitly
	// and prefer `cf-connecting-ip` when present. For `x-forwarded-for`
	// the header can contain a comma-separated list of IPs; take the
	// first non-empty entry.

	// `headers.get(...)` may return `string | null`, but some types can be
	// treated as unknown depending on lib/ambient types. Use an explicit
	// type guard so `@typescript-eslint/no-unsafe-assignment` is satisfied.
	// Use Hono's `ctx.req.header(name)` helper which is well-typed in project
	// code and returns `string | undefined`.
	const cfIpHeader = ctx.req.header("cf-connecting-ip");
	if (typeof cfIpHeader === "string" && cfIpHeader.trim() !== "") {
		return cfIpHeader.trim();
	}

	const xffHeader = ctx.req.header("x-forwarded-for");
	if (typeof xffHeader === "string" && xffHeader.trim() !== "") {
		const first = xffHeader
			.split(",")
			.map((segment: string) => segment.trim())
			.find((segment: string) => segment !== "");

		if (typeof first === "string" && first !== "") {
			return first;
		}
	}

	// If no IP is found (e.g. in local development), default to localhost.
	return "127.0.0.1";
}
