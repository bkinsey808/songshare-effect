import { Effect } from "effect";

import type { ReadonlyContext } from "@/api/hono/ReadonlyContext.type";
import getSupabaseServerClient from "@/api/supabase/getSupabaseServerClient";
import extractErrorMessage from "@/shared/error-message/extractErrorMessage";
import { type UserLibrary } from "@/shared/generated/supabaseSchemas";

import { type AuthenticationError, DatabaseError, ValidationError } from "../api-errors";
import getVerifiedUserSession from "../user-session/getVerifiedSession";
import extractAddUserRequest from "./extractAddUserRequest";
import performUserLibraryInsert from "./performUserLibraryInsert";

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
		let req = { followed_user_id: "" };
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
		const insertResult = yield* $(performUserLibraryInsert(client, userId, req));

		const { data, error: insertError } = insertResult;

		if (insertError !== undefined && insertError !== null) {
			const errorMsg = extractErrorMessage(insertError, "Unknown error");
			// Duplicate key = already in library; treat as idempotent success
			const isDuplicate = typeof errorMsg === "string" && errorMsg.includes("user_library_pkey");
			if (isDuplicate) {
				const fetchEffect = Effect.tryPromise({
					try: () =>
						client
							.from("user_library")
							.select("*")
							.eq("user_id", userId)
							.eq("followed_user_id", req.followed_user_id)
							.single(),
					catch: () =>
						new DatabaseError({
							message: "Failed to fetch existing library entry",
						}),
				});
				const existingResult = yield* $(
					fetchEffect.pipe(
						Effect.map((res) => res.data),
						Effect.catchAll(() => Effect.succeed(undefined)),
					),
				);
				if (existingResult !== undefined && existingResult !== null) {
					return {
						created_at: existingResult.created_at,
						followed_user_id: existingResult.followed_user_id,
						user_id: existingResult.user_id,
					};
				}
				// Fetch failed; return synthetic success so client does not show error
				return {
					created_at: new Date().toISOString(),
					followed_user_id: req.followed_user_id,
					user_id: userId,
				};
			}
			return yield* $(
				Effect.fail(
					new DatabaseError({
						message: errorMsg,
					}),
				),
			);
		}

		if (data === null || data === undefined) {
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
