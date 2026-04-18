import { isIdentifier, type ParameterDeclaration, type TypeChecker } from "typescript";

import getObjectPropertyNames from "./getObjectPropertyNames";
import wrapperObjectParamNames from "./wrapperObjectParamNames";

type GetExpectedNamesForWrapperObjectParameterOptions = {
	parameter: ParameterDeclaration;
	documented: Set<string>;
	checker: TypeChecker | undefined;
};

/**
 * Determine whether the parameter should be documented by direct property names.
 * @param parameter - Parameter declaration to inspect.
 * @param documented - All currently documented `@param` names.
 * @param checker - Type checker for the current file's project.
 * @returns Direct property names when exact object-property matching should be enforced.
 */
export default function getExpectedNamesForWrapperObjectParameter({
	parameter,
	documented,
	checker,
}: GetExpectedNamesForWrapperObjectParameterOptions): string[] {
	if (
		!isIdentifier(parameter.name) ||
		parameter.dotDotDotToken !== undefined ||
		checker === undefined
	) {
		return [];
	}

	const parameterName = parameter.name.text;
	const hasNestedDocs = [...documented].some((name) => name.startsWith(`${parameterName}.`));
	const shouldUsePropertyNames = wrapperObjectParamNames.has(parameterName) || hasNestedDocs;

	if (!shouldUsePropertyNames) {
		return [];
	}

	const propertyNames = getObjectPropertyNames(parameter, checker);
	const MAX_PROPERTIES = 10;
	if (propertyNames.length > MAX_PROPERTIES && !hasNestedDocs) {
		return [];
	}

	return propertyNames;
}
