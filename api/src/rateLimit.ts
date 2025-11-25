import type { ReadonlyContext } from "@/api/hono/hono-context";

// Minimal placeholder rate limiter. Returns true to allow the request.
export default async function rateLimit(
	_ctx: ReadonlyContext,
	_key = "global",
): Promise<boolean> {
	// Real implementation should check IP/keys and throttle appropriately.
	// This placeholder currently resolves immediately to `true`. We keep
	// `async` and `await` here so ESLint's rules about async/await and
	// promise-returning functions are satisfied while still providing a
	// stable Promise<boolean> API for callers.
	await Promise.resolve();
	return true;
}
