import { type ParseError } from "effect/ParseResult";

import { safeSet } from "@/shared/utils/safe";
import { isRecord } from "@/shared/utils/typeGuards";

import createTraverseIssue from "./traverseIssue";

/**
 * Extract i18n messages from a ParseError by traversing the error tree.
 *
 * This implementation avoids unsafe compile-time assertions and uses
 * runtime guards to satisfy the project's strict lint rules.
 */
export default function extractI18nMessages(
	error: Readonly<ParseError>,
	i18nMessageKey: symbol | string,
): Record<string, unknown> {
	const fieldErrorsRaw: Record<string, unknown> = {};

	// Use the extracted helpers for annotation processing and traversal.
	const traverseIssue = createTraverseIssue(i18nMessageKey, (msgRaw, fieldName) => {
		safeSet(fieldErrorsRaw, fieldName, msgRaw);
		return true;
	});

	const maybeError = error as unknown;
	if (isRecord(maybeError) && "issue" in maybeError) {
		const { issue: root } = maybeError;
		if (root !== undefined && root !== null) {
			traverseIssue(root);
		}
	}

	return fieldErrorsRaw;
}
