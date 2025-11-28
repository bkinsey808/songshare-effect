import { getErrorMessage } from "@/api/getErrorMessage";
import { type ReadonlyContext } from "@/api/hono/hono-context";
import { handleHttpEndpoint } from "@/api/http/http-utils";
import { oauthCallbackFactory } from "@/api/oauth-callback-factory/oauthCallbackFactory";
import { getEnvString } from "@/shared/env/getEnv";

// Keep exported wrapper typed as `Context` for Hono compatibility. The
// implementation below uses `ReadonlyContext` so helpers can declare
// read-only parameters without lint issues.
async function oauthCallbackHandlerReadonly(
	ctx: ReadonlyContext,
): Promise<Response> {
	try {
		// Await the handler so we can catch any unexpected runtime rejections
		return await handleHttpEndpoint((context) => oauthCallbackFactory(context))(
			ctx,
		);
	} catch (err) {
		try {
			if (err instanceof Error) {
				console.error(
					"[oauthCallbackHandler] Unhandled exception:",
					err.stack ?? err.message,
				);
			} else {
				console.error(
					"[oauthCallbackHandler] Unhandled exception (non-Error):",
					getErrorMessage(err),
				);
			}
		} catch (innerErr) {
			console.error(
				"[oauthCallbackHandler] Failed to log unhandled exception:",
				getErrorMessage(innerErr),
			);
		}
		return createErrorResponse(ctx, err);
	}
}

function createErrorResponse(ctx: ReadonlyContext, err: unknown): Response {
	try {
		// Read ENVIRONMENT via small helper and avoid call-site cast
		const env = getEnvString(ctx.env, "ENVIRONMENT");
		if (env !== "production") {
			const msg = err instanceof Error ? err.message : getErrorMessage(err);
			return new Response(
				JSON.stringify({
					success: false,
					error: "Internal server error",
					details: { message: msg },
				}),
				{
					status: 500,
					headers: { "Content-Type": "application/json" },
				},
			);
		}
	} catch (ex) {
		console.error(
			"[oauthCallbackHandler] Failed to generate debug response:",
			getErrorMessage(ex),
		);
	}

	return new Response(
		JSON.stringify({ success: false, error: "Internal server error" }),
		{
			status: 500,
			headers: { "Content-Type": "application/json" },
		},
	);
}

export default async function oauthCallbackHandler(
	ctx: ReadonlyContext,
): Promise<Response> {
	// Adapter wrapper - convert to ReadonlyContext for the inner implementation
	return oauthCallbackHandlerReadonly(ctx);
}
