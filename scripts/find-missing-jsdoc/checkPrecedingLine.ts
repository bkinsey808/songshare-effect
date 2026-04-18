import { ONE } from "@/shared/constants/shared-constants";

import { type SpacingCheckParams } from "./SpacingCheckParams.type";

/**
 * Check the line preceding a JSDoc block for spacing or comment-touching violations.
 *
 * @param params - Inspection parameters
 * @param params.idx - Index of the JSDoc start line
 * @param params.lines - Array of file lines
 * @param params.documentsSymbol - Whether this JSDoc documents a code symbol
 * @param params.issues - Array to push found issues into
 */
export function checkPrecedingLine({
	idx,
	lines,
	documentsSymbol,
	issues,
}: SpacingCheckParams): void {
	const prev = (lines[idx - ONE] ?? "").trim();
	const prevHasBlank = prev === "";
	const prevEndsWithBrace = /\{\s*$/.test(prev);

	if (prevHasBlank || prevEndsWithBrace) {
		return;
	}

	const isPrevComment = prev.startsWith("/**") || prev.endsWith("*/") || prev.startsWith("//");

	if (isPrevComment) {
		issues.push({
			line: idx + ONE,
			reason: `comment touches JSDoc; they should be combined (previous: "${prev}")`,
		});
	} else if (documentsSymbol) {
		issues.push({
			line: idx + ONE,
			reason: `missing blank line before JSDoc (previous: "${prev}")`,
		});
	}
}

export default checkPrecedingLine;
