import { ONE, ZERO } from "@/shared/constants/shared-constants";

import { LOOKBACK_LINES } from "./constants";

/**
 * Find a JSDoc block immediately preceding the symbol at `lineIndex`.
 * Returns the JSDoc text (lines) when found; otherwise returns null.
 *
 * @param lines - File content split into lines
 * @param lineIndex - 1-based line number where the symbol starts
 * @returns JSDoc block text (including delimiters) or null when none found
 */
function getPrecedingJsDoc(lines: string[], lineIndex: number): string | undefined {
	const symbolIdx = lineIndex - ONE; // zero-based index of symbol line
	const startIndex = Math.max(ZERO, symbolIdx - LOOKBACK_LINES);

	// Start looking at the line immediately above the symbol
	function collectJsdoc(startIndexLine: number, endExclusiveLine: number): string {
		const jsdocLines: string[] = [];
		for (let idxLine = startIndexLine; idxLine < endExclusiveLine; idxLine += ONE) {
			jsdocLines.push(lines[idxLine] ?? "");
		}
		return jsdocLines.join("\n");
	}

	function findJsdocStartFromEnd(endIdx: number): number | undefined {
		for (let jdx = endIdx; jdx >= startIndex; jdx -= ONE) {
			const t = (lines[jdx] ?? "").trim();
			if (t.startsWith("/**")) {
				return jdx;
			}
			// Only allow blank lines or lines that begin with `*` as part of the
			// JSDoc block. Do NOT accept `//` style comments inside a JSDoc block.
			if (!(t === "" || t.startsWith("*") || t.startsWith("/**"))) {
				return undefined;
			}
		}
		return undefined;
	}

	for (let idx = symbolIdx - ONE; idx >= startIndex; idx -= ONE) {
		const rawLine = lines[idx];
		if (rawLine !== undefined) {
			const trimmed = rawLine.trim();
			// If there is a blank line or a single-line comment immediately above the
			// symbol, the JSDoc is not considered immediately preceding (invalid).
			if (trimmed === "" || trimmed.startsWith("//")) {
				return undefined;
			} else if (trimmed.includes("*/")) {
				const start = findJsdocStartFromEnd(idx);
				if (typeof start === "number") {
					return collectJsdoc(start, symbolIdx);
				}
				return undefined;
			} else if (trimmed.startsWith("/**")) {
				// Collect lines from the start of JSDoc down to the line before the symbol
				return collectJsdoc(idx, symbolIdx);
			}
			// Any other non-empty/non-comment line blocks JSDoc from being considered
			return undefined;
		}
	}

	return undefined;
}

/**
 * Check whether a JSDoc comment appears within the previous few lines
 * above `lineIndex` in the provided file lines.
 *
 * @param lines - File content split into lines
 * @param lineIndex - 1-based line number where the symbol starts
 * @returns true when a `/**` JSDoc block is present in the lookback window
 */
function hasPrecedingJsDoc(lines: string[], lineIndex: number): boolean {
	return getPrecedingJsDoc(lines, lineIndex) !== undefined;
}

// Attach helper to default export function as a property to keep single-export convention
Object.defineProperty(hasPrecedingJsDoc, "getPrecedingJsDoc", {
	value: getPrecedingJsDoc,
	writable: false,
});

export default hasPrecedingJsDoc;
