# E2E Test Authentication Guide

## Overview

This guide explains how to write E2E tests for authenticated users in the SongShare application.

## Why Mock Authentication?

The application uses **OAuth with HttpOnly cookies** for authentication. In E2E tests, we don't want to:

- Go through full OAuth flows (slow, requires test accounts with providers)
- Set up test OAuth providers
- Manage real user credentials

Instead, we **mock the `/api/me` endpoint** to simulate authenticated sessions. This is fast, reliable, and doesn't require external services.

## How It Works

1. The app calls `/api/me` on load to check if a user is signed in
2. If `/api/me` returns 200 with user data → user is signed in
3. If `/api/me` returns 401/204 → user is signed out
4. We use Playwright's `page.route()` to intercept `/api/me` and return mock data

## Quick Start

### Basic Authenticated Test

```typescript
import { test, expect } from "@playwright/test";
import { authenticateTestUser } from "./utils/auth-helpers";

test("authenticated user can access dashboard", async ({ page }) => {
  // Set up mock authentication
  await authenticateTestUser(page);

  // Navigate to protected route
  await page.goto("https://localhost:5173/en/dashboard");

  // Make assertions
  await expect(page.getByText(/welcome/i)).toBeVisible();
});
```

### Custom User Data

```typescript
import { authenticateTestUser, createTestUser } from "./utils/auth-helpers";

test("user sees their own name", async ({ page }) => {
  const customUser = createTestUser({
    name: "Jane Doe",
    email: "jane@example.com",
    user_id: "custom-user-id"
  });

  await authenticateTestUser(page, customUser);
  await page.goto("https://localhost:5173/en/dashboard");

  await expect(page.getByText(/jane doe/i)).toBeVisible();
});
```

### Test Signed-Out User

```typescript
import { mockSignedOutUser } from "./utils/auth-helpers";

test("signed-out user redirected from dashboard", async ({ page }) => {
  await mockSignedOutUser(page);

  await page.goto("https://localhost:5173/en/dashboard");

  // Should redirect to home
  expect(page.url()).toMatch(/\/en\/?$/);
});
```

### Multiple Users

To test multiple users, create separate browser contexts:

```typescript
test("different users see their own data", async ({ browser }) => {
  // User 1
  const context1 = await browser.newContext();
  const page1 = await context1.newPage();
  const user1 = createTestUser({ name: "User One" });
  await authenticateTestUser(page1, user1);
  await page1.goto("https://localhost:5173/en/dashboard");

  // User 2
  const context2 = await browser.newContext();
  const page2 = await context2.newPage();
  const user2 = createTestUser({ name: "User Two" });
  await authenticateTestUser(page2, user2);
  await page2.goto("https://localhost:5173/en/dashboard");

  // Each user sees their own data
  await expect(page1.getByText(/user one/i)).toBeVisible();
  await expect(page2.getByText(/user two/i)).toBeVisible();

  await context1.close();
  await context2.close();
});
```

## API Reference

### `authenticateTestUser(page, userSession?)`

Mocks the `/api/me` endpoint to simulate an authenticated user.

**Parameters:**

- `page: Page` - Playwright page object
- `userSession?: MockUserSession` - Optional custom user data (defaults to `DEFAULT_TEST_USER`)

**Example:**

```typescript
await authenticateTestUser(page);
// or with custom data:
await authenticateTestUser(page, { user: { name: "Custom User", ... } });
```

### `mockSignedOutUser(page)`

Mocks the `/api/me` endpoint to return 401 (unauthenticated).

**Parameters:**

- `page: Page` - Playwright page object

**Example:**

```typescript
await mockSignedOutUser(page);
```

### `createTestUser(overrides?)`

Creates a test user object with custom properties.

**Parameters:**

- `overrides?: Partial<MockUserSession["user"]>` - Properties to override

**Returns:** `MockUserSession` - Complete user session object

**Example:**

```typescript
const user = createTestUser({
  name: "Admin User",
  email: "admin@example.com",
  user_id: "admin-123"
});
```

### `DEFAULT_TEST_USER`

Default test user data:

```typescript
{
  user: {
    user_id: "test-user-id-12345",
    email: "test@example.com",
    name: "Test User",
    username: "testuser"
  }
}
```

## Best Practices

### 1. Call authentication before navigation

```typescript
// ✅ Good
await authenticateTestUser(page);
await page.goto("/en/dashboard");

// ❌ Bad - may have race conditions
await page.goto("/en/dashboard");
await authenticateTestUser(page);
```

### 2. Use separate contexts for multiple users

```typescript
// ✅ Good - isolated contexts
const context1 = await browser.newContext();
const page1 = await context1.newPage();

// ❌ Bad - shared context causes conflicts
const page1 = await browser.newPage();
const page2 = await browser.newPage();
```

### 3. Create descriptive user data for clarity

```typescript
// ✅ Good - clear what's being tested
const adminUser = createTestUser({
  name: "Admin User",
  email: "admin@test.com"
});

// ❌ Bad - unclear user identity
const user = createTestUser({ name: "User" });
```

### 4. Test both authenticated and unauthenticated states

```typescript
test.describe("Dashboard Access", () => {
  test("authenticated user can access", async ({ page }) => {
    await authenticateTestUser(page);
    // ... test authenticated behavior
  });

  test("unauthenticated user redirected", async ({ page }) => {
    await mockSignedOutUser(page);
    // ... test redirect behavior
  });
});
```

## Examples

See complete examples in:

- `e2e/authenticated-user.spec.ts` - Various authenticated user scenarios
- `e2e/dashboard.spec.ts` - Dashboard-specific authentication tests

## Troubleshooting

### Test fails with "Not authenticated" error

Make sure you call `authenticateTestUser(page)` **before** navigating to protected routes:

```typescript
// Must come first
await authenticateTestUser(page);
// Then navigate
await page.goto("/en/dashboard");
```

### User data not showing up

Add a wait for hydration if the app needs time to load:

```typescript
await page.goto("/en/dashboard");
await page.waitForTimeout(2000); // Wait for React hydration
await expect(page.getByText(/welcome/i)).toBeVisible();
```

### Route mock not working

Ensure the route pattern matches your API endpoint:

```typescript
// The pattern in auth-helpers.ts uses **/api/me
// This matches: http://localhost:8787/api/me
// And: https://localhost:5173/api/me
await page.route("**/api/me", ...);
```

## Advanced Usage

### Custom Mock Responses

You can create custom authentication helpers for special cases:

```typescript
async function mockExpiredSession(page: Page): Promise<void> {
  await page.route("**/api/me", async (route) => {
    await route.fulfill({
      status: 401,
      headers: {
        "Set-Cookie": "userSession=; Max-Age=0; Path=/",
      },
      body: JSON.stringify({ error: "Session expired" }),
    });
  });
}
```

### Conditional Authentication

```typescript
async function authenticateIf(page: Page, shouldAuth: boolean): Promise<void> {
  if (shouldAuth) {
    await authenticateTestUser(page);
  } else {
    await mockSignedOutUser(page);
  }
}

// Use in tests
test.describe.each([
  { authenticated: true },
  { authenticated: false },
])("Feature with auth=$authenticated", ({ authenticated }) => {
  test("behaves correctly", async ({ page }) => {
    await authenticateIf(page, authenticated);
    // ... test behavior
  });
});
```

## Related Documentation

- [Authentication System](../docs/authentication-system.md) - How auth works in the app
- [Login Flow](../docs/login-flow.md) - OAuth flow details
- [Playwright Documentation](https://playwright.dev/docs/intro) - Playwright basics
