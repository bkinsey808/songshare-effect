/**
 * Validates that a visitor token exists and is a string.
 * @param visitorToken - The visitor token to validate
 * @returns True if the token is valid, false otherwise
 */
export default function validateVisitorToken(visitorToken: unknown): visitorToken is string {
	if (typeof visitorToken !== "string") {
		console.warn("[validateVisitorToken] No visitor token found. Cannot fetch songs.");
		return false;
	}
	return true;
}
