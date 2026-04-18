import { readFileSync } from "node:fs";

import { createSourceFile, ScriptTarget } from "typescript";

import collectIssuesForNode from "./analyze-file/collectIssuesForNode";
import getProgramSourceFile from "./analyze-file/getProgramSourceFile";
import getTypeContext from "./analyze-file/getTypeContext";
import type { Issue } from "./analyze-file/Issue.type";

/**
 * Analyze a file and return a list of symbols with "improper" JSDoc.
 * @param filePath - Path to the TS/TSX file to analyze.
 * @returns Array of issue objects describing missing JSDoc.
 */
export default function analyzeFile(filePath: string): Issue[] {
	const typeContext = getTypeContext(filePath);
	const sourceFile =
		(typeContext ? getProgramSourceFile(typeContext.program, filePath) : undefined) ??
		createSourceFile(filePath, readFileSync(filePath, "utf8"), ScriptTarget.Latest, true);
	const issues: Issue[] = [];

	collectIssuesForNode({
		checker: typeContext?.checker,
		issues,
		node: sourceFile,
		sourceFile,
	});

	return issues;
}
