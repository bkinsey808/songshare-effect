import { Effect } from "effect";
import { sign } from "hono/jwt";

import { ServerError } from "@/api/api-errors";
import extractErrorMessage from "@/shared/error-message/extractErrorMessage";
import isRecordStringUnknown from "@/shared/type-guards/isRecordStringUnknown";

/**
 * Helper: create JWT (wrap sign)
 * @param payload - object to sign
 * @param secret - signing secret
 * @returns Effect yielding the signed JWT
 */
export default function createJwt<PayloadType>(
	payload: PayloadType,
	secret: string,
): Effect.Effect<string, ServerError> {
	// Serialize the payload to a plain object suitable for JWT signing.
	// We JSON-serialize/deserialize to produce a JSON-safe plain object
	// and fall back to a `{ payload: string }` record on failure.
	return Effect.tryPromise<string, ServerError>({
		try: () => {
			/**
			 * @param payloadCandidate - candidate to sign
			 * @returns plain record
			 */
			function computeToSign(payloadCandidate: PayloadType): Record<string, unknown> {
				try {
					const parsed: unknown = structuredClone(payloadCandidate);
					if (isRecordStringUnknown(parsed)) {
						return parsed;
					}
					const payloadStr = extractErrorMessage(payloadCandidate) ?? String(payloadCandidate);
					return { payload: payloadStr };
				} catch {
					const payloadStr = extractErrorMessage(payloadCandidate) ?? String(payloadCandidate);
					return { payload: payloadStr };
				}
			}

			const toSign: Record<string, unknown> = computeToSign(payload);

			return sign(toSign, secret);
		},
		catch: (err) => new ServerError({ message: extractErrorMessage(err, "Unknown error") }),
	});
}
