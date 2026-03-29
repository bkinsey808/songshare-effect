import type { Browser, BrowserContext } from "@playwright/test";

/**
 * Creates a Playwright browser context and pins the app_version value so
 * cached state does not vary between tests.
 *
 * @param browser Browser instance used to create the context.
 * @param storageState Path to the storageState file to reuse.
 * @return Promise that resolves with the newly created BrowserContext.
 */
export default async function newContextWithVersion(
	browser: Browser,
	storageState: string,
): Promise<BrowserContext> {
	const context = await browser.newContext({ storageState });
	await context.addInitScript(() => {
		try {
			localStorage.setItem("app_version", "1.0.0");
			// Ensure stale persisted share state does not hide valid recipients.
			localStorage.removeItem("app-store");
		} catch {
			// ignore
		}
	});
	return context;
}
