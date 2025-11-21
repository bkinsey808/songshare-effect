#!/usr/bin/env node
import puppeteer from "puppeteer";

const APP_URL = process.argv[2] || "http://localhost:5173";
const TIMEOUT_MS = parseInt(process.env.CAPTURE_TIMEOUT_MS || "12000", 10);

(async function main() {
	console.log("Launching headless Chromium (puppeteer) — network debug...");
	const browser = await puppeteer.launch({
		args: ["--no-sandbox", "--disable-setuid-sandbox"],
	});
	const page = await browser.newPage();

	page.on("console", (msg) => {
		const type = msg.type();
		const text = msg
			.args()
			.map((a) => (a._remoteObject ? a._remoteObject.value : String(a)))
			.join(" ");
		console.log(`[console.${type}] ${text}`);
	});

	page.on("pageerror", (err) => {
		console.error("[pageerror]", err && err.stack ? err.stack : err);
	});

	page.on("request", (req) => {
		console.log(
			`[request] ${req.method()} ${req.url()} - resourceType=${req.resourceType()}`,
		);
	});

	page.on("response", async (res) => {
		try {
			const status = res.status();
			const url = res.url();
			console.log(`[response] ${status} ${url}`);
			if (url.endsWith("/api/me")) {
				const text = await res.text();
				console.log(`[response.body] /api/me -> ${text}`);
			}
		} catch (err) {
			console.error("[response] error reading response", err);
		}
	});

	await page.goto(APP_URL, { waitUntil: "networkidle2" }).catch((err) => {
		console.error("Error navigating to app:", err);
	});

	console.log(
		`Capturing network & console for ${TIMEOUT_MS}ms from ${APP_URL}...`,
	);

	await new Promise((resolve) => setTimeout(resolve, TIMEOUT_MS));

	console.log("Done capturing — closing browser.");
	await browser.close();
	process.exit(0);
})();
