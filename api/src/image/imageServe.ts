import { createClient } from "@supabase/supabase-js";
import type { Context } from "hono";

import {
	HTTP_BAD_REQUEST,
	HTTP_INTERNAL,
	HTTP_NOT_FOUND,
	HTTP_TEMP_REDIRECT,
} from "@/shared/constants/http";

import type { Bindings } from "../env";

/** Supabase Storage bucket name for images */
const IMAGES_BUCKET = "images";

/** Prefix stripped from storage keys to get the path within the Supabase bucket */
const IMAGES_KEY_PREFIX = "images/";

/** Storage backend value that selects Cloudflare R2 */
const R2_BACKEND = "r2";

/**
 * Serve an image from storage.
 *
 * - **Supabase Storage (default):** Issues a 302 redirect to the Supabase
 *   public CDN URL so the client fetches the file directly without proxying.
 * - **R2 (`STORAGE_BACKEND = "r2"`):** Streams the file directly from R2.
 *
 * The image key is taken from the wildcard URL path after the base path.
 * Returns 404 when the key is not found and 400 when no key is provided.
 *
 * Note: This endpoint intentionally uses the raw Hono handler signature
 * (not Effect-based) because it streams binary data rather than returning JSON.
 *
 * @param ctx - The Hono request context with R2 Bindings.
 * @returns - An HTTP response containing or redirecting to the image.
 */
export default async function imageServe(ctx: Context<{ Bindings: Bindings }>): Promise<Response> {
	const imageKey = ctx.req.param("*");
	if (typeof imageKey !== "string" || imageKey.trim() === "") {
		return ctx.json({ error: "image_key is required" }, HTTP_BAD_REQUEST);
	}

	// Supabase Storage: redirect to the public CDN URL (no R2 binding needed)
	if (ctx.env.STORAGE_BACKEND !== R2_BACKEND) {
		const supabase = createClient(ctx.env.VITE_SUPABASE_URL, ctx.env.SUPABASE_SERVICE_KEY);
		const path = imageKey.startsWith(IMAGES_KEY_PREFIX)
			? imageKey.slice(IMAGES_KEY_PREFIX.length)
			: imageKey;
		const { data } = supabase.storage.from(IMAGES_BUCKET).getPublicUrl(path);
		return Response.redirect(data.publicUrl, HTTP_TEMP_REDIRECT);
	}

	// R2: stream file directly
	if (ctx.env.BUCKET === undefined) {
		return ctx.json({ error: "Storage not configured: BUCKET binding is missing" }, HTTP_INTERNAL);
	}

	const object = await ctx.env.BUCKET.get(imageKey);
	if (object === null) {
		return ctx.json({ error: "Image not found" }, HTTP_NOT_FOUND);
	}

	const headers = new Headers();
	object.writeHttpMetadata(headers);
	headers.set("etag", object.httpEtag);
	headers.set("cache-control", "public, max-age=31536000, immutable");

	return new Response(object.body, { headers });
}
