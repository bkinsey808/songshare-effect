/**
 * Playwright MCP Init Page Script
 * Bypasses OAuth and overrides /api/me for debugging authenticated pages
 * 
 * This matches the authentication mocking pattern used in E2E tests.
 * See: e2e/utils/auth-helpers.ts
 * 
 * Usage: npx @playwright/mcp@latest --init-page .mcp/playwright-auth-init.ts
 */

import type { Page } from '@playwright/test';

// Mock user session data - matches E2E test format
const mockUserSession = {
  user: {
    user_id: 'test-user-id-123',
    email: 'mcp-debug@example.com',
    name: 'MCP Debug User',
    username: 'mcpuser',
  },
};

export default async function playwrightAuthInit({
  page,
}: {
  page: Page;
}): Promise<void> {
  // Set up route handler to intercept /api/me
  await page.route('**/api/me', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(mockUserSession),
    });
  });

  // Optional: Set viewport size for consistent debugging
  await page.setViewportSize({ width: 1280, height: 720 });

  // Optional: Grant permissions if needed
  // await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
}
