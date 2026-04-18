import {
	isBindingElement,
	isIdentifier,
	isObjectBindingPattern,
	isStringLiteral,
	type Node,
} from "typescript";

/**
 * Get parameter names from a binding pattern (destructuring).
 * @param name - The binding pattern to check.
 * @returns Array of property names found in the destructuring.
 */
export default function getNamesFromBindingPattern(name: Node): string[] {
	const names: string[] = [];
	if (isObjectBindingPattern(name)) {
		for (const element of name.elements) {
			if (isBindingElement(element)) {
				const targetName = element.propertyName ?? element.name;
				if (isIdentifier(targetName)) {
					names.push(targetName.text);
				} else if (isStringLiteral(targetName)) {
					names.push(targetName.text);
				}
			}
		}
	}
	return names;
}
