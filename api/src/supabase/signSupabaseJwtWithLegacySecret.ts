import { sign } from "hono/jwt";

/**
 * Signs a Supabase-compatible HS256 JWT using the legacy base64-encoded HMAC secret.
 *
 * Supabase's legacy JWT secret is stored as a base64 string in the dashboard.
 * Supabase infrastructure (Realtime, PostgREST) base64-decodes the secret before
 * using it as the raw HMAC-SHA256 key. This function does the same, producing a
 * token that Supabase Realtime will successfully verify.
 *
 * Use this when GoTrue is issuing ES256 tokens (after ECC key rotation) but
 * Supabase Realtime still uses the legacy HS256 secret for JWT verification.
 *
 * @param payload - JWT claims to sign (must include `sub`, `role`, `exp`, etc.)
 * @param legacyBase64Secret - The legacy JWT secret as shown in the Supabase dashboard
 * @returns Signed HS256 JWT string
 */
export default async function signSupabaseJwtWithLegacySecret(
	payload: Record<string, unknown>,
	legacyBase64Secret: string,
): Promise<string> {
	// The Supabase dashboard shows the HMAC key as a base64 string.
	// Supabase infrastructure decodes it to raw bytes before HMAC — we must do the same.
	// Using the base64 string directly as UTF-8 would produce a different
	// key.
	const FIRST_CHAR_INDEX = 0;
	const FALLBACK_CHAR_CODE = 0;
	const keyBytes = Uint8Array.from(
		atob(legacyBase64Secret),
		(char) => char.codePointAt(FIRST_CHAR_INDEX) ?? FALLBACK_CHAR_CODE,
	);
	const cryptoKey = await crypto.subtle.importKey(
		"raw",
		keyBytes,
		{ name: "HMAC", hash: "SHA-256" },
		false,
		["sign"],
	);
	return sign(payload, cryptoKey, "HS256");
}
