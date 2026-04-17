import { Effect } from "effect";

import type { ReadonlyContext } from "@/api/hono/ReadonlyContext.type";
import { HTTP_INTERNAL } from "@/shared/constants/http";
import extractErrorMessage from "@/shared/error-message/extractErrorMessage";

import updateSongPublic from "./updateSongPublic";

/**
 * Dev-only handler to update `song_public` rows and trigger realtime events.
 * This endpoint is explicitly disallowed in production environments.
 *
 * @param ctx - Hono request context
 * @returns An Effect that resolves to a Response object
 */
export default function updateSongPublicHandler(
	ctx: ReadonlyContext,
): Effect.Effect<Response> {
	return Effect.gen(function* updateSongPublicGen() {
		// Safety: disallow in production
		if (ctx.env.ENVIRONMENT === "production") {
			return Response.json({ error: "Not allowed in production" }, { status: 403 });
		}
		const resp = yield* updateSongPublic(ctx);
		return resp;
	}).pipe(
		Effect.catchAll((error) => {
			console.error(
				"[dev:updateSongPublic] handler failed:",
				extractErrorMessage(error, "Unknown error"),
			);
			return Effect.succeed(
				Response.json({ error: "Internal error" }, { status: HTTP_INTERNAL }),
			);
		}),
	);
}
