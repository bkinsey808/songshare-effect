import getErrorMessage from "@/api/getErrorMessage";
import { type ReadonlyContext } from "@/api/hono/hono-context";
import { getEnvString } from "@/shared/env/getEnv";

export default function createErrorResponse(
	ctx: ReadonlyContext,
	err: unknown,
): Response {
	try {
		// Read ENVIRONMENT via small helper and avoid call-site cast
		const env = getEnvString(ctx.env, "ENVIRONMENT");
		if (env !== "production") {
			const msg = err instanceof Error ? err.message : getErrorMessage(err);
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
			getErrorMessage(error),
		);
	}

	return Response.json(
		{ success: false, error: "Internal server error" },
		{ status: 500 },
	);
}
