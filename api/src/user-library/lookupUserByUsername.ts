import { Effect } from "effect";

import type { ReadonlyContext } from "@/api/hono/ReadonlyContext.type";

import getSupabaseServerClient from "@/api/supabase/getSupabaseServerClient";
import parseMaybeSingle from "@/api/supabase/parseMaybeSingle";
import extractErrorMessage from "@/shared/error-message/extractErrorMessage";

import { DatabaseError, ValidationError, type AuthenticationError } from "../api-errors";
import getVerifiedUserSession from "../user-session/getVerifiedSession";

type LookupUserRequest = {
	username: string;
};

type LookupUserResponse = {
	user_id: string;
	username: string;
};

/**
 * Extract and validate the request payload for looking up a user by username.
 *
 * Ensures the incoming `request` is an object and contains a `username`
 * property of type string with non-empty value.
 *
 * @param request - The raw request payload (typically parsed JSON).
 * @returns - A validated `LookupUserRequest` containing `username`.
 * @throws - `TypeError` when validation fails.
 */
function extractLookupUserRequest(request: unknown): LookupUserRequest {
	if (typeof request !== "object" || request === null) {
		throw new TypeError("Request must be a valid object");
	}

	if (!("username" in request)) {
		throw new TypeError("Request must contain username");
	}

	const { username } = request as Record<string, unknown>;

	if (typeof username !== "string") {
		throw new TypeError("username must be a string");
	}

	if (username.trim() === "") {
		throw new TypeError("username cannot be empty");
	}

	return { username: username.trim() };
}

/**
 * Server-side handler for looking up a user by username.
 *
 * This Effect-based handler:
 * - validates the incoming request
 * - verifies user authentication
 * - queries the user_public table for the username
 * - returns the user_id and username if found
 * - returns a validation error if not found
 *
 * @param ctx - The readonly request context provided by the server
 * @returns The user ID and username, or fails with an error
 */
export default function lookupUserByUsernameHandler(
	ctx: ReadonlyContext,
): Effect.Effect<LookupUserResponse, ValidationError | DatabaseError | AuthenticationError> {
	return Effect.gen(function* lookupUserByUsernameGen($) {
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
		let req: LookupUserRequest = { username: "" };
		try {
			req = extractLookupUserRequest(requestBody);
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
		yield* $(getVerifiedUserSession(ctx));

		// Get Supabase client
		const client = getSupabaseServerClient(ctx.env.VITE_SUPABASE_URL, ctx.env.SUPABASE_SERVICE_KEY);

		// Query user_public for the username
		const queryResult = yield* $(
			Effect.tryPromise({
				try: () =>
					client
						.from("user_public")
						.select("user_id, username")
						.eq("username", req.username)
						.maybeSingle(),
				catch: (error) =>
					new DatabaseError({
						message: extractErrorMessage(error, "Failed to lookup user"),
					}),
			}),
		);

		const { data, error: queryError } = parseMaybeSingle(queryResult);

		if (queryError !== undefined && queryError !== null) {
			return yield* $(
				Effect.fail(
					new DatabaseError({
						message: extractErrorMessage(queryError, "Database error"),
					}),
				),
			);
		}

		if (data === undefined || data === null) {
			return yield* $(
				Effect.fail(
					new ValidationError({
						message: `User "${req.username}" not found`,
					}),
				),
			);
		}

		// Type narrowing: data is unknown from parseMaybeSingle, so we must access
		// properties via bracket notation and validate types. Disabling type assertion
		// warnings since we perform runtime type checks after accessing the properties.
		// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-type-assertion, prefer-destructuring
		const user_id = (data as Record<string, unknown>)["user_id"];
		// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-type-assertion, prefer-destructuring
		const username = (data as Record<string, unknown>)["username"];

		if (typeof user_id !== "string" || typeof username !== "string") {
			return yield* $(
				Effect.fail(
					new DatabaseError({
						message: "Invalid user data returned from database",
					}),
				),
			);
		}

		return { user_id, username };
	});
}
