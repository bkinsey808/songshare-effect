import fs from "node:fs";
import path from "node:path";

function walk(rootPath: string): string | undefined {
	try {
		const files = fs.readdirSync(rootPath, { withFileTypes: true });
		for (const file of files) {
			if (
				file.isFile() &&
				(file.name === "chrome" ||
					file.name === "chromium" ||
					file.name === "chrome.exe" ||
					file.name === "playwright.exe")
			) {
				return path.join(rootPath, file.name);
			}
			if (file.isDirectory()) {
				const found = walk(path.join(rootPath, file.name));
				if (found !== undefined && found !== "") {
					return found;
				}
			}
		}
	} catch {
		return undefined;
	}
	return undefined;
}

export default function findBrowserExecutable(cacheRoot: string): string | undefined {
	try {
		const entries = fs.readdirSync(cacheRoot, { withFileTypes: true });
		const dirEntries = entries.filter((entry) => entry.isDirectory());
		for (const entry of dirEntries) {
			const name = entry.name.toLowerCase();
			if (name.includes("chromium") || name.includes("chrome") || name.includes("ms-playwright")) {
				const candidatePath = walk(path.join(cacheRoot, entry.name));
				if (candidatePath !== undefined && candidatePath !== "") {
					return candidatePath;
				}
			}
		}
	} catch {
		// ignore
	}
	return undefined;
}
