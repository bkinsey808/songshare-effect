import { Effect } from "effect";
import { sign } from "hono/jwt";

import { ServerError } from "@/api/errors";

// Helper: create JWT (wrap sign)
export function createJwt<T>(
	payload: T,
	secret: string,
): Effect.Effect<string, ServerError> {
	// Cast payload to a simple object shape for the JWT library
	return Effect.tryPromise<string, ServerError>({
		try: () => sign(payload as unknown as Record<string, unknown>, secret),
		catch: (err) => new ServerError({ message: String(err) }),
	});
}
