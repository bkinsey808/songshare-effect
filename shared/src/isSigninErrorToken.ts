import { SigninErrorToken as signinErrorTokens, type SigninErrorToken } from "./queryParams";

// The guard operates on the runtime constant exported from queryParams; we
// import it here only so the comparison loop has something to iterate.  The
// publicly exported `SigninErrorToken` type is also imported and will be used
// directly in the return signature below.

/**
 * Type guard to detect known SigninErrorToken values used in redirects/UI.
 *
 * @param value - Value to check
 * @returns True when `value` is a `SigninErrorTokenType`
 */
export default function isSigninErrorToken(value: unknown): value is SigninErrorToken {
	return (
		typeof value === "string" &&
		// Avoid unsafe type assertions by performing a direct equality
		// comparison against the runtime values.
		Object.values(signinErrorTokens).some((token) => token === value)
	);
}
