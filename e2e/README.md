# Translation-Aware E2E Testing

This document explains how our e2e tests are structured to be robust against translation changes.

## Problem

Traditional e2e tests that rely on text content become fragile when:

- Translations change
- New languages are added
- UI copy is updated
- Tests run in different locales

For example, this test would break if translations change:

```typescript
// ❌ Fragile - breaks when translations change
const message = page.getByText("Your account has been successfully deleted.");
await expect(message).toBeVisible();
```

## Solution

We use a combination of semantic data attributes and translation-agnostic selectors:

### 1. Data-testid Attributes

Components include `data-testid` attributes for reliable element selection:

```typescript
// ✅ Robust - doesn't depend on text content
const alertContainer = page.getByTestId("dismissible-alert");
await expect(alertContainer).toBeVisible();
```

### 2. Semantic Data Attributes

Components include semantic attributes that indicate their purpose:

```typescript
// ✅ Robust - tests alert type, not text content
await expect(alertContainer).toHaveAttribute(
	"data-alert-type",
	"deleteSuccess",
);
await expect(alertContainer).toHaveAttribute("data-variant", "success");
```

### 3. Translation-Agnostic Constants

We define constants for alert types and selectors in `e2e/utils/translationHelpers.ts`:

```typescript
export const ALERT_TYPES = {
	DELETE_SUCCESS: "deleteSuccess",
	SIGN_OUT_SUCCESS: "signOutSuccess",
	SIGN_IN_SUCCESS: "signedInSuccess",
	REGISTERED_SUCCESS: "registeredSuccess",
} as const;
```

## Implementation

### Component Level

The `DismissibleAlert` component includes semantic attributes:

```tsx
<div
	data-testid="dismissible-alert"
	data-alert-type={alertType} // e.g., "deleteSuccess"
	data-variant={variant} // e.g., "success"
>
	<strong data-testid="alert-title">{title}</strong>
	<div data-testid="alert-message">{children}</div>
	<button data-testid="alert-dismiss-button">Dismiss</button>
</div>
```

### Test Level

Tests use semantic selectors instead of text matching:

```typescript
test("shows account deleted success alert", async ({ page }) => {
	// Setup test state...

	// ✅ Test using semantic attributes
	const alertContainer = page.getByTestId("dismissible-alert");
	await expect(alertContainer).toBeVisible();

	// ✅ Verify specific alert type
	await expect(alertContainer).toHaveAttribute(
		"data-alert-type",
		ALERT_TYPES.DELETE_SUCCESS,
	);

	// ✅ Verify alert variant
	await expect(alertContainer).toHaveAttribute("data-variant", "success");

	// ✅ Test individual elements
	const alertTitle = page.getByTestId("alert-title");
	await expect(alertTitle).toBeVisible();

	const alertMessage = page.getByTestId("alert-message");
	await expect(alertMessage).toBeVisible();

	// ✅ Dismiss using semantic selector
	const dismissButton = page.getByTestId("alert-dismiss-button");
	await dismissButton.click();
});
```

## Benefits

1. **Translation Independence**: Tests don't break when copy changes
2. **Language Agnostic**: Tests work in any language
3. **Maintainable**: Centralized constants for alert types
4. **Semantic**: Tests verify behavior, not presentation
5. **Robust**: Less brittle than text-based selectors

## Guidelines

### Do ✅

- Use `data-testid` for element selection
- Use semantic data attributes for state verification
- Test behavior and functionality, not specific text
- Use constants for alert types and selectors
- Verify element presence and attributes

### Don't ❌

- Search for specific translated text
- Use CSS class selectors that might change
- Hard-code text strings in tests
- Rely on element positioning or styling
- Test translation accuracy (that's a separate concern)

## Alternative Approaches Considered

### Option 1: Load Translation Files in Tests

```typescript
// Could load actual translation files for validation
const translations = loadTranslations("en");
const expectedText = translations["pages.dashboard.accountDeleted.message"];
await expect(page.getByText(expectedText)).toBeVisible();
```

**Pros**: Validates actual translations  
**Cons**: Complex setup, still fragile to translation changes, requires test-time translation loading

### Option 2: Translation Key Attributes

```typescript
// Could include translation keys as data attributes
<div data-translation-key="pages.dashboard.accountDeleted.message">
  {t("pages.dashboard.accountDeleted.message")}
</div>
```

**Pros**: Direct link between UI and translation keys  
**Cons**: Clutters DOM, exposes internal structure, still dependent on translation architecture

### Chosen Approach: Semantic Data Attributes ✅

**Pros**: Clean, semantic, translation-agnostic, tests behavior not text  
**Cons**: Requires adding data attributes to components

The chosen approach strikes the best balance between robustness, maintainability, and semantic clarity.

## Running tests locally ⚠️

If you see errors like "Executable doesn't exist" when running Playwright tests, it means the Playwright browser binaries are not installed yet. To download Playwright's browsers run:

```bash
npx playwright install
```

The dev script will also attempt to automatically install browsers for you before starting tests. If you prefer to skip automatic installation (CI or offline environments) set:

```bash
PLAYWRIGHT_SKIP_BROWSER_INSTALL=1
```

If installation fails, run `npx playwright install` manually and then rerun the tests.

You can also run the repository npm script which wraps the Playwright installer:

```bash
npm run playwright:install
```

On machines using Bun or when you need the repo's postinstall to run automatically, we include a Bun TypeScript `postinstall` script. This will execute after `npm install` and run the installer unless you set `PLAYWRIGHT_SKIP_BROWSER_INSTALL=1`.

This repo also includes a small cross-platform wrapper that prefers Bun (so the existing Bun TypeScript `postinstall` continues to work when `bun` is available) and falls back to `npx playwright install --with-deps` when `bun` isn't present in PATH. The intended consumer behavior is unchanged — browsers will be installed automatically — but contributors without Bun still get the same installer behavior.

## Caching Playwright browser downloads in CI (recommended)

Browsers are large and repeatedly downloading them in CI is slow — caching them reduces runtime. There are two good approaches in GitHub Actions:

1. Cache the Playwright cache directory (default):

```yaml
- name: Cache Playwright browser cache
	uses: actions/cache@v4
	with:
		path: |
			~/.cache/ms-playwright
		key: ${{ runner.os }}-playwright-${{ hashFiles('**/package-lock.json') }}
		restore-keys: ${{ runner.os }}-playwright-
```

2. Use a repo-local cache (portable): set `PLAYWRIGHT_BROWSERS_PATH` to a repo folder and cache that. This keeps binaries inside the workspace which simplifies caching across OSes:

```yaml
# top-level job envs
env:
	PLAYWRIGHT_BROWSERS_PATH: ${{ github.workspace }}/.playwright-browsers

- name: Cache repo-local Playwright browsers
	uses: actions/cache@v4
	with:
		path: .playwright-browsers
		key: ${{ runner.os }}-playwright-${{ hashFiles('**/package-lock.json') }}
		restore-keys: ${{ runner.os }}-playwright-
```

We update the workflow job to set `PLAYWRIGHT_BROWSERS_PATH` and cache `.playwright-browsers` — then `npm run playwright:install` will fast-path installations using the cache.

Tip: Use the lockfile hash (package-lock.json) in the cache key to automatically invalidate the cache when dependencies change.
