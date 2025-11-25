import type { ReadonlyContext } from "@/api/hono/hono-context";

/**
 * Gets the IP address of the requestor.
 *
 * It checks for specific headers that are commonly used to identify the original IP address of a client.
 * This is especially important when the server is behind a proxy or a load balancer (like Cloudflare).
 *
 * 1. `cf-connecting-ip`: This header is specific to Cloudflare and is considered reliable as it's set by Cloudflare's proxy.
 * 2. `x-forwarded-for`: This is a standard header for identifying the originating IP address of a client connecting to a web server through an HTTP proxy or a load balancer.
 *
 * For local development (e.g., using the `pnpm preview` script), these headers won't exist. In that case, we default to `127.0.0.1` to ensure the application continues to work as expected.
 *
 * @param ctx The Hono context object.
 * @returns The determined IP address or a default for local development.
 */
// Accept a readonly context wrapper used across the project. This keeps
// the function compatible with both `Context` and `ReadonlyContext` call
// sites because a plain `Context` is structurally assignable to the
// readonly wrapper.
export function getIpAddress(ctx: ReadonlyContext): string {
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

		if (typeof first === "string" && first.length > 0) {
			return first;
		}
	}

	// If no IP is found (e.g. in local development), default to localhost.
	return "127.0.0.1";
}
