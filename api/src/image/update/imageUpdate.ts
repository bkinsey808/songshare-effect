import { createClient } from "@supabase/supabase-js";
import { Effect } from "effect";

import type { ReadonlyContext } from "@/api/hono/ReadonlyContext.type";
import extractErrorMessage from "@/shared/error-message/extractErrorMessage";
import { type Database } from "@/shared/generated/supabaseTypes";

import { type AuthenticationError, DatabaseError, ValidationError } from "@/api/api-errors";
import getVerifiedUserSession from "@/api/user-session/getVerifiedSession";

type ImageUpdateRequest = {
	image_id: string;
	image_name: string;
	description: string;
	alt_text: string;
};

/**
 * Extract and validate the update request from raw JSON.
 *
 * @param request - Raw parsed JSON body.
 * @returns - Validated `ImageUpdateRequest`.
 * @throws - `TypeError` when required fields are missing or invalid.
 */
function extractImageUpdateRequest(request: unknown): ImageUpdateRequest {
	if (typeof request !== "object" || request === null) {
		throw new TypeError("Request must be a valid object");
	}
	if (!("image_id" in request)) {
		throw new TypeError("image_id must be a non-empty string");
	}
	if (!("image_name" in request)) {
		throw new TypeError("image_name must be a string");
	}
	if (!("description" in request)) {
		throw new TypeError("description must be a string");
	}
	if (!("alt_text" in request)) {
		throw new TypeError("alt_text must be a string");
	}
	const { image_id, image_name, description, alt_text } = request;
	if (typeof image_id !== "string" || image_id.trim() === "") {
		throw new TypeError("image_id must be a non-empty string");
	}
	if (typeof image_name !== "string") {
		throw new TypeError("image_name must be a string");
	}
	if (typeof description !== "string") {
		throw new TypeError("description must be a string");
	}
	if (typeof alt_text !== "string") {
		throw new TypeError("alt_text must be a string");
	}
	return {
		image_id: image_id.trim(),
		image_name: image_name.trim(),
		description: description.trim(),
		alt_text: alt_text.trim(),
	};
}

/**
 * Server-side handler for updating image metadata.
 *
 * Updates `image_name`, `description`, and `alt_text` for an image the
 * requesting user owns. Returns the updated `image_public` row on success.
 *
 * 1. Authenticate user
 * 2. Parse and validate request body
 * 3. Verify ownership via `image_public`
 * 4. Update the `image` table row
 * 5. Fetch and return the refreshed `image_public` row
 *
 * @param ctx - The readonly request context provided by the server.
 * @returns The updated `image_public` row, or fails with a typed error.
 */
export default function imageUpdate(
	ctx: ReadonlyContext,
): Effect.Effect<
	Record<string, unknown>,
	ValidationError | DatabaseError | AuthenticationError
> {
	return Effect.gen(function* imageUpdateGen($) {
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

		let req: ImageUpdateRequest = {
			image_id: "",
			image_name: "",
			description: "",
			alt_text: "",
		};
		try {
			req = extractImageUpdateRequest(body);
		} catch (error: unknown) {
			return yield* $(
				Effect.fail(new ValidationError({ message: extractErrorMessage(error, "Invalid request") })),
			);
		}

		const supabase = createClient<Database>(
			ctx.env.VITE_SUPABASE_URL,
			ctx.env.SUPABASE_SERVICE_KEY,
		);

		// 3. Verify ownership
		const ownershipResult = yield* $(
			Effect.tryPromise({
				try: () =>
					supabase
						.from("image_public")
						.select("user_id")
						.eq("image_id", req.image_id)
						.single(),
				catch: (error) =>
					new DatabaseError({ message: extractErrorMessage(error, "Failed to fetch image") }),
			}),
		);

		if (ownershipResult.error || ownershipResult.data === null) {
			return yield* $(Effect.fail(new DatabaseError({ message: "Image not found" })));
		}

		if (ownershipResult.data.user_id !== userId) {
			return yield* $(
				Effect.fail(
					new ValidationError({ message: "You do not have permission to edit this image" }),
				),
			);
		}

		// 4. Update the image record
		const updateResult = yield* $(
			Effect.tryPromise({
				try: () =>
					supabase
						.from("image_public")
						.update({
							image_name: req.image_name,
							description: req.description,
							alt_text: req.alt_text,
						})
						.eq("image_id", req.image_id)
						.eq("user_id", userId),
				catch: (error) =>
					new DatabaseError({ message: extractErrorMessage(error, "Failed to update image") }),
			}),
		);

		if (updateResult.error) {
			return yield* $(
				Effect.fail(
					new DatabaseError({
						message: extractErrorMessage(updateResult.error, "Failed to update image"),
					}),
				),
			);
		}

		// 5. Fetch and return the refreshed image_public row
		const fetchResult = yield* $(
			Effect.tryPromise({
				try: () =>
					supabase
						.from("image_public")
						.select("*")
						.eq("image_id", req.image_id)
						.single(),
				catch: (error) =>
					new DatabaseError({ message: extractErrorMessage(error, "Failed to fetch updated image") }),
			}),
		);

		if (fetchResult.error || fetchResult.data === null) {
			return yield* $(Effect.fail(new DatabaseError({ message: "Image not found after update" })));
		}

		return fetchResult.data as Record<string, unknown>;
	});
}
