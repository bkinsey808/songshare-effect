import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { warn as sWarn } from "../../utils/scriptLogger";
import findBrowserExecutable from "./findBrowserExecutable";

export default function browsersAlreadyInstalled(): boolean {
	const repoPath: string | undefined =
		typeof process.env["PLAYWRIGHT_BROWSERS_PATH"] === "string" &&
		process.env["PLAYWRIGHT_BROWSERS_PATH"] !== ""
			? process.env["PLAYWRIGHT_BROWSERS_PATH"]
			: undefined;

	const candidates: string[] = [];
	if (repoPath !== undefined && repoPath !== "") {
		candidates.push(repoPath);
	}
	const xdg = process.env["XDG_CACHE_HOME"] ?? path.join(os.homedir(), ".cache");
	candidates.push(path.join(xdg, "ms-playwright"));

	for (const candidate of candidates) {
		try {
			const stat = fs.statSync(candidate);
			// Prefer a stronger check: verify at least one expected browser executable
			// exists under the candidate cache root. A stale cache directory may
			// contain files but be missing real browser binaries which causes
			// Playwright to fail later at launch. Use findBrowserExecutable to
			// discover actual executable files (chrome, chromium, firefox, etc.).
			if (stat.isDirectory()) {
				const exe = findBrowserExecutable(candidate);
				// Avoid treating nullable string values as truthy — be explicit
				// about the type/empty check to satisfy strict-boolean-expressions.
				if (typeof exe === "string" && exe !== "") {
					return true;
				}
				// Directory exists but no executable found — prefer to install
				// Playwright browsers instead of relying on a possibly stale cache.
				sWarn(
					"Playwright cache directory present but no browser executables were detected at:",
					candidate,
				);
			}
		} catch {
			// ignore
		}
	}
	return false;
}
