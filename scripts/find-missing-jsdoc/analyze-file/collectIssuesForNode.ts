import {
	forEachChild,
	getLineAndCharacterOfPosition,
	isArrowFunction,
	isClassDeclaration,
	isFunctionDeclaration,
	isMethodDeclaration,
	isVariableDeclaration,
	type Node,
	type SourceFile,
	type TypeChecker,
} from "typescript";

import { ONE } from "@/shared/constants/shared-constants";

import getMissingParams from "./getMissingParams";
import getUnexpectedParams from "./getUnexpectedParams";
import hasAnyJsDoc from "./hasAnyJsDoc";
import hasReturnsTag from "./hasReturnsTag";
import type { Issue } from "./Issue.type";

type CollectIssuesForNodeArgs = {
	checker: TypeChecker | undefined;
	issues: Issue[];
	node: Node;
	sourceFile: SourceFile;
};

/**
 * Recursively collect JSDoc issues for supported declarations in a source file.
 * @param args - Traversal state for the current node.
 * @returns void
 */
export default function collectIssuesForNode(args: CollectIssuesForNodeArgs): void {
	const { checker, issues, node, sourceFile } = args;

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
	} else if (isVariableDeclaration(node) && node.initializer && isArrowFunction(node.initializer)) {
		targetNode = node.parent.parent;
		name = node.name.getText(sourceFile);
	}

	if (targetNode) {
		const { line, character } = getLineAndCharacterOfPosition(sourceFile, node.getStart());
		if (!hasAnyJsDoc(targetNode, sourceFile)) {
			issues.push({
				col: character,
				detail: "Missing JSDoc entirely",
				kind: "missing-jsdoc",
				line: line + ONE,
				name,
			});
		} else if (!isClassDeclaration(node)) {
			if (!hasReturnsTag(targetNode)) {
				issues.push({
					col: character,
					detail: "Has JSDoc but no @returns tag",
					kind: "missing-returns",
					line: line + ONE,
					name,
				});
			}

			const arrowOrFunc = isVariableDeclaration(node) && node.initializer ? node.initializer : node;
			const missingParams = getMissingParams(arrowOrFunc, sourceFile, checker);
			for (const paramName of missingParams) {
				issues.push({
					col: character,
					detail: `Missing @param for '${paramName}'`,
					kind: "missing-param",
					line: line + ONE,
					name,
				});
			}

			const unexpectedParams = getUnexpectedParams(arrowOrFunc, sourceFile, checker);
			for (const paramName of unexpectedParams) {
				issues.push({
					col: character,
					detail: `Unexpected @param for '${paramName}'`,
					kind: "unexpected-param",
					line: line + ONE,
					name,
				});
			}
		}
	}

	forEachChild(node, (child) => {
		collectIssuesForNode({
			checker,
			issues,
			node: child,
			sourceFile,
		});
	});
}
