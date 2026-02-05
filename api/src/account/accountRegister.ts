import { createClient } from "@supabase/supabase-js";
import { Effect } from "effect";
import { sign } from "hono/jwt";
import { nanoid } from "nanoid";

import type { Database } from "@/shared/generated/supabaseTypes";

import { DatabaseError, ServerError, ValidationError } from "@/api/api-errors";
import buildSessionCookie from "@/api/cookie/buildSessionCookie";
import { registerCookieName, userSessionCookieName } from "@/api/cookie/cookie";
import { parseDataFromCookie } from "@/api/cookie/parseDataFromCookie";
import getIpAddress from "@/api/getIpAddress";
import { debug as serverDebug, error as serverError } from "@/api/logger";
import normalizeNullsTopLevel from "@/api/oauth/normalizeNullsTopLevel";
import { RegisterDataSchema } from "@/api/register/registerData";
import parseMaybeSingle from "@/api/supabase/parseMaybeSingle";
import { csrfTokenCookieName } from "@/shared/cookies";
import { getEnvString } from "@/shared/env/getEnv";
import extractErrorMessage from "@/shared/error-message/extractErrorMessage";
import { UserPublicSchema, UserSchema } from "@/shared/generated/supabaseSchemas";
import { RegisterFormSchema } from "@/shared/register/register";
import { UserSessionDataSchema } from "@/shared/userSessionData";
import decodeUnknownEffectOrMap from "@/shared/validation/decode-effect";
import decodeUnknownSyncOrThrow from "@/shared/validation/decodeUnknownSyncOrThrow";

import type { ReadonlyContext } from "../hono/ReadonlyContext.type";

/**
 * Handle account registration after OAuth callback
 *
 * @param ctx - Hono request context
 * @returns An Effect that resolves to a Response on success
 */
export default function accountRegister(
	ctx: ReadonlyContext,
): Effect.Effect<Response, DatabaseError | ServerError | ValidationError> {
	return Effect.gen(function* accountRegisterGen($) {
		// Parse and validate the request body
		const body: unknown = yield* $(
			Effect.tryPromise({
				// Await inside the async factory so we don't return `Promise<any>`
				// directly (avoids unsafe-return lint warnings).
				try: async (): Promise<unknown> => {
					const parsed = (await ctx.req.json()) as unknown;
					return parsed;
				},
				catch: () => new ValidationError({ message: "Invalid JSON body" }),
			}),
		);

		const registerForm = yield* $(
			decodeUnknownEffectOrMap(
				RegisterFormSchema,
				body,
				() => new ValidationError({ message: "Invalid registration data" }),
			),
		);

		const { username } = registerForm;

		// Debug: log incoming Cookie header and request headers so we can
		// diagnose why the register cookie might be missing when the client
		// posts the registration form.
		yield* $(
			Effect.sync(() => {
				// Localized: debug-only server-side log
				serverDebug(
					"[accountRegister] ctx.req.url:",
					ctx.req.url,
					"Request Cookie header:",
					ctx.req.header("Cookie"),
				);
			}),
		);
		yield* $(
			Effect.sync(() => {
				// Localized: debug-only server-side log
				serverDebug("[accountRegister] Request headers:", {
					Host: ctx.req.header("Host"),
					Origin: ctx.req.header("Origin"),
					Referer: ctx.req.header("Referer"),
					Cookie: ctx.req.header("Cookie"),
					xForwardedProto: ctx.req.header("x-forwarded-proto"),
				});
			}),
		);

		// Parse register data from cookie. Enable debug so parseDataFromCookie
		// prints the raw cookie and JWT verification details to the server log.
		const registerData = yield* $(
			Effect.tryPromise({
				try: async () => {
					const parsed = await parseDataFromCookie<typeof RegisterDataSchema>({
						ctx,
						// RegisterDataSchema is a Schema<RegisterData, RegisterData,
						// never>. We need to present it as a Schema whose input
						// type is `unknown` for decodeUnknownSync usage below.
						// The register schema comes from generated types and needs
						// to be widened to accept `unknown` input. This cast is
						// safe at runtime but narrows types in TS; suppress the
						// ESLint rule for this specific line.
						schema: RegisterDataSchema,
						cookieName: registerCookieName,
						debug: true,
					});
					if (parsed === undefined) {
						throw new Error("Missing register cookie");
					}
					return parsed;
				},
				catch: () => new ValidationError({ message: "Invalid register cookie" }),
			}),
		);

		// Use service key for backend
		const supabaseUrl = ctx.env.VITE_SUPABASE_URL;
		const supabaseServiceKey = ctx.env.SUPABASE_SERVICE_KEY;
		const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey);

		// Check if username already exists
		const rawUsernameRes = yield* $(
			Effect.tryPromise({
				try: () =>
					supabase.from("user_public").select("user_id").eq("username", username).maybeSingle(),
				catch: () =>
					new DatabaseError({
						message: "Failed to check username availability",
					}),
			}),
		);

		const usernameResponse = parseMaybeSingle(rawUsernameRes);

		if (usernameResponse.error !== undefined && usernameResponse.error !== null) {
			return yield* $(
				Effect.fail(new DatabaseError({ message: "Database error checking username" })),
			);
		}

		if (usernameResponse.data !== undefined && usernameResponse.data !== null) {
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
				catch: () => new DatabaseError({ message: "Failed to create user account" }),
			}),
		);

		if (userInsertResult.error) {
			return yield* $(Effect.fail(new DatabaseError({ message: "Failed to insert user record" })));
		}

		// Destructure the inserted row to avoid numeric indices (no magic numbers)
		const [rawInsertedUser] = userInsertResult.data;
		if (!rawInsertedUser) {
			return yield* $(Effect.fail(new DatabaseError({ message: "Failed to insert user record" })));
		}

		// Debug: log raw insert result to help diagnose schema validation failures
		const JSON_INDENT = 2;
		yield* $(
			Effect.sync(() => {
				// Localized: debug-only server-side log
				serverDebug(
					"[accountRegister] userInsertResult:",
					// oxlint-disable-next-line no-null
					JSON.stringify(rawInsertedUser, null, JSON_INDENT),
				);
			}),
		);

		const normalizedRow = normalizeNullsTopLevel(rawInsertedUser);

		const newUser = yield* $(
			Effect.tryPromise({
				try: async () => {
					const decoded = decodeUnknownSyncOrThrow(UserSchema, normalizedRow);
					const resolved = await Promise.resolve(decoded);
					return resolved;
				},
				catch: (err) => {
					// Log the raw DB row to help debugging
					// Localized: server-side error logging
					serverError(
						"[accountRegister] Failed to decode user row:",
						// oxlint-disable-next-line no-null
						JSON.stringify(rawInsertedUser, null, JSON_INDENT),
						"error:",
						extractErrorMessage(err, "Unknown error"),
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
				try: () => supabase.from("user_public").insert([userPublicToInsert]).select(),
				catch: () => new DatabaseError({ message: "Failed to create user profile" }),
			}),
		);

		if (userPublicInsertResult.error) {
			return yield* $(Effect.fail(new DatabaseError({ message: "Failed to insert user profile" })));
		}

		// Destructure the inserted public row to avoid numeric indices
		const [rawUserPublic] = userPublicInsertResult.data;
		if (!rawUserPublic) {
			return yield* $(Effect.fail(new DatabaseError({ message: "Failed to insert user profile" })));
		}

		const newUserPublic = yield* $(
			decodeUnknownEffectOrMap(
				UserPublicSchema,
				rawUserPublic,
				() =>
					new DatabaseError({
						message: "Invalid user profile data from database",
					}),
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
			decodeUnknownEffectOrMap(
				UserSessionDataSchema,
				sessionData,
				() => new ServerError({ message: "Invalid session data" }),
			),
		);

		// Sign session JWT
		const jwtSecret = getEnvString(ctx.env, "JWT_SECRET");
		if (jwtSecret === undefined || jwtSecret === "") {
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
				try: async () => {
					const token = await sign(validatedSessionData, jwtSecret);
					return token;
				},
				catch: () => new ServerError({ message: "Failed to sign session token" }),
			}),
		);

		// Set session cookie using the shared helper so attributes match
		// those used by the OAuth callback and sign-out clearing logic.
		const cookieHeader = buildSessionCookie({
			ctx,
			name: userSessionCookieName,
			value: sessionJwt,
			opts: {
				maxAge: 604_800,
				httpOnly: true,
			},
		});
		ctx.res.headers.append("Set-Cookie", cookieHeader);

		// Also set a readable double-submit CSRF token cookie for frontend use
		const csrfToken = nanoid();
		const csrfHeader = buildSessionCookie({
			ctx,
			name: csrfTokenCookieName,
			value: csrfToken,
			opts: {
				maxAge: 604_800,
				httpOnly: false,
			},
		});
		ctx.res.headers.append("Set-Cookie", csrfHeader);

		return ctx.json({ success: true });
	});
}
