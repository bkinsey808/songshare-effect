import { Effect } from "effect";

import { type ReadonlyContext } from "@/api/hono/hono-context";
import { error as serverError, log as serverLog } from "@/api/logger";
import { getEnvString } from "@/shared/env/getEnv";
import extractErrorMessage from "@/shared/error-message/extractErrorMessage";
import { type UserSessionData } from "@/shared/userSessionData";
import { safeSet } from "@/shared/utils/safe";

import { AuthenticationError, type DatabaseError } from "./api-errors";
import getIpAddress from "./getIpAddress";
import getVerifiedUserSession from "./user-session/getVerifiedSession";

/**
 * Effect-based handler for `GET /api/me`.
 *
 * Verifies and decodes the current user's session, checks the request IP
 * matches the session IP, and returns the validated `UserSessionData` on
 * success. When `DEBUG_API_HEADERS=1` the handler will optionally log a set of
 * incoming request headers to help debug cookie propagation and OAuth flows.
 *
 * @param ctx - Readonly request context providing cookies and environment.
 * @returns - An Effect that resolves to validated `UserSessionData` on success.
 *   Fails with an `AuthenticationError` when the user is not authenticated or
 *   when the IP addresses do not match. Fails with a `DatabaseError` if
 *   required server configuration is missing.
 */
export default function me(
	ctx: ReadonlyContext,
): Effect.Effect<UserSessionData, AuthenticationError | DatabaseError> {
	return Effect.gen(function* meGen($) {
		// Optional incoming headers dump. This was previously always-on to help
		// debug cookie propagation after OAuth. To avoid noisy logs during
		// normal local browsing, make it opt-in via the DEBUG_API_HEADERS
		// binding. Set DEBUG_API_HEADERS=1 in your environment to enable.
		// Read optional DEBUG_API_HEADERS binding via helper
		const debugHeaders = getEnvString(ctx.env, "DEBUG_API_HEADERS");
		if (debugHeaders === "1") {
			yield* $(
				Effect.sync(() => {
					try {
						const names = [
							"host",
							"cookie",
							"referer",
							"user-agent",
							"x-forwarded-proto",
							"x-forwarded-host",
							"x-forwarded-for",
						];
						const hdrObj: Record<string, string | undefined> = {};
						for (const nm of names) {
							safeSet(hdrObj, nm, ctx.req.header(nm) ?? undefined);
						}
						serverLog("[me] Incoming request headers:", hdrObj);
					} catch (error) {
						serverError(
							"[me] Failed to dump incoming headers:",
							extractErrorMessage(error, "Unknown error"),
						);
					}
				}),
			);
		}

		// Use the reusable helper to verify session and decode the UserSessionData
		const userSessionData = yield* $(getVerifiedUserSession(ctx));

		// 5) IP check (sync)
		const ip = getIpAddress(ctx);
		if (userSessionData.ip !== ip) {
			return yield* $(
				Effect.fail(
					new AuthenticationError({
						message: "IP address mismatch",
					}),
				),
			);
		}

		return userSessionData;
	});
}
