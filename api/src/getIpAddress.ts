// src/features/server-utils/getIpAddress.ts
import { type Context } from "hono";

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
export function getIpAddress(ctx: Context): string {
	// headers.get can return string | null. Read each header explicitly
	// and prefer `cf-connecting-ip` when present. For `x-forwarded-for`
	// the header can contain a comma-separated list of IPs; take the
	// first non-empty entry.

	const cfIp = ctx.req.raw.headers.get("cf-connecting-ip");
	if (cfIp !== null && cfIp.trim() !== "") {
		return cfIp.trim();
	}

	const xff = ctx.req.raw.headers.get("x-forwarded-for");
	if (xff !== null && xff.trim() !== "") {
		const first = xff
			.split(",")
			.map((segment) => segment.trim())
			.find((segment) => segment !== "");

		if (typeof first === "string" && first.length > 0) {
			return first;
		}
	}

	// If no IP is found (e.g. in local development), default to localhost.
	return "127.0.0.1";
}
