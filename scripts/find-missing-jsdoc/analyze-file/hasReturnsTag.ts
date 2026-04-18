import { getJSDocTags, type Node } from "typescript";

/**
 * Check if a node has a @returns tag.
 * @param node - The node to check.
 * @returns true if @returns or @return exists.
 */
export default function hasReturnsTag(node: Node): boolean {
	const tags = getJSDocTags(node);
	return tags.some((tag) => tag.tagName.text === "returns" || tag.tagName.text === "return");
}
