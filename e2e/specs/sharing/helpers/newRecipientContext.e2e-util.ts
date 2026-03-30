import type { Browser, BrowserContext } from "@playwright/test";
import newContextWithVersion from "@/e2e/specs/sharing/helpers/newContextWithVersion.e2e-util.ts";
import { GOOGLE_USER_SESSION_PATH_2 } from "@/e2e/utils/auth-helpers";

/**
 * Creates a browser context signed in as the recipient/test-user 2.
 *
 * @param browser - Browser to create the context on.
 * @returns Promise resolving with the recipient BrowserContext.
 */
export default function newRecipientContext(browser: Browser): Promise<BrowserContext> {
	return newContextWithVersion(browser, GOOGLE_USER_SESSION_PATH_2);
}
