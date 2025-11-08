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
