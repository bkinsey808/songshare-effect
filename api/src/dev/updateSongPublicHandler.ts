import { Effect } from "effect";

import type { ReadonlyContext } from "@/api/hono/hono-context";

import { HTTP_INTERNAL } from "@/shared/constants/http";
import extractErrorMessage from "@/shared/error-message/extractErrorMessage";

import updateSongPublic from "./updateSongPublic";

/**
 * Dev-only handler to update `song_public` rows and trigger realtime events.
 * This endpoint is explicitly disallowed in production environments.
 *
 * @param ctx - Hono request context
 * @returns A Response object
 */
export default async function updateSongPublicHandler(ctx: ReadonlyContext): Promise<Response> {
	// Safety: disallow in production
	if (ctx.env.ENVIRONMENT === "production") {
		return Response.json({ error: "Not allowed in production" }, { status: 403 });
	}
	try {
		const resp = await Effect.runPromise(updateSongPublic(ctx));
		return resp;
	} catch (error) {
		console.error(
			"[dev:updateSongPublic] handler failed:",
			extractErrorMessage(error, "Unknown error"),
		);
		return Response.json({ error: "Internal error" }, { status: HTTP_INTERNAL });
	}
}
