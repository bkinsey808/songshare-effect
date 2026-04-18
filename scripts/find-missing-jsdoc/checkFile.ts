import { readFileSync } from "node:fs";

import { ONE, ZERO } from "@/shared/constants/shared-constants";

import { checkPrecedingLine } from "./checkPrecedingLine";

/**
 * Check a single file for JSDoc spacing violations according to the
 * repository's comment conventions (SKILL rules). Looks for JSDoc blocks
 * that should be preceded by a single blank line (formatter exception for
 * top-of-blocks is honored).
 *
 * @param filePath - Path to the file to inspect
 * @returns Array of issues; each item contains `line` and `reason` fields
 */
export function checkFile(filePath: string): { line: number; reason: string }[] {
	const text = readFileSync(filePath, "utf8");
	const lines = text.split("\n");
	const issues: { line: number; reason: string }[] = [];

	for (let idx = ZERO; idx < lines.length; ) {
		const raw = lines[idx] ?? "";
		if (raw.trim().startsWith("/**")) {
			// locate end of JSDoc
			let end = idx;
			while (end < lines.length && !(lines[end] ?? "").includes("*/")) {
				end += ONE;
			}

			// Look ahead for the symbol this JSDoc documents, skipping // comments
			let nextIdx = end + ONE;
			while (nextIdx < lines.length && (lines[nextIdx] ?? "").trim().startsWith("//")) {
				nextIdx += ONE;
			}

			const nextLine = (lines[nextIdx] ?? "").trim();
			const documentsSymbol =
				/^(export\s+|export\s+default|function\s+|class\s+|const\s+|let\s+|type\s+|interface\s+)/.test(
					nextLine,
				);

			if (idx !== ZERO) {
				checkPrecedingLine({ idx, lines, documentsSymbol, issues });
			}

			// advance past this block
			idx = end + ONE;
		} else {
			idx += ONE;
		}
	}

	return issues;
}

export default checkFile;
