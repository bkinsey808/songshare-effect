import { Browser, test as base, chromium } from "@playwright/test";
import getPort from "get-port";
import { playAudit } from "playwright-lighthouse";

const IS_DEPLOYED_TEST = (process.env.PLAYWRIGHT_BASE_URL ?? "").startsWith(
	"https://",
); // Determines if testing deployed environment

export const lighthouseTest = base.extend<
	// eslint-disable-next-line @typescript-eslint/no-empty-object-type
	{},
	{ port: number; browser: Browser }
>({
	port: [
		async ({}, use) => {
			// Assign a unique port for each playwright worker to support parallel tests
			const port = await getPort();
			await use(port);
		},
		{ scope: "worker" },
	],

	browser: [
		async ({ port }, use) => {
			const browser = await chromium.launch({
				args: [`--remote-debugging-port=${String(port)}`],
			});
			await use(browser);
		},
		{ scope: "worker" },
	],
});

lighthouseTest.describe("Lighthouse", () => {
	lighthouseTest(
		"should pass lighthouse tests",
		async ({ page, port, browserName }) => {
			lighthouseTest.skip(
				!IS_DEPLOYED_TEST,
				"Skipping Lighthouse tests in deployed environment",
			);

			lighthouseTest.skip(
				browserName !== "chromium",
				"Skipping Lighthouse tests in non-chromium browsers",
			);

			await page.goto("/", { timeout: 60000 });
			await page.waitForLoadState("networkidle");

			await playAudit({
				page,
				port,
				thresholds: {
					// production site perf should be 100, but being safer here to make sure test isn't flakey.
					performance: 90,
					accessibility: 100,
					"best-practices": 100,
					seo: 100,
					// Why is the test returning undefined for PWA?
					pwa: 100,
				},
			});
		},
	);
});
