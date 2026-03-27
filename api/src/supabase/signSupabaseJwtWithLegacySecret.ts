import { sign } from "hono/jwt";

/**
 * Signs a Supabase-compatible HS256 JWT using the legacy JWT secret.
 *
 * GoTrue (supabase/auth) and Supabase Realtime both use the JWT secret
 * as raw UTF-8 bytes for HMAC-SHA256 signing/verification — they do NOT
 * base64-decode it. This function does the same, producing a token that
 * Supabase Realtime will successfully verify.
 *
 * Use this when GoTrue is issuing ES256 tokens (after ECC key rotation) but
 * Supabase Realtime still uses the legacy HS256 secret for JWT verification.
 *
 * @param payload - JWT claims to sign (must include `sub`, `role`, `exp`, etc.)
 * @param legacySecret - The legacy JWT secret as shown in the Supabase dashboard
 * @returns Signed HS256 JWT string
 */
export default async function signSupabaseJwtWithLegacySecret(
	payload: Record<string, unknown>,
	legacySecret: string,
): Promise<string> {
	// GoTrue and Realtime use the raw secret string as UTF-8 bytes for HMAC —
	// not base64-decoded. Match that behavior exactly.
	const keyBytes = new TextEncoder().encode(legacySecret);
	const cryptoKey = await crypto.subtle.importKey(
		"raw",
		keyBytes,
		{ name: "HMAC", hash: "SHA-256" },
		false,
		["sign"],
	);
	return sign(payload, cryptoKey, "HS256");
}
