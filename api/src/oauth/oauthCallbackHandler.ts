import { type Context } from "hono";

import { oauthCallbackFactory } from "./oauthCallbackFactory";
import type { Env } from "@/api/env";
import { handleHttpEndpoint } from "@/api/http-utils";

export default async function oauthCallbackHandler(
	ctx: Context<{ Bindings: Env }>,
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
		return new Response(
			JSON.stringify({ success: false, error: "Internal server error" }),
			{
				status: 500,
				headers: { "Content-Type": "application/json" },
			},
		);
	}
}
