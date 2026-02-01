import { Effect } from "effect";
import { verify } from "hono/jwt";

import { AuthenticationError } from "@/api/errors";
import { getEnvString } from "@/shared/env/getEnv";
import extractErrorMessage from "@/shared/error-message/extractErrorMessage";

/**
 * Verify a user session JWT using the environment's `JWT_SECRET`.
 *
 * This helper looks up the `JWT_SECRET` from the provided environment-like
 * object and verifies the supplied JWT string. On failure an
 * `AuthenticationError` is produced with a helpful message.
 *
 * @param userSessionToken - The raw JWT string to verify.
 * @param envLike - Environment-like object used to resolve `JWT_SECRET`.
 * @returns An Effect that resolves with the decoded JWT payload or fails
 *          with an `AuthenticationError` if verification fails.
 */
export default function verifyUserSessionToken(
	userSessionToken: string,
	envLike: unknown,
): Effect.Effect<unknown, AuthenticationError> {
	return Effect.tryPromise({
		try: () => {
			const jwtSecret = getEnvString(envLike, "JWT_SECRET");
			if (jwtSecret === undefined || jwtSecret === "") {
				throw new Error("Missing JWT_SECRET");
			}
			return verify(userSessionToken, jwtSecret, "HS256");
		},
		catch: (err: unknown) =>
			new AuthenticationError({
				message: extractErrorMessage(err ?? "Invalid token", "Invalid token"),
			}),
	});
}
