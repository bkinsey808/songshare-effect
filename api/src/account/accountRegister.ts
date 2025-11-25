import { Effect, Schema } from "effect";
import { sign } from "hono/jwt";
import { nanoid } from "nanoid";

import type { Database } from "@/shared/generated/supabaseTypes";

import { buildSessionCookie } from "@/api/cookie/buildSessionCookie";
import { registerCookieName, userSessionCookieName } from "@/api/cookie/cookie";
import { parseDataFromCookie } from "@/api/cookie/parseDataFromCookie";
import { DatabaseError, ServerError, ValidationError } from "@/api/errors";
import { getErrorMessage } from "@/api/getErrorMessage";
import { getIpAddress } from "@/api/getIpAddress";
import { RegisterDataSchema } from "@/api/register/registerData";
import { parseMaybeSingle } from "@/api/supabase/parseMaybeSingle";
import { csrfTokenCookieName } from "@/shared/cookies";
import { getEnvString } from "@/shared/env/getEnv";
import {
	UserPublicSchema,
	UserSchema,
} from "@/shared/generated/supabaseSchemas";
import { RegisterFormSchema } from "@/shared/register/register";
import { UserSessionDataSchema } from "@/shared/userSessionData";
import { safeGet, safeSet } from "@/shared/utils/safe";
import { decodeUnknownEffectOrMap } from "@/shared/validation/decode-effect";
import { decodeUnknownSyncOrThrow } from "@/shared/validation/decode-or-throw";
/* eslint-disable no-console */
import { createClient } from "@supabase/supabase-js";

import { type ReadonlyContext } from "../hono/hono-context";

/**
 * Handle account registration after OAuth callback
 */
// eslint-disable-next-line max-lines-per-function
export default function accountRegister(
	// eslint-disable-next-line @typescript-eslint/prefer-readonly-parameter-types
	ctx: ReadonlyContext,
): Effect.Effect<Response, DatabaseError | ServerError | ValidationError> {
	// eslint-disable-next-line max-lines-per-function
	return Effect.gen(function* ($) {
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
				console.log(
					"[accountRegister] ctx.req.url:",
					ctx.req.url,
					"Request Cookie header:",
					ctx.req.header("Cookie"),
				);
			}),
		);
		yield* $(
			Effect.sync(() => {
				// Log a few useful headers instead of relying on a raw headers object
				console.log("[accountRegister] Request headers:", {
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
					const parsed = await parseDataFromCookie({
						ctx,
						// RegisterDataSchema is a Schema<RegisterData, RegisterData,
						// never>. We need to present it as a Schema whose input
						// type is `unknown` for decodeUnknownSync usage below.
						// The register schema comes from generated types and needs
						// to be widened to accept `unknown` input. This cast is
						// safe at runtime but narrows types in TS; suppress the
						// ESLint rule for this specific line.
						// eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
						schema: RegisterDataSchema as unknown as Schema.Schema<
							Schema.Schema.Type<typeof RegisterDataSchema>,
							unknown
						>,
						cookieName: registerCookieName,
						debug: true,
					});
					return parsed;
				},
				catch: () =>
					new ValidationError({ message: "Invalid register cookie" }),
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

		const usernameResponse = parseMaybeSingle(rawUsernameRes);

		if (
			usernameResponse.error !== undefined &&
			usernameResponse.error !== null
		) {
			return yield* $(
				Effect.fail(
					new DatabaseError({ message: "Database error checking username" }),
				),
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
			Effect.sync(() => {
				console.log(
					"[accountRegister] userInsertResult:",
					// eslint-disable-next-line unicorn/no-null
					JSON.stringify(userInsertResult, null, 2),
				);
			}),
		);

		// Normalize DB row: Supabase returns `null` for nullable fields whereas
		// our Effect schemas expect `undefined` for optional fields. Convert
		// any null values to undefined before running schema decoding so that
		// optional fields validate correctly.
		const isPlainRecord = (v: unknown): v is Record<string, unknown> =>
			v !== null && typeof v === "object" && !Array.isArray(v);

		const normalizeNulls = (obj: unknown): Record<string, unknown> => {
			// Use safeGet/safeSet to satisfy lint/security rules and avoid
			// prototype pollution while normalizing null -> undefined.
			if (!isPlainRecord(obj)) {
				// Not a plain record — return an empty normalized map
				return {};
			}

			// `isPlainRecord` narrowed the type, so `obj` is a Record<string, unknown>
			const src = obj;
			const copy: Record<string, unknown> = { ...src };
			for (const key of Object.keys(src)) {
				const value = safeGet(src, key);
				if (value === null) {
					safeSet(copy, key, undefined);
				} else {
					safeSet(copy, key, value);
				}
			}
			return copy;
		};

		const normalizedRow = normalizeNulls(userInsertResult.data[0]);

		const newUser = yield* $(
			Effect.tryPromise({
				try: async () => {
					const decoded = decodeUnknownSyncOrThrow(UserSchema, normalizedRow);
					const resolved = await Promise.resolve(decoded);
					return resolved;
				},
				catch: (err) => {
					// Log the raw DB row to help debugging
					console.error(
						"[accountRegister] Failed to decode user row:",
						// eslint-disable-next-line unicorn/no-null
						JSON.stringify(userInsertResult.data[0], null, 2),
						"error:",
						getErrorMessage(err),
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
			decodeUnknownEffectOrMap(
				UserPublicSchema,
				userPublicInsertResult.data[0],
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
		if (jwtSecret === undefined || jwtSecret.length === 0) {
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
				catch: () =>
					new ServerError({ message: "Failed to sign session token" }),
			}),
		);

		// Set session cookie using the shared helper so attributes match
		// those used by the OAuth callback and sign-out clearing logic.
		const cookieHeader = buildSessionCookie({
			ctx,
			name: userSessionCookieName,
			value: sessionJwt,
			opts: {
				maxAge: 604800,
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
				maxAge: 604800,
				httpOnly: false,
			},
		});
		ctx.res.headers.append("Set-Cookie", csrfHeader);

		return ctx.json({ success: true });
	});
}
