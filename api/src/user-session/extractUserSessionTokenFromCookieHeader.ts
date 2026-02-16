import { userSessionCookieName } from "@/api/cookie/cookie";

/**
 * Extract the session token from a `Cookie` header value.
 *
 * This is a small, pure helper that parses the request `Cookie` header and
 * returns the value of the configured session cookie when present, otherwise
 * `undefined`.
 *
 * @param cookieHeader - The raw `Cookie` header value from the request, or `undefined`.
 * @returns The session token string if found, otherwise `undefined`.
 */
export default function extractUserSessionTokenFromCookieHeader(
	cookieHeader: string | undefined,
): string | undefined {
	const cookie = typeof cookieHeader === "string" ? cookieHeader : "";
	// Match the cookie name exactly (either at the start of the header or
	// immediately following a ";" plus optional whitespace). Escape the
	// configured cookie name before embedding in the RegExp.
	const name = userSessionCookieName.replaceAll(/[.*+?^${}()|[\]\\]/g, String.raw`\$&`);
	const re = new RegExp(`(?:^|;\\s*)${name}=(?<val>[^;]+)`);
	const match = re.exec(cookie);
	const value = match?.groups?.val;
	return typeof value === "string" && value !== "" ? value : undefined;
}
