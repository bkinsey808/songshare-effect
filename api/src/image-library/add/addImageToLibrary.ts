import { Effect } from "effect";

import { type AuthenticationError, DatabaseError, ValidationError } from "@/api/api-errors";
import type { ReadonlyContext } from "@/api/hono/ReadonlyContext.type";
import getSupabaseServerClient from "@/api/supabase/getSupabaseServerClient";
import getVerifiedUserSession from "@/api/user-session/getVerifiedSession";
import extractErrorMessage from "@/shared/error-message/extractErrorMessage";

import extractAddImageRequest, { type AddImageRequest } from "./extractAddImageRequest";

type ImageLibraryRow = {
	user_id: string;
	image_id: string;
	image_owner_id: string;
	created_at: string;
};

/**
 * Server-side handler for adding an image to the current user's library.
 *
 * @param ctx - The readonly request context provided by the server.
 * @returns The inserted `image_library` row, or fails with a typed error.
 */
export default function addImageToLibrary(
	ctx: ReadonlyContext,
): Effect.Effect<ImageLibraryRow, ValidationError | DatabaseError | AuthenticationError> {
	return Effect.gen(function* addImageGen($) {
		const body: unknown = yield* $(
			Effect.tryPromise({
				try: async () => {
					const parsed: unknown = await ctx.req.json();
					return parsed;
				},
				catch: () => new ValidationError({ message: "Invalid JSON body" }),
			}),
		);

		let req: AddImageRequest = { image_id: "" };
		try {
			req = extractAddImageRequest(body);
		} catch (error) {
			return yield* $(
				Effect.fail(
					new ValidationError({ message: extractErrorMessage(error, "Invalid request") }),
				),
			);
		}

		const userSession = yield* $(getVerifiedUserSession(ctx));
		const userId = userSession.user.user_id;

		const client = getSupabaseServerClient(ctx.env.VITE_SUPABASE_URL, ctx.env.SUPABASE_SERVICE_KEY);

		// Fetch the image owner from image_public
		const imageResult = yield* $(
			Effect.tryPromise({
				try: () =>
					client.from("image_public").select("user_id").eq("image_id", req.image_id).single(),
				catch: (error) =>
					new DatabaseError({ message: extractErrorMessage(error, "Failed to fetch image") }),
			}),
		);

		if (imageResult.error || imageResult.data === null) {
			return yield* $(Effect.fail(new DatabaseError({ message: "Image not found" })));
		}

		const imageOwnerId: string = imageResult.data.user_id;

		// Insert into image_library
		const insertResult = yield* $(
			Effect.tryPromise({
				try: () =>
					client
						.from("image_library")
						.insert([
							{
								user_id: userId,
								image_id: req.image_id,
								image_owner_id: imageOwnerId,
							},
						])
						.select()
						.single(),
				catch: (error) =>
					new DatabaseError({
						message: extractErrorMessage(error, "Failed to add image to library"),
					}),
			}),
		);

		if (insertResult.error || insertResult.data === null) {
			return yield* $(
				Effect.fail(
					new DatabaseError({
						message: extractErrorMessage(
							insertResult.error ?? {},
							"Failed to add image to library",
						),
					}),
				),
			);
		}

		return insertResult.data as ImageLibraryRow;
	});
}
