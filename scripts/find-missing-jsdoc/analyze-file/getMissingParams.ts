import type { Node, SourceFile, TypeChecker } from "typescript";

import getDocumentedParamNames from "./getDocumentedParamNames";
import getExpectedParamNames from "./getExpectedParamNames";

/**
 * Get missing `@param` tags for a node's parameters.
 * @param node - The node to check.
 * @param sourceFile - The source file context.
 * @param checker - Type checker for the current file's project.
 * @returns Array of parameter/property names missing from JSDoc.
 */
export default function getMissingParams(
	node: Node,
	sourceFile: SourceFile,
	checker?: TypeChecker,
): string[] {
	const documented = getDocumentedParamNames(node, sourceFile);
	const expected = getExpectedParamNames(node, sourceFile, checker);

	return [...expected]
		.filter((name) => {
			if (documented.has(name)) {
				return false;
			}
			// Check if it's documented with a prefix like "props.name" or "opts.name"
			return ![...documented].some((docName) => docName.endsWith(`.${name}`));
		})
		.toSorted();
}
