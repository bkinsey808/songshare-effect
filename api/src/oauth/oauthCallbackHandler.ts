import type { Env } from "@/api/env";
import type { ReadonlyContext } from "@/api/hono/hono-context";
import { handleHttpEndpoint } from "@/api/http/http-utils";
import { oauthCallbackFactory } from "@/api/oauth/oauthCallbackFactory";

// Keep exported wrapper typed as `Context` for Hono compatibility. The
// implementation below uses `ReadonlyContext` so helpers can declare
// read-only parameters without lint issues.
async function oauthCallbackHandlerReadonly(
	// eslint-disable-next-line @typescript-eslint/prefer-readonly-parameter-types
	ctx: ReadonlyContext<{ Bindings: Env }>,
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
					String(err),
				);
			}
		} catch (innerErr) {
			console.error(
				"[oauthCallbackHandler] Failed to log unhandled exception:",
				String(innerErr),
			);
		}
		return createErrorResponse(ctx as ReadonlyContext<{ Bindings: Env }>, err);
	}
}

function createErrorResponse(
	// eslint-disable-next-line @typescript-eslint/prefer-readonly-parameter-types
	ctx: ReadonlyContext<{ Bindings: Env }>,
	err: unknown,
): Response {
	try {
		const env = (ctx.env as unknown as Record<string, string | undefined>)
			.ENVIRONMENT;
		if (env !== "production") {
			const msg = err instanceof Error ? err.message : String(err);
			const stack = err instanceof Error ? err.stack : undefined;
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
			String(ex),
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
	// eslint-disable-next-line @typescript-eslint/prefer-readonly-parameter-types
	ctx: ReadonlyContext,
): Promise<Response> {
	// Adapter wrapper - convert to ReadonlyContext for the inner implementation
	return oauthCallbackHandlerReadonly(ctx);
}
