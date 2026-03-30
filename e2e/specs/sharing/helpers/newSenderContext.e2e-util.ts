import type { Browser, BrowserContext } from "@playwright/test";
import newContextWithVersion from "@/e2e/specs/sharing/helpers/newContextWithVersion.e2e-util.ts";
import { GOOGLE_USER_SESSION_PATH } from "@/e2e/utils/auth-helpers";

/**
 * Creates a browser context pre-authenticated as the sender/admin user.
 *
 * @param browser - Browser instance that will host the sender context.
 * @returns Promise resolving with the sender BrowserContext.
 */
export default function newSenderContext(browser: Browser): Promise<BrowserContext> {
	return newContextWithVersion(browser, GOOGLE_USER_SESSION_PATH);
}
