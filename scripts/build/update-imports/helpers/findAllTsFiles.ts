/* oxlint-disable sonarjs/os-command */
import { execSync } from "node:child_process";

import { error as sError } from "@/scripts/utils/scriptLogger";

/**
 * Finds files matching the provided glob pattern while ignoring build artifacts.
 * @param pattern - Filename glob such as `*.ts` or `*.tsx`.
 * @returns Sorted array of matching file paths.
 */
export function findAllTsFiles(pattern: string): string[] {
	try {
		const output = execSync(`find . -name "${pattern}" -type f`, {
			encoding: "utf8",
			cwd: process.cwd(),
		});
		return output
			.trim()
			.split("\n")
			.filter(
				(file) =>
					file !== "" &&
					!file.includes("node_modules") &&
					!file.includes("dist") &&
					!file.includes(".git") &&
					!file.includes("temp-"),
			);
	} catch (error) {
		sError(`Error finding files with pattern ${pattern}:`, error);
		return [];
	}
}

export default findAllTsFiles;
