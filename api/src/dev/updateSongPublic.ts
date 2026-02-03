import { createClient } from "@supabase/supabase-js";
import { Effect } from "effect";

import { type ReadonlyContext } from "@/api/hono/hono-context";
import { HTTP_BAD_REQUEST, HTTP_FORBIDDEN, HTTP_INTERNAL } from "@/shared/constants/http";
import extractErrorMessage from "@/shared/error-message/extractErrorMessage";
import { type Database } from "@/shared/generated/supabaseTypes";

/**
 * Dev-only handler to update a `song_public` row by `song_id`.
 *
 * Intended for local development only; this endpoint is explicitly blocked
 * in production (`ENVIRONMENT === "production"`) to prevent accidental
 * use. The expected JSON body shape is:
 *
 *   { song_id: string, song_name?: string, song_slug?: string }
 *
 * On success the handler returns a JSON `Response` with `{ success: true, data }`.
 * It returns a `403` when disabled in production, `400` for invalid payloads,
 * and `500` for internal or database errors.
 *
 * @param ctx - Readonly request context providing environment variables and request body.
 * @returns - An Effect that resolves to a `Response` representing the operation result.
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
					catch: (error) => new Error(extractErrorMessage(error, "Unknown error")),
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
			console.error("[dev:updateSongPublic] failed:", extractErrorMessage(error, "Unknown error"));
			return Response.json({ error: "Internal error" }, { status: HTTP_INTERNAL });
		}
	});
}
