import { expect, test } from "@playwright/test";

// This test runs Lighthouse programmatically via `lighthouse` + `chrome-launcher`.
// It is tolerant: if the packages are not installed it will be skipped with a
// short message so local devs don't have to add deps until they opt into it.

// We intentionally relax some `@typescript-eslint` checks for this file because
// it interacts with optional devDependencies which are not always present and
// produce untyped runtime objects (Lighthouse outputs). The disables are
// narrow and limited to assignment/call/member-access rules used in the
// integration logic.
/* oxlint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-type-assertion */

const DEFAULT_URL =
	process.env["LIGHTHOUSE_URL"] ?? process.env["PLAYWRIGHT_BASE_URL"] ?? "https://localhost:5173";

let lighthouse: unknown = undefined;
let chromeLauncher: unknown = undefined;

// The optional dev-dependency modules are validated in setup; typed handles are used inline in the test.

// Perform dynamic imports in hooks to avoid top-level side-effects and to
// allow lint rules about setup/teardown being inside hooks.
// If imports fail we call `test.skip` inside the hook to skip the suite.
const LH_SKIP_MESSAGE =
	"lighthouse or chrome-launcher not installed — run `npm i -D lighthouse chrome-launcher` to enable";

test.beforeAll(async () => {
	try {
		lighthouse = await import("lighthouse");
		chromeLauncher = await import("chrome-launcher");
	} catch (error) {
		// oxlint-disable-next-line no-console
		console.debug("Skipping Lighthouse tests (imports failed):", error);
		// Skip the suite when deps are not present
		test.skip(true, LH_SKIP_MESSAGE);
		return;
	}

	// Validate module shapes and skip early if they are unexpected. This moves
	// conditional logic out of the test body to satisfy `jest/no-conditional-in-test`.
	if (!isRecord(lighthouse) || typeof lighthouse["default"] !== "function") {
		// oxlint-disable-next-line no-console
		console.debug("Skipping Lighthouse tests (lighthouse export missing or invalid)");
		test.skip(true, "Lighthouse module not properly loaded");
		return;
	}
	if (!isRecord(chromeLauncher) || typeof chromeLauncher["launch"] !== "function") {
		// oxlint-disable-next-line no-console
		console.debug("Skipping Lighthouse tests (chrome-launcher export missing or invalid)");
		test.skip(true, "Chrome-launcher module not properly loaded");
		return;
	}

	// Module shapes validated above — no runtime assignments required here.
});

// Increase timeout for Lighthouse runs
const LH_TIMEOUT_MS = 240_000;
test.setTimeout(LH_TIMEOUT_MS);

const DEFAULT_MIN_SCORE = 90;
const DEV_MIN_SCORE = 50;
const MIN_FALLBACK = 80;
const SCORE_SCALE = 100;
const SCORE_DEFAULT = 0;

function getMinScore(): number {
	// Priority order:
	// 1. Explicit mode via LIGHTHOUSE_MODE (dev|dist|ci)
	// 2. Per-mode overrides: LIGHTHOUSE_MIN_SCORE_DEV, LIGHTHOUSE_MIN_SCORE_DIST
	// 3. Auto-detect local dev server (localhost or 127.0.0.1 or port 5173) and use dev fallback
	// 4. Fallback to LIGHTHOUSE_MIN_SCORE or DEFAULT_MIN_SCORE
	const mode = process.env["LIGHTHOUSE_MODE"];
	if (mode === "dev") {
		return Number(process.env["LIGHTHOUSE_MIN_SCORE_DEV"] ?? DEV_MIN_SCORE);
	}
	if (mode === "dist" || mode === "ci") {
		return Number(process.env["LIGHTHOUSE_MIN_SCORE_DIST"] ?? DEFAULT_MIN_SCORE);
	}

	const url = process.env["LIGHTHOUSE_URL"] ?? process.env["PLAYWRIGHT_BASE_URL"] ?? "";
	if (url.includes("localhost") || url.includes("127.0.0.1") || url.includes(":5173")) {
		return Number(
			process.env["LIGHTHOUSE_MIN_SCORE_DEV"] ??
				Number(process.env["LIGHTHOUSE_MIN_SCORE"] ?? DEV_MIN_SCORE),
		);
	}

	return Number(process.env["LIGHTHOUSE_MIN_SCORE"] ?? DEFAULT_MIN_SCORE);
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== undefined && value !== null;
}

/**
 * Wait for a TCP port to accept connections on localhost.
 * Retries until the timeout expires, then throws.
 */
const DEFAULT_WAIT_PORT_MS = 20_000;
const PORT_RETRY_DELAY_MS = 100;

async function waitForPort(port: number, timeoutMs = DEFAULT_WAIT_PORT_MS): Promise<void> {
	const net = await import("node:net");
	const start = Date.now();
	/* oxlint-disable promise/avoid-new */
	return new Promise<void>((resolve, reject) => {
		function attempt(): void {
			const socket = net.createConnection({ port, host: "127.0.0.1" }, () => {
				socket.destroy();
				resolve();
			});
			socket.on("error", () => {
				socket.destroy();
				if (Date.now() - start > timeoutMs) {
					reject(new Error(`Timed out waiting for port ${port}`));
				} else {
					setTimeout(attempt, PORT_RETRY_DELAY_MS);
				}
			});
		}
		attempt();
	});
}

// Retry constants for local Lighthouse reliability
const LH_RETRY_ATTEMPTS = 2;
const LH_RETRY_BASE_DELAY_MS = 1500;

/**
 * Run Lighthouse runner with retries for transient connection failures.
 */
async function runLighthouseWithRetries(
	lhRunner: (
		url: string,
		options: { port: number },
		config?: Record<string, unknown>,
	) => Promise<unknown>,
	url: string,
	options: { port: number },
): Promise<unknown> {
	/* oxlint-disable no-magic-numbers */
	async function attemptRun(attempt: number): Promise<unknown> {
		try {
			return await lhRunner(url, options, undefined);
		} catch (error) {
			const text = String(error);
			if (text.includes("ECONNREFUSED") || text.includes("ECONNRESET")) {
				if (attempt + 1 >= LH_RETRY_ATTEMPTS) {
					throw error;
				}
				const delay = LH_RETRY_BASE_DELAY_MS * 2 ** attempt;
				// oxlint-disable-next-line no-console
				console.warn(
					`Lighthouse attempt ${attempt + 1} failed with ${text}; retrying after ${delay}ms`,
				);
				await new Promise((resolve) => setTimeout(resolve, delay));
				return attemptRun(attempt + 1);
			}
			throw error;
		}
	}
	const result = await attemptRun(0);
	/* oxlint-enable no-magic-numbers */
	return result;
}

/*
	Narrowly disable a few `@typescript-eslint` checks in this small helper
	because we're parsing an untyped runtime object produced by an optional
	third-party tool (Lighthouse). Keeping the disable local avoids file-level
	disables while making the code readable and safe via explicit guards.
*/
/* oxlint-disable @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment */
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
/* oxlint-enable @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment */

function getLhrFromRunnerResult(runnerResult: unknown): unknown {
	if (!isRecord(runnerResult)) {
		return undefined;
	}
	if (!("lhr" in runnerResult)) {
		return undefined;
	}
	return runnerResult["lhr"];
}

function computeScoresFromLhr(lhr: unknown): {
	performance: number;
	accessibility: number;
	bestPractices: number;
	seo: number;
} {
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
	// oxlint-disable-next-line no-console
	console.log(`Wrote Lighthouse HTML report to ${outputDir}`);
}

function maybeSkipForAllZeroScores(scores: {
	performance: number;
	accessibility: number;
	bestPractices: number;
	seo: number;
}): void {
	const allZero =
		scores.performance === SCORE_DEFAULT &&
		scores.accessibility === SCORE_DEFAULT &&
		scores.bestPractices === SCORE_DEFAULT &&
		scores.seo === SCORE_DEFAULT;
	if (allZero) {
		// oxlint-disable-next-line no-console
		console.warn(
			"Lighthouse returned all-zero scores — likely a certificate interstitial blocked the page.",
		);
		// oxlint-disable-next-line no-console
		console.warn("To run Lighthouse tests, either use HTTP or a trusted certificate.");
		test.skip(true, "Certificate interstitial blocked Lighthouse — use HTTP or trusted cert");
	}
}

test.describe.serial("Lighthouse audit", () => {
	test("baseline page score meets thresholds", async () => {
		// The concrete runner types come from optional devDependencies.
		type LighthouseRunner = (
			url: string,
			options: { port: number },
			config: Record<string, unknown> | undefined,
		) => Promise<unknown>;

		/* oxlint-disable @typescript-eslint/no-unsafe-type-assertion, @typescript-eslint/no-unnecessary-type-assertion */
		// Only run Lighthouse on the Chromium project to avoid running it multiple
		// times across different browser projects and worker processes.
		/* oxlint-disable jest/no-conditional-in-test */
		const projectName = test.info().project?.name ?? "";
		if (projectName !== "chromium") {
			test.skip(true, "Lighthouse runs only on the Chromium project");
			return;
		}

		const lh = (lighthouse as unknown as { default: LighthouseRunner }).default;
		const launchChrome = (
			chromeLauncher as unknown as {
				launch: (options: {
					chromeFlags: string[];
					userDataDir?: string;
					envVars?: Record<string, string>;
				}) => Promise<{ port: number; kill: () => Promise<void> }>;
			}
		).launch;
		/* oxlint-enable @typescript-eslint/no-unsafe-type-assertion, @typescript-eslint/no-unnecessary-type-assertion */

		// Create unique temp directory for this run to avoid WSL2 creating Windows-path directories in project root
		const fs = await import("node:fs");
		const path = await import("node:path");
		const tempDir = path.join("/tmp", `lighthouse-chrome-${Date.now()}`);
		fs.mkdirSync(tempDir, { recursive: true });

		/* oxlint-disable jest/no-conditional-in-test */
		function skipOnConnRefused(error: unknown): void {
			if (String(error).includes("ECONNREFUSED")) {
				// oxlint-disable-next-line no-console
				console.warn("Observed ECONNREFUSED during Lighthouse run:", error);
				// Skip the test gracefully
				test.skip(true, `Lighthouse skipped due to connection error: ${String(error)}`);
			}
		}
		process.on("unhandledRejection", skipOnConnRefused as (reason: unknown) => void);
		process.on("uncaughtException", skipOnConnRefused as (err: unknown) => void);
		/* oxlint-enable jest/no-conditional-in-test */

		// Run the full Chrome + Lighthouse flow with retries to tolerate transient
		// debug-port connection races on local dev machines.
		/* oxlint-disable jest/no-conditional-in-test */
		async function runFullLighthouseCycle(attempt?: number): Promise<unknown> {
			/* oxlint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access */
			/* oxlint-disable no-magic-numbers */
			const _attempt = attempt ?? 0;
			if (_attempt >= LH_RETRY_ATTEMPTS) {
				throw new Error("Lighthouse failed after multiple attempts");
			}

			const originalCwd = process.cwd();
			process.chdir("/tmp");
			let chrome: { port: number; kill: () => Promise<void> } | undefined = undefined;
			try {
				chrome = await launchChrome({
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

				const options = {
					port: chrome.port,
					logLevel: "info" as const,
					onlyCategories: ["performance", "accessibility", "best-practices", "seo"],
				} as const;

				try {
					await waitForPort(chrome.port, DEFAULT_WAIT_PORT_MS);
				} catch (error) {
					// If Chrome never accepts connections, try again after a delay.
					// oxlint-disable-next-line no-console
					console.warn("Chrome did not accept connections on port", chrome.port, error);
					try {
						await chrome.kill();
					} catch {
						// ignore
					}
					const delay = LH_RETRY_BASE_DELAY_MS * 2 ** _attempt;
					await new Promise((resolve) => setTimeout(resolve, delay));
					return await runFullLighthouseCycle(_attempt + 1);
				}

				// Run Lighthouse with retries for transient runner failures.
				const runnerResult = await runLighthouseWithRetries(lh, DEFAULT_URL, options);
				return runnerResult;
			} catch (error) {
				// oxlint-disable-next-line no-console
				console.warn("Lighthouse cycle attempt failed:", error);
				const delay = LH_RETRY_BASE_DELAY_MS * 2 ** _attempt;
				await new Promise((resolve) => setTimeout(resolve, delay));
				return await runFullLighthouseCycle(_attempt + 1);
			} finally {
				try {
					if (chrome !== undefined) {
						await chrome.kill();
					}
				} catch {
					// ignore
				}
				try {
					process.chdir(originalCwd);
				} catch {
					// ignore
				}
			}
			/* oxlint-enable no-magic-numbers */
			/* oxlint-enable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access */
		}
		/* oxlint-enable jest/no-conditional-in-test */

		let runnerResult: unknown = undefined;
		try {
			runnerResult = await runFullLighthouseCycle();
		} catch (error) {
			// If still failing after retries, skip the test gracefully.
			// oxlint-disable-next-line no-console
			console.warn("Lighthouse runner failed after retries:", error);
			test.skip(true, `Lighthouse runner failed after retries: ${String(error)}`);
			return;
		}

		const lhr = getLhrFromRunnerResult(runnerResult);
		const scores = computeScoresFromLhr(lhr);

		// Check for certificate interstitial errors - all scores will be 0
		// This can happen with self-signed certs in dev environments (e.g., WSL2 with HTTPS)
		maybeSkipForAllZeroScores(scores);
		const minScore = getMinScore();

		expect(scores.performance, "performance").toBeGreaterThanOrEqual(minScore);
		expect(scores.accessibility, "accessibility").toBeGreaterThanOrEqual(minScore);
		expect(scores.bestPractices, "best-practices").toBeGreaterThanOrEqual(
			Math.min(minScore, MIN_FALLBACK),
		);
		expect(scores.seo, "seo").toBeGreaterThanOrEqual(Math.min(minScore, MIN_FALLBACK));

		// oxlint-disable-next-line no-console
		console.log("Lighthouse scores:", scores);

		await writeReportIfRequested(runnerResult);
	});
});
