import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { ZERO } from "./constants";

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
			if (stat.isDirectory()) {
				const entries = fs.readdirSync(candidate);
				if (entries.length !== ZERO) {
					return true;
				}
			}
		} catch {
			// ignore
		}
	}
	return false;
}
