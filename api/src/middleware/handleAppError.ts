import { HTTP_INTERNAL } from "@/shared/constants/http";
import extractErrorMessage from "@/shared/error-message/extractErrorMessage";

/**
 * Global error handler: catch any uncaught exceptions in route handlers
 * and log them to Cloudflare Logs so we can diagnose production failures.
 *
 * @param err - The error thrown by route handlers (may be any value).
 * @param _ctx - Hono request context (not used directly here).
 * @returns - A JSON HTTP response with a generic 500 error message.
 */
export default function handleAppError(err: unknown, _ctx: unknown): Response {
	try {
		if (err instanceof Error) {
			console.error("[app.onError] Unhandled exception:", err.stack ?? err.message);
		} else {
			console.error(
				"[app.onError] Unhandled exception (non-Error):",
				extractErrorMessage(err, "Unknown error"),
			);
		}
	} catch (error) {
		console.error(
			"[app.onError] Failed to log error:",
			extractErrorMessage(error, "Unknown error"),
		);
	}

	// Return a generic 500 response without leaking internals to clients
	return Response.json(
		{ success: false, error: "Internal server error" },
		{
			status: HTTP_INTERNAL,
			headers: { "Content-Type": "application/json" },
		},
	);
}
