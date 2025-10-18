import type { Context } from "hono";

// Minimal placeholder rate limiter. Returns true to allow the request.
export default async function rateLimit(
	_ctx: Context,
	_key = "global",
): Promise<boolean> {
	// Real implementation should check IP/keys and throttle appropriately.
	return true;
}
