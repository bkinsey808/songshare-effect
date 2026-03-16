import { createClient } from "@supabase/supabase-js";
import { Effect } from "effect";

import { DatabaseError, ValidationError, type AuthenticationError } from "@/api/api-errors";
import type { ReadonlyContext } from "@/api/hono/ReadonlyContext.type";
import getStorageAdapter from "@/api/storage/getStorageAdapter";
import getVerifiedUserSession from "@/api/user-session/getVerifiedSession";
import extractErrorMessage from "@/shared/error-message/extractErrorMessage";
import { type Database } from "@/shared/generated/supabaseTypes";

import extractImageDeleteRequest, { type ImageDeleteRequest } from "./extractImageDeleteRequest";

/**
 * Server-side handler for deleting an image.
 *
 * Verifies that the requesting user owns the image before deleting:
 * 1. Authenticate user
 * 2. Look up the image_public record; reject if not found or not owned by caller
 * 3. Delete the file from storage (Supabase Storage or R2)
 * 4. Delete the `image` record (cascades to `image_public` and `image_library`)
 *
 * @param ctx - The readonly request context provided by the server.
 * @returns `{ success: true }` on success, or fails with a typed error.
 */
export default function imageDelete(
	ctx: ReadonlyContext,
): Effect.Effect<{ success: boolean }, ValidationError | DatabaseError | AuthenticationError> {
	return Effect.gen(function* imageDeleteGen($) {
		// 1. Authenticate user
		const userSession = yield* $(getVerifiedUserSession(ctx));
		const userId = userSession.user.user_id;

		// 2. Parse and validate request body
		const body: unknown = yield* $(
			Effect.tryPromise({
				try: async () => {
					const parsed: unknown = await ctx.req.json();
					return parsed;
				},
				catch: () => new ValidationError({ message: "Invalid JSON body" }),
			}),
		);

		let req: ImageDeleteRequest = { image_id: "" };
		try {
			req = extractImageDeleteRequest(body);
		} catch (error: unknown) {
			return yield* $(
				Effect.fail(
					new ValidationError({ message: extractErrorMessage(error, "Invalid request") }),
				),
			);
		}

		const supabase = createClient<Database>(
			ctx.env.VITE_SUPABASE_URL,
			ctx.env.SUPABASE_SERVICE_KEY,
		);

		// 3. Fetch image_public to verify ownership and get R2 key
		const fetchResult = yield* $(
			Effect.tryPromise({
				try: () =>
					supabase
						.from("image_public")
						.select("r2_key, user_id")
						.eq("image_id", req.image_id)
						.single(),
				catch: (error) =>
					new DatabaseError({ message: extractErrorMessage(error, "Failed to fetch image") }),
			}),
		);

		if (fetchResult.error || fetchResult.data === null) {
			return yield* $(Effect.fail(new DatabaseError({ message: "Image not found" })));
		}

		if (fetchResult.data.user_id !== userId) {
			return yield* $(
				Effect.fail(
					new ValidationError({ message: "You do not have permission to delete this image" }),
				),
			);
		}

		const r2Key: string = fetchResult.data.r2_key;

		// 4. Delete from storage (best-effort; proceed even if delete fails)
		const storage = getStorageAdapter(ctx.env);
		yield* $(
			Effect.tryPromise({
				try: () => storage.remove(r2Key),
				catch: (error) =>
					new DatabaseError({
						message: extractErrorMessage(error, "Failed to delete from storage"),
					}),
			}).pipe(Effect.orElse(() => Effect.succeed(undefined))),
		);

		// 5. Delete from Supabase (cascades to image_public and image_library)
		const deleteResult = yield* $(
			Effect.tryPromise({
				try: () =>
					supabase.from("image").delete().eq("image_id", req.image_id).eq("user_id", userId),
				catch: (error) =>
					new DatabaseError({
						message: extractErrorMessage(error, "Failed to delete image record"),
					}),
			}),
		);

		if (deleteResult.error) {
			return yield* $(
				Effect.fail(
					new DatabaseError({
						message: extractErrorMessage(deleteResult.error, "Failed to delete image record"),
					}),
				),
			);
		}

		return { success: true };
	});
}
