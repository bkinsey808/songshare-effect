/**
 * Supabase token response types & validators
 *
 * These helpers validate the shape of a token response returned by the
 * backend token endpoints (e.g., `GET /api/auth/visitor`). They are used by
 * the auth-token modules to safely read and cache tokens.
 */
import isRecord from "@/shared/type-guards/isRecord";

/**
 * Token response shape returned by the auth endpoints.
 */
export type TokenResponse = {
	access_token: string;
	token_type: string;
	expires_in: number;
};

/**
 * isTokenResponse
 *
 * Type guard that verifies an unknown value matches the expected
 * `TokenResponse` shape. Useful for validating API responses before
 * using them to initialize clients or cache tokens.
 *
 * @param value - Value to validate
 * @returns true when the value has `access_token`, `token_type`, and `expires_in`
 */
export function isTokenResponse(value: unknown): value is TokenResponse {
	if (!isRecord(value)) {
		return false;
	}
	const rec = value;
	return (
		Object.hasOwn(rec, "access_token") &&
		Object.hasOwn(rec, "token_type") &&
		Object.hasOwn(rec, "expires_in") &&
		typeof rec["access_token"] === "string" &&
		typeof rec["token_type"] === "string" &&
		typeof rec["expires_in"] === "number"
	);
}
