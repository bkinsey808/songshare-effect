/**
 * Mock user session data for testing.
 * Matches the UserSessionData type from shared/userSessionData.ts
 */
export type MockUserSession = Readonly<{
	user: Readonly<{
		user_id: string;
		email: string;
		name: string;
		username?: string;
	}>;
}>;
