import { Effect } from "effect";

import { type ReadonlyContext } from "@/api/hono/hono-context";
import getSupabaseServerClient from "@/api/supabase/getSupabaseServerClient";
import extractErrorMessage from "@/shared/error-message/extractErrorMessage";

import { type AuthenticationError, DatabaseError, ValidationError } from "../errors";
import getVerifiedUserSession from "../user-session/getVerifiedSession";

type RemoveUserRequest = {
	followed_user_id: string;
};

/**
 * Extract request data with validation
 */
function extractRemoveUserRequest(request: unknown): RemoveUserRequest {
	if (typeof request !== "object" || request === null) {
		throw new TypeError("Request must be a valid object");
	}

	if (!("followed_user_id" in request)) {
		throw new TypeError("Request must contain followed_user_id");
	}

	const { followed_user_id } = request as Record<string, unknown>;

	if (typeof followed_user_id !== "string") {
		throw new TypeError("followed_user_id must be a string");
	}

	return { followed_user_id };
}

/**
 * Server-side handler for removing a user from the current user's library.
 *
 * This Effect-based handler:
 * - validates the incoming request
 * - verifies user authentication
 * - deletes the entry from user_library using service key (bypass RLS)
 *
 * @param ctx - The readonly request context provided by the server
 * @returns Success indicator, or fails with an error
 */
export default function removeUserFromLibraryHandler(
	ctx: ReadonlyContext,
): Effect.Effect<{ success: boolean }, ValidationError | DatabaseError | AuthenticationError> {
	return Effect.gen(function* removeUserFromLibraryGen($) {
		const requestBody: unknown = yield* $(
			Effect.tryPromise({
				try: async () => {
					const parsed: unknown = await ctx.req.json();
					return parsed;
				},
				catch: () => new ValidationError({ message: "Invalid JSON body" }),
			}),
		);

		// Validate request structure
		let req: RemoveUserRequest = { followed_user_id: "" };
		try {
			req = extractRemoveUserRequest(requestBody);
		} catch (error) {
			return yield* $(
				Effect.fail(
					new ValidationError({
						message: extractErrorMessage(error, "Invalid request"),
					}),
				),
			);
		}

		// Authenticate user
		const userSession = yield* $(getVerifiedUserSession(ctx));
		const userId = userSession.user.user_id;

		// Get Supabase admin client (service key - allows bypassing RLS)
		const client = getSupabaseServerClient(ctx.env.VITE_SUPABASE_URL, ctx.env.SUPABASE_SERVICE_KEY);

		// Delete from user_library using service key
		const deleteResult = yield* $(
			Effect.tryPromise({
				try: () =>
					client
						.from("user_library")
						.delete()
						.eq("user_id", userId)
						.eq("followed_user_id", req.followed_user_id),
				catch: (error) =>
					new DatabaseError({
						message: extractErrorMessage(error, "Failed to remove user from library"),
					}),
			}),
		);

		if (deleteResult.error !== null) {
			return yield* $(
				Effect.fail(
					new DatabaseError({
						message: extractErrorMessage(deleteResult.error, "Unknown error"),
					}),
				),
			);
		}

		return { success: true };
	});
}
