import { createClient } from "@supabase/supabase-js";
import { Effect } from "effect";

import getErrorMessage from "@/api/getErrorMessage";
import { type ReadonlyContext } from "@/api/hono/hono-context";
import { HTTP_BAD_REQUEST, HTTP_FORBIDDEN, HTTP_INTERNAL } from "@/shared/constants/http";
import { type Database } from "@/shared/generated/supabaseTypes";

/**
 * Dev-only handler to update a `song_public` row by song_id. This allows
 * triggering realtime events from the browser during local development.
 *
 * Body: { song_id: string, song_name?: string, song_slug?: string }
 */
export default function updateSongPublic(ctx: ReadonlyContext): Effect.Effect<Response, Error> {
	return Effect.gen(function* updateSongPublicGen($) {
		// Disallow in production
		if (ctx.env.ENVIRONMENT === "production") {
			return Response.json({ error: "Not allowed in production" }, { status: HTTP_FORBIDDEN });
		}

		// Parse body
		const body: unknown = yield* $(
			Effect.tryPromise({
				try: () => ctx.req.json(),
				catch: () => new Error("Invalid JSON body"),
			}),
		);

		if (typeof body !== "object" || body === null) {
			return Response.json({ error: "Invalid body" }, { status: HTTP_BAD_REQUEST });
		}

		// Extract fields safely without unsafe assertions
		const maybeId =
			typeof body === "object" && body !== null && "song_id" in body
				? (body as Record<string, unknown>)["song_id"]
				: undefined;
		let songId: string | undefined = undefined;
		if (typeof maybeId === "string" && maybeId !== "") {
			songId = maybeId;
		}
		if (songId === undefined) {
			return Response.json({ error: "Missing song_id" }, { status: HTTP_BAD_REQUEST });
		}
		const maybeName =
			typeof body === "object" && body !== null && "song_name" in body
				? (body as Record<string, unknown>)["song_name"]
				: undefined;
		let songName: string | undefined = undefined;
		if (typeof maybeName === "string") {
			songName = maybeName;
		}
		const maybeSlug =
			typeof body === "object" && body !== null && "song_slug" in body
				? (body as Record<string, unknown>)["song_slug"]
				: undefined;
		let songSlug: string | undefined = undefined;
		if (typeof maybeSlug === "string") {
			songSlug = maybeSlug;
		}

		const updatePayload: { song_name?: string; song_slug?: string } = {};
		if (songName !== undefined) {
			updatePayload.song_name = songName;
		}
		if (songSlug !== undefined) {
			updatePayload.song_slug = songSlug;
		}

		const supabase = createClient<Database>(
			ctx.env.VITE_SUPABASE_URL,
			ctx.env.SUPABASE_SERVICE_KEY,
		);

		try {
			const updateRes = yield* $(
				Effect.tryPromise({
					try: () =>
						supabase
							.from("song_public")
							.update(updatePayload)
							.eq("song_id", songId)
							.select()
							.single(),
					catch: (error) => new Error(getErrorMessage(error)),
				}),
			);

			if (updateRes.error) {
				return Response.json(
					{ error: updateRes.error.message ?? "DB update failed" },
					{ status: HTTP_INTERNAL },
				);
			}

			return Response.json({ success: true, data: updateRes.data });
		} catch (error) {
			console.error("[dev:updateSongPublic] failed:", getErrorMessage(error));
			return Response.json({ error: "Internal error" }, { status: HTTP_INTERNAL });
		}
	});
}
