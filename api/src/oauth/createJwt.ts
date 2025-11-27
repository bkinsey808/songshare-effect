import { Effect } from "effect";
import { sign } from "hono/jwt";

import { ServerError } from "@/api/errors";
import { getErrorMessage } from "@/api/getErrorMessage";

// Helper: create JWT (wrap sign)
export function createJwt<PayloadType>(
	payload: PayloadType,
	secret: string,
): Effect.Effect<string, ServerError> {
	// Helper guard for runtime-checked plain objects
	function isRecordStringUnknown(
		value: unknown,
	): value is Record<string, unknown> {
		return typeof value === "object" && value !== null;
	}

	// Serialize the payload to a plain object suitable for JWT signing.
	// We JSON-serialize/deserialize to produce a JSON-safe plain object
	// and fall back to a `{ payload: string }` record on failure.
	return Effect.tryPromise<string, ServerError>({
		try: async () => {
			function computeToSign(
				payloadCandidate: PayloadType,
			): Record<string, unknown> {
				try {
					const parsed: unknown = JSON.parse(JSON.stringify(payloadCandidate));
					if (isRecordStringUnknown(parsed)) {
						return parsed;
					}
					return { payload: getErrorMessage(payloadCandidate) };
				} catch {
					return { payload: getErrorMessage(payloadCandidate) };
				}
			}

			const toSign: Record<string, unknown> = computeToSign(payload);

			return sign(toSign, secret);
		},
		catch: (err) => new ServerError({ message: getErrorMessage(err) }),
	});
}
