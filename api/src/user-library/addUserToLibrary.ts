import { type PostgrestSingleResponse, type SupabaseClient } from "@supabase/supabase-js";
import { Effect } from "effect";

import { type ReadonlyContext } from "@/api/hono/hono-context";
import getSupabaseServerClient from "@/api/supabase/getSupabaseServerClient";
import extractErrorMessage from "@/shared/error-message/extractErrorMessage";
import { type UserLibrary } from "@/shared/generated/supabaseSchemas";
import { type Database } from "@/shared/generated/supabaseTypes";

import { type AuthenticationError, DatabaseError, ValidationError } from "../errors";
import getVerifiedUserSession from "../user-session/getVerifiedSession";

type AddUserRequest = {
	followed_user_id: string;
};

type UserLibraryRow = Database["public"]["Tables"]["user_library"]["Row"];

/**
 * Extract request data with validation
 */
function extractAddUserRequest(request: unknown): AddUserRequest {
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
 * Perform the Supabase insert for user_library.
 *
 * @param client - Supabase client typed with Database
 * @param userId - User ID to insert
 * @param req - Request containing followed_user_id
 * @returns Insert result or error
 */
function performInsert(
	client: SupabaseClient<Database>,
	userId: string,
	req: AddUserRequest,
): Effect.Effect<PostgrestSingleResponse<UserLibraryRow>, DatabaseError> {
	return Effect.tryPromise({
		try: () =>
			client
				.from("user_library")
				.insert([
					{
						user_id: userId,
						followed_user_id: req.followed_user_id,
					},
				])
				.select()
				.single(),
		catch: (error) =>
			new DatabaseError({
				message: extractErrorMessage(error, "Failed to add user to library"),
			}),
	});
}

/**
 * Server-side handler for adding a user to the current user's library.
 *
 * This Effect-based handler:
 * - validates the incoming request
 * - verifies user authentication
 * - inserts the entry into user_library using service key (bypass RLS for trusted operation)
 *
 * @param ctx - The readonly request context provided by the server
 * @returns The inserted user library entry, or fails with an error
 */
export default function addUserToLibraryHandler(
	ctx: ReadonlyContext,
): Effect.Effect<UserLibrary, ValidationError | DatabaseError | AuthenticationError> {
	return Effect.gen(function* addUserToLibraryGen($) {
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
		let req: AddUserRequest = { followed_user_id: "" };
		try {
			req = extractAddUserRequest(requestBody);
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

		// Insert into user_library using service key
		const insertResult = yield* $(performInsert(client, userId, req));

		const { data, error: insertError } = insertResult;

		if (insertError !== null) {
			return yield* $(
				Effect.fail(
					new DatabaseError({
						message: extractErrorMessage(insertError, "Unknown error"),
					}),
				),
			);
		}

		if (data === null) {
			return yield* $(Effect.fail(new DatabaseError({ message: "No data returned from insert" })));
		}

		const libraryEntry: UserLibrary = {
			created_at: data.created_at,
			followed_user_id: data.followed_user_id,
			user_id: data.user_id,
		};

		return libraryEntry;
	});
}
