import getErrorMessage from "@/api/getErrorMessage";
import { type ReadonlyContext } from "@/api/hono/hono-context";
import { handleHttpEndpoint } from "@/api/http/http-utils";
import oauthCallbackFactory from "@/api/oauth-callback-factory/oauthCallbackFactory";
import createErrorResponse from "@/api/oauth/createErrorResponse";

// Keep exported wrapper typed as `Context` for Hono compatibility. The
// implementation below uses `ReadonlyContext` so helpers can declare
// read-only parameters without lint issues.
export default async function oauthCallbackHandler(ctx: ReadonlyContext): Promise<Response> {
	try {
		// Await the handler so we can catch any unexpected runtime rejections
		return await handleHttpEndpoint((context) => oauthCallbackFactory(context))(ctx);
	} catch (error) {
		try {
			if (error instanceof Error) {
				console.error("[oauthCallbackHandler] Unhandled exception:", error.stack ?? error.message);
			} else {
				console.error(
					"[oauthCallbackHandler] Unhandled exception (non-Error):",
					getErrorMessage(error),
				);
			}
			// oxlint-disable-next-line catch-error-name
		} catch (innerError) {
			console.error(
				"[oauthCallbackHandler] Failed to log unhandled exception:",
				getErrorMessage(innerError),
			);
		}
		return createErrorResponse(ctx, error);
	}
}
