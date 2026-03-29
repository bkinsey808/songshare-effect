import type { BrowserContext, Browser } from "@playwright/test";
import newContextWithVersion from "@/e2e/specs/sharing/helpers/newContextWithVersion.e2e-util.ts";
import { GOOGLE_USER_SESSION_PATH, GOOGLE_USER_SESSION_PATH_2 } from "@/e2e/utils/auth-helpers";

/**
 * Opens both sender and recipient contexts so tests can run sender/recipient flows.
 *
 * @param browser Browser instance used to open both session contexts.
 * @return Promise resolving with both contexts so callers can close them.
 */
export default async function createTwoUserContexts(
	browser: Browser,
): Promise<{ senderCtx: BrowserContext; recipientCtx: BrowserContext }> {
	const senderCtx = await newContextWithVersion(browser, GOOGLE_USER_SESSION_PATH);
	const recipientCtx = await newContextWithVersion(browser, GOOGLE_USER_SESSION_PATH_2);
	return { senderCtx, recipientCtx };
}
