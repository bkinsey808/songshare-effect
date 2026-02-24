// ---------------------------------------------------------------------------
// Sign‑in error token values
//
// The query parameter **key** for signin errors is defined above
// (`signinErrorQueryParam`), and the set of permitted **values** is defined
// right here in `queryParamTokens`.  This module exports both the key and
// the runtime token object so callers don’t need to import from multiple
// places.  The old `signinTokens.ts` file remains for the guard and unit
// tests, but no longer contains the token list itself.
//
// Example:
//   import { signinErrorQueryParam, SigninErrorToken } from "@/shared/queryParams";
//

// We declare the actual set of signin error token values only once and
// derive all of the related types from it.  Previously we repeated the
// keys/values in both a manual `QueryParamTokens` type and the runtime
// object; having a single source is much easier to maintain.
const signinErrorTokenValues = {
	providerMismatch: "providerMismatch",
	securityFailed: "securityFailed",
	missingData: "missingData",
	rateLimit: "rateLimit",
	providerUnavailable: "providerUnavailable",
	cookiesDisabled: "cookiesDisabled",
	serverError: "serverError",
	unknown: "unknown",
} as const;

// Query parameter keys used across the app. Keep names stable so imports
// elsewhere can reference them instead of using magic strings.
export const justSignedInQueryParam = "justSignedIn";

// Sign-in / OAuth related query params
export const signinErrorQueryParam = "signinError";
export const providerQueryParam = "provider";
export const codeQueryParam = "code";
export const stateQueryParam = "state";
export const redirectPortQueryParam = "redirect_port";

// Localization / flow params
export const langQueryParam = "lang";

// Type for the exported lookup.  Using `Record` keeps the syntax
// compact and avoids any short-identifier lint complaints.
export type QueryParamTokens = Record<typeof signinErrorQueryParam, typeof signinErrorTokenValues>;

export const queryParamTokens: QueryParamTokens = {
	[signinErrorQueryParam]: signinErrorTokenValues,
} as const;

// runtime constant for error tokens derived from the above lookup
export const SigninErrorToken: Readonly<(typeof queryParamTokens)[typeof signinErrorQueryParam]> =
	queryParamTokens[signinErrorQueryParam];
export type SigninErrorToken = (typeof SigninErrorToken)[keyof typeof SigninErrorToken];
