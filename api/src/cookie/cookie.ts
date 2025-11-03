// api/src/cookie.ts
// Cookie names used by the API runtime
// Prefer a single canonical name for the runtime session cookie. Older code
// referenced `sessionCookieName` while newer code prefers
// `userSessionCookieName`. Keep a single source-of-truth and alias for
// backward compatibility.
export const userSessionCookieName = "userSession";
export const sessionCookieName: string = userSessionCookieName;
// Cookie name used to store a temporary register JWT after OAuth when the user needs to finish registration
export const registerCookieName = "register";
