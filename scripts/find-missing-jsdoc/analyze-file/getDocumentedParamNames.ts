import { getJSDocTags, isJSDocParameterTag, type Node, type SourceFile } from "typescript";

/**
 * Get names documented by @param tags.
 * @param node - The node to check.
 * @param sourceFile - The source file context.
 * @returns Set of documented parameter names.
 */
export default function getDocumentedParamNames(node: Node, sourceFile: SourceFile): Set<string> {
	const documented = new Set<string>();
	const tags = getJSDocTags(node);
	for (const tag of tags) {
		if (isJSDocParameterTag(tag)) {
			documented.add(tag.name.getText(sourceFile));
		}
	}
	return documented;
}
