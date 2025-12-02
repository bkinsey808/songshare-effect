/**
 * E2E testing utilities for translation-aware testing
 */

/**
 * Translation keys that can be tested semantically instead of by text content.
 * This provides better maintainability when translations change.
 */
export const TRANSLATION_KEYS = {
	accountDeleted: {
		title: "pages.dashboard.accountDeleted.title",
		message: "pages.dashboard.accountDeleted.message",
	},
	signedOut: {
		title: "pages.dashboard.signedOutSuccess.title",
		message: "pages.dashboard.signedOutSuccess.message",
	},
	signedIn: {
		title: "pages.dashboard.signedInSuccess",
		message: "pages.dashboard.signedInSuccess",
	},
	registered: {
		title: "pages.dashboard.createdAccountSuccess",
		message: "pages.dashboard.createdAccountSuccess",
	},
} as const;

/**
 * Alert type constants that correspond to the data-alert-type attribute
 * These are semantic identifiers that don't depend on translation text
 */
export const ALERT_TYPES = {
	DELETE_SUCCESS: "deleteSuccess",
	SIGN_OUT_SUCCESS: "signOutSuccess",
	SIGN_IN_SUCCESS: "signedInSuccess",
	REGISTERED_SUCCESS: "registeredSuccess",
} as const;

/**
 * Helper to get translation values for testing (if needed).
 * This could be extended to load actual translation files for validation.
 */
export function getExpectedTranslation(
	key: string,
	language = "en",
): string | undefined {
	// This is a placeholder that could be expanded to load actual translation files
	// For now, we rely on data-testid attributes instead of text matching
	console.warn(
		`getExpectedTranslation called with key: ${key}, language: ${language}. Consider using data-testid attributes instead.`,
	);
	return undefined;
}

/**
 * Semantic test selectors that don't depend on translated text
 */
export const TEST_SELECTORS = {
	dismissibleAlert: '[data-testid="dismissible-alert"]',
	alertTitle: '[data-testid="alert-title"]',
	alertMessage: '[data-testid="alert-message"]',
	alertDismissButton: '[data-testid="alert-dismiss-button"]',
	deleteSuccessAlert:
		'[data-testid="dismissible-alert"][data-alert-type="deleteSuccess"]',
	signOutSuccessAlert:
		'[data-testid="dismissible-alert"][data-alert-type="signOutSuccess"]',
	signInSuccessAlert:
		'[data-testid="dismissible-alert"][data-alert-type="signedInSuccess"]',
	registeredSuccessAlert:
		'[data-testid="dismissible-alert"][data-alert-type="registeredSuccess"]',
} as const;
