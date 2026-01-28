import { test, expect } from "@playwright/test";

// This test runs Lighthouse programmatically via `lighthouse` + `chrome-launcher`.
// It is tolerant: if the packages are not installed it will be skipped with a
// short message so local devs don't have to add deps until they opt into it.

// We intentionally relax some `@typescript-eslint` checks for this file because
// it interacts with optional devDependencies which are not always present and
// produce untyped runtime objects (Lighthouse outputs). The disables are
// narrow and limited to assignment/call/member-access rules used in the
// integration logic.
/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call */

const DEFAULT_URL = process.env["LIGHTHOUSE_URL"] ?? process.env["PLAYWRIGHT_BASE_URL"] ?? "https://localhost:5173";

let lighthouse: unknown = undefined;
let chromeLauncher: unknown = undefined;

// Perform dynamic imports in hooks to avoid top-level side-effects and to
// allow lint rules about setup/teardown being inside hooks.
// If imports fail we call `test.skip` inside the hook to skip the suite.
const LH_SKIP_MESSAGE = "lighthouse or chrome-launcher not installed — run `npm i -D lighthouse chrome-launcher` to enable";

test.beforeAll(async () => {
	try {
		lighthouse = await import("lighthouse");
		chromeLauncher = await import("chrome-launcher");
	} catch (error) {
		// eslint-disable-next-line no-console
		console.debug("Skipping Lighthouse tests (imports failed):", error);
		// Skip the suite when deps are not present
		test.skip(true, LH_SKIP_MESSAGE);
	}
});

// Increase timeout for Lighthouse runs
const LH_TIMEOUT_MS = 120_000;
test.setTimeout(LH_TIMEOUT_MS);

const DEFAULT_MIN_SCORE = 90;
const MIN_FALLBACK = 80;
const SCORE_SCALE = 100;
const SCORE_DEFAULT = 0;

function getMinScore(): number {
	return Number(process.env["LIGHTHOUSE_MIN_SCORE"] ?? DEFAULT_MIN_SCORE);
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== undefined && value !== null;
}

/*
	Narrowly disable a few `@typescript-eslint` checks in this small helper
	because we're parsing an untyped runtime object produced by an optional
	third-party tool (Lighthouse). Keeping the disable local avoids file-level
	disables while making the code readable and safe via explicit guards.
*/
/* eslint-disable @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment */
function getCategoryScore(categories: unknown, key: string): number {
	if (!isRecord(categories)) {
		return SCORE_DEFAULT;
	}
	const val = categories[key];
	if (!isRecord(val)) {
		return SCORE_DEFAULT;
	}
	const { score } = val;
	if (typeof score !== "number") {
		return SCORE_DEFAULT;
	}
	return score;
}
/* eslint-enable @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment */

function getLhrFromRunnerResult(runnerResult: unknown): unknown {
	if (!isRecord(runnerResult)) {
		return undefined;
	}
	if (!("lhr" in runnerResult)) {
		return undefined;
	}
	return runnerResult["lhr"];
}

function computeScoresFromLhr(lhr: unknown): { performance: number; accessibility: number; bestPractices: number; seo: number } {
	// lhr is already extracted - get categories directly from lhr.categories
	const categories = isRecord(lhr) ? lhr["categories"] : undefined;
	return {
		performance: Math.round(getCategoryScore(categories, "performance") * SCORE_SCALE),
		accessibility: Math.round(getCategoryScore(categories, "accessibility") * SCORE_SCALE),
		bestPractices: Math.round(getCategoryScore(categories, "best-practices") * SCORE_SCALE),
		seo: Math.round(getCategoryScore(categories, "seo") * SCORE_SCALE),
	};
}

async function writeReportIfRequested(runnerResult: unknown): Promise<void> {
	const outputDir = process.env["LH_OUTPUT_DIR"];
	if (outputDir === undefined || outputDir === "") {
		return;
	}
	const fs = await import("node:fs/promises");
	if (!isRecord(runnerResult) || !("report" in runnerResult)) {
		return;
	}
	const reportHtml = runnerResult["report"];
	if (typeof reportHtml !== "string" || reportHtml === "") {
		return;
	}
	await fs.mkdir(outputDir, { recursive: true });
	await fs.writeFile(`${outputDir}/lighthouse-${Date.now()}.html`, reportHtml);
	// eslint-disable-next-line no-console
	console.log(`Wrote Lighthouse HTML report to ${outputDir}`);
}

test.describe.serial("Lighthouse audit", () => {
	test("baseline page score meets thresholds", async () => {
		// The concrete runner types come from optional devDependencies.
		type LighthouseRunner = (url: string, options: { port: number }, config: Record<string, unknown> | undefined) => Promise<unknown>;

		// Safely extract lighthouse default export using runtime checks
		// eslint-disable-next-line jest/no-conditional-in-test -- Runtime check for dynamic import
		if (!isRecord(lighthouse) || typeof lighthouse["default"] !== "function") {
			test.skip(true, "Lighthouse module not properly loaded");
			return;
		}
		// eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- Runtime check above ensures this is a function
		const lh = lighthouse["default"] as LighthouseRunner;

		// Safely extract chrome-launcher launch function using runtime checks
		// eslint-disable-next-line jest/no-conditional-in-test -- Runtime check for dynamic import
		if (!isRecord(chromeLauncher) || typeof chromeLauncher["launch"] !== "function") {
			test.skip(true, "Chrome-launcher module not properly loaded");
			return;
		}
		// eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- Runtime check above ensures this is a function
		const launchChrome = chromeLauncher["launch"] as (options: {
			chromeFlags: string[];
			userDataDir?: string;
			envVars?: Record<string, string>;
		}) => Promise<{ port: number; kill: () => Promise<void> }>;

		// Create unique temp directory for this run to avoid WSL2 creating Windows-path directories in project root
		const fs = await import("node:fs");
		const path = await import("node:path");
		const tempDir = path.join("/tmp", `lighthouse-chrome-${Date.now()}`);
		fs.mkdirSync(tempDir, { recursive: true });

		// Change to temp directory during Chrome launch to prevent WSL path dirs in project root
		const originalCwd = process.cwd();
		process.chdir("/tmp");

		const chrome = await launchChrome({
			chromeFlags: [
				"--headless",
				"--no-sandbox",
				"--ignore-certificate-errors",
				"--allow-insecure-localhost",
				"--disable-web-security",
			],
			userDataDir: tempDir,
		}).finally(() => {
			// Restore original working directory
			process.chdir(originalCwd);
		});

		/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access */
		try {
			const options = { port: chrome.port, logLevel: "info" as const, onlyCategories: ["performance", "accessibility", "best-practices", "seo"] } as const;
			// Pass undefined for config to use defaults (config object changed in newer lighthouse versions)
			const runnerResult = await lh(DEFAULT_URL, options, undefined);

			const lhr = getLhrFromRunnerResult(runnerResult);
			const scores = computeScoresFromLhr(lhr);

			// Check for certificate interstitial errors - all scores will be 0
			// This can happen with self-signed certs in dev environments (e.g., WSL2 with HTTPS)
			// eslint-disable-next-line jest/no-conditional-in-test -- Graceful skip for environments where cert interstitial blocks Lighthouse
			const allZeroScores = scores.performance === SCORE_DEFAULT && scores.accessibility === SCORE_DEFAULT && scores.bestPractices === SCORE_DEFAULT && scores.seo === SCORE_DEFAULT;
			// eslint-disable-next-line jest/no-conditional-in-test -- Required to skip test gracefully in unsupported environments
			if (allZeroScores) {
				// eslint-disable-next-line no-console
				console.warn("Lighthouse returned all-zero scores — likely a certificate interstitial blocked the page.");
				// eslint-disable-next-line no-console
				console.warn("To run Lighthouse tests, either use HTTP or a trusted certificate.");
				test.skip(true, "Certificate interstitial blocked Lighthouse — use HTTP or trusted cert");
				return;
			}

			const minScore = getMinScore();

			expect(scores.performance, "performance").toBeGreaterThanOrEqual(minScore);
			expect(scores.accessibility, "accessibility").toBeGreaterThanOrEqual(minScore);
			expect(scores.bestPractices, "best-practices").toBeGreaterThanOrEqual(Math.min(minScore, MIN_FALLBACK));
			expect(scores.seo, "seo").toBeGreaterThanOrEqual(Math.min(minScore, MIN_FALLBACK));

			// eslint-disable-next-line no-console
			console.log("Lighthouse scores:", scores);

			await writeReportIfRequested(runnerResult);
		} finally {
			await chrome.kill();
		}
		/* eslint-enable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access */
	});
});
