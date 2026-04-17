import { type Schema, Effect } from "effect";
import { verify } from "hono/jwt";

import { ServerError, ValidationError } from "@/api/api-errors";
import type { ParseDataFromCookieParams } from "@/api/cookie/ParseDataFromCookieParams.type";
import { error as serverError, log as serverLog } from "@/api/logger";
import decodeUnknownSyncOrThrow from "@/shared/validation/decodeUnknownSyncOrThrow";

// Overloads: when allowMissing is true the return includes undefined
/**
 * Extract and verify a JWT from a cookie, then decode it using the provided schema.
 * @param params - Configuration options.
 * @returns Effect yielding the decoded data or undefined if allowMissing is true and data is absent.
 */
export function parseDataFromCookie<SchemaT extends Schema.Schema.AnyNoContext>(
	params: ParseDataFromCookieParams<SchemaT, true>,
): Effect.Effect<Schema.Schema.Type<SchemaT> | undefined, ValidationError | ServerError>;
/**
 * Extract and verify a JWT from a cookie, then decode it using the provided schema.
 * @param params - Configuration options.
 * @returns Effect yielding the decoded data.
 */
export function parseDataFromCookie<SchemaT extends Schema.Schema.AnyNoContext>(
	params: ParseDataFromCookieParams<SchemaT, false>,
): Effect.Effect<Schema.Schema.Type<SchemaT>, ValidationError | ServerError>;

/**
 * Extract and verify a JWT from a cookie, then decode it using the provided schema.
 * @param params - Configuration options.
 * @returns Effect yielding the decoded data or undefined.
 */
export function parseDataFromCookie<
	SchemaT extends Schema.Schema.AnyNoContext,
	AllowMissing extends boolean | undefined = false,
>(
	params: ParseDataFromCookieParams<SchemaT, AllowMissing>,
): Effect.Effect<Schema.Schema.Type<SchemaT> | undefined, ValidationError | ServerError> {
	return Effect.gen(function* parseDataFromCookieEffect() {
		const { ctx, cookieName, schema, debug = false, allowMissing = false } = params;

		if (!ctx) {
			yield* Effect.fail(
				new ServerError({ message: "Missing context when parsing data from cookie" }),
			);
			return undefined; // unreachable, but satisfies type checker
		}

		const cookieHeader = ctx.req.header("Cookie");
		const cookie = typeof cookieHeader === "string" ? cookieHeader : "";
		if (debug) {
			serverLog("[parseDataFromCookie] Raw cookie:", cookie);
		}

		const re = new RegExp(`${cookieName}=([^;]+)`);
		const match = re.exec(cookie);
		const CAPTURE_GROUP_ONE = 1;
		const token =
			match && typeof match[CAPTURE_GROUP_ONE] === "string" && match[CAPTURE_GROUP_ONE] !== ""
				? match[CAPTURE_GROUP_ONE]
				: undefined;

		if (token === undefined || token === "") {
			if (allowMissing) {
				return undefined;
			}
			yield* Effect.fail(new ValidationError({ message: "Failed to extract token from cookie" }));
			return undefined; // unreachable, but satisfies type checker
		}

		const jwtSecret = ctx.env.SUPABASE_JWT_SECRET;
		if (jwtSecret === undefined || jwtSecret === "") {
			yield* Effect.fail(
				new ServerError({ message: "Missing SUPABASE_JWT_SECRET in environment" }),
			);
			return undefined; // unreachable, but satisfies type checker
		}

		// Hono's `verify` requires the alg/options param — tokens in this app use HS256
		const verifyEffect = Effect.tryPromise({
			try: () => verify(token, jwtSecret, "HS256"),
			catch: (error) =>
				new ServerError({
					message: "JWT verification failed",
					cause: error,
				}),
		});

		const verified = yield* (allowMissing
			? verifyEffect.pipe(
					Effect.catchAll(() => {
						if (debug) {
							serverLog("[parseDataFromCookie] JWT verification failed, returning undefined (allowMissing=true)");
						}
						return Effect.succeed(undefined);
					}),
				)
			: verifyEffect);

		if (verified === undefined) {
			return undefined;
		}

		if (debug) {
			serverLog("[parseDataFromCookie] Verified JWT payload:", verified);
		}

		try {
			// Use the shared decode helper which throws on validation failure.
			// The decode helper returns the typed schema result but the analyzer
			// may still treat this as `any` in complex generic scenarios. Keep a
			// narrow, localized exception for the assignment.
			// oxlint-disable-next-line typescript/no-unsafe-assignment
			const decoded = decodeUnknownSyncOrThrow(schema, verified);

			// If the decoded value is a record we can safely return it; otherwise it's a schema match
			// and the decode helper will have thrown. Keep TS happy by returning the decoded value.
			// The `decoded` value is typed by the schema but may be treated as
			// `any` by some rules — narrow the exception here for the return.
			// oxlint-disable-next-line typescript/no-unsafe-return, typescript/no-unsafe-type-assertion
			return decoded as Schema.Schema.Type<SchemaT>;
		} catch (error) {
			serverError("[parseDataFromCookie] Schema decoding error:", error);

			if (allowMissing) {
				// When decoding fails, allowMissing enables returning undefined
				// per the overloads defined above.
				return undefined;
			}

			yield* Effect.fail(
				new ValidationError({
					message: "Failed to decode cookie data",
				}),
			);
			return undefined; // unreachable, but satisfies type checker
		}
	});
}
