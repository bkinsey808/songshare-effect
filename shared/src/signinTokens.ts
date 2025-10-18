// Shared set of signin error tokens used in redirects and the client UI.
// Keep tokens short and stable so server and client can share them without
// exposing internal details.

export const SigninErrorToken = {
	providerMismatch: "providerMismatch",
	securityFailed: "securityFailed",
	missingData: "missingData",
	rateLimit: "rateLimit",
	providerUnavailable: "providerUnavailable",
	cookiesDisabled: "cookiesDisabled",
	serverError: "serverError",
	unknown: "unknown",
} as const;

export type SigninErrorTokenType =
	(typeof SigninErrorToken)[keyof typeof SigninErrorToken];

export function isSigninErrorToken(
	value: unknown,
): value is SigninErrorTokenType {
	return (
		typeof value === "string" &&
		Object.values(SigninErrorToken).includes(value as SigninErrorTokenType)
	);
}
