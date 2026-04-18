import {
	isArrowFunction,
	isFunctionDeclaration,
	isIdentifier,
	isMethodDeclaration,
	isObjectBindingPattern,
	type Node,
	type SourceFile,
	type TypeChecker,
} from "typescript";

import { ZERO } from "@/shared/constants/shared-constants";

import getDocumentedParamNames from "./getDocumentedParamNames";
import getExpectedNamesForWrapperObjectParameter from "./getExpectedNamesForWrapperObjectParameter";
import getNamesFromBindingPattern from "./getNamesFromBindingPattern";

type GetExpectedParamNamesOptions = {
	node: Node;
	sourceFile: SourceFile;
	checker: TypeChecker | undefined;
};

/**
 * Get the exact set of `@param` names expected for a function.
 * @param node - The node to check.
 * @param sourceFile - The source file context.
 * @param checker - Type checker for the current file's project.
 * @returns Set of parameter/property names that should be documented exactly.
 */
export default function getExpectedParamNames({
	node,
	sourceFile,
	checker,
}: GetExpectedParamNamesOptions): Set<string> {
	if (!isFunctionDeclaration(node) && !isMethodDeclaration(node) && !isArrowFunction(node)) {
		return new Set<string>();
	}

	const documented = getDocumentedParamNames(node, sourceFile);
	const expected = new Set<string>();

	for (const parameter of node.parameters) {
		let names: string[] = [];
		if (isObjectBindingPattern(parameter.name)) {
			names = getNamesFromBindingPattern(parameter.name);
		} else {
			names = getExpectedNamesForWrapperObjectParameter({ parameter, documented, checker });
			if (names.length === ZERO && isIdentifier(parameter.name)) {
				names = [parameter.name.text];
			}
		}

		for (const name of names) {
			expected.add(name);
		}
	}

	return expected;
}
