import { getJSDocTags, type Node, type SourceFile } from "typescript";

import { ZERO } from "@/shared/constants/shared-constants";

/**
 * Check if a node has any JSDoc tags.
 * @param node - The node to check.
 * @param sourceFile - The source file used for fallback text inspection.
 * @returns true if any JSDoc tags exist.
 */
export default function hasAnyJsDoc(node: Node, sourceFile?: SourceFile): boolean {
	if (getJSDocTags(node).length > ZERO) {
		return true;
	}

	if (!sourceFile) {
		return false;
	}

	const text = sourceFile.getFullText();
	const start = node.getStart();

	const MIN_WINDOW_START = 0;
	const NO_INDEX = -1;
	const COMMENT_END_LEN = 2;

	const beforeText = text.slice(MIN_WINDOW_START, start);
	const lastEnd = beforeText.lastIndexOf("*/");
	if (lastEnd === NO_INDEX) {
		return false;
	}

	const between = beforeText.slice(lastEnd + COMMENT_END_LEN);
	if (/\S/.test(between)) {
		return false;
	}

	const lastStart = beforeText.lastIndexOf("/**", lastEnd);
	if (lastStart === NO_INDEX) {
		return false;
	}

	return true;
}
