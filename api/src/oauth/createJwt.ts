import { Effect } from "effect";
import { sign } from "hono/jwt";

import { ServerError } from "@/api/errors";
import { getErrorMessage } from "@/api/getErrorMessage";

// Helper: create JWT (wrap sign)
export function createJwt<T>(
	payload: T,
	secret: string,
): Effect.Effect<string, ServerError> {
	// Helper guard for runtime-checked plain objects
	function isRecordStringUnknown(x: unknown): x is Record<string, unknown> {
		return typeof x === "object" && x !== null;
	}

	// Serialize the payload to a plain object suitable for JWT signing.
	// We JSON-serialize/deserialize to produce a JSON-safe plain object
	// and fall back to a `{ payload: string }` record on failure.
	return Effect.tryPromise<string, ServerError>({
		try: async () => {
			const toSign: Record<string, unknown> = (() => {
				try {
					const parsed: unknown = JSON.parse(JSON.stringify(payload));
					if (isRecordStringUnknown(parsed)) return parsed;
					return { payload: getErrorMessage(payload) };
				} catch {
					return { payload: getErrorMessage(payload) };
				}
			})();

			return sign(toSign, secret);
		},
		catch: (err) => new ServerError({ message: getErrorMessage(err) }),
	});
}
