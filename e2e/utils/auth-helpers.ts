import { type Page } from "@playwright/test";

import type { MockUserSession } from "@/e2e/utils/MockUserSession.type.e2e-util.ts";
import makeUserSessionData from "@/shared/test-utils/makeUserSessionData.test-util";

type MockUserOverrides = Partial<MockUserSession["user"]> & {
	username?: string;
};
const FAKE_SUPABASE_TOKEN = "fake-supabase-token-for-testing";
const FAKE_TOKEN_EXPIRES_IN = 3600;

/**
 * Default test user for E2E tests.
 */
export const DEFAULT_TEST_USER: MockUserSession = makeUserSessionData({
	user: {
		user_id: "test-user-id-12345",
		email: "test@example.com",
		name: "Test User",
	},
	userPublic: {
		username: "testuser",
	},
});

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
	await page.route("**/api/me", async (route) => {
		await route.fulfill({
			status: 200,
			contentType: "application/json",
			body: JSON.stringify(userSession),
		});
	});
	await page.route("**/api/auth/user/token", async (route) => {
		await route.fulfill({
			status: 200,
			contentType: "application/json",
			body: JSON.stringify({
				success: true,
				data: {
					access_token: FAKE_SUPABASE_TOKEN,
					expires_in: FAKE_TOKEN_EXPIRES_IN,
				},
			}),
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
export function createTestUser(overrides: MockUserOverrides = {}): MockUserSession {
	const { username, ...userOverrides } = overrides;

	return makeUserSessionData({
		user: userOverrides,
		...(username === undefined ? {} : { userPublic: { username } }),
	});
}

/**
 * Path to the pre-generated real-user storageState file.
 *
 * This file is produced by running:
 *   bun e2e/utils/create-google-user-session.bun.ts
 *
 * Use with `test.use({ storageState: GOOGLE_USER_SESSION_PATH })` in specs
 * that need a real authenticated session (real DB interactions, RLS, etc.).
 *
 * @example
 * ```typescript
 * import { GOOGLE_USER_SESSION_PATH } from "./utils/auth-helpers";
 * test.use({ storageState: GOOGLE_USER_SESSION_PATH });
 * ```
 */
export const GOOGLE_USER_SESSION_PATH = "e2e/.auth/google-user.json";

/**
 * Path to the pre-generated real-user storageState file for the second test user.
 *
 * This file is produced by running:
 *   npm run e2e:create-session:staging-db:user2
 *
 * Used in two-user tests (sharing, invitations) where both a sender and a
 * recipient need independent authenticated browser contexts.
 *
 * @example
 * ```typescript
 * import { GOOGLE_USER_SESSION_PATH_2 } from "./utils/auth-helpers";
 * const recipientCtx = await browser.newContext({ storageState: GOOGLE_USER_SESSION_PATH_2 });
 * ```
 */
export const GOOGLE_USER_SESSION_PATH_2 = "e2e/.auth/google-user-2.json";
