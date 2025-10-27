/**
 * URLs used by the E2E test suite.
 *
 * - DEV_URL: the local development server to test against. Defaults to
 *   http://localhost:5173 but can be overridden with the DEV_URL env var.
 * - PROD_URL: the production/deployed URL to test against. Defaults to
 *   https://effect.bardoshare.com but can be overridden with
 *   PLAYWRIGHT_BASE_URL or PROD_URL env vars.
 * - IS_DEPLOYED_TEST: true when PLAYWRIGHT_BASE_URL is provided (targeting
 *   a deployed environment).
 */
export const DEV_URL = String(process.env.DEV_URL ?? "http://localhost:5173");
export const PROD_URL =
	String(process.env.PLAYWRIGHT_BASE_URL ?? process.env.PROD_URL ?? "https://effect.bardoshare.com");

export const IS_DEPLOYED_TEST = Boolean(
	process.env.PLAYWRIGHT_BASE_URL && process.env.PLAYWRIGHT_BASE_URL.trim() !== "",
);
