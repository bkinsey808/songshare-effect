export const preferredLanguageCookieName = "preferred-language";

// Cookie name used to store the OAuth CSRF state on the backend
export const oauthCsrfCookieName = "oauth-csrf";

// Cookie name for a double-submit CSRF token that is readable by JS.
// This is intentionally NOT HttpOnly so the frontend can read it and include
// it in an `X-CSRF-Token` header for state-changing requests (double-submit).
export const csrfTokenCookieName = "csrf-token";
