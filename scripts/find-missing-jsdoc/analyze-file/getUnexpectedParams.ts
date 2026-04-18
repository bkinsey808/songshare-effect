import {
	isArrowFunction,
	isFunctionDeclaration,
	isIdentifier,
	isMethodDeclaration,
	type Node,
	type SourceFile,
	type TypeChecker,
} from "typescript";

import getDocumentedParamNames from "./getDocumentedParamNames";
import getExpectedParamNames from "./getExpectedParamNames";
import wrapperObjectParamNames from "./wrapperObjectParamNames";

/**
 * Get unexpected `@param` tags that do not exactly match a real parameter/property name.
 * @param node - The node to check.
 * @param sourceFile - The source file context.
 * @param checker - Type checker for the current file's project.
 * @returns Array of documented param names that should not be present.
 */
export default function getUnexpectedParams(
	node: Node,
	sourceFile: SourceFile,
	checker?: TypeChecker,
): string[] {
	const documented = getDocumentedParamNames(node, sourceFile);
	const expected = getExpectedParamNames(node, sourceFile, checker);
	const allowed = new Set(expected);

	// Also allow documenting the parameter names themselves, even if not required
	if (isFunctionDeclaration(node) || isMethodDeclaration(node) || isArrowFunction(node)) {
		for (const param of node.parameters) {
			if (isIdentifier(param.name)) {
				const name = param.name.text;
				// Enforce Rule 48: don't allow documenting the wrapper container itself
				if (!wrapperObjectParamNames.has(name)) {
					allowed.add(name);
				}
			}
		}
	}

	return [...documented]
		.filter((name) => {
			if (allowed.has(name)) {
				return false;
			}

			// Allow dotted names like "props.className" if "className" is expected
			if (name.includes(".")) {
				const parts = name.split(".");
				const baseName = [...parts].pop();
				if (baseName !== undefined && expected.has(baseName)) {
					return false;
				}
				// Also allow if the prefix is an allowed container name
				const [prefix] = parts;
				if (prefix !== undefined && allowed.has(prefix)) {
					return false;
				}
			}

			// Allow plain property names if they are expected from a wrapper object
			if (expected.has(name)) {
				return false;
			}

			return true;
		})
		.toSorted();
}
