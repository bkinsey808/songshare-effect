import { type ReadonlyContext } from "@/api/hono/hono-context";
import { getEnvString } from "@/shared/env/getEnv";
import extractErrorMessage from "@/shared/error-message/extractErrorMessage";

/**
 * Create a uniform 500 JSON error response for OAuth handlers.
 *
 * In non-production environments the response includes a `details` object
 * containing the error message to aid debugging. In production the response
 * intentionally exposes no internal details.
 *
 * @param ctx - Readonly request context used to read `ENVIRONMENT`.
 * @param err - The original error or value that triggered the failure.
 * @returns - A `Response` with a 500 status and a JSON error payload. In
 *   non-production the payload includes `details.message` for debugging.
 */
export default function createErrorResponse(ctx: ReadonlyContext, err: unknown): Response {
	try {
		// Read ENVIRONMENT via small helper and avoid call-site cast
		const env = getEnvString(ctx.env, "ENVIRONMENT");
		if (env !== "production") {
			const msg = err instanceof Error ? err.message : extractErrorMessage(err, "Unknown error");
			return Response.json(
				{
					success: false,
					error: "Internal server error",
					details: { message: msg },
				},
				{ status: 500 },
			);
		}
	} catch (error) {
		console.error(
			"[oauthCallbackHandler] Failed to generate debug response:",
			extractErrorMessage(error, "Unknown error"),
		);
	}

	return Response.json({ success: false, error: "Internal server error" }, { status: 500 });
}
