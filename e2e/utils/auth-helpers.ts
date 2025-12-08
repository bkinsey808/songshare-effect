import { type Page } from "@playwright/test";

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

/**
 * Default test user for E2E tests.
 */
export const DEFAULT_TEST_USER: MockUserSession = {
	user: {
		user_id: "test-user-id-12345",
		email: "test@example.com",
		name: "Test User",
		username: "testuser",
	},
};

/**
 * Authenticates a test user by mocking the /api/me endpoint.
 * 
 * Since the app uses OAuth with HttpOnly cookies, and we don't want to
 * set up full OAuth flow in tests, we mock the /api/me response to
 * simulate an authenticated session.
 * 
 * This works because:
 * 1. The app calls /api/me on load to check authentication
 * 2. A 200 response with user data means "signed in"
 * 3. The Zustand store updates isSignedIn based on this response
 * 
 * @param page - Playwright page object
 * @param userSession - Optional custom user session data
 * 
 * @example
 * ```typescript
 * test("authenticated user can access dashboard", async ({ page }) => {
 *   await authenticateTestUser(page);
 *   await page.goto("/en/dashboard");
 *   // ... assertions
 * });
 * ```
 */
export async function authenticateTestUser(
	page: Page,
	userSession: MockUserSession = DEFAULT_TEST_USER,
): Promise<void> {
	// Mock the /api/me endpoint to return a successful auth response
	await page.route("**/api/me", async (route) => {
		await route.fulfill({
			status: 200,
			contentType: "application/json",
			body: JSON.stringify(userSession),
		});
	});
}

/**
 * Simulates a signed-out user by mocking /api/me to return 401.
 * 
 * @param page - Playwright page object
 * 
 * @example
 * ```typescript
 * test("signed-out user cannot access dashboard", async ({ page }) => {
 *   await mockSignedOutUser(page);
 *   await page.goto("/en/dashboard");
 *   // Should redirect to home
 * });
 * ```
 */
export async function mockSignedOutUser(page: Page): Promise<void> {
	await page.route("**/api/me", async (route) => {
		await route.fulfill({
			status: 401,
			contentType: "application/json",
			body: JSON.stringify({ error: "Not authenticated" }),
		});
	});
}

/**
 * Creates a custom test user with specific properties.
 * 
 * @param overrides - Partial user data to override defaults
 * @returns Complete user session object
 * 
 * @example
 * ```typescript
 * const adminUser = createTestUser({ 
 *   name: "Admin User", 
 *   email: "admin@example.com" 
 * });
 * await authenticateTestUser(page, adminUser);
 * ```
 */
export function createTestUser(
	overrides: Partial<MockUserSession["user"]> = {},
): MockUserSession {
	return {
		user: {
			...DEFAULT_TEST_USER.user,
			...overrides,
		},
	};
}
