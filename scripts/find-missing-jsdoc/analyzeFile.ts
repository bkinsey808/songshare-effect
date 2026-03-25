import { readFileSync } from "node:fs";

import {
	createSourceFile,
	forEachChild,
	getJSDocTags,
	getLineAndCharacterOfPosition,
	isArrowFunction,
	isBindingElement,
	isClassDeclaration,
	isFunctionDeclaration,
	isIdentifier,
	isJSDocParameterTag,
	isMethodDeclaration,
	isObjectBindingPattern,
	isVariableDeclaration,
	type Node,
	ScriptTarget,
	type SourceFile,
} from "typescript";

import { ONE, ZERO } from "@/shared/constants/shared-constants";

/**
 * Check if a node has any JSDoc tags.
 * @param node - The node to check
 * @returns true if any JSDoc tags exist
 */
function hasAnyJsDoc(node: Node, sourceFile?: SourceFile): boolean {
	// Prefer explicit tags
	if (getJSDocTags(node).length > ZERO) {
		return true;
	}

	// If a SourceFile is available, check for a /** ... */ JSDoc block immediately
	// before the node's full start position. This avoids unsafe casts to `any`.
	if (!sourceFile) {
		return false;
	}

	const text = sourceFile.getFullText();
	const start = node.getStart();

	const MIN_WINDOW_START = 0;
	const NO_INDEX = -1;
	const COMMENT_END_LEN = 2;

	// Find the last block comment end before the node start.
	const beforeText = text.slice(MIN_WINDOW_START, start);
	const lastEnd = beforeText.lastIndexOf("*/");
	if (lastEnd === NO_INDEX) {
		return false;
	}

	// Ensure only whitespace exists between the comment end and the node start.
	const between = beforeText.slice(lastEnd + COMMENT_END_LEN);
	if (/\S/.test(between)) {
		return false;
	}

	// Check that the comment is a JSDoc-style comment (starts with '/**').
	const lastStart = beforeText.lastIndexOf("/**", lastEnd);
	if (lastStart === NO_INDEX) {
		return false;
	}

	return true;
}

/**
 * Check if a node has a @returns tag.
 * @param node - The node to check
 * @returns true if @returns or @return exists
 */
function hasReturnsTag(node: Node): boolean {
	const tags = getJSDocTags(node);
	return tags.some((tag) => tag.tagName.text === "returns" || tag.tagName.text === "return");
}

/**
 * Get names documented by @param tags.
 * @param node - The node to check
 * @param sourceFile - The source file context
 * @returns Set of documented parameter names
 */
function getDocumentedParamNames(node: Node, sourceFile: SourceFile): Set<string> {
	const documented = new Set<string>();
	const tags = getJSDocTags(node);
	for (const tag of tags) {
		if (isJSDocParameterTag(tag)) {
			documented.add(tag.name.getText(sourceFile));
		}
	}
	return documented;
}

/**
 * Get parameter names from a binding pattern (destructuring).
 * @param name - The binding pattern to check
 * @returns Array of property names found in the destructuring
 */
function getNamesFromBindingPattern(name: Node): string[] {
	const names: string[] = [];
	if (isObjectBindingPattern(name)) {
		for (const element of name.elements) {
			if (isBindingElement(element)) {
				// use propertyName for {propertyName: localName} patterns
				const targetName = element.propertyName ?? element.name;
				if (isIdentifier(targetName)) {
					names.push(targetName.text);
				}
			}
		}
	}
	return names;
}

/**
 * Get missing @param tags for a node's parameters.
 * @param node - The node to check
 * @param sourceFile - The source file context
 * @returns Array of parameter names missing from JSDoc
 */
function getMissingParams(node: Node, sourceFile: SourceFile): string[] {
	if (!isFunctionDeclaration(node) && !isMethodDeclaration(node) && !isArrowFunction(node)) {
		return [];
	}

	const missing: string[] = [];
	const documented = getDocumentedParamNames(node, sourceFile);
	const params = node.parameters;

	// SPECIAL CASE: single options object.
	// If the user is documenting properties directly (as per mandate),
	// don't flag the options object itself as missing if ANY params are documented.
	const firstParam = params[ZERO];
	const isSingleOptions =
		params.length === ONE &&
		firstParam !== undefined &&
		isIdentifier(firstParam.name) &&
		(firstParam.name.text === "opts" || firstParam.name.text === "options");

	for (const param of params) {
		let names: string[] = [];
		if (isObjectBindingPattern(param.name)) {
			names = getNamesFromBindingPattern(param.name);
		} else if (isIdentifier(param.name)) {
			names = [param.name.text];
		}

		for (const name of names) {
			const isDocumented = documented.has(name);
			const isIgnoredOptions =
				isSingleOptions && documented.size > ZERO && (name === "opts" || name === "options");

			if (!isDocumented && !isIgnoredOptions) {
				missing.push(name);
			}
		}
	}

	return missing;
}

/**
 * Analyze a file and return a list of symbols with "improper" JSDoc.
 * @param filePath - Path to the TS/TSX file to analyze
 * @returns Array of issue objects describing missing JSDoc
 */
export default function analyzeFile(filePath: string): Issue[] {
	const content = readFileSync(filePath, "utf8");
	const sourceFile = createSourceFile(filePath, content, ScriptTarget.Latest, true);
	const issues: Issue[] = [];

	function visit(node: Node): void {
		let targetNode: Node | undefined = undefined;
		let name = "anonymous";

		if (isFunctionDeclaration(node)) {
			targetNode = node;
			name = node.name ? node.name.text : "default";
		} else if (isMethodDeclaration(node)) {
			targetNode = node;
			name = node.name.getText(sourceFile);
		} else if (isClassDeclaration(node)) {
			targetNode = node;
			name = node.name ? node.name.text : "default";
		} else if (
			isVariableDeclaration(node) &&
			node.initializer &&
			isArrowFunction(node.initializer)
		) {
			targetNode = node.parent.parent; // Check JSDoc on the VariableStatement
			name = node.name.getText(sourceFile);
		}

		if (targetNode) {
			const { line, character } = getLineAndCharacterOfPosition(sourceFile, node.getStart());
			if (!hasAnyJsDoc(targetNode, sourceFile)) {
				issues.push({
					line: line + ONE,
					col: character,
					name,
					kind: "missing-jsdoc",
					detail: "Missing JSDoc entirely",
				});
			} else if (!isClassDeclaration(node)) {
				// Checks for functions/methods
				if (!hasReturnsTag(targetNode)) {
					issues.push({
						line: line + ONE,
						col: character,
						name,
						kind: "missing-returns",
						detail: "Has JSDoc but no @returns tag",
					});
				}
				const arrowOrFunc =
					isVariableDeclaration(node) && node.initializer ? node.initializer : node;
				const missingParams = getMissingParams(arrowOrFunc, sourceFile);
				for (const paramName of missingParams) {
					issues.push({
						line: line + ONE,
						col: character,
						name,
						kind: "missing-param",
						detail: `Missing @param for '${paramName}'`,
					});
				}
			}
		}

		forEachChild(node, visit);
	}

	visit(sourceFile);
	return issues;
}

/**
 * Types shared by the find-missing-jsdoc modules.
 */
export type Issue = { line: number; col: number; name: string; kind: string; detail?: string };
