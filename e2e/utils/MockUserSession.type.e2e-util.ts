import type { UserSessionData } from "@/shared/userSessionData";

/**
 * Mock user session data for testing.
 * Matches the runtime `UserSessionData` shape returned by `/api/me`.
 */
export type MockUserSession = UserSessionData;
