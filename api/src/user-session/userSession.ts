/**
 * DEPRECATED: `userSession.ts` has been split into separate files (one per function):
 *  - `extractUserSessionTokenFromCookieHeader` -> `./extractUserSessionTokenFromCookieHeader`
 *  - `extractUserSessionTokenFromContext` -> `./extractUserSessionTokenFromContext`
 *  - `verifyUserSessionToken` -> `./verifyUserSessionToken`
 *
 * Please import the specific function you need directly from those files.
 */

// This file intentionally exports a sentinel value to prevent accidental barrel-style imports.
// Prefer importing the specific function from its file instead of this module.
const DEPRECATED_USER_SESSION_SPLIT = true;
export default DEPRECATED_USER_SESSION_SPLIT;
