import { Effect } from "effect";
import type { Context } from "hono";

import type { Bindings } from "./env";
import { AuthenticationError, type DatabaseError } from "./errors";
// getErrorMessage was previously used for logging; not needed in the effect-based flow
import { getIpAddress } from "./getIpAddress";
import { getVerifiedUserSession } from "./userSession/getVerifiedSession";
import { type UserSessionData } from "@/shared/userSessionData";
import { safeSet } from "@/shared/utils/safe";

/** Effect-based handler for /api/me */
export function me(
	ctx: Context<{ Bindings: Bindings }>,
): Effect.Effect<UserSessionData, AuthenticationError | DatabaseError> {
	return Effect.gen(function* ($) {
		// Optional incoming headers dump. This was previously always-on to help
		// debug cookie propagation after OAuth. To avoid noisy logs during
		// normal local browsing, make it opt-in via the DEBUG_API_HEADERS
		// binding. Set DEBUG_API_HEADERS=1 in your environment to enable.
		const debugHeaders = (ctx.env as unknown as { DEBUG_API_HEADERS?: string })
			.DEBUG_API_HEADERS;
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
						// eslint-disable-next-line no-console
						console.log("[me] Incoming request headers:", hdrObj);
					} catch (err) {
						console.error("[me] Failed to dump incoming headers:", String(err));
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
