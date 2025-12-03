import path from "node:path";

// Logging paths used by Playwright helper scripts
const LOG_DIR: string =
	typeof process.env["LOG_DIR"] === "string" && process.env["LOG_DIR"] !== ""
		? process.env["LOG_DIR"]
		: "/tmp";

const CLIENT_LOG = path.join(LOG_DIR, "playwright-dev-client.log");
const API_LOG = path.join(LOG_DIR, "playwright-dev-api.log");

const TAIL_LINES = Number(process.env["PLAYWRIGHT_TAIL_LINES"] ?? "200");

const paths = { LOG_DIR, CLIENT_LOG, API_LOG, TAIL_LINES };

export { LOG_DIR, CLIENT_LOG, API_LOG, TAIL_LINES };

export default paths;
