import { createClient } from "@supabase/supabase-js";
import { Effect, Schema } from "effect";
import { type Context } from "hono";
import { sign } from "hono/jwt";

import { RegisterFormSchema } from "../../shared/src/register/register";
import { registerCookieName, userSessionCookieName } from "./cookie";
import type { Env } from "./env";
import { DatabaseError, ServerError, ValidationError } from "./errors";
import { RegisterDataSchema } from "./features/register/registerData";
import { getIpAddress } from "./getIpAddress";
import { parseDataFromCookie } from "./parseDataFromCookie";
import {
	UserPublicSchema,
	UserSchema,
} from "@/shared/generated/supabaseSchemas";
import type { Database } from "@/shared/generated/supabaseTypes";
import { UserSessionDataSchema } from "@/shared/userSessionData";

/**
 * Handle account registration after OAuth callback
 */
// eslint-disable-next-line max-lines-per-function
export default function accountRegister(
	ctx: Context<{ Bindings: Env }>,
): Effect.Effect<Response, DatabaseError | ServerError | ValidationError> {
	// eslint-disable-next-line max-lines-per-function
	return Effect.gen(function* ($) {
		// Parse and validate the request body
		const body: unknown = yield* $(
			Effect.tryPromise({
				try: () => ctx.req.json(),
				catch: () => new ValidationError({ message: "Invalid JSON body" }),
			}),
		);

		const registerForm = yield* $(
			Schema.decodeUnknown(RegisterFormSchema)(body).pipe(
				Effect.mapError(
					() => new ValidationError({ message: "Invalid registration data" }),
				),
			),
		);

		const { username } = registerForm;

		// Debug: log incoming Cookie header and request headers so we can
		// diagnose why the register cookie might be missing when the client
		// posts the registration form.
		yield* $(
			Effect.sync(() =>
				console.log(
					"[accountRegister] ctx.req.url:",
					ctx.req.url,
					"Request Cookie header:",
					ctx.req.header("Cookie"),
				),
			),
		);
		yield* $(
			Effect.sync(() =>
				// Log a few useful headers instead of relying on a raw headers object
				console.log("[accountRegister] Request headers:", {
					Host: ctx.req.header("Host"),
					Origin: ctx.req.header("Origin"),
					Referer: ctx.req.header("Referer"),
					Cookie: ctx.req.header("Cookie"),
					xForwardedProto: ctx.req.header("x-forwarded-proto"),
				}),
			),
		);

		// Parse register data from cookie. Enable debug so parseDataFromCookie
		// prints the raw cookie and JWT verification details to the server log.
		const registerData = yield* $(
			Effect.tryPromise({
				try: () =>
					parseDataFromCookie({
						ctx,
						schema: RegisterDataSchema as Schema.Schema<
							Schema.Schema.Type<typeof RegisterDataSchema>,
							unknown,
							never
						>,
						cookieName: registerCookieName,
						debug: true,
					}),
				catch: () =>
					new ValidationError({ message: "Invalid register cookie" }),
			}),
		);

		// Use service key for backend
		const supabaseUrl = ctx.env.VITE_SUPABASE_URL;
		const supabaseServiceKey = ctx.env.SUPABASE_SERVICE_KEY;
		const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey);

		// Check if username already exists
		const usernameResponse = yield* $(
			Effect.tryPromise({
				try: () =>
					supabase
						.from("user_public")
						.select("user_id")
						.eq("username", username)
						.maybeSingle(),
				catch: () =>
					new DatabaseError({
						message: "Failed to check username availability",
					}),
			}),
		);

		if (usernameResponse.error) {
			return yield* $(
				Effect.fail(
					new DatabaseError({ message: "Database error checking username" }),
				),
			);
		}

		if (usernameResponse.data) {
			return yield* $(
				Effect.fail(
					new ValidationError({
						message: "Username already taken",
						field: "username",
					}),
				),
			);
		}

		// Create user record
		const userToInsert = {
			email: registerData.oauthUserData.email,
			name: registerData.oauthUserData.name ?? "",
			sub: registerData.oauthUserData.sub ?? "",
			linked_providers: [registerData.oauthState.provider],
		};

		const userInsertResult = yield* $(
			Effect.tryPromise({
				try: () => supabase.from("user").insert([userToInsert]).select(),
				catch: () =>
					new DatabaseError({ message: "Failed to create user account" }),
			}),
		);

		if (userInsertResult.error) {
			return yield* $(
				Effect.fail(
					new DatabaseError({ message: "Failed to insert user record" }),
				),
			);
		}

		if (userInsertResult.data.length === 0) {
			return yield* $(
				Effect.fail(
					new DatabaseError({ message: "Failed to insert user record" }),
				),
			);
		}

		// Debug: log raw insert result to help diagnose schema validation failures
		yield* $(
			Effect.sync(() =>
				console.log(
					"[accountRegister] userInsertResult:",
					JSON.stringify(userInsertResult, null, 2),
				),
			),
		);

		const newUser = yield* $(
			Effect.tryPromise({
				try: () =>
					Promise.resolve(
						Schema.decodeUnknownSync(UserSchema)(userInsertResult.data[0]),
					),
				catch: (err) => {
					// Log the raw DB row to help debugging
					console.error(
						"[accountRegister] Failed to decode user row:",
						JSON.stringify(userInsertResult.data[0], null, 2),
						"error:",
						String(err),
					);
					return new DatabaseError({
						message: "Invalid user data from database",
					});
				},
			}),
		);

		const newUserId = newUser.user_id;

		// Create user_public record
		const userPublicToInsert = {
			user_id: newUserId,
			username,
		};

		const userPublicInsertResult = yield* $(
			Effect.tryPromise({
				try: () =>
					supabase.from("user_public").insert([userPublicToInsert]).select(),
				catch: () =>
					new DatabaseError({ message: "Failed to create user profile" }),
			}),
		);

		if (userPublicInsertResult.error) {
			return yield* $(
				Effect.fail(
					new DatabaseError({ message: "Failed to insert user profile" }),
				),
			);
		}

		const newUserPublic = yield* $(
			Schema.decodeUnknown(UserPublicSchema)(
				userPublicInsertResult.data[0],
			).pipe(
				Effect.mapError(
					() =>
						new DatabaseError({
							message: "Invalid user profile data from database",
						}),
				),
			),
		);

		// Create session data
		const sessionData = {
			user: newUser,
			userPublic: newUserPublic,
			oauthUserData: registerData.oauthUserData,
			oauthState: registerData.oauthState,
			ip: getIpAddress(ctx),
		};

		const validatedSessionData = yield* $(
			Schema.decodeUnknown(UserSessionDataSchema)(sessionData).pipe(
				Effect.mapError(
					() => new ServerError({ message: "Invalid session data" }),
				),
			),
		);

		// Sign session JWT
		const jwtSecret = ctx.env.JWT_SECRET;
		if (typeof jwtSecret !== "string" || jwtSecret.length === 0) {
			return yield* $(
				Effect.fail(
					new ServerError({
						message: "Server misconfiguration: missing JWT_SECRET",
					}),
				),
			);
		}

		const sessionJwt = yield* $(
			Effect.tryPromise({
				try: () => sign(validatedSessionData, jwtSecret),
				catch: () =>
					new ServerError({ message: "Failed to sign session token" }),
			}),
		);

		// Set session cookie
		ctx.header(
			"Set-Cookie",
			`${userSessionCookieName}=${sessionJwt}; HttpOnly; Path=/; Secure; SameSite=Lax; Max-Age=604800`,
		);

		return ctx.json({ success: true });
	});
}
