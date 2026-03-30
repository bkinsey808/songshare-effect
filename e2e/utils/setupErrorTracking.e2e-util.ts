import { type ConsoleMessage, type Page } from "@playwright/test";

export type ErrorCollector = {
	consoleErrors: string[];
	pageErrors: string[];
};

/* oxlint-disable jest/no-conditional-in-test */
/**
 * Attach console and page error listeners to a Playwright page.
 *
 * @param page - Page whose runtime errors should be collected.
 * @returns A mutable collector populated by the registered listeners.
 */
export default function setupErrorTracking(page: Page): ErrorCollector {
	const collector: ErrorCollector = {
		consoleErrors: [],
		pageErrors: [],
	};

	page.on("console", (msg: ConsoleMessage) => {
		if (msg.type() === "error") {
			collector.consoleErrors.push(msg.text());
		}
	});

	page.on("pageerror", (error: Error) => {
		collector.pageErrors.push(error.message);
	});

	return collector;
}
/* oxlint-enable jest/no-conditional-in-test */
