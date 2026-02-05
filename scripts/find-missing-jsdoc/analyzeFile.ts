import { readFileSync } from "node:fs";

import { ZERO } from "@/shared/constants/shared-constants";

import hasPrecedingJsDoc from "./hasPrecedingJsDoc";

// Helper accessor for JSDoc text (attached to the default export)
function isJsDocGetter(
	value: unknown,
): value is (lines: string[], lineIndex: number) => string | undefined {
	return typeof value === "function";
}

const descriptor = Object.getOwnPropertyDescriptor(hasPrecedingJsDoc, "getPrecedingJsDoc");
let getPrecedingJsDoc = undefined as
	| ((lines: string[], lineIndex: number) => string | undefined)
	| undefined;
if (descriptor && isJsDocGetter(descriptor.value)) {
	getPrecedingJsDoc = descriptor.value;
}

/**
 * Types shared by the find-missing-jsdoc modules.
 */
export type Issue = { line: number; col: number; name: string; kind: string };

/**
 * Analyze a file and return a list of exported symbols missing JSDoc.
 *
 * This scans for exported functions, classes and exported const-arrow
 * functions and reports line/column/name/kind for each missing comment.
 *
 * @param filePath - Path to the TS/TSX file to analyze
 * @returns Array of issue objects describing missing JSDoc
 */
export default function analyzeFile(filePath: string): Issue[] {
	const src = readFileSync(filePath, "utf8");
	const lines = src.split(/\r?\n/);
	const text = src;
	const issues: Issue[] = [];

	const patterns: { regex: RegExp; kind: string }[] = [
		{ regex: /^\s*export\s+function\s+([A-Za-z0-9_]+)\s*\(/gm, kind: "function" },
		{ regex: /^\s*export\s+default\s+function\s+([A-Za-z0-9_]+)\s*\(/gm, kind: "function" },
		{ regex: /^\s*export\s+const\s+([A-Za-z0-9_]+)\s*=\s*(?:async\s*)?\(/gm, kind: "const-fn" },
		{ regex: /^\s*export\s+class\s+([A-Za-z0-9_]+)/gm, kind: "class" },
	];

	for (const { regex, kind } of patterns) {
		while (true) {
			const matchItem = regex.exec(text);
			if (matchItem === null) {
				break;
			}
			const idx = matchItem.index;
			const lineNum = text.slice(ZERO, idx).split(/\r?\n/).length; // lines are one based
			const [, maybeName] = matchItem;
			// Try to extract the preceding JSDoc text when available
			const jsdocText = getPrecedingJsDoc ? getPrecedingJsDoc(lines, lineNum) : undefined;

			if (jsdocText === undefined) {
				// No JSDoc found — report missing documentation
				issues.push({ line: lineNum, col: ZERO, name: maybeName ?? "default", kind });
			} else if (kind === "function" || kind === "const-fn") {
				// For functions, JSDoc must include a @returns/@return tag
				const hasReturns = /@returns?\b/i.test(jsdocText);
				if (!hasReturns) {
					issues.push({
						line: lineNum,
						col: ZERO,
						name: maybeName ?? "default",
						kind: "missing-returns",
					});
				}
			}
		}
	}

	return issues;
}
