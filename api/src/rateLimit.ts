import type { ReadonlyContext } from "@/api/hono/hono-context";

// Minimal placeholder rate limiter. Returns true to allow the request.
export default async function rateLimit(
	// eslint-disable-next-line @typescript-eslint/prefer-readonly-parameter-types
	_ctx: ReadonlyContext,
	_key = "global",
): Promise<boolean> {
	// Real implementation should check IP/keys and throttle appropriately.
	return true;
}
