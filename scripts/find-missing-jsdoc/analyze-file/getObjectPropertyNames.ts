import type { ParameterDeclaration, TypeChecker } from "typescript";

/**
 * Return direct property names for wrapper-style object parameters when their type is known.
 * @param parameter - Parameter declaration to inspect.
 * @param checker - Type checker for the current file's project.
 * @returns Direct property names that should be documented, or [] when the type is not a bag object.
 */
export default function getObjectPropertyNames(
	parameter: ParameterDeclaration,
	checker: TypeChecker,
): string[] {
	const parameterType = checker.getApparentType(checker.getTypeAtLocation(parameter));
	if (checker.isArrayType(parameterType) || checker.isTupleType(parameterType)) {
		return [];
	}

	return parameterType
		.getProperties()
		.map((property) => property.getName())
		.filter((propertyName) => !propertyName.startsWith("__") && propertyName !== "prototype")
		.toSorted();
}
