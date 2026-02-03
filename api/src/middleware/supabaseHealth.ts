import type { ReadonlyContext } from "@/api/hono/hono-context";

import extractErrorMessage from "@/shared/error-message/extractErrorMessage";

const STARTUP_SUPABASE_TIMEOUT_MS = 3000;
const SUPABASE_ACCEPTABLE_404 = 404;

declare global {
	// Declare the specific global variable we use for a one-time health check.
	var __songshare_supabase_health_checked: boolean | undefined;
}

/**
 * Returns whether the Supabase startup health check has already run.
 *
 * @returns - true if the one-time startup health check has already run, false
 *   otherwise.
 */
function isSupabaseHealthChecked(): boolean {
	return Boolean(globalThis.__songshare_supabase_health_checked === true);
}

/**
 * Marks that the Supabase startup health check has been completed so it does
 * not run again for the lifetime of the process.
 *
 * @returns - nothing.
 */
function markSupabaseHealthChecked(): void {
	globalThis.__songshare_supabase_health_checked = true;
}

/**
 * Perform a one-off health check against the Supabase host by sending a
 * HEAD request to the configured Supabase origin with a short timeout.
 *
 * @param url - The VITE_SUPABASE_URL value to parse and use for the health
 *   check.
 * @returns - Resolves when the check completes (no value returned).
 */
async function runSupabaseHealthCheck(url: string): Promise<void> {
	try {
		const parsed = new URL(url);
		const controller = new AbortController();
		const timeout = setTimeout(() => {
			controller.abort();
		}, STARTUP_SUPABASE_TIMEOUT_MS);
		try {
			const res = await fetch(parsed.origin, {
				method: "HEAD",
				signal: controller.signal,
			});
			if (!res.ok && res.status !== SUPABASE_ACCEPTABLE_404) {
				console.warn("[startup-check] Supabase host responded with status:", res.status);
			}
		} catch (error) {
			console.warn(
				"[startup-check] Failed to contact Supabase host; check VITE_SUPABASE_URL and network/DNS:",
				extractErrorMessage(error, "Unknown error"),
			);
		} finally {
			clearTimeout(timeout);
		}
	} catch (error) {
		console.warn(
			"[startup-check] Supabase URL parse failed:",
			extractErrorMessage(error, "Unknown error"),
		);
	}
}

/**
 * One-time startup health check middleware for Supabase host. Runs on the
 * first incoming request (dev-friendly) and logs a clear warning if the
 * configured `VITE_SUPABASE_URL` cannot be contacted.
 *
 * @param ctx - Hono request context providing `env` for configuration.
 * @param next - The next middleware/handler to invoke.
 * @returns - Resolves when middleware completes.
 */
export default async function supabaseHealthMiddleware(
	ctx: ReadonlyContext,
	next: () => Promise<unknown>,
): Promise<unknown> {
	if (isSupabaseHealthChecked()) {
		await next();
		return undefined;
	}

	markSupabaseHealthChecked();
	const url = (ctx.env.VITE_SUPABASE_URL as string | undefined) ?? "";
	if (!url) {
		console.warn("[startup-check] VITE_SUPABASE_URL is not configured");
		await next();
		return undefined;
	}

	await runSupabaseHealthCheck(url);

	await next();
	return undefined;
}
